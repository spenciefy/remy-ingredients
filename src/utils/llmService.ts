/**
 * Service to interact with LLM API for generating summaries of ingredients
 */

import { env } from "../env";

export interface OpenAIResponse {
  text: string;
}

export interface ImageAnalysisRequest {
  imageUrl: string;
  prompt: string;
}

// Interfaces for OpenAI API response format
interface Annotation {
  text: string;
  type: string;
  start_index: number;
  end_index: number;
}

interface OpenAIOutputTextContent {
  type: "output_text";
  text: string;
  annotations?: Annotation[];
}

interface OpenAIMessageContent {
  type: "message";
  id: string;
  status: string;
  role: "assistant" | "user";
  content: OpenAIOutputTextContent[];
}

interface OpenAIResponseData {
  id: string;
  object: string;
  created_at: number;
  output?: OpenAIMessageContent[];
  error: null | unknown;
  text?: string;
  [key: string]: unknown;
}

/**
 * Generates a summary of an ingredient's content
 * @param content The content to summarize (text or image description)
 * @param title The title of the ingredient
 * @returns A summary of the ingredient
 */
export async function generateIngredientSummary(
  content: string,
  title: string,
  isImage: boolean = false,
): Promise<string> {
  try {
    if (isImage) {
      const response = await analyzeImage({
        imageUrl: content,
        prompt: `Analyze this image${title ? ` of ${title}` : ""} and provide a brief description in maximum 2 sentences. Use plain text only, no markdown or special formatting.`,
      });
      return response.text;
    } else {
      const response = await sendTextToOpenAI(
        `analyze the following text${title ? ` about ${title}` : ""} and provide a brief summary in maximum 2 sentences. Use plain text only, no markdown or special formatting:\n\n${content}`,
      );
      return response.text;
    }
  } catch (error) {
    console.error("Error generating ingredient summary:", error);
    return "Failed to generate summary. Please try again later.";
  }
}

export async function sendTextToOpenAI(text: string): Promise<OpenAIResponse> {
  try {
    if (!env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found:', env.OPENAI_API_KEY);
      throw new Error('OpenAI API key not found');
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4.1",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: text,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        apiKey: env.OPENAI_API_KEY
      });
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const responseData = await response.json();
    console.log("OpenAI response:", responseData);
    
    // Extract text from the new response format
    const extractedText = extractTextFromResponse(responseData);
    
    return { text: extractedText };
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    throw error;
  }
}

export async function analyzeImage(
  request: ImageAnalysisRequest,
): Promise<OpenAIResponse> {
  try {
    if (!env.OPENAI_API_KEY) {
      console.error('OpenAI API key not found:', env.OPENAI_API_KEY);
      throw new Error('OpenAI API key not found');
    }

    console.log("Analyzing image URL:", request.imageUrl);
    
    let imageContent = request.imageUrl;
    
    // If the URL doesn't already start with data:image
    if (!imageContent.startsWith('data:image')) {
      if (imageContent.startsWith("http")) {
        // Fetch remote image
        const response = await fetch(imageContent);
        if (!response.ok) {
          console.error("Failed to fetch image:", {
            imageUrl: request.imageUrl,
            status: response.status,
            statusText: response.statusText
          });
          throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
        }
        const blob = await response.blob();
        
        // Convert to base64 with proper format
        imageContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // This will already give us the full data URL with proper format
            resolve(reader.result as string);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else {
        // If it's not a data URL or http URL, we can't process it
        throw new Error("Invalid image URL format. Must be a data URL or http URL.");
      }
    }
    
    console.log("Prepared image URL format:", 
      imageContent.substring(0, 30) + "... [truncated]", 
      "Length:", imageContent.length);
    
    // Create request body exactly matching OpenAI's example
    const requestBody = {
      model: "gpt-4.1",
      input: [
        {
          role: "user",
          content: [
            { 
              type: "input_image", 
              image_url: imageContent 
            },
            {
              type: "input_text",
              text: request.prompt || "What is in this image?",
            }
          ],
        },
      ],
    };
    
    console.log("OpenAI request structure:", {
      model: requestBody.model,
      input_structure: "Following OpenAI's example format",
      contentTypes: requestBody.input[0].content.map(item => item.type)
    });

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Image analysis API request failed:", {
        status: response.status,
        statusText: response.statusText,
        errorData,
        apiKey: env.OPENAI_API_KEY,
        prompt: request.prompt
      });
      throw new Error(`Image analysis API request failed: ${response.status} ${response.statusText} - ${errorData}`);
    }

    const responseData = await response.json();
    console.log("OpenAI image analysis response:", responseData);
    
    // Extract text from the new response format
    const extractedText = extractTextFromResponse(responseData);
    
    return { text: extractedText };
  } catch (error: unknown) {
    console.error("Error analyzing image:", error);
    throw error;
  }
}

/**
 * Extracts the text content from the OpenAI API response
 */
function extractTextFromResponse(responseData: OpenAIResponseData): string {
  try {
    // Check if response matches the new format
    if (responseData.output && Array.isArray(responseData.output)) {
      // Find the first message in the output array
      const message = responseData.output.find(
        (item: OpenAIMessageContent) => item.type === "message" && item.role === "assistant"
      );
      
      if (message && message.content && Array.isArray(message.content)) {
        // Find the first text content
        const textContent = message.content.find(
          (content: OpenAIOutputTextContent) => content.type === "output_text"
        );
        
        if (textContent && textContent.text) {
          return textContent.text;
        }
      }
    }
    
    // Fallback: try to look for any text property in the response
    if (responseData.text) {
      return responseData.text;
    }
    
    // If we can't find the text, return an error message
    console.error("Could not extract text from response:", responseData);
    return "Could not extract response text";
  } catch (error: unknown) {
    console.error("Error extracting text from response:", error);
    return "Error extracting response text";
  }
}
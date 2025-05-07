import { Editor } from 'tldraw';
import { Comment } from '../types/Comment';
import { ApiInputItem } from './formatIngredientsForLLM';

export interface ImageDesignArtifact {
  title: string;
  notes: string;
  image_url: string;
}

// Ensure VITE_API_URL is set in your .env file, e.g., VITE_API_URL=http://localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.error("VITE_API_URL is not defined. Please set it in your .env file.");
  // Optionally throw an error or use a default, but for now, we'll log and proceed (which might fail).
}

export async function callVisualizeApi(apiContentItems: ApiInputItem[]): Promise<ImageDesignArtifact[]> {
  // If the provided items don't include any input_text from the user, append a default instruction.
  const hasUserInputText = apiContentItems.some(
    (item) => item.type === 'input_text' && item.text.trim() !== ''
  )

  const contentItems: ApiInputItem[] = hasUserInputText
    ? apiContentItems
    : [
        ...apiContentItems,
        { type: 'input_text', text: 'visualize this as a web or mobile mockup' },
      ]

  const requestBody = {
    input: [
      {
        type: 'message' as const,
        role: 'user' as const,
        content: contentItems,
      },
    ],
    // session_id is optional per API_SPECIFICATION.md
  }

  console.log('Sending visualization request to /chat:', JSON.stringify(requestBody, null, 2));
  
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (networkError) {
    console.error("Network error during visualization API call:", networkError);
    throw new Error("Network error: Could not connect to the visualization service.");
  }

  console.log('Received response status from /chat:', response.status);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Error response body from /chat:', errorBody);
    throw new Error(`Visualization API request failed: ${response.status} ${response.statusText}. Details: ${errorBody}`);
  }

  try {
    const responseData = await response.json();
    console.log('Received data from /chat:', JSON.stringify(responseData, null, 2));

    if (responseData.result && Array.isArray(responseData.result)) {
      // Basic validation of artifact structure could be added here if needed
      return responseData.result as ImageDesignArtifact[];
    } else {
      console.error("Unexpected response format from visualization service:", responseData);
      throw new Error("Unexpected response format from the visualization service.");
    }
  } catch (parsingError) {
    console.error("Error parsing JSON response from visualization API:", parsingError);
    throw new Error("Error parsing response from the visualization service.");
  }
}

/**
 * Adds an AI	generated image (from ImageDesignArtifact) to the tldraw canvas as an image ingredient.
 * Unlike addImageIngredient, this function does not upload files to Supabase nor call the summary API
 * because the provided imageUrl already points to a remote image.
 */
export const addAgentImageOutput = async (
  editor: Editor,
  artifact: ImageDesignArtifact,
  point: { x: number; y: number }
): Promise<void> => {
  // Helper to get image dimensions while constraining to max size
  const getDimensions = (url: string): Promise<{ width: number; height: number }> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const maxWidth = 600
        const maxHeight = 600
        let width = img.naturalWidth
        let height = img.naturalHeight
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          if (width / maxWidth > height / maxHeight) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }
        resolve({ width, height })
      }
      img.onerror = (err) => reject(err instanceof Event ? new Error('Image load error') : err)
      img.src = url
    })

  try {
    // 1. Get image dimensions
    const dims = await getDimensions(artifact.image_url)

    // 2. Build AI comment from artifact notes (if any)
    const comments: Comment[] = []
    if (artifact.notes?.trim()) {
      comments.push({
        id: Math.random().toString(36).substr(2, 9),
        text: artifact.notes,
        createdAt: Date.now(),
        isAI: true,
      })
    }

    // 3. Create the shape on canvas
    editor.createShape({
      type: 'image-ingredient-shape',
      props: {
        title: artifact.title || 'AI Generated',
        imageUrl: artifact.image_url,
        w: dims.width,
        h: dims.height,
        comments,
      },
      x: point.x,
      y: point.y,
      meta: {
        isActive: true,
        createdAt: Date.now(),
      },
    })
  } catch (error) {
    console.error('Error adding agent image output to canvas:', error)
  }
} 
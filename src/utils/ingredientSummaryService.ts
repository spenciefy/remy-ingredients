/**
 * Service to interact with LLM API for generating summaries of ingredients
 */

interface IngredientSummary {
  title: string;
  description: string;
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
): Promise<IngredientSummary> {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/llm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        content,
        title,
        isImage
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Generated title:', data.title);
    return data;
  } catch (error) {
    console.error("Error generating ingredient summary:", error);
    throw error;
  }
}
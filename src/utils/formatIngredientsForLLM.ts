import { TLShape } from 'tldraw'
import { Comment } from '../types/Comment'
import { IngredientProps } from '../types/Ingredient'

type ContentItem = {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

// Helper types for the new API content structure
type ApiInputTextItem = {
  type: 'input_text';
  text: string;
};

type ApiInputImageItem = {
  type: 'input_image';
  image_url: string;
  detail: 'auto';
};

type ApiContentItem = ApiInputTextItem | ApiInputImageItem;

/**
 * Formats ingredients into OpenAI API compatible format
 * Each text and image is a separate entry in the content array
 */
export async function formatIngredientsForLLM(shapes: TLShape[]): Promise<ContentItem[]> {
  // Filter for active ingredient shapes
  const ingredientShapes = shapes.filter((shape) => {
    if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
      return false
    }
    return 'title' in shape.props && shape.meta?.isActive === true
  })

  const contentItems: ContentItem[] = []

  // Add initial text content
  if (ingredientShapes.length > 0) {
    contentItems.push({
      type: 'text',
      text: 'Here are the ingredients in the workspace:'
    })
  }

  // Process each ingredient
  for (const shape of ingredientShapes) {
    const props = shape.props as IngredientProps
    const title = props.title || 'Untitled'
    const comments = props.comments || []

    // Format comments text
    const commentText = comments.length > 0
      ? '\nComments:\n' + comments
          .map((comment: Comment, i: number) => `${i + 1}. ${comment.text}${comment.isAI ? ' (AI)' : ''}`)
          .join('\n')
      : ''

    if (shape.type === 'text-ingredient-shape') {
      contentItems.push({
        type: 'text',
        text: `Ingredient: ${title}\nContent: ${props.text || ''}${commentText}`
      })
    } else if (shape.type === 'image-ingredient-shape' && props.imageUrl) {
      // Add title and comments as text
      contentItems.push({
        type: 'text',
        text: `Ingredient: ${title}${commentText}`
      })
      
      // Add image as separate item
      contentItems.push({
        type: 'image_url',
        image_url: {
          url: props.imageUrl
        }
      })
    }
  }

  return contentItems
}

/**
 * Formats ingredients into a JSON string that matches the specified OpenAI API format.
 */
export async function formatIngredientsForClipboard(shapes: TLShape[]): Promise<string> {
  // Utilize the existing formatIngredientsForLLM to get the base content items
  const llmContentItems = await formatIngredientsForLLM(shapes);

  // Transform the llmContentItems to the new API structure
  const apiContentItems: ApiContentItem[] = llmContentItems.map(item => {
    if (item.type === 'text') {
      return {
        type: 'input_text',
        text: item.text ?? '', // Ensure text is a string
      };
    } else { // item.type === 'image_url'
      // item.image_url and item.image_url.url are guaranteed by formatIngredientsForLLM for this type
      return {
        type: 'input_image',
        image_url: item.image_url!.url,
        detail: 'auto' as const, // Ensures 'auto' is treated as a literal type
      };
    }
  });

  // Construct the final JSON object structure
  const finalApiOutput = {
    input: [
      {
        type: 'message',
        role: 'user',
        content: apiContentItems,
      },
    ],
  };

  // Return the JSON string
  return JSON.stringify(finalApiOutput);
} 
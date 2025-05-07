import { TLShape } from 'tldraw';
import { Comment } from '../types/Comment';
import { IngredientProps } from '../types/Ingredient';

// Standardized API item types
export type ApiInputTextItem = {
  type: 'input_text';
  text: string;
};

export type ApiInputImageItem = {
  type: 'input_image';
  image_url: string;
  detail: 'auto'; // Or 'low', 'high' - keeping 'auto' as per previous def
};

export type ApiInputItem = ApiInputTextItem | ApiInputImageItem;

/**
 * Formats ingredients into an array of ApiInputTextItem and ApiInputImageItem objects.
 */
export async function formatIngredientsForLLM(shapes: TLShape[]): Promise<ApiInputItem[]> {
  const ingredientShapes = shapes.filter((shape) => {
    if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
      return false
    }
    return 'title' in shape.props && shape.meta?.isActive === true
  })

  const formattedIngredients: ApiInputItem[] = []

  if (ingredientShapes.length > 0) {
    formattedIngredients.push({
      type: 'input_text',
      text: 'Here are the ingredients in the workspace:'
    })
  }

  for (const shape of ingredientShapes) {
    const props = shape.props as IngredientProps
    const title = props.title || 'Untitled'
    const comments = props.comments || []

    const commentText = comments.length > 0
      ? '\nComments:\n' + comments
          .map((comment: Comment, i: number) => `${i + 1}. ${comment.text}${comment.isAI ? ' (AI)' : ''}`)
          .join('\n')
      : ''

    if (shape.type === 'text-ingredient-shape') {
      formattedIngredients.push({
        type: 'input_text',
        text: `Text Ingredient: ${title}\nContent: ${props.text || ''}${commentText}` // Appended commentText
      })
    } else if (shape.type === 'image-ingredient-shape' && props.imageUrl) {
      // For image ingredients, push text information first, then the image item.
      formattedIngredients.push({
        type: 'input_text',
        text: `Image Ingredient: ${title}${commentText}`
      })
      formattedIngredients.push({
        type: 'input_image',
        image_url: props.imageUrl,
        detail: 'auto' 
      })
    }
  }
  return formattedIngredients
}

/**
 * Formats ingredients into a JSON string structured for an API, using ApiInputItem items.
 */
export async function formatIngredientsForClipboard(shapes: TLShape[]): Promise<string> {
  // Get the structured ingredient data
  const formattedIngredients: ApiInputItem[] = await formatIngredientsForLLM(shapes);

  // Construct the final JSON object structure directly with ApiInputItem items
  const finalApiOutput = {
    input: [
      {
        type: 'message',
        role: 'user',
        content: formattedIngredients, // Use the already formatted ingredients
      },
    ],
  };

  return JSON.stringify(finalApiOutput, null, 2); // Added null, 2 for pretty printing
} 
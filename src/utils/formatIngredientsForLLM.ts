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

/**
 * Formats ingredients into OpenAI API compatible format
 * Each text and image is a separate entry in the content array
 */
export async function formatIngredientsForLLM(shapes: TLShape[]): Promise<ContentItem[]> {
  // Filter for ingredient shapes
  const ingredientShapes = shapes.filter((shape) => {
    if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
      return false
    }
    return 'title' in shape.props
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
 * Formats ingredients into a markdown-friendly format for clipboard
 */
export async function formatIngredientsForClipboard(shapes: TLShape[]): Promise<string> {
  // Filter for ingredient shapes
  const ingredientShapes = shapes.filter((shape) => {
    if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
      return false
    }
    return 'title' in shape.props
  })

  let formattedText = '# Ingredients in the workspace\n\n'

  // Process each ingredient
  for (const shape of ingredientShapes) {
    const props = shape.props as IngredientProps
    const title = props.title || 'Untitled'
    const comments = props.comments || []

    // Format comments if they exist
    const commentText = comments.length > 0
      ? '\n' + comments
          .map((comment: Comment, i: number) => `${i + 1}. ${comment.text}${comment.isAI ? ' _(AI)_' : ''}`)
          .join('\n')
      : ''

    if (shape.type === 'text-ingredient-shape') {
      formattedText += `# ${title}\n${props.text ? `Content: ${props.text}\n` : ''}${commentText}\n---\n\n`
    } else if (shape.type === 'image-ingredient-shape' && props.imageUrl) {
      formattedText += `# ${title}\n![${title}](${props.imageUrl})\n${commentText}\n---\n\n`
    }
  }

  return formattedText
} 
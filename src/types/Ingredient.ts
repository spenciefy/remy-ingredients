import { TLBaseShape } from 'tldraw'
import { Comment } from './Comment'

/**
 * Common properties shared between text and image ingredients
 */
export type IngredientProps = {
  title?: string
  text?: string
  imageUrl?: string
}

export type ITextIngredientShape = TLBaseShape<
  'text-ingredient-shape',
  {
    w: number
    h: number
    title: string
    text: string
    comments: Comment[]
  }
>

export type IImageIngredientShape = TLBaseShape<
  'image-ingredient-shape',
  {
    w: number
    h: number
    title: string
    imageUrl: string
    comments: Comment[]
  }
>

/**
 * Union type for both ingredient shapes
 */
export type IngredientShape = ITextIngredientShape | IImageIngredientShape 
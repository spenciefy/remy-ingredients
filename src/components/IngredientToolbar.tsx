import React from 'react'
import { Editor } from 'tldraw'
import { INGREDIENT_SHAPE_TYPE, IngredientShape } from '../shapes/IngredientShape'

interface IngredientToolbarProps {
  editor: Editor
}

export const IngredientToolbar: React.FC<IngredientToolbarProps> = ({ editor }) => {
  const handleAddIngredient = () => {
    const { x, y } = editor.getViewportScreenCenter()
    editor.createShape<IngredientShape>({
      type: INGREDIENT_SHAPE_TYPE,
      x,
      y,
      props: {
        title: 'New Ingredient',
        text: 'Enter text here...',
        w: 200,
        h: 200,
      },
    })
  }

  return (
    <div className="absolute top-4 left-4 z-50 flex gap-2">
      <button
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        onClick={handleAddIngredient}
      >
        Add Ingredient
      </button>
    </div>
  )
} 
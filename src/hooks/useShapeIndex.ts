import { useCallback } from 'react'
import { useEditor } from 'tldraw'
import { IngredientShape } from '../types/Ingredient'

export function useShapeIndex() {
  const editor = useEditor()

  const getShapeIndex = useCallback((shapeId: string) => {
    const shapes = editor.getCurrentPageShapes()
    const ingredientShapes = shapes.filter((shape): shape is IngredientShape => {
      if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
        return false
      }
      return 'title' in shape.props
    })

    // Sort by creation time
    const sorted = [...ingredientShapes].sort((a, b) => {
      const aTime = a.meta?.createdAt ? Number(a.meta.createdAt) : 0
      const bTime = b.meta?.createdAt ? Number(b.meta.createdAt) : 0
      return aTime - bTime
    })

    return sorted.findIndex(shape => shape.id === shapeId)
  }, [editor])

  return getShapeIndex
} 
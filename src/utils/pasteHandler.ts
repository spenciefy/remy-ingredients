import { Editor } from 'tldraw';
import { addImageIngredient, addTextIngredient } from './ingredientHandler';

/**
 * Handle global paste events for ingredients
 */
export const handleGlobalPaste = async (e: ClipboardEvent, editor: Editor) => {
  // Check if there are any selected shapes in tldraw
  const selectedShapeIds = editor.getSelectedShapeIds()
  const hasSelectedShapes = selectedShapeIds.length > 0

  // If shapes are selected, let tldraw handle the paste
  if (hasSelectedShapes) {
    return
  }

  // Stop propagation to prevent tldraw's default paste
  e.stopPropagation()
  e.preventDefault()

  // Get cursor position or center of viewport for shape placement
  const point = editor.inputs.currentPagePoint || editor.getViewportScreenCenter()

  // Handle image paste
  const items = e.clipboardData?.items
  if (items) {
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          const reader = new FileReader()
          reader.onload = () => {
            const dataUrl = reader.result as string
            addImageIngredient(editor, dataUrl, point)
          }
          reader.readAsDataURL(file)
          return
        }
      }
    }
  }

  // Handle text paste
  const text = e.clipboardData?.getData('text')
  if (text?.trim()) {
    addTextIngredient(editor, text, point)
  }
} 
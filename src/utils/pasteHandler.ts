import { Editor } from 'tldraw'

// Track created ingredient counts for auto-naming
let imageCount = 0
let textCount = 0

/**
 * Add an image ingredient to the canvas
 */
const addImageIngredient = (editor: Editor, dataUrl: string, point: { x: number, y: number }) => {
  // Create temporary image to get dimensions
  const img = new Image()
  img.onload = () => {
    // Calculate dimensions while maintaining aspect ratio
    const maxWidth = 600
    const maxHeight = 600
    let width = img.naturalWidth
    let height = img.naturalHeight
    
    // Scale down if image is larger than max dimensions
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

    // Increment image count and create automatic title
    imageCount++
    const title = `Image ${imageCount}`

    editor.createShape({
      type: 'image-ingredient-shape',
      props: {
        title,
        imageUrl: dataUrl,
        w: width,
        h: height,
      },
      x: point.x,
      y: point.y,
    })
  }
  img.src = dataUrl
}

/**
 * Add a text ingredient to the canvas
 */
const addTextIngredient = (editor: Editor, text: string, point: { x: number, y: number }) => {
  // Increment text count and create automatic title
  textCount++
  const title = `Text ${textCount}`

  editor.createShape({
    type: 'text-ingredient-shape',
    props: {
      title,
      text,
    },
    x: point.x,
    y: point.y,
  })
}

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
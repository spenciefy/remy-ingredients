import { Editor } from 'tldraw'

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

              editor.createShape({
                type: 'image-ingredient-shape',
                props: {
                  title: '',
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
          reader.readAsDataURL(file)
          return
        }
      }
    }
  }

  // Handle text paste
  const text = e.clipboardData?.getData('text')
  if (text?.trim()) {
    editor.createShape({
      type: 'text-ingredient-shape',
      props: {
        title: '',
        text: text,
      },
      x: point.x,
      y: point.y,
    })
  }
} 
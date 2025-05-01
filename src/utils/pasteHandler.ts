import { Editor } from 'tldraw'

export const handleGlobalPaste = async (e: ClipboardEvent, editor: Editor) => {
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
            editor.createShape({
              type: 'image-ingredient-shape',
              props: {
                title: 'Image Ingredient',
                imageUrl: dataUrl,
                w: 400,
                h: 300,
              },
              x: point.x,
              y: point.y,
            })
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
        title: 'Text Ingredient',
        text: text,
        w: 400,
        h: 300,
      },
      x: point.x,
      y: point.y,
    })
  }
} 
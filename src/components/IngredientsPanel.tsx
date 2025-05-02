import { MouseEvent, useCallback, useEffect, useState } from 'react'
import { TLBaseShape, TLShapeId, useEditor } from 'tldraw'

type IngredientShape = TLBaseShape<
  'text-ingredient-shape' | 'image-ingredient-shape',
  {
    w: number
    h: number
    title: string
    text?: string
    imageUrl?: string
  }
>

export function IngredientsPanel() {
  const editor = useEditor()
  const [ingredients, setIngredients] = useState<IngredientShape[]>([])
  const [selectedIds, setSelectedIds] = useState<TLShapeId[]>([])
  const [editingTitleId, setEditingTitleId] = useState<TLShapeId | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const [width, setWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)

  // Handle resize
  const handleResizeStart = useCallback((e: MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleResize = useCallback((e: globalThis.MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = e.clientX - 16 // 16px is the left offset
    // Clamp width between min and max values
    setWidth(Math.max(250, Math.min(800, newWidth)))
  }, [isResizing])

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [])

  // Add and remove resize event listeners
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleResize)
      window.addEventListener('mouseup', handleResizeEnd)
    }
    return () => {
      window.removeEventListener('mousemove', handleResize)
      window.removeEventListener('mouseup', handleResizeEnd)
    }
  }, [isResizing, handleResize, handleResizeEnd])

  // Update ingredients list when shapes change
  useEffect(() => {
    function updateIngredients() {
      const shapes = editor.getCurrentPageShapes()
      const ingredientShapes = shapes.filter((shape): shape is IngredientShape => {
        // First check if it's one of our ingredient types
        if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
          return false
        }
        // Then verify it has the required properties
        return 'title' in shape.props
      })

      // Sort by creation time, newest first
      const sorted = [...ingredientShapes].sort((a, b) => {
        const aTime = a.meta?.createdAt ? Number(a.meta.createdAt) : 0
        const bTime = b.meta?.createdAt ? Number(b.meta.createdAt) : 0
        return bTime - aTime // Changed to show newest first
      })

      setIngredients(sorted)
    }

    // Initial update
    updateIngredients()

    // Subscribe to store changes
    const unsubscribe = editor.store.listen(updateIngredients)
    return () => {
      unsubscribe()
    }
  }, [editor])

  // Update selection state when canvas selection changes
  useEffect(() => {
    function updateSelection() {
      setSelectedIds(editor.getSelectedShapeIds())
    }

    // Initial update
    updateSelection()

    // Subscribe to selection changes
    const unsubscribe = editor.store.listen(updateSelection)
    return () => {
      unsubscribe()
    }
  }, [editor])

  // Handle keyboard events for deletion
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.length > 0) {
        editor.deleteShapes(selectedIds)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [editor, selectedIds])

  const handleTitleDoubleClick = useCallback((id: TLShapeId) => {
    setEditingTitleId(id)
  }, [])

  const handleTitleChange = useCallback((id: TLShapeId, newTitle: string) => {
    editor.updateShape({
      id,
      type: 'text-ingredient-shape',
      props: { title: newTitle }
    })
    setEditingTitleId(null)
  }, [editor])

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  return (
    <div 
      className={`absolute left-[16px] top-[60px] bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 ${
        isExpanded ? 'h-[calc(100%-76px)]' : 'h-[48px]'
      }`}
      style={{ width: isExpanded ? width : 320 }}
    >
      <div className="relative h-full">
        {/* Header */}
        <div className={`flex items-center transition-all duration-300 ${
          isExpanded ? 'p-4 border-b border-gray-200 justify-between' : 'px-4 py-3 justify-between'
        }`}>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Ingredients</h2>
          </div>
          <button
            onClick={toggleExpanded}
            className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path d="M19 9l-7 7-7-7"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-2 overflow-y-auto max-h-[calc(100%-80px)]">
            {ingredients.map((ingredient, index) => (
              <div 
                key={ingredient.id} 
                className={`mb-2 rounded-lg cursor-pointer overflow-hidden transition-colors shadow-sm hover:shadow ${
                  selectedIds.includes(ingredient.id) ? 'bg-blue-50 ring-2 ring-blue-500' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => {
                  editor.setSelectedShapes([ingredient.id])
                  editor.zoomToFit()
                }}
              >
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    {/* Icon based on type */}
                    {ingredient.type === 'text-ingredient-shape' ? (
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className="text-gray-600"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <path d="M14 2v6h6"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <line x1="10" y1="9" x2="8" y2="9"/>
                      </svg>
                    ) :
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className="text-gray-600"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="m21 15-5-5L5 21"/>
                      </svg>
                    }
                    {editingTitleId === ingredient.id ? (
                      <input
                        type="text"
                        className="flex-1 text-sm px-1 border rounded"
                        defaultValue={ingredient.props.title}
                        autoFocus
                        onBlur={(e) => handleTitleChange(ingredient.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTitleChange(ingredient.id, e.currentTarget.value)
                          }
                          if (e.key === 'Escape') {
                            setEditingTitleId(null)
                          }
                          e.stopPropagation()
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span 
                        className="flex-1 font-medium text-sm text-gray-900"
                        onDoubleClick={(e) => {
                          e.stopPropagation()
                          handleTitleDoubleClick(ingredient.id)
                        }}
                      >
                        {ingredient.props.title || `Ingredient ${index}`}
                      </span>
                    )}
                  </div>

                  {/* Content preview */}
                  {ingredient.type === 'text-ingredient-shape' && ingredient.props.text && (
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {ingredient.props.text}
                    </div>
                  )}
                  {ingredient.type === 'image-ingredient-shape' && ingredient.props.imageUrl && (
                    <div className="mt-1 h-20 bg-gray-200 rounded overflow-hidden">
                      <img 
                        src={ingredient.props.imageUrl} 
                        alt={ingredient.props.title || `Ingredient ${index}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Resize handle */}
        {isExpanded && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-ew-resize hover:bg-blue-500/50 transition-colors"
            onMouseDown={handleResizeStart}
          />
        )}
      </div>
    </div>
  )
} 
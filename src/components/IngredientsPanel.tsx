import { useCallback, useContext, useEffect, useState } from 'react'
import { TLShapeId } from 'tldraw'
import { editorContext } from '../App'
import { IngredientShape } from '../types/Ingredient'
import { AddIngredientPopup } from './AddIngredientPopup'
import { IngredientPanelRow } from './IngredientPanelRow'

// Add helper function for fallback title
export const getIngredientTitle = (ingredient: IngredientShape): string => {
  if (ingredient.props.title?.trim()) {
    return ingredient.props.title;
  }
  
  // Fallback based on ingredient type
  return ingredient.type === 'image-ingredient-shape' ? 'Image' : 'Text';
};

export function IngredientsPanel() {
	const { editor } = useContext(editorContext)
  const [ingredients, setIngredients] = useState<IngredientShape[]>([])
  const [selectedIds, setSelectedIds] = useState<TLShapeId[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [showAddPopup, setShowAddPopup] = useState(false)

  // Convert image URL to base64
  const getBase64FromUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error converting image to base64:', error)
      return ''
    }
  }

  // Format ingredients data for LLM
  const formatIngredientsForLLM = useCallback(async () => {
    const formattedIngredients = await Promise.all(ingredients.map(async (ingredient, index) => {
      const title = ingredient.props.title || `Ingredient ${index}`
      const type = ingredient.type === 'text-ingredient-shape' ? 'text' : 'image'
      
      let content = ''
      let imageData = ''
      
      if (ingredient.type === 'text-ingredient-shape') {
        content = ingredient.props.text
      } else if (ingredient.type === 'image-ingredient-shape' && ingredient.props.imageUrl) {
        imageData = await getBase64FromUrl(ingredient.props.imageUrl)
      }
      
      return [
        `# Ingredient: ${title}`,
        `Type: ${type}`,
        content ? `Content: ${content}` : '',
        imageData ? `Image: ${imageData}` : '',
        '' // Empty line for spacing
      ].filter(line => line !== '').join('\n')
    }))
    
    return formattedIngredients.join('\n\n')
  }, [ingredients])

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const formattedData = await formatIngredientsForLLM()
      await navigator.clipboard.writeText(formattedData)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [formatIngredientsForLLM])

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

  // Handle ingredient selection
  const handleIngredientSelect = useCallback((e: React.MouseEvent, ingredientId: TLShapeId) => {
    // If shift key is pressed, add to selection instead of replacing
    if (e.shiftKey) {
      const currentSelection = [...editor.getSelectedShapeIds()];
      
      // If already selected, remove from selection
      if (currentSelection.includes(ingredientId)) {
        editor.setSelectedShapes(currentSelection.filter(id => id !== ingredientId));
      } else {
        // Add to selection
        editor.setSelectedShapes([...currentSelection, ingredientId]);
      }
    } else {
      // Normal selection (replace)
      editor.setSelectedShapes([ingredientId]);
      
      // Find the shape's bounds to center on it
      const shape = editor.getShape(ingredientId);
      if (shape) {
        // Get shape's page bounds
        const bounds = editor.getShapePageBounds(ingredientId);
        if (bounds) {
          // Center the camera on the shape
          editor.centerOnPoint(bounds.center);
          // Apply a reasonable zoom level
          editor.zoomToBounds(bounds, { targetZoom: 0.85 });
        }
      }
    }
  }, [editor]);

  // Handle title editing
  const handleTitleDoubleClick = useCallback((id: TLShapeId) => {
    editor.setEditingShape(id)
  }, [editor]);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden h-full w-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Ingredients ({ingredients.length})</h2>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowAddPopup(true)}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors mr-2"
              title="Add ingredient"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors relative group"
              title="Copy ingredients data"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-opacity ${copySuccess ? 'opacity-0' : 'opacity-100'}`}
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              {copySuccess && (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto flex-1">
          {ingredients.map((ingredient) => (
            <IngredientPanelRow
              key={ingredient.id}
              ingredient={ingredient}
              isSelected={selectedIds.includes(ingredient.id)}
              onSelect={(e) => handleIngredientSelect(e, ingredient.id)}
              onDoubleClick={() => handleTitleDoubleClick(ingredient.id)}
              editor={editor}
            />
          ))}
        </div>
      </div>
      {/* Add Ingredient Popup */}
      {showAddPopup && (
        <AddIngredientPopup
          editor={editor}
          onClose={() => setShowAddPopup(false)}
        />
      )}
    </div>
  )
} 
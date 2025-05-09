import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { TLShapeId } from 'tldraw'
import { editorContext } from '../../App'
import { IngredientShape } from '../../types/Ingredient'
import { formatIngredientsForClipboard } from '../../utils/formatIngredientsForLLM'
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
  const [activeIngredientIds, setActiveIngredientIds] = useState<TLShapeId[]>([])
  const [copySuccess, setCopySuccess] = useState(false)
  const [showAddPopup, setShowAddPopup] = useState(false)
  const initializedRef = useRef(false)

  // Handle copy to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    try {
      const shapes = editor.getCurrentPageShapes()
      const formattedText = await formatIngredientsForClipboard(shapes)
      await navigator.clipboard.writeText(formattedText)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }, [editor])

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
      
      // Only auto-activate ingredients on initial load
      if (!initializedRef.current) {
        initializedRef.current = true
      }
      
      // Get currently active ingredients from metadata
      const activeIds = sorted
        .filter(ingredient => ingredient.meta?.isActive)
        .map(ingredient => ingredient.id)
      
      setActiveIngredientIds(activeIds)
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

  // Handle toggling ingredient active state
  const handleToggleActive = useCallback((ingredientId: TLShapeId) => {
    setActiveIngredientIds(prev => {
      const willBeActive = !prev.includes(ingredientId)
      
      // Update the shape's metadata
      const shape = editor.getShape(ingredientId)
      if (shape) {
        editor.updateShape({
          ...shape,
          meta: {
            ...shape.meta,
            isActive: willBeActive
          }
        })
      }
      
      const newActiveIds = willBeActive ? 
        [...prev, ingredientId] : 
        prev.filter(id => id !== ingredientId)
      return newActiveIds
    })
  }, [editor])

  return (
    <div className="bg-white dark:bg-custom-dark-panel rounded-lg shadow-lg overflow-hidden h-full w-full">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ingredients ({ingredients.length})</h2>
          </div>
        </div>

        {/* Caption */}
        {ingredients.length === 0 && (
          <div className="px-4 pt-2 pb-1">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Start by cmd-v pasting text or images on the canvas</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex w-full px-4 pb-2 pt-4 gap-2">
            <button
              onClick={() => setShowAddPopup(true)}
              className="flex items-center justify-center gap-2 w-1/2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200"
              title="Add ingredient"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-600 dark:text-gray-300">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-medium text-sm">Add</span>
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="flex items-center justify-center gap-2 w-1/2 py-2.5 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 relative"
              title="Copy ingredients data"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`transition-opacity text-gray-600 dark:text-gray-300 ${copySuccess ? 'opacity-0' : 'opacity-100'}`}
              >
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
              <span className="font-medium text-sm">Copy</span>
              {copySuccess && (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-green-500 dark:text-green-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                >
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              )}
            </button>
          </div>

        {/* Select All Toggle */}
        <div className="px-4 py-1.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
             onClick={() => {
               const allIds = ingredients.map(ing => ing.id);
               const allActive = ingredients.length === activeIngredientIds.length;
               
               // Update all ingredients' active state
               ingredients.forEach(ingredient => {
                 editor.updateShape({
                   ...ingredient,
                   meta: {
                     ...ingredient.meta,
                     isActive: !allActive
                   }
                 })
               });
               
               // Update active IDs state
               setActiveIngredientIds(allActive ? [] : allIds);
             }}>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Select all ingredients</span>
          <input
            type="checkbox"
            checked={ingredients.length > 0 && ingredients.length === activeIngredientIds.length}
            onChange={() => {}} // Handled by parent div onClick
            className="h-4 w-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 cursor-pointer"
          />
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {ingredients.map((ingredient) => (
            <IngredientPanelRow
              key={ingredient.id}
              ingredient={ingredient}
              isSelected={selectedIds.includes(ingredient.id)}
              isActive={activeIngredientIds.includes(ingredient.id)}
              onSelect={(e) => handleIngredientSelect(e, ingredient.id)}
              onDoubleClick={() => handleTitleDoubleClick(ingredient.id)}
              onToggleActive={() => handleToggleActive(ingredient.id)}
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
import { HiOutlineDocumentText } from 'react-icons/hi'
import { Editor } from 'tldraw'
import { IngredientShape } from '../../types/Ingredient'
import { getIngredientTitle } from './IngredientsPanel'

interface IngredientPanelRowProps {
  ingredient: IngredientShape
  isSelected: boolean
  isActive: boolean
  onSelect: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onToggleActive: () => void
  editor: Editor
}

export function IngredientPanelRow({
  ingredient,
  isSelected,
  isActive,
  onSelect,
  onDoubleClick,
  onToggleActive,
  editor
}: IngredientPanelRowProps) {
  return (
    <div 
      className={`mb-2 rounded-md cursor-pointer overflow-hidden transition-colors ${
        isSelected ? 'bg-blue-100 dark:bg-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      onClick={onSelect}
    >
      <div className="px-2 py-1.5 flex items-center space-x-2">
        {/* Small square image preview for image ingredients */}
        {ingredient.type === 'image-ingredient-shape' && ingredient.props.imageUrl ? (
          <div className="w-5 h-5 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-600 shadow-sm">
            <img 
              src={ingredient.props.imageUrl} 
              alt={getIngredientTitle(ingredient)} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <HiOutlineDocumentText className="w-5 h-5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
        )}
        
        {/* Title */}
        {ingredient.id === editor.getEditingShapeId() ? (
          <input
            type="text"
            className="flex-1 text-sm px-1 border rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-blue-400"
            defaultValue={ingredient.props.title}
            autoFocus
            onBlur={(e) => {
              editor.updateShape({
                id: ingredient.id,
                type: ingredient.type,
                props: { title: e.target.value }
              })
              editor.setEditingShape(null)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                editor.updateShape({
                  id: ingredient.id,
                  type: ingredient.type,
                  props: { title: e.currentTarget.value }
                })
                editor.setEditingShape(null)
              }
              if (e.key === 'Escape') {
                editor.setEditingShape(null)
              }
              e.stopPropagation()
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span 
            className={`flex-1 text-base truncate ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}
            onDoubleClick={(e) => {
              e.stopPropagation()
              onDoubleClick()
            }}
          >
            {getIngredientTitle(ingredient)}
          </span>
        )}

        {/* Active Toggle Checkbox */}
        <div 
          className="flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleActive()
          }}
        >
          <input
            type="checkbox"
            checked={isActive}
            onClick={(e) => {
              e.stopPropagation()
            }}
            onChange={(e) => {
              e.stopPropagation()
              onToggleActive()
            }}
            className={`h-4 w-4 text-blue-600 dark:text-blue-400 rounded border-gray-300 dark:border-gray-500 focus:ring-blue-500 dark:focus:ring-offset-0 dark:focus:ring-blue-400 bg-white dark:bg-gray-700 cursor-pointer`}
          />
        </div>
      </div>
    </div>
  )
} 
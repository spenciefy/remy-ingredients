import { HiOutlineDocumentText } from 'react-icons/hi'
import { Editor } from 'tldraw'
import { IngredientShape, getIngredientTitle } from './IngredientsPanel'

interface IngredientPanelRowProps {
  ingredient: IngredientShape
  isSelected: boolean
  onSelect: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  editor: Editor
}

export function IngredientPanelRow({
  ingredient,
  isSelected,
  onSelect,
  onDoubleClick,
  editor
}: IngredientPanelRowProps) {
  return (
    <div 
      className={`mb-2 rounded-md cursor-pointer overflow-hidden transition-colors ${
        isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
      }`}
      onClick={onSelect}
    >
      <div className="px-2 py-1.5 flex items-center space-x-2">
        {/* Small square image preview for image ingredients */}
        {ingredient.type === 'image-ingredient-shape' && ingredient.props.imageUrl ? (
          <div className="w-5 h-5 flex-shrink-0 rounded overflow-hidden bg-gray-200 shadow-sm">
            <img 
              src={ingredient.props.imageUrl} 
              alt={getIngredientTitle(ingredient)} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <HiOutlineDocumentText className="w-5 h-5 flex-shrink-0 text-gray-600" />
        )}
        
        {/* Title */}
        {ingredient.id === editor.getEditingShapeId() ? (
          <input
            type="text"
            className="flex-1 text-sm px-1 border rounded"
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
            className="flex-1 text-base text-gray-900 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation()
              onDoubleClick()
            }}
          >
            {getIngredientTitle(ingredient)}
          </span>
        )}
      </div>
    </div>
  )
} 
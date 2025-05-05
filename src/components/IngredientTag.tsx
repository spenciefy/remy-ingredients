import { useContext, useEffect, useState } from 'react';
import { BsImage } from 'react-icons/bs';
import { HiOutlineDocumentText } from 'react-icons/hi';
import { TLShapeId } from 'tldraw';
import { editorContext } from '../App';

interface IngredientTagProps {
  ingredient: { 
    id: TLShapeId; 
    title: string; 
    type: string 
  };
  onDeactivate: (id: TLShapeId) => void;
}

export function IngredientTag({ ingredient, onDeactivate }: IngredientTagProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { editor } = useContext(editorContext);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get image URL for image ingredients
    if (ingredient.type === 'image-ingredient-shape') {
      const shape = editor.getShape(ingredient.id);
      if (shape && 'imageUrl' in shape.props) {
        setImageUrl(shape.props.imageUrl as string);
      }
    }
  }, [ingredient.id, ingredient.type, editor]);

  return (
    <span
      key={ingredient.id}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-300 group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered ? (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDeactivate(ingredient.id);
          }}
          className="w-3 h-3 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      ) : ingredient.type === 'image-ingredient-shape' && imageUrl ? (
        <div className="w-3.5 h-3.5 rounded-sm overflow-hidden flex items-center justify-center">
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        </div>
      ) : ingredient.type === 'text-ingredient-shape' ? (
        <HiOutlineDocumentText className="w-3 h-3" />
      ) : (
        <BsImage className="w-3 h-3" />
      )}
      {ingredient.title || 'Untitled'}
    </span>
  );
} 
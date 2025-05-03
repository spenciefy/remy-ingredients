import React, { DragEvent, useEffect, useRef, useState } from 'react';
import { Editor } from 'tldraw';
import { addImageIngredient, addTextIngredient } from '../utils/ingredientHandler';

interface AddIngredientPopupProps {
  editor: Editor;
  onClose: () => void;
}

export const AddIngredientPopup: React.FC<AddIngredientPopupProps> = ({ editor, onClose }) => {
  const [text, setText] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle paste events for text or image
  useEffect(() => {
    const handlePaste = (e: Event) => {
      const ce = e as ClipboardEvent;
      if (ce.clipboardData) {
        // Image paste
        const items = ce.clipboardData.items;
        for (const item of items) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = () => setImageDataUrl(reader.result as string);
              reader.readAsDataURL(file);
              ce.preventDefault();
              return;
            }
          }
        }
        // Text paste
        const pastedText = ce.clipboardData.getData('text');
        if (pastedText) {
          setText(pastedText);
          ce.preventDefault();
        }
      }
    };
    const node = popupRef.current;
    if (node) node.addEventListener('paste', handlePaste as EventListener);
    return () => {
      if (node) node.removeEventListener('paste', handlePaste as EventListener);
    };
  }, []);

  // Drag and drop image
  useEffect(() => {
    const dropNode = dropRef.current;
    if (!dropNode) return;
    const handleDragOver = (e: Event) => {
      const de = e as unknown as DragEvent<HTMLDivElement>;
      de.preventDefault();
      setIsDragActive(true);
    };
    const handleDragLeave = (e: Event) => {
      const de = e as unknown as DragEvent<HTMLDivElement>;
      de.preventDefault();
      setIsDragActive(false);
    };
    const handleDrop = (e: Event) => {
      const de = e as unknown as DragEvent<HTMLDivElement>;
      de.preventDefault();
      setIsDragActive(false);
      const dt = de.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        const file = dt.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => setImageDataUrl(reader.result as string);
          reader.readAsDataURL(file);
        }
      }
    };
    dropNode.addEventListener('dragover', handleDragOver as EventListener);
    dropNode.addEventListener('dragleave', handleDragLeave as EventListener);
    dropNode.addEventListener('drop', handleDrop as EventListener);
    return () => {
      dropNode.removeEventListener('dragover', handleDragOver as EventListener);
      dropNode.removeEventListener('dragleave', handleDragLeave as EventListener);
      dropNode.removeEventListener('drop', handleDrop as EventListener);
    };
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Add ingredient (image if present, else text)
  const handleAdd = async () => {
    if (!text.trim() && !imageDataUrl) return;
    setIsAdding(true);
    const point = editor.inputs.currentPagePoint || editor.getViewportScreenCenter();
    if (imageDataUrl) {
      addImageIngredient(editor, imageDataUrl, point);
    } else {
      await addTextIngredient(editor, text, point);
    }
    setIsAdding(false);
    onClose();
  };

  // Backdrop click closes
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  // File input change handler
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setImageDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Click on drop area opens file picker
  const handleDropAreaClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
      onClick={handleBackdropClick}
    >
      <div
        ref={popupRef}
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative animate-fadeIn"
        tabIndex={-1}
        style={{ outline: 'none' }}
      >
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Add Ingredient</h2>
        <div className="mb-4">
          <textarea
            className="w-full border rounded p-4 min-h-[120px] text-base resize-y"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type or paste text here..."
            disabled={isAdding}
          />
        </div>
        <div className="mb-4">
          <div
            ref={dropRef}
            className={`w-full h-32 border-2 rounded flex items-center justify-center transition-colors cursor-pointer ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-dashed border-gray-300 bg-gray-50'}`}
            tabIndex={0}
            style={{ outline: 'none' }}
            onClick={handleDropAreaClick}
          >
            {imageDataUrl ? (
              <div className="flex flex-col items-center w-full">
                <img src={imageDataUrl} alt="Preview" className="max-h-28 max-w-full rounded border" />
                <button
                  className="mt-1 text-xs text-red-500 hover:underline"
                  onClick={e => { e.stopPropagation(); setImageDataUrl(null); }}
                  type="button"
                  disabled={isAdding}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <span className="text-gray-400 text-sm text-center px-2">
                Paste or drag and drop an image here, or click to select
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInputChange}
              tabIndex={-1}
            />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full"
            onClick={handleAdd}
            disabled={(!text.trim() && !imageDataUrl) || isAdding}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}; 
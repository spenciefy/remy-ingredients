import { ClipboardEvent, useCallback, useRef } from 'react';
import { Editor, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { IngredientsPanel } from './components/IngredientsPanel';
import { ImageIngredientShape } from './shapes/ImageIngredientShape';
import { TextIngredientShape } from './shapes/TextIngredientShape';
import './styles.css';
import { handleGlobalPaste } from './utils/pasteHandler';

export default function App() {
  const customShapeUtils = [
    TextIngredientShape,
    ImageIngredientShape
  ]

  const editorRef = useRef<Editor | null>(null);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    if (editorRef.current) {
      handleGlobalPaste(e.nativeEvent, editorRef.current);
    }
  }, []);

  return (
    <div className="flex h-screen w-screen bg-gray-100 p-4">
      {/* Center - TLDraw Canvas */}
      <div className="flex-1 relative mr-4">
        <div 
          className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden"
          onPaste={handlePaste}
        >
          <Tldraw
            autoFocus={true} 
            persistenceKey="my-persistence-key"
            shapeUtils={customShapeUtils}
            onMount={(editor) => {
              editorRef.current = editor;
            }}
          >
            <IngredientsPanel />
          </Tldraw>
        </div>
      </div>

      {/* Right side - Suggestions and Chat */}
      <div className="w-80 flex flex-col gap-4">
        {/* Suggestions Box */}
        <div className="flex-1 bg-white rounded-2xl shadow-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Suggestions</h2>
          <div className="text-gray-500">Coming soon</div>
        </div>

        {/* Chat Box */}
        <div className="flex-1 bg-white rounded-2xl shadow-2xl p-4">
          <h2 className="text-lg font-semibold mb-4">Chat</h2>
          <div className="text-gray-500">Coming soon</div>
        </div>
      </div>
    </div>
  );
}
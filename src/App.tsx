import React from 'react';
import { Editor, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { IngredientToolbar } from './components/IngredientToolbar';
import { IngredientShapeUtil } from './shapes/IngredientShape';
import './styles.css';

const customShapeUtils = [IngredientShapeUtil]

export default function App() {
  const [editor, setEditor] = React.useState<Editor | null>(null);

  const handleMount = (editor: Editor) => {
    setEditor(editor);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 p-4">
      {/* Left side - TLDraw Canvas */}
      <div className="flex-1 relative mr-4">
        <div className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden">
          {editor && <IngredientToolbar editor={editor} />}
          <Tldraw 
            autoFocus={true} 
            persistenceKey="my-persistence-key"
            hideUi={false}
            shapeUtils={customShapeUtils}
            onMount={handleMount}
          />
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
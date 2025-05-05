import { ClipboardEvent, createContext, useCallback, useEffect, useState } from 'react';
import { Editor, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { ChatPanel } from './components/ChatPanel';
import { IngredientsPanel } from './components/IngredientsPanel';
import { ResizablePanel } from './components/ResizablePanel';
import { ImageIngredientShape } from './shapes/ImageIngredientShape';
import { TextIngredientShape } from './shapes/TextIngredientShape';
import './styles.css';
import { handleGlobalPaste } from './utils/pasteHandler';

export const editorContext = createContext({} as { editor: Editor })

type TabType = 'ingredients' | 'board' | 'chat';

export default function App() {
  const customShapeUtils = [
    TextIngredientShape,
    ImageIngredientShape
  ]

  const [editor, setEditor] = useState<Editor | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('ingredients')
  const [isMobile, setIsMobile] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(300)
  const [rightPanelWidth, setRightPanelWidth] = useState(350)

  // Check if screen is mobile/tablet size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkScreenSize();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    if (editor) {
      handleGlobalPaste(e.nativeEvent, editor);
    }
  }, [editor]);

  // Tab navigation component
  const TabNavigation = () => (
    <div className="w-full flex border-b border-gray-300 border-b-2">
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'ingredients' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveTab('ingredients')}
      >
        Ingredients
      </button>
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'board' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveTab('board')}
      >
        Board
      </button>
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        onClick={() => setActiveTab('chat')}
      >
        Chat
      </button>
    </div>
  );

  // Content based on active tab for mobile view
  const renderMobileContent = () => {
    switch (activeTab) {
      case 'ingredients':
        return editor && (
          <div className="h-full w-full">
            <editorContext.Provider value={{ editor }}>
              <IngredientsPanel />
            </editorContext.Provider>
          </div>
        );
      case 'chat':
        return editor && (
          <div className="h-full w-full bg-white rounded-2xl shadow-2xl">
            <editorContext.Provider value={{ editor }}>
              <ChatPanel />
            </editorContext.Provider>
          </div>
        );
      case 'board':
        return (
          <div 
            className="h-full w-full relative bg-white rounded-2xl shadow-2xl overflow-hidden"
            onPaste={handlePaste}
          >
            <Tldraw
              autoFocus={true} 
              persistenceKey="my-persistence-key"
              shapeUtils={customShapeUtils}
              onMount={(editor) => setEditor(editor)}
            />
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-100 p-4">
      {isMobile && <TabNavigation />}

      {isMobile ? (
        // Mobile layout - full height content
        <div className="flex-1">
          {renderMobileContent()}
        </div>
      ) : (
        // Desktop layout
        <div className="flex flex-1 min-h-0">
          {/* Left - Ingredients Panel */}
          {editor && (
            <ResizablePanel
              width={leftPanelWidth}
              onWidthChange={setLeftPanelWidth}
              side="left"
              minWidth={250}
              maxWidth={500}
            >
              <editorContext.Provider value={{ editor }}>
                <IngredientsPanel />
              </editorContext.Provider>
            </ResizablePanel>
          )}
        
          {/* Center - TLDraw Canvas */}
          <div className="flex-1 relative mx-4">
            <div 
              className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden"
              onPaste={handlePaste}
            >
              <Tldraw
                autoFocus={true} 
                persistenceKey="my-persistence-key"
                shapeUtils={customShapeUtils}
                onMount={(editor) => setEditor(editor)}
              />
            </div>
          </div>

          {/* Right side - Chat */}
          {editor && (
            <ResizablePanel
              width={rightPanelWidth}
              onWidthChange={setRightPanelWidth}
              side="right"
              minWidth={300}
              maxWidth={600}
            >
              <div className="bg-white rounded-2xl shadow-2xl h-full">
                <editorContext.Provider value={{ editor }}>
                  <ChatPanel />
                </editorContext.Provider>
              </div>
            </ResizablePanel>
          )}
        </div>
      )}
    </div>
  );
}
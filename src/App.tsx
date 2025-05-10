import { ClipboardEvent, createContext, useCallback, useEffect, useState } from 'react';
import { Editor, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';
import { ChatPanel } from './components/Chat/ChatPanel';
import { IngredientsPanel } from './components/Ingredients/IngredientsPanel';
import { Header } from './components/Layout/Header';
import { ResizablePanel } from './components/ResizablePanel';
import { myAssetStore } from './lib/tldrawAssetStore';
import { ImageIngredientShape } from './shapes/ImageIngredientShape';
import { TextIngredientShape } from './shapes/TextIngredientShape';
import './styles.css';
import { handleGlobalPaste } from './utils/pasteHandler';

export const editorContext = createContext({} as { editor: Editor })

const LOCAL_STORAGE_KEY = 'darkModePreference';

type TabType = 'ingredients' | 'board' | 'chat';

const getInitialDarkMode = (): boolean => {
  const storedPreference = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (storedPreference !== null) {
    return JSON.parse(storedPreference);
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

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
  const [darkMode, setDarkMode] = useState<boolean>(getInitialDarkMode);

  // Effect to apply dark mode to HTML element and Tldraw
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    if (editor?.user) {
      editor.user.updateUserPreferences({ colorScheme: darkMode ? 'dark' : 'light' });
    }
    // Save preference to localStorage whenever darkMode state changes internally
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(darkMode));

  }, [darkMode, editor]);


  // Toggle dark mode function (called by Header)
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
    // localStorage saving is now handled by the useEffect above
  };

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
    <div className="w-full flex border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-custom-dark-panel">
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'ingredients' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
        onClick={() => setActiveTab('ingredients')}
      >
        Ingredients
      </button>
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'board' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
        onClick={() => setActiveTab('board')}
      >
        Board
      </button>
      <button 
        className={`flex-1 pb-2 text-center font-bold text-lg flex items-center justify-center ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 dark:text-gray-400'}`}
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
          <div className="h-full w-full bg-white dark:bg-custom-dark-panel">
            <editorContext.Provider value={{ editor }}>
              <IngredientsPanel />
            </editorContext.Provider>
          </div>
        );
      case 'chat':
        return editor && (
          <div className="h-full w-full bg-white dark:bg-custom-dark-panel rounded-2xl shadow-2xl">
            <editorContext.Provider value={{ editor }}>
              <ChatPanel />
            </editorContext.Provider>
          </div>
        );
      case 'board':
        return (
          <div 
            className="h-full w-full relative bg-white dark:bg-custom-dark-canvas rounded-2xl shadow-2xl overflow-hidden"
            onPaste={handlePaste}
          >
            <Tldraw
              key={darkMode ? 'tldraw-dark-mobile' : 'tldraw-light-mobile'} 
              autoFocus={true} 
              persistenceKey="my-persistence-key-mobile"
              shapeUtils={customShapeUtils}
              onMount={(mountedEditor) => {
                setEditor(mountedEditor);
                // Initial Tldraw theme set by the useEffect based on darkMode state
              }}
              assets={myAssetStore}
            />
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-gray-100 dark:bg-custom-dark-panel ${darkMode ? 'dark' : ''}`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
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
              <div className="bg-white dark:bg-custom-dark-panel rounded-b-2xl shadow-2xl h-full border-r border-gray-300 dark:border-gray-600">
                <editorContext.Provider value={{ editor }}>
                  <IngredientsPanel />
                </editorContext.Provider>
              </div>
            </ResizablePanel>
          )}
        
          {/* Center - TLDraw Canvas */} 
          <div className="flex-1 relative">
            <div 
              className="absolute inset-0 bg-white dark:bg-custom-dark-canvas rounded-2xl shadow-2xl overflow-hidden"
              onPaste={handlePaste}
            >
              <Tldraw
                key={darkMode ? 'tldraw-dark-desktop' : 'tldraw-light-desktop'} 
                autoFocus={true} 
                persistenceKey="my-persistence-key-desktop"
                shapeUtils={customShapeUtils}
                onMount={(mountedEditor) => {
                  setEditor(mountedEditor);
                  // Initial Tldraw theme set by the useEffect based on darkMode state
                }}
                assets={myAssetStore}
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
              <div className="bg-white dark:bg-custom-dark-panel rounded-b-2xl shadow-2xl h-full border-l border-gray-300 dark:border-gray-600">
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
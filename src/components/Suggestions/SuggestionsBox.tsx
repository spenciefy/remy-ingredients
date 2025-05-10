import { useCallback, useEffect, useRef, useState } from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Editor, TLShapeId } from 'tldraw';
import { IngredientProps } from '../../types/Ingredient';
import { ApiInputItem, formatIngredientsForLLM } from '../../utils/formatIngredientsForLLM';
import { fetchSuggestionsStream } from '../../utils/suggestionsHandler';

const DEBOUNCE_DELAY = 1000; // Reinstated debounce delay

interface SuggestionsBoxProps {
  editor: Editor;
}

export function SuggestionsBox({ editor }: SuggestionsBoxProps) {
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  const [activeIngredients, setActiveIngredients] = useState<Array<{ id: TLShapeId; title: string; type: string }>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionsBoxHeight, setSuggestionsBoxHeight] = useState<number>(250); // Default height in pixels (h-40 = 10rem = 160px)
  const isResizingRef = useRef<boolean>(false);
  const lastMouseYRef = useRef<number>(0);

  const debounceTimeoutRef = useRef<number | null>(null);

  const getActiveIngredients = useCallback(() => {
    const shapes = editor.getCurrentPageShapes();
    return shapes
      .filter((shape) => 
        (shape.type === 'text-ingredient-shape' || shape.type === 'image-ingredient-shape') &&
        'title' in shape.props && shape.meta?.isActive === true
      )
      .map(shape => {
        const { title } = shape.props as IngredientProps; // Type assertion
        return {
          id: shape.id as TLShapeId, // Type assertion
          title: title || 'Untitled',
          type: shape.type
        };
      });
  }, [editor]);

  // Effect for listening to editor changes and updating activeIngredients
  useEffect(() => {
    const updateIngredientsList = () => {
      const currentActiveIngredients = getActiveIngredients();
      if (JSON.stringify(currentActiveIngredients) !== JSON.stringify(activeIngredients)) {
        setActiveIngredients(currentActiveIngredients);
      }
    };

    updateIngredientsList();

    // Corrected listener: does not need the snapshot argument if not used for granular updates
    const unsubscribe = editor.store.listen(updateIngredientsList);

    return () => {
      unsubscribe();
    };
  }, [editor, getActiveIngredients, activeIngredients]);


  const callSuggestionApi = useCallback(async () => {
    if (activeIngredients.length === 0) {
      setCurrentSuggestion('');
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentSuggestion(''); // Clear previous suggestion before streaming new one

    try {
      const shapesForLLM = editor.getCurrentPageShapes().filter(shape => 
        activeIngredients.some(activeIng => activeIng.id === shape.id)
      );
      const formattedIngredients: ApiInputItem[] = await formatIngredientsForLLM(shapesForLLM);
      
      const requestPayloadInput: ApiInputItem[] = [...formattedIngredients]; // Only ingredients
      const requestBody = { input: requestPayloadInput };

      console.log('🧠 [SuggestionsBox] Invoking Remy for suggestions stream...');
      
      for await (const chunk of fetchSuggestionsStream(requestBody, undefined)) {
        setCurrentSuggestion(prev => prev + chunk); 
      }
      
    } catch (err) {
      console.error("❌ [SuggestionsBox] Error fetching or streaming suggestion:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred during suggestions.");
      setCurrentSuggestion(''); // Clear suggestion on error
    } finally {
      setIsLoading(false);
    }
    // Removed suggestionsHistory from dependencies as it's not sent to backend anymore
  }, [editor, activeIngredients, formatIngredientsForLLM]);

  // Effect for automatic API calls when activeIngredients change (debounced)
  useEffect(() => {
    if (activeIngredients.length > 0) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = window.setTimeout(() => {
        callSuggestionApi();
      }, DEBOUNCE_DELAY);
    } else {
      // Clear suggestion and ongoing debounce if ingredients are removed
      setCurrentSuggestion('');
      setError(null);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [activeIngredients, callSuggestionApi]);

  const handleRefresh = () => {
    if (debounceTimeoutRef.current) { // This check might be redundant now but harmless
      clearTimeout(debounceTimeoutRef.current); // Clear any pending debounced call
    }
    callSuggestionApi(); // Call immediately
  };

  const handleMouseDownResize = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    lastMouseYRef.current = e.clientY;
    document.addEventListener('mousemove', handleMouseMoveResize);
    document.addEventListener('mouseup', handleMouseUpResize);
    e.preventDefault(); // Prevent text selection
  };

  const handleMouseMoveResize = (e: MouseEvent) => {
    if (!isResizingRef.current) return;
    const deltaY = e.clientY - lastMouseYRef.current;
    setSuggestionsBoxHeight(prevHeight => Math.max(50, prevHeight + deltaY)); // Min height 50px
    lastMouseYRef.current = e.clientY;
  };

  const handleMouseUpResize = () => {
    isResizingRef.current = false;
    document.removeEventListener('mousemove', handleMouseMoveResize);
    document.removeEventListener('mouseup', handleMouseUpResize);
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMoveResize);
      document.removeEventListener('mouseup', handleMouseUpResize);
    };
  }, []);

  return (
    <div className="border-b border-gray-300 dark:border-gray-600 p-4 bg-white dark:bg-custom-dark-panel rounded-t-2xl" style={{ height: `${suggestionsBoxHeight}px`, position: 'relative' }}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-md font-semibold text-gray-900 dark:text-white">Remy's Thoughts</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Refresh suggestions"
        >
          <FiRefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      <div className="h-full overflow-y-auto text-sm text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700 p-2 rounded scrollbar-thin dark:scrollbar-thumb-gray-500 dark:scrollbar-track-gray-700" style={{ height: `calc(100% - 32px - 8px)` /* Account for title and drag handle area */ }}>
        {/* Initial loading state (before first chunk or if no active ingredients) */}
        {isLoading && !currentSuggestion && activeIngredients.length > 0 && !error && (
          <div className="flex items-center text-gray-600 dark:text-gray-300">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Remy is looking at your {activeIngredients.length} ingredients...
          </div>
        )}

        {/* Display suggestion (streaming or complete) */}
        {currentSuggestion && !error && (
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]} 
            className="prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-200"
            components={{
              ul: (props) => <ul className="my-2 list-disc pl-4" {...props} />,
              ol: (props) => <ol className="my-2 list-decimal pl-4" {...props} />,
              li: (props) => <li className="my-0.5" {...props} />,
              // We can add other elements here if needed, like p, h1, etc.
              // For now, let's stick to the list items as requested.
              p: (props) => <p className="my-1" {...props} />, // Added for consistent paragraph styling
            }}
          >
            {currentSuggestion}
          </ReactMarkdown>
        )}

        {/* Placeholder: No active ingredients and not loading initial suggestion */}
        {!isLoading && activeIngredients.length === 0 && !error && !currentSuggestion && (
          <p className="text-gray-500 dark:text-gray-400">Remy is waiting for you to add ingredients.</p>
        )}
        
        {/* Placeholder: Active ingredients, but no suggestion initiated/available and not currently loading one */}
        {!isLoading && activeIngredients.length > 0 && !currentSuggestion && !error && (
          <p className="text-gray-500 dark:text-gray-400">Click refresh to get Remy's thoughts, or wait for Remy to ponder.</p>
        )}

        {/* Error message */}
        {error && <p className="text-red-500 dark:text-red-400">Error: {error}</p>}
      </div>
      <div 
        onMouseDown={handleMouseDownResize}
        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize flex items-center justify-center"
        style={{ touchAction: 'none' }} // Prevent scrolling on touch devices when dragging
      >
        <div className="w-8 h-1 bg-gray-400 dark:bg-gray-500 rounded-full hover:bg-gray-500 dark:hover:bg-gray-400 transition-colors"></div>
      </div>
    </div>
  );
} 
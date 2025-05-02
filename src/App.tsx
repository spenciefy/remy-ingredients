import FontFamily from '@tiptap/extension-font-family';
import TextStyle from '@tiptap/extension-text-style';
import { ClipboardEvent, useCallback, useRef } from 'react';
import { Editor, TLTextOptions, Tldraw, defaultAddFontsFromNode, tipTapDefaultExtensions } from 'tldraw';
import 'tldraw/tldraw.css';
import { IngredientsPanel } from './components/IngredientsPanel';
import { extensionFontFamilies } from './extensions/fonts';
import { FontSize } from './extensions/FontSizeExtension';
import { ImageIngredientShape } from './shapes/ImageIngredientShape';
import { TextIngredientShape } from './shapes/TextIngredientShape';
import './styles.css';
import './styles/RichTextFontExtension.css';
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

  const textOptions: Partial<TLTextOptions> = {
    tipTapConfig: {
      extensions: [...tipTapDefaultExtensions, FontFamily, FontSize, TextStyle],
    },
    addFontsFromNode(node, state, addFont) {
      state = defaultAddFontsFromNode(node, state, addFont)

      // if we have a font-family attribute, keep track of that in the state so it applies to children
      for (const mark of node.marks) {
        if (
          mark.type.name === 'textStyle' &&
          mark.attrs.fontFamily &&
          mark.attrs.fontFamily !== 'DEFAULT' &&
          mark.attrs.fontFamily !== state.family
        ) {
          state = { ...state, family: mark.attrs.fontFamily }
        }
      }

      // if one of our extension font families matches the current state, add that font to the document.
      const font = extensionFontFamilies[state.family]?.[state.style]?.[state.weight]
      if (font) addFont(font)

      return state
    },
  }

  const fontFaces = Object.values(extensionFontFamilies)
    .map((fontFamily) => Object.values(fontFamily))
    .flat()
    .map((fontStyle) => Object.values(fontStyle))
    .flat()

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
            textOptions={textOptions}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.fonts.requestFonts(fontFaces);
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
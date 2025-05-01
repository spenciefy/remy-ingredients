import React from 'react'
import {
    BaseBoxShapeUtil,
    HTMLContainer,
    T,
    TLBaseShape,
    toDomPrecision,
    useEditor,
    useIsEditing
} from 'tldraw'

export const INGREDIENT_SHAPE_TYPE = 'my-ingredient' as const

// Define the shape's properties
export type IngredientShape = TLBaseShape<
  typeof INGREDIENT_SHAPE_TYPE,
  {
    w: number
    h: number
    title: string
    text: string
    isLoading?: boolean
  }
>

const LABEL_HEIGHT = 40
const DEFAULT_SIZE = { w: 200, h: 200 }

// Keep focus state outside component to persist across re-renders
let currentlyFocused: { shapeId: string; element: 'title' | 'text' } | null = null

export class IngredientShapeUtil extends BaseBoxShapeUtil<IngredientShape> {
  static override type = INGREDIENT_SHAPE_TYPE

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    text: T.string,
    isLoading: T.optional(T.boolean),
  }

  override isAspectRatioLocked = () => false
  override canResize = () => true
  override canBind = () => true
  override canEdit = () => true

  getDefaultProps(): IngredientShape['props'] {
    return {
      w: DEFAULT_SIZE.w,
      h: DEFAULT_SIZE.h,
      title: 'New Ingredient',
      text: 'Enter text here...',
      isLoading: false,
    }
  }

  override onDoubleClick = (shape: IngredientShape) => {
    console.log('🎯 onDoubleClick triggered', { shapeId: shape.id })
    const { editor } = this
    if (!editor) return
    editor.setEditingShape(shape.id)
    editor.setSelectedShapes([shape.id])
    // Reset focus state on double click
    currentlyFocused = null
  }

  override onEditEnd = () => {
    console.log('🔚 onEditEnd triggered')
    const { editor } = this
    if (!editor) return
    editor.setEditingShape(null)
    currentlyFocused = null
  }

  component(shape: IngredientShape) {
    const IngredientComponent = () => {
      const editor = useEditor()
      const isEditing = useIsEditing(shape.id)
      const titleRef = React.useRef<HTMLInputElement>(null)
      const textRef = React.useRef<HTMLTextAreaElement>(null)
      
      console.log('🔄 Component rendered', { 
        shapeId: shape.id, 
        isEditing,
        currentlyFocused: currentlyFocused?.element,
        title: shape.props.title,
        text: shape.props.text 
      })

      React.useEffect(() => {
        if (isEditing && !currentlyFocused) {
          console.log('🎯 Initial edit focus on title')
          titleRef.current?.focus()
          currentlyFocused = { shapeId: shape.id, element: 'title' }
        }
      }, [isEditing])

      const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        console.log('📝 Text changed', e.target.value)
        if (!editor) return
        
        const selectionStart = e.target.selectionStart
        const selectionEnd = e.target.selectionEnd
        
        editor.batch(() => {
          editor.updateShape({
            id: shape.id,
            type: INGREDIENT_SHAPE_TYPE,
            props: {
              ...shape.props,
              text: e.target.value,
            },
          })
        })

        // Restore cursor position after update
        requestAnimationFrame(() => {
          if (document.activeElement === textRef.current) {
            textRef.current?.setSelectionRange(selectionStart, selectionEnd)
          }
        })
      }

      const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('📝 Title changed', e.target.value)
        if (!editor) return
        
        const selectionStart = e.target.selectionStart
        const selectionEnd = e.target.selectionEnd
        
        editor.batch(() => {
          editor.updateShape({
            id: shape.id,
            type: INGREDIENT_SHAPE_TYPE,
            props: {
              ...shape.props,
              title: e.target.value,
            },
          })
        })

        // Restore cursor position after update
        requestAnimationFrame(() => {
          if (document.activeElement === titleRef.current) {
            titleRef.current?.setSelectionRange(selectionStart, selectionEnd)
          }
        })
      }

      const handleKeyDown = (e: React.KeyboardEvent) => {
        console.log('⌨️ Key pressed', { key: e.key, target: (e.target as HTMLElement).tagName })
        switch (e.key) {
          case 'Escape': {
            editor?.setEditingShape(null)
            currentlyFocused = null
            break
          }
          case 'Tab': {
            e.preventDefault()
            // Move between title and text areas
            const isTitle = (e.target as HTMLElement).tagName === 'INPUT'
            if (isTitle) {
              console.log('🔄 Tabbing from title to text')
              textRef.current?.focus()
              currentlyFocused = { shapeId: shape.id, element: 'text' }
            } else {
              console.log('🔄 Tabbing from text to title')
              titleRef.current?.focus()
              currentlyFocused = { shapeId: shape.id, element: 'title' }
            }
            break
          }
        }
      }

      return (
        <HTMLContainer
          className="tl-ingredient-container"
          data-shape-id={shape.id}
          style={{
            width: toDomPrecision(shape.props.w),
            height: toDomPrecision(shape.props.h),
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            cursor: isEditing ? 'text' : 'default',
            pointerEvents: isEditing ? 'all' : 'none',
          }}
        >
          {/* Title area */}
          <div
            style={{
              height: LABEL_HEIGHT,
              padding: '8px',
              borderBottom: '1px solid #e0e0e0',
            }}
          >
            <input
              ref={titleRef}
              type="text"
              value={shape.props.title}
              onChange={handleTitleChange}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                background: 'transparent',
                pointerEvents: isEditing ? 'all' : 'none',
              }}
            />
          </div>

          {/* Content area */}
          <div
            style={{
              flex: 1,
              padding: '8px',
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            <textarea
              ref={textRef}
              value={shape.props.text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '14px',
                background: 'transparent',
                pointerEvents: isEditing ? 'all' : 'none',
              }}
            />
          </div>
        </HTMLContainer>
      )
    }

    return <IngredientComponent />
  }

  indicator(shape: IngredientShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    )
  }
} 
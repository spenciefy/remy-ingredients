import { Editor } from '@tiptap/core'
import FontFamily from '@tiptap/extension-font-family'
import TextStyle from '@tiptap/extension-text-style'
import { EditorContent, useEditor as useTipTapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect } from 'react'
import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'
import { FontSize } from '../extensions/FontSizeExtension'
import { useShapeIndex } from '../hooks/useShapeIndex'
import '../styles/tiptap.css'
import { ShapeHeader } from './ShapeHeader'

const fontOptions = [
	{ label: 'Default', value: 'DEFAULT' },
	{ label: 'Inter', value: 'Inter' },
	{ label: 'Comic Sans MS', value: 'Comic Sans MS' },
	{ label: 'serif', value: 'serif' },
	{ label: 'monospace', value: 'monospace' },
	{ label: 'cursive', value: 'cursive' },
]

const fontSizeOptions = [
	{ label: 'Small', value: '12px' },
	{ label: 'Normal', value: '16px' },
	{ label: 'Large', value: '20px' },
	{ label: 'X-Large', value: '24px' },
	{ label: 'XX-Large', value: '28px' },
	{ label: 'Huge', value: '32px' },
]

type ITextIngredientShape = TLBaseShape<
	'text-ingredient-shape',
	{
		w: number
		h: number
		title: string
		text: string
	}
>

function RichTextToolbar({ editor }: { editor: Editor | null }) {
	if (!editor) return null

	const currentFontFamily = editor.getAttributes('textStyle').fontFamily ?? 'DEFAULT'
	const currentFontSize = editor.getAttributes('textStyle').fontSize

	return (
		<div className="rich-text-toolbar">
			<select
				value={currentFontFamily}
				onChange={(e) => {
					editor.chain().focus().setFontFamily(e.target.value).run()
				}}
			>
				{fontOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<select
				value={currentFontSize}
				onChange={(e) => {
					editor.chain().focus().setFontSize(e.target.value).run()
				}}
			>
				{fontSizeOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<button 
				onClick={() => editor.chain().focus().toggleBold().run()}
				className={editor.isActive('bold') ? 'is-active' : ''}
			>
				Bold
			</button>
			<button 
				onClick={() => editor.chain().focus().toggleItalic().run()}
				className={editor.isActive('italic') ? 'is-active' : ''}
			>
				Italic
			</button>
			<button 
				onClick={() => editor.chain().focus().toggleStrike().run()}
				className={editor.isActive('strike') ? 'is-active' : ''}
			>
				Strike
			</button>
			<button 
				onClick={() => editor.chain().focus().toggleCode().run()}
				className={editor.isActive('code') ? 'is-active' : ''}
			>
				Code
			</button>
		</div>
	)
}

function TextIngredientContent({ 
	shape,
	onTitleChange,
	onDelete,
	onTextChange,
}: { 
	shape: ITextIngredientShape
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onTextChange: (newText: string) => void
}) {
	const getShapeIndex = useShapeIndex()
	const index = getShapeIndex(shape.id)
	
	const editor = useTipTapEditor({
		extensions: [
			StarterKit,
			FontFamily,
			FontSize,
			TextStyle,
		],
		content: shape.props.text,
		onUpdate: ({ editor }) => {
			onTextChange(editor.getHTML())
		},
	})

	useEffect(() => {
		editor?.commands.setContent(shape.props.text)
	}, [editor, shape.props.text])

	return (
		<HTMLContainer
			style={{
				width: shape.props.w,
				height: shape.props.h,
				pointerEvents: 'all',
				background: 'white',
				borderRadius: '12px',
				boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<ShapeHeader
				title={shape.props.title}
				onTitleChange={onTitleChange}
				onDelete={onDelete}
				index={index}
				icon={
					<svg 
						width="16" 
						height="16" 
						viewBox="0 0 24 24" 
						fill="none" 
						stroke="currentColor" 
						strokeWidth="2"
						style={{ flexShrink: 0 }}
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<path d="M14 2v6h6"/>
						<line x1="16" y1="13" x2="8" y2="13"/>
						<line x1="16" y1="17" x2="8" y2="17"/>
						<line x1="10" y1="9" x2="8" y2="9"/>
					</svg>
				}
			/>
			<div
				style={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					padding: '8px',
				}}
			>
				<RichTextToolbar editor={editor} />
				<div
					className="tiptap-editor"
					onPointerDown={(e) => e.stopPropagation()}
					onPointerUp={(e) => e.stopPropagation()}
					onTouchStart={(e) => e.stopPropagation()}
					onTouchEnd={(e) => e.stopPropagation()}
				>
					<EditorContent editor={editor} />
				</div>
			</div>
		</HTMLContainer>
	)
}

export class TextIngredientShape extends BaseBoxShapeUtil<ITextIngredientShape> {
	static override type = 'text-ingredient-shape' as const
	static override props: RecordProps<ITextIngredientShape> = {
		w: T.number,
		h: T.number,
		title: T.string,
		text: T.string,
	}

	getDefaultProps(): ITextIngredientShape['props'] {
		return {
			w: 400,
			h: 300,
			title: '',
			text: '',
		}
	}

	component(shape: ITextIngredientShape) {
		return (
			<TextIngredientContent
				shape={shape}
				onTitleChange={(newTitle) => {
					this.editor.updateShape<ITextIngredientShape>({
						id: shape.id,
						type: 'text-ingredient-shape',
						props: { ...shape.props, title: newTitle },
					})
				}}
				onDelete={() => {
					this.editor.deleteShape(shape.id)
				}}
				onTextChange={(newText) => {
					this.editor.updateShape<ITextIngredientShape>({
						id: shape.id,
						type: 'text-ingredient-shape',
						props: { ...shape.props, text: newText },
					})
				}}
			/>
		)
	}

	indicator(shape: ITextIngredientShape) {
		return <rect width={shape.props.w} height={shape.props.h} rx={12} />
	}
} 
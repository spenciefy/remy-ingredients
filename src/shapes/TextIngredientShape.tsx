import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'
import { useShapeIndex } from '../hooks/useShapeIndex'
import { Comment, CommentValidator } from '../types/Comment'
import { IngredientFooter } from './IngredientFooter'

type ITextIngredientShape = TLBaseShape<
	'text-ingredient-shape',
	{
		w: number
		h: number
		title: string
		text: string
		comments: Comment[]
	}
>

function TextIngredientContent({ 
	shape,
	onTitleChange,
	onDelete,
	onTextChange,
	onAddComment,
}: { 
	shape: ITextIngredientShape
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onTextChange: (newText: string) => void
	onAddComment: (text: string, isAI?: boolean) => void
}) {
	const getShapeIndex = useShapeIndex()
	const index = getShapeIndex(shape.id)

	// Calculate total height based on number of comments
	const totalHeight = shape.props.h + (shape.props.comments.length * 50)

	return (
		<HTMLContainer
			style={{
				width: shape.props.w,
				height: totalHeight,
				pointerEvents: 'all',
				background: '#2C2C2C',
				borderRadius: '12px',
				overflow: 'hidden',
				display: 'flex',
				flexDirection: 'column',
				color: 'white',
			}}
		>
			{/* Main content */}
			<div
				style={{
					flex: 1,
					fontFamily: 'sans-serif',
					fontSize: '14px',
					background: 'white',
					borderBottomLeftRadius: '12px',
					borderBottomRightRadius: '12px',
				}}
			>
				<textarea
					value={shape.props.text}
					placeholder="Enter text..."
					onChange={(e) => onTextChange(e.currentTarget.value)}
					style={{
						width: '100%',
						height: '100%',
						padding: '16px',
						border: 'none',
						outline: 'none',
						resize: 'none',
						fontFamily: 'inherit',
						fontSize: 'inherit',
						lineHeight: '1.5',
						background: 'transparent',
						color: '#374151',
					}}
					onPointerDown={(e) => e.stopPropagation()}
					onPointerUp={(e) => e.stopPropagation()}
					onTouchStart={(e) => e.stopPropagation()}
					onTouchEnd={(e) => e.stopPropagation()}
				/>
			</div>

			<IngredientFooter
				title={shape.props.title}
				comments={shape.props.comments}
				index={index}
				onTitleChange={onTitleChange}
				onDelete={onDelete}
				onAddComment={onAddComment}
			/>
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
		comments: T.arrayOf(CommentValidator),
	}

	getDefaultProps(): ITextIngredientShape['props'] {
		return {
			w: 300,
			h: 400,
			title: '',
			text: '',
			comments: [],
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
				onAddComment={(text, isAI = false) => {
					const newComment: Comment = {
						id: Math.random().toString(36).substr(2, 9),
						text,
						createdAt: Date.now(),
						isAI,
					}
					const newComments = [...shape.props.comments, newComment]
					this.editor.updateShape<ITextIngredientShape>({
						id: shape.id,
						type: 'text-ingredient-shape',
						props: {
							...shape.props,
							comments: newComments
						},
					})
				}}
			/>
		)
	}

	indicator(shape: ITextIngredientShape) {
		return <rect width={shape.props.w} height={shape.props.h} rx={12} />
	}
} 
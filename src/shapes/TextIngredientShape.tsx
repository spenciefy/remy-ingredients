import { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T } from 'tldraw'
import { BASE_FOOTER_HEIGHT, COMMENT_HEIGHT } from '../constants/shapes'
import { Comment, CommentValidator } from '../types/Comment'
import { ITextIngredientShape } from '../types/Ingredient'
import { generateIngredientSummary } from '../utils/llmService'
import { IngredientFooter } from './IngredientFooter'

function TextIngredientContent({ 
	shape,
	onTitleChange,
	onDelete,
	onTextChange,
	onAddComment,
	onDeleteComment,
	onUpdateShapeProps,
}: { 
	shape: ITextIngredientShape
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onTextChange: (newText: string) => void
	onAddComment: (text: string, isAI?: boolean) => void
	onDeleteComment: (commentId: string) => void
	onUpdateShapeProps: (props: Partial<ITextIngredientShape['props']>) => void
}) {
	const [isSummarizing, setIsSummarizing] = useState(false)

	// Calculate total height based on number of comments
	const totalHeight =
		shape.props.h +
		BASE_FOOTER_HEIGHT +
		shape.props.comments.length * COMMENT_HEIGHT

	const handleGenerateSummary = async () => {
		if (isSummarizing) return
		
		setIsSummarizing(true)
		try {
			const summary = await generateIngredientSummary(shape.props.text, shape.props.title, false)
			console.log("Summary received:", summary);
			
			// Create new comment
			const newComment: Comment = {
				id: Math.random().toString(36).substr(2, 9),
				text: summary.description,
				createdAt: Date.now(),
				isAI: true,
			}
			
			// Update title and comments in a single call
			onUpdateShapeProps({
				title: summary.title,
				comments: [...shape.props.comments, newComment]
			})
		} catch (error) {
			console.error('Error generating summary:', error)
			
			// Create error comment
			const errorComment: Comment = {
				id: Math.random().toString(36).substr(2, 9),
				text: 'Failed to generate summary. Please try again.',
				createdAt: Date.now(),
				isAI: true,
			}
			
			// Add error comment
			onUpdateShapeProps({
				comments: [...shape.props.comments, errorComment]
			})
		} finally {
			setIsSummarizing(false)
		}
	}

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
			className="text-ingredient-container"
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
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					onPointerDown={(e) => {
						// Don't stop propagation, just ensure the editor knows this is interactive
						e.currentTarget.focus()
					}}
				/>
			</div>

			<IngredientFooter
				shapeProps={shape.props}
				onTitleChange={onTitleChange}
				onDelete={onDelete}
				onAddComment={onAddComment}
				onDeleteComment={onDeleteComment}
				onGenerateSummary={handleGenerateSummary}
				isSummarizing={isSummarizing}
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
						props: { 
							...shape.props,
							title: newTitle
						},
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
				onDeleteComment={(commentId: string) => {
					const newComments = shape.props.comments.filter(comment => comment.id !== commentId);
					this.editor.updateShape<ITextIngredientShape>({
						id: shape.id,
						type: 'text-ingredient-shape',
						props: {
							...shape.props,
							comments: newComments
						},
					});
				}}
				onUpdateShapeProps={(props) => {
					this.editor.updateShape<ITextIngredientShape>({
						id: shape.id,
						type: 'text-ingredient-shape',
						props: {
							...shape.props,
							...props
						},
					})
				}}
			/>
		)
	}

	indicator(shape: ITextIngredientShape) {
		const totalHeight =
			shape.props.h +
			BASE_FOOTER_HEIGHT +
			shape.props.comments.length * COMMENT_HEIGHT
		return <rect width={shape.props.w} height={totalHeight} rx={12} />
	}
}
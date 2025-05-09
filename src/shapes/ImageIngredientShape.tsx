import { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T } from 'tldraw'
import { Comment, CommentValidator } from '../types/Comment'
import { IImageIngredientShape } from '../types/Ingredient'
import { generateIngredientSummary } from '../utils/ingredientSummaryService'
import { BASE_FOOTER_HEIGHT, COMMENT_HEIGHT } from './constants'
import { IngredientFooter } from './IngredientFooter'

function ImageIngredientContent({
	shape,
	onTitleChange,
	onDelete,
	onImageUrlChange,
	onAddComment,
	onDeleteComment,
	onUpdateShapeProps,
}: {
	shape: IImageIngredientShape
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onImageUrlChange: (newImageUrl: string) => void
	onAddComment: (text: string, isAI?: boolean) => void
	onDeleteComment: (commentId: string) => void
	onUpdateShapeProps: (props: Partial<IImageIngredientShape['props']>) => void
}) {
	const [isSummarizing, setIsSummarizing] = useState(false)

	const handlePaste = async (e: React.ClipboardEvent) => {
		e.preventDefault()
		e.stopPropagation()

		const items = e.clipboardData.items
		for (const item of items) {
			if (item.type.startsWith('image/')) {
				const file = item.getAsFile()
				if (file) {
					const reader = new FileReader()
					reader.onload = () => {
						const dataUrl = reader.result as string
						onImageUrlChange(dataUrl)
					}
					reader.readAsDataURL(file)
					break
				}
			}
		}
	}

	// Calculate total height based on number of comments
	const totalHeight =
		shape.props.h +
		BASE_FOOTER_HEIGHT +
		shape.props.comments.length * COMMENT_HEIGHT

	const handleGenerateSummary = async () => {
		if (isSummarizing) return
		
		setIsSummarizing(true)
		try {
			const summary = await generateIngredientSummary(shape.props.imageUrl, shape.props.title, true)
			
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
		>
			{/* Main content */}
			<div
				style={{
					flex: 1,
					display: 'flex',
					position: 'relative',
					minHeight: 0,
					margin: 0,
					padding: 0,
					background: 'white',
					borderBottomLeftRadius: '12px',
					borderBottomRightRadius: '12px',
				}}
				onPaste={handlePaste}
				tabIndex={0}
			>
				{shape.props.imageUrl ? (
					<img
						src={shape.props.imageUrl}
						alt={shape.props.title}
						style={{
							width: '100%',
							height: '100%',
							objectFit: 'contain',
							display: 'block',
							pointerEvents: 'none',
						}}
					/>
				) : (
					<div
						style={{
							width: '100%',
							height: '100%',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							color: '#6B7280',
							fontFamily: 'sans-serif',
							padding: '16px',
							pointerEvents: 'none',
						}}
					>
						<div>No image uploaded</div>
						<div style={{ marginTop: '8px', fontSize: '14px' }}>
							Paste image or URL here
						</div>
						<input
							type="text"
							placeholder="Or enter image URL..."
							value={shape.props.imageUrl}
							onChange={(e) => onImageUrlChange(e.currentTarget.value)}
							style={{
								width: '100%',
								marginTop: '8px',
								padding: '8px',
								background: '#F3F4F6',
								border: 'none',
								outline: 'none',
								textAlign: 'center',
								color: '#374151',
								fontFamily: 'inherit',
								borderRadius: '6px',
								pointerEvents: 'auto',
							}}
							onPointerDown={(e) => e.stopPropagation()}
							onPointerUp={(e) => e.stopPropagation()}
							onTouchStart={(e) => e.stopPropagation()}
							onTouchEnd={(e) => e.stopPropagation()}
						/>
					</div>
				)}
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

export class ImageIngredientShape extends BaseBoxShapeUtil<IImageIngredientShape> {
	static override type = 'image-ingredient-shape' as const
	static override props: RecordProps<IImageIngredientShape> = {
		w: T.number,
		h: T.number,
		title: T.string,
		imageUrl: T.string,
		comments: T.arrayOf(CommentValidator),
	}

	getDefaultProps(): IImageIngredientShape['props'] {
		return {
			w: 400,
			h: 300,
			title: '',
			imageUrl: '',
			comments: [],
		}
	}

	component(shape: IImageIngredientShape) {
		return (
			<ImageIngredientContent
				shape={shape}
				onTitleChange={(newTitle) => {
					this.editor.updateShape<IImageIngredientShape>({
						id: shape.id,
						type: 'image-ingredient-shape',
						props: { ...shape.props, title: newTitle },
					})
				}}
				onDelete={() => {
					this.editor.deleteShape(shape.id)
				}}
				onImageUrlChange={(newImageUrl) => {
					// Create temporary image to get dimensions
					const img = new Image()
					img.onload = () => {
						// Calculate dimensions while maintaining aspect ratio
						const maxWidth = shape.props.w
						const maxHeight = shape.props.h // Use h for aspect ratio calculation
						let width = img.naturalWidth
						let height = img.naturalHeight
						
						// Scale to fit current shape size while maintaining aspect ratio
						const aspectRatio = width / height
						if (width / maxWidth > height / maxHeight) {
							width = maxWidth
							height = width / aspectRatio
						} else {
							height = maxHeight
							width = height * aspectRatio
						}

						this.editor.updateShape<IImageIngredientShape>({
							id: shape.id,
							type: 'image-ingredient-shape',
							props: { 
								...shape.props, 
								imageUrl: newImageUrl,
								w: Math.round(width),
								h: Math.round(height),
							},
						})
					}
					img.src = newImageUrl
				}}
				onAddComment={(text, isAI = false) => {
					const newComment: Comment = {
						id: Math.random().toString(36).substr(2, 9),
						text,
						createdAt: Date.now(),
						isAI,
					}
					const newComments = [...shape.props.comments, newComment]
					this.editor.updateShape<IImageIngredientShape>({
						id: shape.id,
						type: 'image-ingredient-shape',
						props: {
							...shape.props,
							comments: newComments
                        },
					})
				}}
				onDeleteComment={(commentId: string) => {
					const newComments = shape.props.comments.filter(comment => comment.id !== commentId);
					this.editor.updateShape<IImageIngredientShape>({
						id: shape.id,
						type: 'image-ingredient-shape',
						props: {
							...shape.props,
							comments: newComments
						},
					});
				}}
				onUpdateShapeProps={(props) => {
					this.editor.updateShape<IImageIngredientShape>({
						id: shape.id,
						type: 'image-ingredient-shape',
						props: {
							...shape.props,
							...props
						},
					})
				}}
			/>
		)
	}

	indicator(shape: IImageIngredientShape) {
		const totalHeight =
			shape.props.h +
			BASE_FOOTER_HEIGHT +
			shape.props.comments.length * COMMENT_HEIGHT
		return <rect width={shape.props.w} height={totalHeight} rx={12} />
	}
}
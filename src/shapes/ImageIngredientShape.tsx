import { useState } from 'react'
import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'
import { useShapeIndex } from '../hooks/useShapeIndex'
import { Comment, CommentValidator } from '../types/Comment'
import { generateIngredientSummary } from '../utils/llmService'
import { IngredientFooter } from './IngredientFooter'

type IImageIngredientShape = TLBaseShape<
	'image-ingredient-shape',
	{
		w: number
		h: number
		title: string
		imageUrl: string
		comments: Comment[]
	}
>

function ImageIngredientContent({
	shape,
	onTitleChange,
	onDelete,
	onImageUrlChange,
	onAddComment,
	onDeleteComment,
}: {
	shape: IImageIngredientShape
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onImageUrlChange: (newImageUrl: string) => void
	onAddComment: (text: string, isAI?: boolean) => void
	onDeleteComment: (commentId: string) => void
}) {
	const getShapeIndex = useShapeIndex()
	const index = getShapeIndex(shape.id)
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
	const totalHeight = shape.props.h + (shape.props.comments.length * 50)

	const handleGenerateSummary = async () => {
		if (isSummarizing) return
		
		setIsSummarizing(true)
		try {
			console.log('Image URL being sent to OpenAI:', shape.props.imageUrl);
			const summary = await generateIngredientSummary(shape.props.imageUrl, shape.props.title, true)
			onAddComment(summary, true)
		} catch (error) {
			console.error('Error generating summary:', error)
			onAddComment('Failed to generate summary. Please try again.', true)
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
				title={shape.props.title}
				comments={shape.props.comments}
				index={index}
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
			/>
		)
	}

	indicator(shape: IImageIngredientShape) {
		const totalHeight = shape.props.h + (shape.props.comments.length * 50)
		return <rect width={shape.props.w} height={totalHeight} rx={12} />
	}
} 
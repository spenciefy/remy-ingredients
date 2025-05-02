import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'
import { ShapeHeader } from './ShapeHeader'

type IImageIngredientShape = TLBaseShape<
	'image-ingredient-shape',
	{
		w: number
		h: number
		title: string
		imageUrl: string
	}
>

export class ImageIngredientShape extends BaseBoxShapeUtil<IImageIngredientShape> {
	static override type = 'image-ingredient-shape' as const
	static override props: RecordProps<IImageIngredientShape> = {
		w: T.number,
		h: T.number,
		title: T.string,
		imageUrl: T.string,
	}

	getDefaultProps(): IImageIngredientShape['props'] {
		return {
			w: 400,
			h: 300,
			title: '',
			imageUrl: '',
		}
	}

	component(shape: IImageIngredientShape) {
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
							// Create temporary image to get dimensions
							const img = new Image()
							img.onload = () => {
								// Calculate dimensions while maintaining aspect ratio
								const maxWidth = shape.props.w
								const maxHeight = shape.props.h
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
										imageUrl: dataUrl,
										w: Math.round(width),
										h: Math.round(height)
									},
								})
							}
							img.src = dataUrl
						}
						reader.readAsDataURL(file)
						break
					}
				}
			}
		}

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
				/>
				<div
					style={{
						flex: 1,
						display: 'flex',
						position: 'relative',
						minHeight: 0,
						margin: 0,
						padding: 0,
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
								color: '#6b7280',
								fontFamily: 'sans-serif',
								padding: '16px',
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
								onChange={(e) =>
									this.editor.updateShape<IImageIngredientShape>({
										id: shape.id,
										type: 'image-ingredient-shape',
										props: { ...shape.props, imageUrl: e.currentTarget.value },
									})
								}
								style={{
									width: '100%',
									marginTop: '8px',
									padding: '8px',
									background: 'transparent',
									border: 'none',
									outline: 'none',
									textAlign: 'center',
									color: 'inherit',
									fontFamily: 'inherit',
								}}
								onPointerDown={(e) => e.stopPropagation()}
								onPointerUp={(e) => e.stopPropagation()}
								onTouchStart={(e) => e.stopPropagation()}
								onTouchEnd={(e) => e.stopPropagation()}
							/>
						</div>
					)}
				</div>
			</HTMLContainer>
		)
	}

	indicator(shape: IImageIngredientShape) {
		return <rect width={shape.props.w} height={shape.props.h} rx={12} />
	}
} 
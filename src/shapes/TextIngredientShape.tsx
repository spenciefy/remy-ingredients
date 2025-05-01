import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'

type ITextIngredientShape = TLBaseShape<
	'text-ingredient-shape',
	{
		w: number
		h: number
		title: string
		text: string
	}
>

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
			title: 'Add title',
			text: '',
		}
	}

	component(shape: ITextIngredientShape) {
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
				<div
					style={{
						padding: '16px',
						background: 'black',
						color: 'white',
						fontFamily: 'sans-serif',
						fontSize: '16px',
						fontWeight: 'bold',
					}}
				>
					<input
						type="text"
						value={shape.props.title}
						onChange={(e) =>
							this.editor.updateShape<ITextIngredientShape>({
								id: shape.id,
								type: 'text-ingredient-shape',
								props: { ...shape.props, title: e.currentTarget.value },
							})
						}
						style={{
							width: '100%',
							background: 'transparent',
							color: 'inherit',
							fontFamily: 'inherit',
							fontSize: 'inherit',
							fontWeight: 'inherit',
							border: 'none',
							padding: 0,
							margin: 0,
							outline: 'none',
						}}
						onPointerDown={(e) => e.stopPropagation()}
						onPointerUp={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						onTouchEnd={(e) => e.stopPropagation()}
					/>
				</div>
				<div
					style={{
						flex: 1,
						fontFamily: 'sans-serif',
						fontSize: '14px',
					}}
				>
					<textarea
						value={shape.props.text}
						placeholder="Enter text..."
						onChange={(e) =>
							this.editor.updateShape<ITextIngredientShape>({
								id: shape.id,
								type: 'text-ingredient-shape',
								props: { ...shape.props, text: e.currentTarget.value },
							})
						}
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
						}}
						onPointerDown={(e) => e.stopPropagation()}
						onPointerUp={(e) => e.stopPropagation()}
						onTouchStart={(e) => e.stopPropagation()}
						onTouchEnd={(e) => e.stopPropagation()}
					/>
				</div>
			</HTMLContainer>
		)
	}

	indicator(shape: ITextIngredientShape) {
		return <rect width={shape.props.w} height={shape.props.h} rx={12} />
	}
} 
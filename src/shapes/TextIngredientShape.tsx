import { BaseBoxShapeUtil, HTMLContainer, RecordProps, T, TLBaseShape } from 'tldraw'
import { ShapeHeader } from './ShapeHeader'

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
			title: '',
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
				<ShapeHeader
					title={shape.props.title}
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
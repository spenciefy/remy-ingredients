import { useState } from 'react'

interface ShapeHeaderProps {
	title: string
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	icon?: React.ReactNode
	index?: number
}

export function ShapeHeader({ 
	title, 
	onTitleChange, 
	onDelete,
	index,
	icon = (
		<svg 
			width="16" 
			height="16" 
			viewBox="0 0 24 24" 
			fill="none" 
			stroke="currentColor" 
			strokeWidth="2"
			style={{ flexShrink: 0 }}
		>
			<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
			<circle cx="8.5" cy="8.5" r="1.5"/>
			<path d="m21 15-5-5L5 21"/>
		</svg>
	)
}: ShapeHeaderProps) {
	const [isEditingTitle, setIsEditingTitle] = useState(false)

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		setIsEditingTitle(true)
	}

	const buttonStyles = {
		background: 'transparent',
		border: 'none',
		padding: '4px',
		cursor: 'pointer',
		borderRadius: '4px',
		color: '#6b7280',
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	}

	const displayTitle = title || (typeof index === 'number' ? `Ingredient ${index}` : 'Add ingredient name')

	return (
		<div
			style={{
				padding: '8px 12px',
				background: '#e5e7eb',
				color: '#374151',
				fontFamily: 'sans-serif',
				fontSize: '14px',
				fontWeight: '500',
				borderBottom: '1px solid #d1d5db',
				display: 'flex',
				alignItems: 'center',
				gap: '6px',
				cursor: isEditingTitle ? 'text' : 'move',
				userSelect: 'none',
			}}
			onDoubleClick={handleDoubleClick}
		>
			{icon}
			{isEditingTitle ? (
				<input
					type="text"
					value={title}
					placeholder="Add ingredient name"
					onChange={(e) => onTitleChange(e.currentTarget.value)}
					onBlur={() => setIsEditingTitle(false)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') {
							setIsEditingTitle(false)
						}
					}}
					autoFocus
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
						cursor: 'text',
					}}
					onPointerDown={(e) => e.stopPropagation()}
				/>
			) : (
				<div 
					style={{ 
						flex: 1, 
						userSelect: 'none',
						color: title ? '#374151' : '#9CA3AF'
					}}
				>
					{displayTitle}
				</div>
			)}
			<button
				onClick={() => setIsEditingTitle(true)}
				style={buttonStyles}
				onPointerDown={(e) => e.stopPropagation()}
				title="Edit title"
			>
				<svg 
					width="14" 
					height="14" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					strokeWidth="2"
				>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
				</svg>
			</button>
			<button
				onClick={onDelete}
				style={buttonStyles}
				onPointerDown={(e) => e.stopPropagation()}
				title="Delete shape"
			>
				<svg 
					width="14" 
					height="14" 
					viewBox="0 0 24 24" 
					fill="none" 
					stroke="currentColor" 
					strokeWidth="2"
				>
					<line x1="18" y1="6" x2="6" y2="18"/>
					<line x1="6" y1="6" x2="18" y2="18"/>
				</svg>
			</button>
		</div>
	)
} 
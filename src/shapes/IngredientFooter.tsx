import { useState } from 'react'
import { CommentSection } from '../components/CommentSection'
import { Comment } from '../types/Comment'

interface IngredientFooterProps {
	title: string
	comments: Comment[]
	index: number
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onAddComment: (text: string, isAI?: boolean) => void
}

export function IngredientFooter({
	title,
	comments,
	index,
	onTitleChange,
	onDelete,
	onAddComment,
}: IngredientFooterProps) {
	const [isEditingTitle, setIsEditingTitle] = useState(false)

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		setIsEditingTitle(true)
	}

	return (
		<>
			{/* Title section */}
			<div
				style={{
					padding: '4px 4px',
					display: 'flex',
					alignItems: 'center',
					gap: '8px',
					borderTop: '1px solid rgba(255,255,255,0.1)',
					borderBottom: '1px solid rgba(255,255,255,0.1)',
					pointerEvents: 'all',
				}}
				onPointerDown={(e) => e.stopPropagation()}
				onPointerUp={(e) => e.stopPropagation()}
				onClick={(e) => e.stopPropagation()}
			>
				{isEditingTitle ? (
					<input
						type="text"
						value={title}
						placeholder="Add ingredient name"
						onChange={(e) => onTitleChange(e.currentTarget.value)}
						onBlur={() => setIsEditingTitle(false)}
						onKeyDown={(e) => {
							e.stopPropagation()
							
							if (e.key === 'Enter') {
								setIsEditingTitle(false)
							}
						}}
						style={{
							background: '#3A3A3A',
							border: 'none',
							padding: '4px 8px',
							borderRadius: '4px',
							color: 'white',
							fontSize: '16px',
							fontWeight: '500',
							width: '100%',
							outline: 'none',
						}}
						autoFocus
						onPointerDown={(e) => e.stopPropagation()}
					/>
				) : (
					<div 
						style={{ 
							fontSize: '16px', 
							fontWeight: '500', 
							padding: '4px 8px',
							color: title ? 'white' : '#9CA3AF',
							flex: 1,
							pointerEvents: 'auto',
						}}
						onDoubleClick={(e) => {
							e.stopPropagation()
							handleDoubleClick(e)
						}}
					>
						{title || `Ingredient ${index}`}
					</div>
				)}
				<button
					onClick={(e) => {
						e.stopPropagation()
						onDelete()
					}}
					style={{
						background: 'transparent',
						border: 'none',
						padding: '8px',
						cursor: 'pointer',
						color: '#9CA3AF',
						display: 'flex',
					}}
					onPointerDown={(e) => e.stopPropagation()}
					title="Delete shape"
				>
					<svg 
						width="20" 
						height="20" 
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

			{/* Comments section */}
			<CommentSection
				comments={comments}
				onAddComment={onAddComment}
			/>
		</>
	)
} 
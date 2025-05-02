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
	onDeleteComment: (commentId: string) => void
	onGenerateSummary: () => void
	isSummarizing?: boolean
}

export function IngredientFooter({
	title,
	comments,
	index,
	onTitleChange,
	onDelete,
	onAddComment,
	onDeleteComment,
	onGenerateSummary,
	isSummarizing = false,
}: IngredientFooterProps) {
	const [isEditingTitle, setIsEditingTitle] = useState(false)

	const handleDoubleClick = (e: React.MouseEvent) => {
		e.stopPropagation()
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
					borderTop: '1px solid rgba(255,255,255,0.1)',
					borderBottom: '1px solid rgba(255,255,255,0.1)',
					pointerEvents: 'all',
				}}
				// Only stop propagation for specific events that matter for interaction
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
						onClick={(e) => e.stopPropagation()}
					/>
				) : (
					<>
						<div 
							style={{ 
								fontSize: '16px', 
								fontWeight: '500', 
								padding: '4px 8px',
								color: title ? 'white' : '#9CA3AF',
								flex: 1,
								pointerEvents: 'auto',
							}}
							onDoubleClick={handleDoubleClick}
						>
							{title || `Ingredient ${index}`}
						</div>
						<button
							onClick={(e) => {
								e.stopPropagation()
								onGenerateSummary()
							}}
							style={{
								background: 'transparent',
								border: 'none',
								padding: '4px',
								cursor: 'pointer',
								color: '#7C9EFF',
								display: 'flex',
								alignItems: 'center',
							}}
							onPointerDown={(e) => e.stopPropagation()}
							title="Generate summary"
							disabled={isSummarizing}
						>
							{isSummarizing ? (
								<svg 
									width="16" 
									height="16" 
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									className="animate-spin"
								>
									<circle cx="12" cy="12" r="10" strokeWidth="4" stroke="currentColor" strokeDasharray="32" strokeDashoffset="12" fill="none" />
								</svg>
							) : (
								<svg 
									width="16" 
									height="16" 
									viewBox="0 0 24 24" 
									fill="none" 
									stroke="currentColor" 
									strokeWidth="2"
								>
									<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
									<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
								</svg>
							)}
						</button>
						<button
							onClick={(e) => {
								e.stopPropagation()
								setIsEditingTitle(true)
							}}
							style={{
								background: 'transparent',
								border: 'none',
								padding: '4px',
								cursor: 'pointer',
								color: '#9CA3AF',
								display: 'flex',
							}}
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
								<path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
							</svg>
						</button>
					</>
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
				onDeleteComment={onDeleteComment}
			/>
		</>
	)
} 
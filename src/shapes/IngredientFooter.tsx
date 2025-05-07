import { useState } from 'react'
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FiEdit2, FiX } from 'react-icons/fi'
import { RiFlashlightFill } from 'react-icons/ri'
import { Comment } from '../types/Comment'
import { IngredientComments } from './IngredientComments'

interface IngredientShapeProps {
	title: string
	comments: Comment[]
}

type IngredientFooterProps = {
	shapeProps: IngredientShapeProps
	onTitleChange: (newTitle: string) => void
	onDelete: () => void
	onAddComment: (text: string, isAI?: boolean) => void
	onDeleteComment: (commentId: string) => void
	onGenerateSummary: () => void
	isSummarizing?: boolean
}

export function IngredientFooter({
	shapeProps,
	onTitleChange,
	onDelete,
	onAddComment,
	onDeleteComment,
	onGenerateSummary,
	isSummarizing = false,
}: IngredientFooterProps) {
	const { title, comments } = shapeProps

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
							{title}
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
								color: '#9CA3AF',
								display: 'flex',
								alignItems: 'center',
								marginLeft: '4px',
							}}
							onPointerDown={(e) => e.stopPropagation()}
							title="Description"
							disabled={isSummarizing}
						>
							{isSummarizing ? (
								<AiOutlineLoading3Quarters 
									size={16} 
									className="animate-spin"
								/>
							) : (
								<RiFlashlightFill size={16} />
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
								alignItems: 'center',
								marginLeft: '4px',
							}}
							onPointerDown={(e) => e.stopPropagation()}
							title="Edit title"
						>
							<FiEdit2 size={14} />
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
						padding: '4px',
						cursor: 'pointer',
						color: '#9CA3AF',
						display: 'flex',
						alignItems: 'center',
						marginLeft: '4px',
					}}
					onPointerDown={(e) => e.stopPropagation()}
					title="Delete ingredient"
				>
					<FiX size={20} />
				</button>
			</div>

			{/* Comments section */}
			<IngredientComments
				comments={comments}
				onAddComment={onAddComment}
				onDeleteComment={onDeleteComment}
			/>
		</>
	)
} 
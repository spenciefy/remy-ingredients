import { useEffect, useRef, useState } from 'react'
import { CommentProps } from '../types/Comment'

export function IngredientComments({ comments, onAddComment, onDeleteComment }: CommentProps) {
  const [newComment, setNewComment] = useState('')
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const prevCommentsLengthRef = useRef(comments.length)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    // Only scroll to bottom if new comments were added
    if (comments.length > prevCommentsLengthRef.current) {
      scrollToBottom()
    }
    prevCommentsLengthRef.current = comments.length
  }, [comments])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (newComment.trim()) {
      onAddComment(newComment.trim())
      setNewComment('')
    }
  }

  const handleDelete = (commentId: string) => {
    if (deleteButtonRef.current) {
      deleteButtonRef.current.focus();
    }
    onDeleteComment(commentId);
  };

  return (
    <div className="bg-[#2C2C2C]">
      {/* Comments list */}
      <div 
        className="overflow-y-auto px-3 py-2 space-y-2 scroll-smooth"
        onClick={(e) => {
          // Only stop propagation for click events directly on this container
          // not for those on its children which might need bubbling to work
          if (e.target === e.currentTarget) {
            e.stopPropagation();
          }
        }}
      >
        {comments.map((comment) => (
          <div
            key={comment.id}
            className={`flex items-center justify-center flex-row`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex flex-grow flex-col items-start gap-1">
                  <div className="text-xs font-bold">{comment.isAI ? 'Description' : 'You'}</div>
                  <div className="text-xs">{comment.text}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    ref={deleteButtonRef}
                    onClick={(e) => {
                      // Only stop propagation of the click event, not all events
                      e.stopPropagation();
                      handleDelete(comment.id);
                    }}
                    // Prevent other pointer events from being stopped
                    onPointerDown={(e) => e.stopPropagation()}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        <div ref={commentsEndRef} /> {/* Scroll anchor */}
      </div>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="px-3 pb-3">
        <div className="relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="w-full px-3 py-2 pr-10 bg-[#3A3A3A] text-white rounded-full text-xs focus:outline-none placeholder-gray-400"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#7C9EFF] text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => e.stopPropagation()}
          >
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M12 19V5M12 5l7 7M12 5l-7 7" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
} 
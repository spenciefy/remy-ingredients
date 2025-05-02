import { T } from 'tldraw'

export interface Comment {
  id: string
  text: string
  createdAt: number
  isAI: boolean
  userId?: string
}

export interface CommentProps {
  comments: Comment[]
  onAddComment: (text: string, isAI?: boolean) => void
  onDeleteComment: (commentId: string) => void
}

export const CommentValidator = T.object({
  id: T.string,
  text: T.string,
  createdAt: T.number,
  isAI: T.boolean,
  userId: T.optional(T.string),
}) 
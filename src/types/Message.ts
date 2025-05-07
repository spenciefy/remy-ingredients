import { ImageDesignArtifact } from '../utils/chatHandler';

export type ContentItem = {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export type Message = {
  role: 'user' | 'assistant'
  content: string | ContentItem[] | ImageDesignArtifact[]
  type?: 'visualization'
  isStreaming?: boolean
} 
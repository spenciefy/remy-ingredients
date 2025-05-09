import { ImageDesignMockup } from '../utils/chatHandler'

export type ContentItem = {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
  }
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string | ImageDesignMockup[] | null
  type?: 'visualization' | 'tool_call' | 'agent_update'
  isStreaming?: boolean
  toolCall?: {
    name: string
    args: Record<string, unknown>
  }
  toolResult?: Record<string, unknown>
} 
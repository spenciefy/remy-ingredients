import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FiTool } from 'react-icons/fi'
import { ContentItem } from '../../types/Message'
import { ImageDesignMockup } from '../../utils/chatHandler'

interface MessageContentProps {
  content: string | ContentItem[] | ImageDesignMockup[]
  type?: 'visualization' | 'tool_call' | 'agent_update'
}

export function MessageContent({ content, type }: MessageContentProps) {
  if (type === 'tool_call' && typeof content === 'string') {
    return (
      <div className="flex items-center space-x-2 text-gray-500 italic">
        <FiTool className="flex-shrink-0" />
        <p className="whitespace-pre-wrap">🛠️ {content}</p>
      </div>
    )
  }

  if (type === 'agent_update' && typeof content === 'string') {
    return (
      <div className="flex items-center space-x-2 text-gray-500 italic">
        <AiOutlineLoading3Quarters className="flex-shrink-0 animate-spin" />
        <p className="whitespace-pre-wrap">🤖 {content}</p>
      </div>
    )
  }

  if (type === 'visualization' && Array.isArray(content)) {
    return (
      <div className="space-y-4">
        {(content as ImageDesignMockup[]).map((artifact, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold">🎨 {artifact.title || 'Generated Design'}</h3>
            {artifact.rationale && (
              <p className="text-gray-600">{artifact.rationale}</p>
            )}
            {artifact.image_url && (
              <img
                src={artifact.image_url}
                alt={artifact.title || 'Generated Design'}
                className="max-w-full rounded-lg shadow-lg"
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  if (typeof content === 'string') {
    return <p className="whitespace-pre-wrap">{type === undefined ? '💬 ' : ''}{content}</p>
  }

  return (
    <div className="space-y-2">
      {(content as ContentItem[]).map((item, index) => {
        if (item.type === 'text') {
          return (
            <p key={index} className="whitespace-pre-wrap">
              💬 {item.text}
            </p>
          )
        } else if (item.type === 'image_url') {
          return (
            <img
              key={index}
              src={item.image_url?.url}
              alt="Ingredient"
              className="max-w-full rounded-lg"
            />
          )
        }
        return null
      })}
    </div>
  )
} 
import { ContentItem } from '../types/Message'
import { ImageDesignArtifact } from '../utils/chatHandler'

interface MessageContentProps {
  content: string | ContentItem[] | ImageDesignArtifact[]
  type?: 'visualization'
}

export function MessageContent({ content, type }: MessageContentProps) {
  if (type === 'visualization' && Array.isArray(content)) {
    return (
      <div className="space-y-4">
        {(content as ImageDesignArtifact[]).map((artifact, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold">{artifact.title || 'Generated Design'}</h3>
            {artifact.notes && (
              <p className="text-gray-600">{artifact.notes}</p>
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
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="space-y-2">
      {(content as ContentItem[]).map((item, index) => {
        if (item.type === 'text') {
          return (
            <p key={index} className="whitespace-pre-wrap">
              {item.text}
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
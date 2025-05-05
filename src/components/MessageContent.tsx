import { ContentItem } from '../types/Message'

interface MessageContentProps {
  content: string | ContentItem[]
}

export function MessageContent({ content }: MessageContentProps) {
  if (typeof content === 'string') {
    return <p className="whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="space-y-2">
      {content.map((item, index) => {
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
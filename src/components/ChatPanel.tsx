import { ClassAttributes, HTMLAttributes, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FiSend } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TLShapeId } from 'tldraw'
import { editorContext } from '../App'
import { IngredientProps } from '../types/Ingredient'
import { Message } from '../types/Message'
import { formatIngredientsForLLM } from '../utils/formatIngredientsForLLM'
import { IngredientTag } from './IngredientTag'
import { MessageContent } from './MessageContent'

export function ChatPanel() {
  const { editor } = useContext(editorContext)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [ingredients, setIngredients] = useState<{ id: TLShapeId; title: string; type: string }[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  // Update ingredients list when shapes change
  useEffect(() => {
    function updateIngredients() {
      const shapes = editor.getCurrentPageShapes()
      const ingredientShapes = shapes.filter((shape) => {
        if (shape.type !== 'text-ingredient-shape' && shape.type !== 'image-ingredient-shape') {
          return false
        }
        return 'title' in shape.props && shape.meta?.isActive === true
      })

      setIngredients(
        ingredientShapes.map(shape => {
          const { title } = shape.props as IngredientProps;
          return {
            id: shape.id as TLShapeId,
            title: title || 'Untitled',
            type: shape.type
          };
        })
      )
    }

    // Initial update
    updateIngredients()

    // Subscribe to store changes
    const unsubscribe = editor.store.listen(updateIngredients)
    return () => {
      unsubscribe()
    }
  }, [editor])

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }

  // Auto-scroll only when user is at (or near) the bottom
  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom()
    }
  }, [messages, shouldAutoScroll])

  // Track whether the user has scrolled away from the bottom
  useEffect(() => {
    const container = chatContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const threshold = 20 // px tolerance from the bottom
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold
      setShouldAutoScroll(atBottom)
    }

    // Attach listener
    container.addEventListener('scroll', handleScroll)
    // Initial determination
    handleScroll()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    // Get formatted ingredients data
    const shapes = editor.getCurrentPageShapes()
    const contentItems = await formatIngredientsForLLM(shapes)
    
    // Combine content items with user input at the end
    const userMessage = { 
      role: 'user' as const, 
      content: [
        ...(contentItems || []),
        { type: 'text', text: input }
      ]
    }

    console.log('New user message:', userMessage)
    console.log('All messages being sent to API:', [...messages, userMessage])
    
    // Show the user's input in the chat
    setMessages(prev => [...prev, { role: 'user', content: input }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      // Add initial assistant message with streaming flag
      setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }])

      let assistantMessage = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = new TextDecoder().decode(value)
        assistantMessage += text
        
        // Update the streaming message
        setMessages(prev => {
          const newMessages = [...prev]
          const lastMessage = newMessages[newMessages.length - 1]
          if (lastMessage && lastMessage.isStreaming) {
            lastMessage.content = assistantMessage
          }
          return newMessages
        })
      }

      // Remove streaming flag once complete
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMessage = newMessages[newMessages.length - 1]
        if (lastMessage && lastMessage.isStreaming) {
          lastMessage.isStreaming = false
        }
        return newMessages
      })
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
      ])
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, messages, isLoading, editor])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }

  return (
    <div className="flex flex-col h-full max-h-full min-h-0">
      <div className="flex-none p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold">Chat</h2>
      </div>
      
      {/* Scrollable messages area – flex child allowed to shrink */}
      <div 
        ref={chatContainerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600"
      >
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p>Chat about your ingredients</p>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`${
                message.role === 'user' ? 'bg-gray-700 text-white ml-12' : 'bg-gray-100 text-gray-800'
              } rounded-lg p-3 ${message.role === 'assistant' ? 'w-full' : 'max-w-[88%]'}`}
            >
              {message.role === 'assistant' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  className="prose prose-sm max-w-none dark:prose-invert"
                  components={{
                    p: (props) => <p className="my-1" {...props} />,
                    ul: (props) => <ul className="my-2 list-disc pl-4" {...props} />,
                    ol: (props) => <ol className="my-2 list-decimal pl-4" {...props} />,
                    li: (props) => <li className="my-0.5" {...props} />,
                    h1: (props) => <h1 className="text-xl font-bold my-2" {...props} />,
                    h2: (props) => <h2 className="text-lg font-bold my-2" {...props} />,
                    h3: (props) => <h3 className="text-base font-bold my-1.5" {...props} />,
                    code: (props) => {
                      const { inline, ...rest } = props as { inline?: boolean } & ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement>;
                      return inline ? (
                        <code className="bg-gray-200 dark:bg-gray-800 dark:text-gray-100 px-1 py-0.5 rounded" {...rest} />
                      ) : (
                        <code className="block bg-gray-200 dark:bg-gray-800 dark:text-gray-100 p-2 rounded my-2 overflow-x-auto" {...rest} />
                      );
                    },
                    pre: (props) => <pre className="my-2" {...props} />,
                    blockquote: (props) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />
                    ),
                  }}
                >
                  {typeof message.content === 'string' ? message.content : ''}
                </ReactMarkdown>
              ) : (
                <MessageContent content={message.content} />
              )}
            </div>
          </div>
        ))}
        {isLoading && !messages[messages.length - 1]?.isStreaming && (
          <div className="flex justify-start">
            <div className="w-full bg-gray-100 rounded-lg p-3 animate-pulse">
              <div className="h-4 w-8 bg-gray-300 rounded"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex-none">
        <div className="p-4">
          <form onSubmit={handleSubmit} className="relative">
            {ingredients.length > 0 && (
              <div className="bg-gray-100 px-3 py-1.5 rounded-t-lg flex flex-wrap gap-1.5 border border-b-0 border-gray-300 max-h-24 overflow-y-auto">
                {ingredients.map(ingredient => (
                  <IngredientTag
                    key={ingredient.id}
                    ingredient={ingredient}
                    onDeactivate={(id) => {
                      const shape = editor.getShape(id);
                      if (shape) {
                        editor.updateShape({
                          ...shape,
                          meta: {
                            ...shape.meta,
                            isActive: false
                          }
                        });
                      }
                    }}
                  />
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                adjustTextareaHeight()
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className={`w-full px-4 py-3 pr-12 border border-gray-300 focus:outline-none focus:border-blue-500 resize-none ${
                ingredients.length > 0 ? 'rounded-b-lg' : 'rounded-lg'
              }`}
              style={{
                minHeight: '44px',
                maxHeight: '150px'
              }}
              disabled={isLoading}
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-[10px] p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FiSend size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
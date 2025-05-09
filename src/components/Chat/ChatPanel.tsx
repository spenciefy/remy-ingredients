import { ClassAttributes, HTMLAttributes, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { FiSend } from 'react-icons/fi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { TLShapeId } from 'tldraw'
import { editorContext } from '../../App'
import { IngredientProps } from '../../types/Ingredient'
import { Message } from '../../types/Message'
import { addAgentImageOutput, callChatStream, callVisualizeApi, ImageDesignMockup } from '../../utils/chatHandler'
import { ApiInputItem, formatIngredientsForLLM } from '../../utils/formatIngredientsForLLM'
import { IngredientTag } from './IngredientTag'
import { MessageContent } from './MessageContent'

export function ChatPanel() {
  const { editor } = useContext(editorContext)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isVisualizing, setIsVisualizing] = useState(false)
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

    // Build the agent input (ingredients + user text)
    const shapes = editor.getCurrentPageShapes()
    const llmFormattedIngredients: ApiInputItem[] = await formatIngredientsForLLM(shapes)

    const userTextInput: ApiInputItem = { type: 'input_text', text: input }
    const messageContentItems: ApiInputItem[] = [
      ...llmFormattedIngredients,
      userTextInput,
    ]

    // Format previous messages for the API
    const formattedPreviousMessages = messages.map(msg => {
      if (msg.role === 'user') {
        // For user messages, wrap the text in an input_text item
        return {
          type: 'message' as const,
          role: 'user' as const,
          content: [{ type: 'input_text', text: msg.content as string }],
        }
      } else {
        // For assistant messages, pass through as is if it's a string
        return {
          type: 'message' as const,
          role: 'assistant' as const,
          content: typeof msg.content === 'string' ? [{ type: 'input_text', text: msg.content }] : msg.content,
        }
      }
    })

    const requestBody = {
      input: [
        {
          type: 'message' as const,
          role: 'user' as const,
          content: messageContentItems,
        },
        ...formattedPreviousMessages
      ],
    }

    console.log('🎤 User input:', input)
    console.log('🧪 Request payload:', requestBody)

    // Show user message in chat
    setMessages(prev => [...prev, { role: 'user', content: input } as Message])
    setInput('')

    // Placeholder assistant streaming message
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true } as Message])
    setIsLoading(true)

    try {
      for await (const evt of callChatStream(requestBody)) {
        console.log('📨 SSE event:', evt.event, evt)

        // Handle delta events for streaming text
        if (evt.event === 'delta') {
          console.log('📝 Delta update:', evt.content)
          setMessages(prev => {
            const newMessages = [...prev]
            // Find the last streaming assistant message
            for (let i = newMessages.length - 1; i >= 0; i--) {
              const msg = newMessages[i]
              if (msg.role === 'assistant' && msg.isStreaming) {
                // Append new content to existing message
                msg.content = (msg.content as string || '') + (evt.content || '')
                return newMessages
              }
            }
            // Fallback – create new streaming message
            return [...newMessages, { role: 'assistant', content: evt.content || '', isStreaming: true } as Message]
          })
          continue
        }

        // Handle tool calls (simple status messages)
        if (evt.event === 'tool_call') {
          console.log('🛠️ Tool call:', evt.content)
          if (evt.content) {
            setMessages(prev => [...prev, { role: 'assistant', content: evt.content ?? '', type: 'tool_call' } as Message])
          }
          continue
        }

        // Handle agent updates
        if (evt.event === 'agent_update') {
          console.log('🤖 Agent update:', evt.content)
          if (evt.content) {
            setMessages(prev => [...prev, { role: 'assistant', content: evt.content ?? '', type: 'agent_update' } as Message])
          }
          continue
        }

        // Handle tool outputs – may include image artifacts
        if (evt.event === 'tool_output') {
          if (Array.isArray(evt.output)) {
            const artifacts = evt.output as unknown as ImageDesignMockup[]
            console.log('🎨 Generated artifacts:', artifacts)

            // Drop images onto canvas similar to visualize flow
            if (artifacts.length > 0) {
              const basePoint = editor.inputs.currentPagePoint || editor.getViewportScreenCenter()
              let currentX = basePoint.x

              for (const artifact of artifacts) {
                try {
                  const point = { x: currentX, y: basePoint.y }
                  await addAgentImageOutput(editor, artifact, point)
                  console.log('🖼️ Added image to canvas:', artifact.title)
                  currentX += 620 // approx width + gap (avoid costly img dims fetch)
                } catch (err) {
                  console.warn('❌ Failed to add artifact to canvas:', err)
                }
              }
            }

            // Update existing streaming message with visualization
            setMessages(prev => {
              const newMessages = [...prev];
              let updated = false;
              for (let i = newMessages.length - 1; i >= 0; i--) {
                const msg = newMessages[i];
                if (msg.role === 'assistant' && msg.isStreaming) {
                  msg.content = artifacts;
                  msg.type = 'visualization';
                  // msg.isStreaming = false; // Keep streaming true if text might still follow
                  updated = true;
                  console.log('🖼️ Updated streaming message with visualization artifacts');
                  break;
                }
              }
              if (updated) return newMessages;
              // Fallback: if no streaming message found (should not happen with placeholder)
              console.warn('⚠️ No streaming message found to update with visualization, adding new message.');
              return [...newMessages, { role: 'assistant', content: artifacts, type: 'visualization' } as Message];
            });
          } else if (evt.content) {
            console.log('💬 Tool output message:', evt.content)
            // Add tool output text as a new message, or update streaming if appropriate
            setMessages(prev => {
                const newMessages = [...prev];
                let updated = false;
                for (let i = newMessages.length - 1; i >= 0; i--) {
                    const msg = newMessages[i];
                    if (msg.role === 'assistant' && msg.isStreaming && typeof msg.content === 'string') {
                        msg.content += `\n\nTool output: ${evt.content}`;
                        updated = true;
                        break;
                    }
                }
                if (updated) return newMessages;
                // Fallback or if streaming message is already image
                return [...newMessages, { role: 'assistant', content: evt.content ?? '' } as Message];
            });
          }
          continue
        }

        // Handle text messages from agent (final message event)
        if (evt.event === 'message') {
          const textContent = evt.content || ''
          console.log('🤖 Agent message (event type "message"):', textContent)
          setMessages(prev => {
            const newMessages = [...prev]
            for (let i = newMessages.length - 1; i >= 0; i--) {
              const msg = newMessages[i]
              if (msg.role === 'assistant' && msg.isStreaming) {
                // If the message is already a visualization, we might want to append this text
                // or store it in a dedicated field. For now, if it's not a visualization,
                // this textContent (potentially JSON) becomes the main content.
                // If deltas already populated text, this might overwrite it or be a structured version.
                if (msg.type !== 'visualization') {
                    msg.content = textContent // This might be a raw JSON string.
                } else {
                    // msg.content is ImageDesignMockup[]. How to add textContent?
                    // For now, we log it. A better approach would be to parse textContent
                    // if it's JSON and extract relevant text to show with the image.
                    console.log('🤖 Received textContent for an existing visualization message:', textContent);
                    // Or, if you want to append simple string text to a visualization message:
                    // msg.description = (msg.description || "") + "\n" + textContent; // Requires adding 'description' to Message type
                }
                msg.isStreaming = false
                console.log('✏️ Finalized streaming message from "message" event')
                return newMessages
              }
            }
            // Fallback – no streaming message found.
            console.warn('⚠️ No streaming message found to finalize from "message" event, adding new message.');
            return [...newMessages, { role: 'assistant', content: textContent, isStreaming: false } as Message]
          })
          continue
        }
      }
    } catch (error) {
      console.error('💥 Error during streaming chat:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' } as Message
      ])
    } finally {
      console.log('🏁 Chat stream completed')
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, isLoading, editor, messages])

  const handleVisualizeClick = async () => {
    try {
      setIsVisualizing(true)
      const shapes = editor.getCurrentPageShapes()
      const llmFormattedIngredients: ApiInputItem[] = await formatIngredientsForLLM(shapes)

      // Include any text the user has currently typed into the chat box
      const trimmedInput = input.trim()
      const userTextInput: ApiInputItem[] = trimmedInput
        ? [{ type: 'input_text', text: trimmedInput }]
        : []

      // Combine ingredient data with any user-typed text
      const visualizeInput: ApiInputItem[] = [
        ...llmFormattedIngredients,
        ...userTextInput,
      ]

      // Now pass the combined input to the visualize API
      const imageDesignArtifacts = await callVisualizeApi(visualizeInput)

      // Drop each generated image onto the canvas
      if (imageDesignArtifacts.length > 0) {
        const basePoint = editor.inputs.currentPagePoint || editor.getViewportScreenCenter()

        // Helper to get image dimensions (limited to max 600 as in addAgentImageOutput)
        const getDimensions = (url: string): Promise<{ width: number; height: number }> =>
          new Promise((resolve, reject) => {
            const img = new Image()
            img.onload = () => {
              const maxWidth = 600
              const maxHeight = 600
              let width = img.naturalWidth
              let height = img.naturalHeight
              if (width > maxWidth || height > maxHeight) {
                const aspectRatio = width / height
                if (width / maxWidth > height / maxHeight) {
                  width = maxWidth
                  height = width / aspectRatio
                } else {
                  height = maxHeight
                  width = height * aspectRatio
                }
              }
              resolve({ width, height })
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = url
          })

        let currentX = basePoint.x
        for (const artifact of imageDesignArtifacts) {
          try {
            const dims = await getDimensions(artifact.image_url)
            const point = { x: currentX, y: basePoint.y }
            await addAgentImageOutput(editor, artifact, point)
            currentX += dims.width + 20 // 20px gap between images
          } catch (err) {
            console.warn('Could not get dimensions for image artifact', err)
          }
        }
      }

      // Add the visualization results to the chat
      const newMessage: Message = {
        role: 'assistant',
        content: imageDesignArtifacts,
        type: 'visualization'
      }
      setMessages(prev => [...prev, newMessage as Message])
    } catch (error) {
      console.error('Error in visualization:', error)
      // Handle error appropriately
    } finally {
      setIsVisualizing(false)
    }
  }

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
      <div className="flex-none p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Chat</h2>
        <button
          onClick={handleVisualizeClick}
          disabled={isVisualizing || isLoading}
          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isVisualizing && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isVisualizing ? 'Visualizing...' : 'Visualize'}
        </button>
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
                message.type === 'visualization' ? (
                  <MessageContent content={Array.isArray(message.content) ? message.content : []} type="visualization" />
                ) : (
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
                        const { inline, ...rest } = props as { inline?: boolean } & ClassAttributes<HTMLElement> & HTMLAttributes<HTMLElement>
                        return inline ? (
                          <code className="bg-gray-200 dark:bg-gray-800 dark:text-gray-100 px-1 py-0.5 rounded" {...rest} />
                        ) : (
                          <code className="block bg-gray-200 dark:bg-gray-800 dark:text-gray-100 p-2 rounded my-2 overflow-x-auto" {...rest} />
                        );
                      },
                      pre: (props) => <pre className="my-2 overflow-x-auto bg-gray-200 dark:bg-gray-800 rounded" {...props} />,
                      blockquote: (props) => (
                        <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />
                      ),
                    }}
                  >
                    {typeof message.content === 'string' ? message.content : ''}
                  </ReactMarkdown>
                )
              ) : (
                <MessageContent content={typeof message.content === 'string' ? message.content : ''} />
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
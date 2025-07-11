import { useState, useRef, useEffect } from 'react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Send, Bot, Sparkles, Zap } from 'lucide-react'
import { blink } from '../blink/client'
import { Conversation, Message } from '../App'
import { AuthUser } from '@blinkdotnew/sdk'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  conversation: Conversation | undefined
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void
  onCreateConversation: () => Promise<Conversation | null>
  user: AuthUser | null
}

export function ChatInterface({
  conversation,
  onUpdateConversation,
  onCreateConversation,
  user
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingMessage, setStreamingMessage] = useState('')
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [conversation?.messages, streamingMessage])

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setStreamingMessage('')

    try {
      // Create conversation if none exists
      let currentConversation = conversation
      if (!currentConversation) {
        currentConversation = await onCreateConversation()
        if (!currentConversation) {
          throw new Error('Failed to create conversation')
        }
      }

      // Add user message
      const newUserMessage: Message = {
        id: Date.now().toString(),
        content: userMessage,
        role: 'user',
        timestamp: Date.now()
      }

      const updatedMessages = [...(currentConversation.messages || []), newUserMessage]
      
      // Update conversation title if it's the first message
      const updates: Partial<Conversation> = {
        messages: updatedMessages
      }
      
      if (currentConversation.title === 'New Chat' && userMessage.length > 0) {
        updates.title = userMessage.length > 50 
          ? userMessage.substring(0, 50) + '...' 
          : userMessage
      }

      onUpdateConversation(currentConversation.id, updates)

      // Generate AI response using streaming
      let aiResponse = ''
      
      await blink.ai.streamText(
        {
          messages: updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          model: 'gpt-4o-mini'
        },
        (chunk) => {
          aiResponse += chunk
          setStreamingMessage(aiResponse)
        }
      )

      // Add AI message to conversation
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        role: 'assistant',
        timestamp: Date.now()
      }

      const finalMessages = [...updatedMessages, aiMessage]
      onUpdateConversation(currentConversation.id, { messages: finalMessages })
      
      setStreamingMessage('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const allMessages = [
    ...(conversation?.messages || []),
    ...(streamingMessage ? [{
      id: 'streaming',
      content: streamingMessage,
      role: 'assistant' as const,
      timestamp: Date.now()
    }] : [])
  ]

  return (
    <div className="flex-1 flex flex-col bg-white/50 dark:bg-black/20 backdrop-blur-sm">
      {/* Chat Header */}
      <div className="p-6 border-b border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {conversation?.title || 'New Conversation'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                AI-powered assistant ready to help
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Zap className="w-4 h-4" />
            <span>GPT-4o Mini</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef}
        className="flex-1 p-6"
      >
        {allMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto">
            <div className="relative mb-8">
              <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-premium-lg">
                <Bot className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-yellow-800" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Welcome to ChatGPT Premium
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              I'm your advanced AI assistant, ready to help with writing, analysis, coding, creative projects, and much more. What would you like to explore today?
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-xl">
              {[
                { icon: "✍️", title: "Creative Writing", desc: "Stories, poems, scripts" },
                { icon: "🧠", title: "Problem Solving", desc: "Analysis and solutions" },
                { icon: "💻", title: "Code Assistant", desc: "Programming help" },
                { icon: "📚", title: "Learning Support", desc: "Explanations and tutorials" }
              ].map((item, i) => (
                <div key={i} className="p-4 glass rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-all duration-200 cursor-pointer group">
                  <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">{item.icon}</div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-4xl mx-auto">
            {allMessages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 message-enter ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <Avatar className="w-10 h-10 flex-shrink-0 shadow-premium">
                  <AvatarFallback 
                    className={
                      message.role === 'user'
                        ? 'gradient-primary text-white font-semibold'
                        : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    }
                  >
                    {message.role === 'user' ? (
                      getUserInitials(user?.displayName)
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div 
                  className={`flex-1 max-w-3xl ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div className={`flex items-center gap-2 mb-2 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {message.role === 'user' 
                        ? (user?.displayName || 'You') 
                        : 'ChatGPT'
                      }
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  <div 
                    className={`p-4 rounded-2xl shadow-premium transition-all duration-200 hover:shadow-premium-lg ${
                      message.role === 'user'
                        ? 'gradient-primary text-white ml-auto backdrop-blur-sm'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 backdrop-blur-sm border border-white/20 dark:border-gray-700/50'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 dark:prose-pre:bg-gray-900">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed font-medium">{message.content}</div>
                    )}
                    
                    {message.id === 'streaming' && isLoading && (
                      <div className="inline-flex items-center gap-1 ml-2">
                        <div className="typing-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t border-white/10 dark:border-white/5 bg-white/60 dark:bg-black/20 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatGPT..."
              className="min-h-[60px] max-h-40 pr-16 resize-none bg-white/80 dark:bg-gray-800/80 border-white/30 dark:border-gray-600/30 focus:border-purple-500/50 dark:focus:border-purple-400/50 focus:ring-purple-500/20 shadow-premium backdrop-blur-sm text-base leading-relaxed rounded-2xl"
              disabled={isLoading}
            />
            <Button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 bottom-3 h-12 w-12 p-0 gradient-primary border-0 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-5 w-5 text-white" />
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
            ChatGPT can make mistakes. Check important info. Press Enter to send, Shift+Enter for new line.
          </p>
        </div>
      </div>
    </div>
  )
}
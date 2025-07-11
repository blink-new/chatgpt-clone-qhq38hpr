import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { ChatSidebar } from './components/ChatSidebar'
import { ChatInterface } from './components/ChatInterface'
import { AuthUser } from '@blinkdotnew/sdk'

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: number
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  userId: string
}

function App() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = async () => {
    try {
      const result = await blink.db.conversations.list({
        where: { user_id: user!.id },
        orderBy: { updated_at: 'desc' }
      })
      // Ensure the result is always an array – some drivers may return an object when no rows are found
      const listRaw = Array.isArray(result)
        ? result
        : result
          ? (Object.values(result) as Conversation[])
          : []

      // Parse messages JSON stored as TEXT
      const listUns: Conversation[] = listRaw.map((conv) => ({
        ...conv,
        messages:
          conv && conv.messages
            ? typeof conv.messages === 'string'
              ? JSON.parse(conv.messages)
              : conv.messages
            : []
      }))
      const list = listUns
      setConversations(list)
    } catch (error) {
      console.error('Failed to load conversations:', error)
    }
  }

  const createNewConversation = async () => {
    if (!user) return null

    try {
      const newConversationRaw = await blink.db.conversations.create({
        title: 'New Chat',
        messages: JSON.stringify([]),
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      const newConversation = {
        ...newConversationRaw,
        messages: [] as Message[]
      }

      setConversations(prev => [newConversation, ...prev])
      setActiveConversationId(newConversation.id)
      return newConversation
    } catch (error) {
      console.error('Failed to create conversation:', error)
      return null
    }
  }

  const updateConversation = async (conversationId: string, updates: Partial<Conversation>) => {
    try {
      const dbUpdates: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString()
      }

      if (updates.messages) {
        // serialize for DB
        dbUpdates.messages = JSON.stringify(updates.messages)
      }

      await blink.db.conversations.update(conversationId, dbUpdates)

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? {
              ...conv,
              ...updates,
              // ensure messages array not string
              messages: updates.messages ? (updates.messages as Message[]) : conv.messages,
              updated_at: new Date().toISOString()
            }
            : conv
        )
      )
    } catch (error) {
      console.error('Failed to update conversation:', error)
    }
  }

  const deleteConversation = async (conversationId: string) => {
    try {
      await blink.db.conversations.delete(conversationId)
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))

      if (activeConversationId === conversationId) {
        setActiveConversationId(null)
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const activeConversation = Array.isArray(conversations)
    ? conversations.find(conv => conv.id === activeConversationId)
    : undefined

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          {/* Premium loading animation */}
          <div className="w-16 h-16 gradient-primary rounded-full opacity-75 animate-ping"></div>
          <div className="absolute top-0 left-0 w-16 h-16 gradient-primary rounded-full opacity-50 animate-pulse"></div>
          <div className="absolute top-3 left-3 w-10 h-10 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 gradient-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.02'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      {/* Main content */}
      <div className="relative flex w-full">
        <ChatSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onConversationSelect={setActiveConversationId}
          onNewConversation={createNewConversation}
          onDeleteConversation={deleteConversation}
          user={user}
        />

        <ChatInterface
          conversation={activeConversation}
          onUpdateConversation={updateConversation}
          onCreateConversation={createNewConversation}
          user={user}
        />
      </div>
    </div>
  )
}

export default App
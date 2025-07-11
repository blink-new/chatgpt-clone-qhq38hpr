import { useState } from 'react'
import { Button } from './ui/button'
import { ScrollArea } from './ui/scroll-area'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit3,
  User,
  LogOut,
  Settings,
  Sparkles
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { blink } from '../blink/client'
import { Conversation } from '../App'
import { AuthUser } from '@blinkdotnew/sdk'

interface ChatSidebarProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation: (id: string) => void
  user: AuthUser | null
}

export function ChatSidebar({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  onDeleteConversation,
  user
}: ChatSidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation.id)
    setEditTitle(conversation.title)
  }

  const saveEdit = async (conversationId: string) => {
    if (editTitle.trim()) {
      try {
        await blink.db.conversations.update(conversationId, { title: editTitle.trim() })
        setEditingId(null)
      } catch (error) {
        console.error('Failed to update conversation title:', error)
      }
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditTitle('')
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getUserInitials = (name?: string) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  return (
    <div className="w-80 h-full backdrop-blur-xl bg-white/80 dark:bg-black/20 border-r border-white/10 dark:border-white/5 flex flex-col shadow-premium">
      {/* Header */}
      <div className="p-6 border-b border-white/10 dark:border-white/5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">ChatGPT</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Premium AI Assistant</p>
          </div>
        </div>
        
        <Button
          onClick={onNewConversation}
          className="w-full gradient-primary text-white border-0 h-12 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] group"
        >
          <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform duration-200" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-1">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                activeConversationId === conversation.id
                  ? 'bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 border border-purple-200/20 dark:border-purple-400/20 shadow-lg'
                  : 'hover:bg-white/50 dark:hover:bg-white/5 glass'
              }`}
              onClick={() => !editingId && onConversationSelect(conversation.id)}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                activeConversationId === conversation.id 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                  : 'bg-gray-300 dark:bg-gray-600'
              }`} />
              
              {editingId === conversation.id ? (
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveEdit(conversation.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(conversation.id)
                    if (e.key === 'Escape') cancelEdit()
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-sm font-medium text-gray-900 dark:text-white focus-ring"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm font-medium truncate text-gray-900 dark:text-white">
                  {conversation.title}
                </span>
              )}

              {/* Action buttons - show on hover */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    startEditing(conversation)
                  }}
                  className="h-8 w-8 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteConversation(conversation.id)
                  }}
                  className="h-8 w-8 p-1.5 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
          
          {conversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">No conversations yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Start your first chat above</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* User Menu */}
      <div className="p-4 border-t border-white/10 dark:border-white/5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full flex items-center gap-3 p-4 h-auto justify-start rounded-xl hover:bg-white/50 dark:hover:bg-white/5 glass transition-all duration-200 hover:scale-[1.02]"
            >
              <Avatar className="h-10 w-10 ring-2 ring-purple-500/20">
                <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                  {getUserInitials(user?.displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.displayName || user?.email || 'User'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-64 glass border-white/20 dark:border-white/10 shadow-premium-lg"
          >
            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg">
              <User className="h-4 w-4" />
              <span className="font-medium">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-3 p-3 rounded-lg">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10 dark:bg-white/5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState, useRef, useEffect } from 'react'
import { PaperAirplaneIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { api } from '@cai/app/utils/trpc'
import { formatDistanceToNow } from 'date-fns'

export const Route = createFileRoute('/_layout/chat')({
  component: ChatPage,
})

function ChatPage() {
  const [message, setMessage] = useState('')
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const utils = api.useUtils()
  
  // Fetch messages
  const { data, isLoading, error } = api.chat.getMessages.useQuery({
    roomId: 'general',
    limit: 50,
  })
  
  // Poll for new messages every 3 seconds
  api.chat.getLatestMessages.useQuery(
    {
      roomId: 'general',
      afterId: data?.messages[data.messages.length - 1]?.id,
    },
    {
      enabled: !!data?.messages.length,
      refetchInterval: 3000, // Poll every 3 seconds
      onSuccess: (newMessages) => {
        if (newMessages.length > 0) {
          // Invalidate the main messages query to include new messages
          utils.chat.getMessages.invalidate()
        }
      },
    }
  )
  
  // Send message mutation
  const sendMessage = api.chat.sendMessage.useMutation({
    onSuccess: () => {
      setMessage('')
      utils.chat.getMessages.invalidate()
      scrollToBottom()
    },
    onError: (error) => {
      console.error('Failed to send message:', error)
      // You might want to show a toast notification here
    },
  })
  
  // Edit message mutation
  const editMessage = api.chat.editMessage.useMutation({
    onSuccess: () => {
      setEditingMessage(null)
      utils.chat.getMessages.invalidate()
    },
  })
  
  // Delete message mutation
  const deleteMessage = api.chat.deleteMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate()
    },
  })
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [data?.messages])
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      if (editingMessage) {
        editMessage.mutate({
          messageId: editingMessage.id,
          content: message.trim(),
        })
      } else {
        sendMessage.mutate({
          content: message.trim(),
          roomId: 'general',
        })
      }
    }
  }
  
  const handleEditClick = (messageId: string, content: string) => {
    setEditingMessage({ id: messageId, content })
    setMessage(content)
  }
  
  const handleCancelEdit = () => {
    setEditingMessage(null)
    setMessage('')
  }
  
  // Get current user from session (you might need to adjust this based on your auth setup)
  const { data: session } = api.auth.getSession.useQuery()
  const currentUserId = session?.user?.id
  
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Catalyst.Text>Loading messages...</Catalyst.Text>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Catalyst.Alert>
          <Catalyst.AlertTitle>Error loading messages</Catalyst.AlertTitle>
          <Catalyst.AlertDescription>{error.message}</Catalyst.AlertDescription>
        </Catalyst.Alert>
      </div>
    )
  }
  
  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="border-b border-zinc-950/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-zinc-900">
        <Catalyst.Heading>Chat</Catalyst.Heading>
        <Catalyst.Text className="mt-1">General chat room</Catalyst.Text>
      </div>
      
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-3xl space-y-4">
          {data?.messages.map((msg) => {
            const isOwnMessage = msg.userId === currentUserId
            
            return (
              <div
                key={msg.id}
                className={`group flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Catalyst.Avatar
                    src={msg.user?.avatar || undefined}
                    initials={msg.user?.name?.slice(0, 2) || msg.user?.email?.slice(0, 2) || '??'}
                    className="size-8"
                  />
                </div>
                
                {/* Message Content */}
                <div className={`flex flex-1 flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <Catalyst.Text className="text-sm font-medium">
                      {msg.user?.name || msg.user?.email || 'Unknown User'}
                    </Catalyst.Text>
                    <Catalyst.Text className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                    </Catalyst.Text>
                    {msg.edited && (
                      <Catalyst.Text className="text-xs text-zinc-500">(edited)</Catalyst.Text>
                    )}
                  </div>
                  
                  <div className={`mt-1 flex items-start gap-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isOwnMessage
                          ? 'bg-blue-600 text-white'
                          : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white'
                      }`}
                    >
                      <Catalyst.Text className={isOwnMessage ? 'text-white' : ''}>
                        {msg.content}
                      </Catalyst.Text>
                    </div>
                    
                    {/* Message Actions */}
                    {isOwnMessage && (
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Catalyst.Button
                          plain
                          onClick={() => handleEditClick(msg.id, msg.content)}
                          className="p-1"
                        >
                          <PencilIcon className="size-4" />
                        </Catalyst.Button>
                        <Catalyst.Button
                          plain
                          color="red"
                          onClick={() => deleteMessage.mutate(msg.id)}
                          className="p-1"
                        >
                          <TrashIcon className="size-4" />
                        </Catalyst.Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message Input */}
      <div className="border-t border-zinc-950/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
        {!session?.user ? (
          <div className="mx-auto max-w-3xl text-center">
            <Catalyst.Text className="text-zinc-500">
              Please sign in to send messages
            </Catalyst.Text>
          </div>
        ) : (
        <form onSubmit={handleSendMessage} className="mx-auto max-w-3xl">
          {editingMessage && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 dark:bg-blue-950/20">
              <Catalyst.Text className="text-sm">Editing message</Catalyst.Text>
              <Catalyst.Button plain onClick={handleCancelEdit}>
                Cancel
              </Catalyst.Button>
            </div>
          )}
          
          <div className="flex gap-2">
            <Catalyst.Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={editingMessage ? 'Edit your message...' : 'Type a message...'}
              className="flex-1"
              disabled={sendMessage.isPending || editMessage.isPending}
            />
            <Catalyst.Button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending || editMessage.isPending}
            >
              <PaperAirplaneIcon className="size-4" />
              {editingMessage ? 'Update' : 'Send'}
            </Catalyst.Button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
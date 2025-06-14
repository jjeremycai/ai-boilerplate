import { useState, useEffect, useRef, useCallback } from 'react'
import { useApiClient } from '@/services/api'
import type { ChatMessage, ChatUser, ChatWebSocketConfig } from '../../shared/types'

interface WebSocketState {
  messages: ChatMessage[]
  users: ChatUser[]
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
}

interface WebSocketActions {
  sendMessage: (content: string) => void
  sendTyping: () => void
  connect: () => Promise<void>
  disconnect: () => void
}

export function useWebSocket(roomId: string): WebSocketState & WebSocketActions {
  const [state, setState] = useState<WebSocketState>({
    messages: [],
    users: [],
    isConnected: false,
    isConnecting: false,
    error: null,
  })

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const reconnectAttemptsRef = useRef(0)
  const apiClient = useApiClient()

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Get WebSocket configuration
      const config = await apiClient.request<ChatWebSocketConfig>(
        `/chat/rooms/${roomId}/websocket`
      )

      // Create WebSocket connection
      const ws = new WebSocket(config.url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connected')
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
        }))
        reconnectAttemptsRef.current = 0
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'history':
            setState(prev => ({ ...prev, messages: data.messages }))
            break
          case 'message':
            setState(prev => ({
              ...prev,
              messages: [...prev.messages, data.message],
            }))
            break
          case 'users':
            setState(prev => ({ ...prev, users: data.users }))
            break
          case 'user_joined':
            setState(prev => ({
              ...prev,
              users: [...prev.users, data.user],
              messages: [...prev.messages, {
                id: crypto.randomUUID(),
                userId: 'system',
                userName: 'System',
                content: `${data.user.name} joined`,
                timestamp: new Date().toISOString(),
                type: 'system',
              }],
            }))
            break
          case 'user_left':
            setState(prev => ({
              ...prev,
              users: prev.users.filter(u => u.id !== data.user.id),
              messages: [...prev.messages, {
                id: crypto.randomUUID(),
                userId: 'system',
                userName: 'System',
                content: `${data.user.name} left`,
                timestamp: new Date().toISOString(),
                type: 'system',
              }],
            }))
            break
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setState(prev => ({
          ...prev,
          error: new Error('WebSocket connection error'),
        }))
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }))

        // Attempt to reconnect with exponential backoff
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000)
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        }
      }
    } catch (error) {
      console.error('Failed to connect:', error)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: error as Error,
      }))
    }
  }, [roomId, apiClient])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  const sendMessage = useCallback((content: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected')
      return
    }

    wsRef.current.send(JSON.stringify({
      type: 'message',
      content: content.trim(),
    }))
  }, [])

  const sendTyping = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return
    }

    wsRef.current.send(JSON.stringify({ type: 'typing' }))
  }, [])

  // Connect on mount
  useEffect(() => {
    connect()

    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    messages: state.messages,
    users: state.users,
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    sendMessage,
    sendTyping,
    connect,
    disconnect,
  }
}
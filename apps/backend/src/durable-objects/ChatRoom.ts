import { DurableObject } from 'cloudflare:workers'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'message' | 'system' | 'typing'
}

export interface ChatUser {
  id: string
  name: string
  joinedAt: string
  isTyping?: boolean
}

export class ChatRoom extends DurableObject {
  private sessions: Map<WebSocket, ChatUser> = new Map()
  private messages: ChatMessage[] = []
  private typingTimers: Map<string, NodeJS.Timeout> = new Map()

  async fetch(request: Request) {
    const url = new URL(request.url)
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request)
      case '/messages':
        return this.handleMessages(request)
      case '/users':
        return this.handleUsers(request)
      default:
        return new Response('Not found', { status: 404 })
    }
  }

  async handleWebSocket(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const userName = url.searchParams.get('userName')

    if (!userId || !userName) {
      return new Response('Missing userId or userName', { status: 400 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    this.ctx.acceptWebSocket(server)

    const user: ChatUser = {
      id: userId,
      name: userName,
      joinedAt: new Date().toISOString(),
    }

    this.sessions.set(server, user)

    // Send existing messages to new user
    server.send(JSON.stringify({
      type: 'history',
      messages: this.messages.slice(-50), // Last 50 messages
    }))

    // Notify others of new user
    this.broadcast(JSON.stringify({
      type: 'user_joined',
      user,
    }), server)

    // Send current users list
    server.send(JSON.stringify({
      type: 'users',
      users: Array.from(this.sessions.values()),
    }))

    server.addEventListener('message', async (event) => {
      await this.handleMessage(server, event.data as string)
    })

    server.addEventListener('close', () => {
      const user = this.sessions.get(server)
      if (user) {
        this.sessions.delete(server)
        this.typingTimers.delete(user.id)
        
        // Notify others of user leaving
        this.broadcast(JSON.stringify({
          type: 'user_left',
          user,
        }))
      }
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  async handleMessage(ws: WebSocket, data: string) {
    const user = this.sessions.get(ws)
    if (!user) return

    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'message':
          const chatMessage: ChatMessage = {
            id: crypto.randomUUID(),
            userId: user.id,
            userName: user.name,
            content: message.content,
            timestamp: new Date().toISOString(),
            type: 'message',
          }

          this.messages.push(chatMessage)
          
          // Store in storage (optional persistence)
          await this.ctx.storage.put(`message:${chatMessage.id}`, chatMessage)

          // Broadcast to all users
          this.broadcast(JSON.stringify({
            type: 'message',
            message: chatMessage,
          }))
          break

        case 'typing':
          // Clear existing timer
          const existingTimer = this.typingTimers.get(user.id)
          if (existingTimer) {
            clearTimeout(existingTimer)
          }

          // Broadcast typing status
          this.broadcast(JSON.stringify({
            type: 'typing',
            userId: user.id,
            userName: user.name,
            isTyping: true,
          }), ws)

          // Set timer to clear typing status
          const timer = setTimeout(() => {
            this.broadcast(JSON.stringify({
              type: 'typing',
              userId: user.id,
              userName: user.name,
              isTyping: false,
            }), ws)
            this.typingTimers.delete(user.id)
          }, 3000)

          this.typingTimers.set(user.id, timer)
          break
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  async handleMessages(request: Request) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    return new Response(JSON.stringify({ messages: this.messages }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async handleUsers(request: Request) {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const users = Array.from(this.sessions.values())
    return new Response(JSON.stringify({ users }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  broadcast(message: string, exclude?: WebSocket) {
    this.sessions.forEach((user, ws) => {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(message)
      }
    })
  }

  async alarm() {
    // Clean up old messages periodically
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    this.messages = this.messages.filter(m => m.timestamp > oneHourAgo)
  }
}
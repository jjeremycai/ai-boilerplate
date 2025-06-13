import { DurableObject } from 'cloudflare:workers'

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'message' | 'system' | 'typing' | 'agent'
  agentResponse?: string
}

export interface ChatUser {
  id: string
  name: string
  joinedAt: string
  isTyping?: boolean
}

export class AgentChatRoom extends DurableObject {
  private sessions: Map<WebSocket, ChatUser> = new Map()
  private messages: ChatMessage[] = []
  private typingTimers: Map<string, NodeJS.Timeout> = new Map()

  async fetch(request: Request) {
    const url = new URL(request.url)
    
    if (url.pathname === '/websocket') {
      return this.handleWebSocket(request)
    }
    
    return new Response('Not found', { status: 404 })
  }

  async handleWebSocket(request: Request) {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    this.ctx.acceptWebSocket(server)

    // Load persisted messages from storage
    const storedMessages = await this.ctx.storage.list<ChatMessage>({ prefix: 'message:' })
    if (storedMessages.size > 0) {
      this.messages = Array.from(storedMessages.values())
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(-100) // Keep last 100 messages
    }

    // Get user info from auth token (passed as subprotocol)
    const token = request.headers.get('Sec-WebSocket-Protocol')
    let userId = 'anonymous'
    let userName = 'Anonymous'
    
    if (token) {
      // In real app, verify token with Clerk
      // For now, extract user info from token
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]))
        userId = decoded.sub || 'anonymous'
        userName = decoded.name || 'Anonymous'
      } catch (e) {
        console.error('Token decode error:', e)
      }
    }

    const user: ChatUser = {
      id: userId,
      name: userName,
      joinedAt: new Date().toISOString(),
    }

    this.sessions.set(server, user)

    // Send chat history to new user
    server.send(JSON.stringify({
      type: 'history',
      messages: this.messages.slice(-50), // Last 50 messages
    }))

    // Welcome message from agent
    const welcomeMsg: ChatMessage = {
      id: crypto.randomUUID(),
      userId: 'agent',
      userName: 'AI Assistant',
      content: `Welcome ${userName}! I'm here to help. Ask me anything about your dashboard, data, or projects.`,
      timestamp: new Date().toISOString(),
      type: 'agent',
    }
    
    server.send(JSON.stringify({
      type: 'message',
      message: welcomeMsg,
    }))

    server.addEventListener('message', async (event) => {
      await this.handleMessage(server, event.data as string)
    })

    server.addEventListener('close', () => {
      const user = this.sessions.get(server)
      if (user) {
        this.sessions.delete(server)
        this.typingTimers.delete(user.id)
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
          
          // Persist message
          await this.ctx.storage.put(`message:${chatMessage.id}`, chatMessage)

          // Broadcast to all users
          this.broadcast(JSON.stringify({
            type: 'message',
            message: chatMessage,
          }))

          // Process with AI agent
          await this.processWithAgent(chatMessage)
          break

        case 'typing':
          this.handleTyping(user, ws)
          break
      }
    } catch (error) {
      console.error('Error handling message:', error)
    }
  }

  async processWithAgent(userMessage: ChatMessage) {
    // Show agent is typing
    this.broadcast(JSON.stringify({
      type: 'typing',
      userId: 'agent',
      userName: 'AI Assistant',
      isTyping: true,
    }))

    try {
      // Use Cloudflare AI to generate response
      const env = this.env as any
      
      let response = ''
      
      if (env.AI) {
        // Analyze user intent
        const messages = [
          { role: 'system', content: 'You are a helpful assistant for a dashboard application. Help users with their data, blog posts, and general questions. Be concise and friendly.' },
          { role: 'user', content: userMessage.content }
        ]

        const aiResponse = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages })
        response = aiResponse.response || 'I apologize, but I encountered an error processing your request.'
      } else {
        // Fallback responses if AI not available
        const lowerContent = userMessage.content.toLowerCase()
        if (lowerContent.includes('help')) {
          response = 'I can help you with:\n- Managing your D1 database items\n- Creating and editing blog posts\n- Understanding your dashboard features\n\nWhat would you like to know more about?'
        } else if (lowerContent.includes('blog')) {
          response = 'The blog feature uses Cloudflare KV for fast, globally distributed content. You can create SEO-optimized posts with custom slugs. Would you like tips on writing effective blog posts?'
        } else if (lowerContent.includes('data') || lowerContent.includes('database')) {
          response = 'Your data is stored in Cloudflare D1, a SQLite database at the edge. You can add, view, and manage items directly from the dashboard. The data persists across sessions and is fully backed up.'
        } else {
          response = 'I understand you\'re asking about: "' + userMessage.content + '". Could you provide more details so I can better assist you?'
        }
      }

      // Create agent response
      const agentMessage: ChatMessage = {
        id: crypto.randomUUID(),
        userId: 'agent',
        userName: 'AI Assistant',
        content: response,
        timestamp: new Date().toISOString(),
        type: 'agent',
      }

      this.messages.push(agentMessage)
      await this.ctx.storage.put(`message:${agentMessage.id}`, agentMessage)

      // Stop typing indicator
      this.broadcast(JSON.stringify({
        type: 'typing',
        userId: 'agent',
        userName: 'AI Assistant',
        isTyping: false,
      }))

      // Send agent message
      this.broadcast(JSON.stringify({
        type: 'message',
        message: agentMessage,
      }))

    } catch (error) {
      console.error('Agent processing error:', error)
      
      // Stop typing on error
      this.broadcast(JSON.stringify({
        type: 'typing',
        userId: 'agent',
        userName: 'AI Assistant',
        isTyping: false,
      }))
    }
  }

  handleTyping(user: ChatUser, ws: WebSocket) {
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
  }

  broadcast(message: string, exclude?: WebSocket) {
    this.sessions.forEach((user, ws) => {
      if (ws !== exclude && ws.readyState === WebSocket.READY_STATE_OPEN) {
        ws.send(message)
      }
    })
  }

  async alarm() {
    // Clean up old messages every hour, keep last 1000
    const messages = await this.ctx.storage.list<ChatMessage>({ prefix: 'message:' })
    const sortedMessages = Array.from(messages.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    if (sortedMessages.length > 1000) {
      const toDelete = sortedMessages.slice(1000)
      for (const msg of toDelete) {
        await this.ctx.storage.delete(`message:${msg.id}`)
      }
    }

    // Schedule next cleanup
    this.ctx.storage.setAlarm(Date.now() + 60 * 60 * 1000) // 1 hour
  }
}
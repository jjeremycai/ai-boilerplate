import { DurableObject } from 'cloudflare:workers'

export class AgentChatRoom extends DurableObject {
  private messages: any[] = []
  private users: Map<string, any> = new Map()
  private agent: any = null

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env)
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    switch (url.pathname) {
      case '/websocket':
        return this.handleWebSocket(request)
      case '/messages':
        return new Response(JSON.stringify(this.messages), {
          headers: { 'Content-Type': 'application/json' }
        })
      default:
        return new Response('Not found', { status: 404 })
    }
  }

  async handleWebSocket(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    this.ctx.acceptWebSocket(server)

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string)
        await this.handleMessage(server, data)
      } catch (error) {
        server.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format'
        }))
      }
    })

    server.addEventListener('close', () => {
      // Clean up user from the room
      for (const [id, user] of this.users) {
        if (user.websocket === server) {
          this.users.delete(id)
          this.broadcast({
            type: 'user_left',
            userId: id,
            timestamp: new Date().toISOString()
          }, server)
          break
        }
      }
    })

    return new Response(null, { status: 101, webSocket: client })
  }

  async handleMessage(websocket: WebSocket, data: any) {
    switch (data.type) {
      case 'join':
        this.users.set(data.userId, {
          id: data.userId,
          name: data.userName,
          joinedAt: new Date().toISOString(),
          websocket
        })
        
        // Send chat history to new user
        websocket.send(JSON.stringify({
          type: 'history',
          messages: this.messages
        }))
        
        // Notify others
        this.broadcast({
          type: 'user_joined',
          userId: data.userId,
          userName: data.userName,
          timestamp: new Date().toISOString()
        }, websocket)
        break
        
      case 'message':
        const message = {
          id: crypto.randomUUID(),
          userId: data.userId,
          userName: data.userName,
          content: data.content,
          timestamp: new Date().toISOString(),
          type: 'message'
        }
        
        this.messages.push(message)
        this.broadcast(message)
        
        // Process with AI if needed
        if (data.requestAI) {
          await this.processWithAI(message)
        }
        break
        
      case 'typing':
        this.broadcast({
          type: 'typing',
          userId: data.userId,
          userName: data.userName
        }, websocket)
        break
    }
  }

  async processWithAI(userMessage: any) {
    // This is where you'd integrate with Cloudflare Workers AI
    // For now, sending a placeholder response
    const aiResponse = {
      id: crypto.randomUUID(),
      userId: 'ai-agent',
      userName: 'AI Assistant',
      content: `I received your message: "${userMessage.content}". How can I help you?`,
      timestamp: new Date().toISOString(),
      type: 'message'
    }
    
    this.messages.push(aiResponse)
    this.broadcast(aiResponse)
  }

  broadcast(message: any, exclude?: WebSocket) {
    const messageStr = JSON.stringify(message)
    for (const user of this.users.values()) {
      if (user.websocket !== exclude && user.websocket.readyState === WebSocket.READY_STATE_OPEN) {
        user.websocket.send(messageStr)
      }
    }
  }
}
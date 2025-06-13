import { Hono } from 'hono'
import type { Env } from '../index'

const agentChat = new Hono<{ Bindings: Env }>()

// WebSocket endpoint for AI agent chat
agentChat.get('/websocket', async (c) => {
  const upgrade = c.req.header('Upgrade')
  if (!upgrade || upgrade !== 'websocket') {
    return c.text('Expected WebSocket', 426)
  }

  // Get or create the agent chat room
  const roomId = 'agent-chat-main' // Single persistent room for all users
  const id = c.env.AGENT_CHAT_ROOMS.idFromName(roomId)
  const stub = c.env.AGENT_CHAT_ROOMS.get(id)
  
  // Pass the request to the durable object
  return stub.fetch(c.req.raw)
})

export { agentChat }
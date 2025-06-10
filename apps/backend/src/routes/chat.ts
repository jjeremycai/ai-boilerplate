import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import type { Env } from '../index'
// Use crypto.randomUUID() instead of nanoid

export const chatRoutes = new Hono<{ Bindings: Env }>()

// List available chat rooms
chatRoutes.get('/rooms', requireAuth, async (c) => {
  try {
    // Get rooms from KV store
    const roomsList = await c.env.KV.get('chat:rooms', 'json') || []
    return c.json({ data: roomsList })
  } catch (error) {
    throw error
  }
})

// Create a new chat room
chatRoutes.post('/rooms', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ name: string; description?: string }>()
  
  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Room name is required', code: 'VALIDATION_ERROR' }, 400)
  }

  try {
    const roomId = crypto.randomUUID()
    const room = {
      id: roomId,
      name: body.name,
      description: body.description || '',
      createdBy: user.id,
      createdAt: new Date().toISOString(),
    }

    // Get existing rooms
    const existingRooms = await c.env.KV.get('chat:rooms', 'json') || []
    
    // Add new room
    const updatedRooms = [...existingRooms, room]
    await c.env.KV.put('chat:rooms', JSON.stringify(updatedRooms))

    return c.json({ data: room }, 201)
  } catch (error) {
    throw error
  }
})

// Get WebSocket URL for a chat room
chatRoutes.get('/rooms/:roomId/websocket', requireAuth, async (c) => {
  const user = c.get('user')
  const roomId = c.req.param('roomId')
  
  try {
    // Get or create durable object for this room
    const durableObjectId = c.env.CHAT_ROOMS.idFromName(roomId)
    const durableObject = c.env.CHAT_ROOMS.get(durableObjectId)
    
    // Generate WebSocket URL
    const url = new URL(c.req.url)
    url.pathname = `/websocket`
    url.searchParams.set('userId', user.id)
    url.searchParams.set('userName', user.firstName || user.email)
    
    // Create a unique session token
    const sessionToken = crypto.randomUUID()
    await c.env.KV.put(
      `chat:session:${sessionToken}`,
      JSON.stringify({ userId: user.id, roomId, expires: Date.now() + 3600000 }),
      { expirationTtl: 3600 }
    )
    
    return c.json({
      data: {
        url: url.toString(),
        sessionToken,
        roomId,
      }
    })
  } catch (error) {
    throw error
  }
})

// Proxy WebSocket connections to Durable Objects
chatRoutes.all('/rooms/:roomId/ws', async (c) => {
  const roomId = c.req.param('roomId')
  
  // Verify session token
  const sessionToken = c.req.header('X-Session-Token')
  if (!sessionToken) {
    return c.json({ error: 'Missing session token', code: 'UNAUTHORIZED' }, 401)
  }
  
  const session = await c.env.KV.get(`chat:session:${sessionToken}`, 'json')
  if (!session || session.roomId !== roomId || session.expires < Date.now()) {
    return c.json({ error: 'Invalid or expired session', code: 'UNAUTHORIZED' }, 401)
  }
  
  // Forward to Durable Object
  const durableObjectId = c.env.CHAT_ROOMS.idFromName(roomId)
  const durableObject = c.env.CHAT_ROOMS.get(durableObjectId)
  
  return durableObject.fetch(c.req.raw)
})

// Get chat room messages
chatRoutes.get('/rooms/:roomId/messages', requireAuth, async (c) => {
  const roomId = c.req.param('roomId')
  
  try {
    const durableObjectId = c.env.CHAT_ROOMS.idFromName(roomId)
    const durableObject = c.env.CHAT_ROOMS.get(durableObjectId)
    
    const response = await durableObject.fetch(
      new Request(`http://internal/messages`, { method: 'GET' })
    )
    
    const data = await response.json()
    return c.json({ data: data.messages })
  } catch (error) {
    throw error
  }
})

// Get active users in a room
chatRoutes.get('/rooms/:roomId/users', requireAuth, async (c) => {
  const roomId = c.req.param('roomId')
  
  try {
    const durableObjectId = c.env.CHAT_ROOMS.idFromName(roomId)
    const durableObject = c.env.CHAT_ROOMS.get(durableObjectId)
    
    const response = await durableObject.fetch(
      new Request(`http://internal/users`, { method: 'GET' })
    )
    
    const data = await response.json()
    return c.json({ data: data.users })
  } catch (error) {
    throw error
  }
})
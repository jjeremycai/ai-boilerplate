import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import type { Env } from '../index'

// Agent SDK integration for complex AI workflows
// This is a placeholder - the actual Agent SDK will be integrated when available

export const agentChat = new Hono<{ Bindings: Env }>()

// Create an agent chat session
agentChat.post('/session', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ 
    systemPrompt?: string
    tools?: string[]
    model?: string 
  }>()
  
  try {
    const sessionId = crypto.randomUUID()
    
    // Store session configuration in KV
    await c.env.KV.put(
      `agent:session:${sessionId}`,
      JSON.stringify({
        userId: user.id,
        systemPrompt: body.systemPrompt || 'You are a helpful AI assistant.',
        tools: body.tools || [],
        model: body.model || '@cf/meta/llama-3.1-8b-instruct',
        createdAt: new Date().toISOString()
      }),
      { expirationTtl: 3600 } // 1 hour TTL
    )
    
    return c.json({ 
      data: { 
        sessionId,
        message: 'Agent session created. Use this sessionId for subsequent messages.'
      } 
    })
  } catch (error) {
    return c.json({ error: 'Failed to create agent session' }, 500)
  }
})

// Send message to agent
agentChat.post('/message', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ 
    sessionId: string
    message: string 
  }>()
  
  if (!body.sessionId || !body.message) {
    return c.json({ error: 'sessionId and message are required' }, 400)
  }
  
  try {
    // Get session from KV
    const session = await c.env.KV.get(`agent:session:${body.sessionId}`, 'json')
    
    if (!session || session.userId !== user.id) {
      return c.json({ error: 'Invalid session' }, 404)
    }
    
    // Get conversation history
    const historyKey = `agent:history:${body.sessionId}`
    const history = await c.env.KV.get(historyKey, 'json') || []
    
    // Add user message to history
    history.push({ role: 'user', content: body.message })
    
    // Prepare messages for AI
    const messages = [
      { role: 'system', content: session.systemPrompt },
      ...history
    ]
    
    // Call Workers AI
    const response = await c.env.AI.run(session.model, { 
      messages,
      stream: false 
    })
    
    // Add AI response to history
    history.push({ role: 'assistant', content: response.response })
    
    // Store updated history
    await c.env.KV.put(historyKey, JSON.stringify(history), { 
      expirationTtl: 3600 
    })
    
    return c.json({ 
      data: {
        response: response.response,
        sessionId: body.sessionId
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to process message' }, 500)
  }
})

// Get conversation history
agentChat.get('/history/:sessionId', requireAuth, async (c) => {
  const user = c.get('user')
  const sessionId = c.req.param('sessionId')
  
  try {
    // Verify session ownership
    const session = await c.env.KV.get(`agent:session:${sessionId}`, 'json')
    
    if (!session || session.userId !== user.id) {
      return c.json({ error: 'Invalid session' }, 404)
    }
    
    // Get history
    const history = await c.env.KV.get(`agent:history:${sessionId}`, 'json') || []
    
    return c.json({ 
      data: {
        sessionId,
        systemPrompt: session.systemPrompt,
        model: session.model,
        messages: history
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch history' }, 500)
  }
})

// Clear conversation history
agentChat.delete('/history/:sessionId', requireAuth, async (c) => {
  const user = c.get('user')
  const sessionId = c.req.param('sessionId')
  
  try {
    // Verify session ownership
    const session = await c.env.KV.get(`agent:session:${sessionId}`, 'json')
    
    if (!session || session.userId !== user.id) {
      return c.json({ error: 'Invalid session' }, 404)
    }
    
    // Delete history
    await c.env.KV.delete(`agent:history:${sessionId}`)
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to clear history' }, 500)
  }
})
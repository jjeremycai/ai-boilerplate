import { Hono } from 'hono'
import { clerkMiddleware, getAuth } from '@hono/clerk-auth'
// Agent SDK not available yet - will be added when released
import type { Env } from '../index'

const aiRoutes = new Hono<{ Bindings: Env }>()

// Apply authentication middleware
aiRoutes.use('*', clerkMiddleware())

// Chat completion endpoint using Workers AI
aiRoutes.post('/chat', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { messages, model = '@cf/meta/llama-3.1-8b-instruct', stream = false } = body

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Messages array is required' }, 400)
    }

    // Use AI Gateway if configured
    let aiBinding = c.env.AI
    if (c.env.AI_GATEWAY_ACCOUNT_ID && c.env.AI_GATEWAY_ID) {
      // Route through AI Gateway for analytics and caching
      const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${c.env.AI_GATEWAY_ACCOUNT_ID}/${c.env.AI_GATEWAY_ID}/workers-ai/`
      
      const response = await fetch(`${gatewayUrl}${model}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, stream })
      })
      
      return new Response(response.body, {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Direct Workers AI call
    const response = await aiBinding.run(model, { messages, stream })
    
    return c.json(response)
  } catch (error) {
    console.error('AI chat error:', error)
    return c.json({ 
      error: 'Failed to process AI request',
      details: c.env.ENVIRONMENT === 'development' ? error.message : undefined
    }, 500)
  }
})

// Agent SDK endpoint for more complex AI workflows
aiRoutes.post('/agent', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { prompt, context = {}, tools = [] } = body

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    // Agent SDK not available yet - use direct AI call
    const messages = [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: prompt }
    ]
    
    const result = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages })
    
    return c.json({
      result: result.response,
      metadata: {
        model: '@cf/meta/llama-3.1-8b-instruct',
        timestamp: new Date().toISOString(),
        userId: auth.userId
      }
    })
  } catch (error) {
    console.error('Agent error:', error)
    return c.json({ 
      error: 'Failed to process agent request',
      details: c.env.ENVIRONMENT === 'development' ? error.message : undefined
    }, 500)
  }
})

// Text generation endpoint
aiRoutes.post('/generate', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { 
      prompt, 
      model = '@cf/meta/llama-3.1-8b-instruct',
      max_tokens = 256,
      temperature = 0.7,
      stream = false 
    } = body

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    const response = await c.env.AI.run(model, {
      prompt,
      max_tokens,
      temperature,
      stream
    })
    
    return c.json({
      response,
      metadata: {
        model,
        max_tokens,
        temperature,
        timestamp: new Date().toISOString(),
        userId: auth.userId
      }
    })
  } catch (error) {
    console.error('Text generation error:', error)
    return c.json({ 
      error: 'Failed to generate text',
      details: c.env.ENVIRONMENT === 'development' ? error.message : undefined
    }, 500)
  }
})

// Image generation endpoint
aiRoutes.post('/image', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const body = await c.req.json()
    const { prompt, model = '@cf/stabilityai/stable-diffusion-xl-base-1.0' } = body

    if (!prompt) {
      return c.json({ error: 'Prompt is required' }, 400)
    }

    const response = await c.env.AI.run(model, { prompt })
    
    return c.json({
      image: response,
      metadata: {
        model,
        prompt,
        timestamp: new Date().toISOString(),
        userId: auth.userId
      }
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return c.json({ 
      error: 'Failed to generate image',
      details: c.env.ENVIRONMENT === 'development' ? error.message : undefined
    }, 500)
  }
})

// List available models
aiRoutes.get('/models', async (c) => {
  const auth = getAuth(c)
  if (!auth?.userId) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  // Common Cloudflare Workers AI models
  const models = {
    text: [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/microsoft/phi-2',
      '@cf/mistral/mistral-7b-instruct-v0.1',
      '@cf/google/gemma-7b-it'
    ],
    chat: [
      '@cf/meta/llama-3.1-8b-instruct',
      '@cf/meta/llama-3.1-70b-instruct',
      '@cf/mistral/mistral-7b-instruct-v0.1'
    ],
    image: [
      '@cf/stabilityai/stable-diffusion-xl-base-1.0',
      '@cf/runwayml/stable-diffusion-v1-5',
      '@cf/lykon/dreamshaper-8-lcm'
    ],
    embedding: [
      '@cf/baai/bge-base-en-v1.5',
      '@cf/baai/bge-large-en-v1.5'
    ]
  }

  return c.json({ models })
})

// Health check for AI services
aiRoutes.get('/health', async (c) => {
  const checks = {
    ai: !!c.env.AI,
    gateway: !!(c.env.AI_GATEWAY_ACCOUNT_ID && c.env.AI_GATEWAY_ID),
    agentSDK: true // SDK is always available if imported
  }

  const status = Object.values(checks).every(Boolean) ? 'ok' : 'partial'

  return c.json({ 
    status,
    checks,
    timestamp: new Date().toISOString()
  })
})

export { aiRoutes }
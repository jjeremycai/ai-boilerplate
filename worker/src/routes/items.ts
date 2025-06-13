import { Hono } from 'hono'
import type { Env } from '../index'

const items = new Hono<{ Bindings: Env }>()

// Get all items
items.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM items ORDER BY created_at DESC LIMIT 100'
    ).all()
    
    return c.json({ items: results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch items' }, 500)
  }
})

// Create item
items.post('/', async (c) => {
  try {
    const { name } = await c.req.json()
    
    if (!name) {
      return c.json({ error: 'Name is required' }, 400)
    }
    
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    await c.env.DB.prepare(
      'INSERT INTO items (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)'
    ).bind(id, name, now, now).run()
    
    return c.json({ id, name, created_at: now, updated_at: now })
  } catch (error) {
    return c.json({ error: 'Failed to create item' }, 500)
  }
})

export { items }
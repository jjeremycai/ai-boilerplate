import { Hono } from 'hono'
import { requireAuth } from '../middleware/clerk'
import type { Env } from '../index'

export interface Item {
  id: string
  name: string
  description?: string
  userId: string
  createdAt: string
  updatedAt?: string
}

export const items = new Hono<{ Bindings: Env }>()

// Get all items for authenticated user
items.get('/', requireAuth, async (c) => {
  const user = c.get('user')
  
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM items WHERE userId = ? ORDER BY createdAt DESC'
    ).bind(user.id).all()
    
    return c.json({ data: result.results })
  } catch (error) {
    return c.json({ error: 'Failed to fetch items' }, 500)
  }
})

// Create new item
items.post('/', requireAuth, async (c) => {
  const user = c.get('user')
  const body = await c.req.json<{ name: string; description?: string }>()
  
  if (!body.name || body.name.trim().length === 0) {
    return c.json({ error: 'Item name is required' }, 400)
  }
  
  try {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    
    await c.env.DB.prepare(
      'INSERT INTO items (id, name, description, userId, createdAt) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, body.name, body.description || null, user.id, now).run()
    
    const item: Item = {
      id,
      name: body.name,
      description: body.description,
      userId: user.id,
      createdAt: now
    }
    
    return c.json({ data: item }, 201)
  } catch (error) {
    return c.json({ error: 'Failed to create item' }, 500)
  }
})

// Update item
items.patch('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const itemId = c.req.param('id')
  const body = await c.req.json<{ name?: string; description?: string }>()
  
  try {
    // Check ownership
    const existing = await c.env.DB.prepare(
      'SELECT * FROM items WHERE id = ? AND userId = ?'
    ).bind(itemId, user.id).first()
    
    if (!existing) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    const updates = []
    const values = []
    
    if (body.name !== undefined) {
      updates.push('name = ?')
      values.push(body.name)
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?')
      values.push(body.description)
    }
    
    if (updates.length > 0) {
      updates.push('updatedAt = ?')
      values.push(new Date().toISOString())
      values.push(itemId)
      values.push(user.id)
      
      await c.env.DB.prepare(
        `UPDATE items SET ${updates.join(', ')} WHERE id = ? AND userId = ?`
      ).bind(...values).run()
    }
    
    const updated = await c.env.DB.prepare(
      'SELECT * FROM items WHERE id = ?'
    ).bind(itemId).first()
    
    return c.json({ data: updated })
  } catch (error) {
    return c.json({ error: 'Failed to update item' }, 500)
  }
})

// Delete item
items.delete('/:id', requireAuth, async (c) => {
  const user = c.get('user')
  const itemId = c.req.param('id')
  
  try {
    const result = await c.env.DB.prepare(
      'DELETE FROM items WHERE id = ? AND userId = ?'
    ).bind(itemId, user.id).run()
    
    if (result.meta.changes === 0) {
      return c.json({ error: 'Item not found' }, 404)
    }
    
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete item' }, 500)
  }
})
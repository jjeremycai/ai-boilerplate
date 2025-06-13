import { Hono } from 'hono'
import type { Env } from '../index'

const blog = new Hono<{ Bindings: Env }>()

// Get all blog posts
blog.get('/', async (c) => {
  try {
    const posts = []
    const list = await c.env.KV.list({ prefix: 'blog:' })
    
    for (const key of list.keys) {
      const post = await c.env.KV.get(key.name, 'json')
      if (post) {
        posts.push(post)
      }
    }
    
    // Sort by created_at desc
    posts.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    return c.json({ posts })
  } catch (error) {
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// Get single blog post
blog.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  try {
    const post = await c.env.KV.get(`blog:${slug}`, 'json')
    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }
    return c.json(post)
  } catch (error) {
    return c.json({ error: 'Failed to fetch post' }, 500)
  }
})

// Create blog post
blog.post('/', async (c) => {
  try {
    const { title, slug, content } = await c.req.json()
    
    if (!title || !slug || !content) {
      return c.json({ error: 'Missing required fields' }, 400)
    }
    
    const post = {
      title,
      slug,
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    await c.env.KV.put(`blog:${slug}`, JSON.stringify(post))
    
    return c.json(post)
  } catch (error) {
    return c.json({ error: 'Failed to create post' }, 500)
  }
})

export { blog }
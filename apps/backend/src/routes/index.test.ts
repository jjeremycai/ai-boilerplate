import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { apiRoutes } from './index'

describe('API Routes', () => {
  it('returns API information on root endpoint', async () => {
    const app = new Hono()
    app.route('/api/v1', apiRoutes)
    
    const res = await app.request('/api/v1/')
    const json = await res.json()
    
    expect(res.status).toBe(200)
    expect(json).toHaveProperty('message', 'API v1')
    expect(json).toHaveProperty('endpoints')
    expect(json.endpoints).toHaveProperty('projects')
    expect(json.endpoints).toHaveProperty('tasks')
  })
})
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

export interface Env {
  ENVIRONMENT?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Lite API is running!'
  });
});

// Simple API endpoints
app.get('/api/hello', (c) => {
  return c.json({ 
    message: 'Hello from Cloudflare Workers!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (c) => {
  return c.json({
    environment: c.env.ENVIRONMENT || 'development',
    worker: 'cloudflare-workers',
    framework: 'hono',
    template: 'lite'
  });
});

// Simple CRUD example (in-memory, resets on worker restart)
let items: Array<{ id: string; name: string; created: string }> = [
  { id: '1', name: 'Sample Item', created: new Date().toISOString() }
];

app.get('/api/items', (c) => {
  return c.json({ items });
});

app.post('/api/items', async (c) => {
  const body = await c.req.json();
  const item = {
    id: Date.now().toString(),
    name: body.name || 'Unnamed Item',
    created: new Date().toISOString()
  };
  items.push(item);
  return c.json({ item }, 201);
});

app.delete('/api/items/:id', (c) => {
  const id = c.req.param('id');
  const index = items.findIndex(item => item.id === id);
  
  if (index === -1) {
    return c.json({ error: 'Item not found' }, 404);
  }
  
  const deleted = items.splice(index, 1)[0];
  return c.json({ deleted });
});

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not found',
    available_endpoints: [
      'GET /health',
      'GET /api/hello',
      'GET /api/status',
      'GET /api/items',
      'POST /api/items',
      'DELETE /api/items/:id'
    ]
  }, 404);
});

export default app;
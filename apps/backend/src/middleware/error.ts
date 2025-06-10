import { Context } from 'hono'
import { HTTPException } from 'hono/http-exception'

export const errorHandler = (err: Error, c: Context) => {
  console.error('Error:', err)
  
  if (err instanceof HTTPException) {
    return c.json(
      { error: err.message, code: 'HTTP_EXCEPTION' },
      err.status
    )
  }
  
  // Database errors with helpful messages
  if (err.message.includes('D1_ERROR') || err.message.includes('no such table')) {
    return c.json({
      error: 'Database not configured properly',
      code: 'DATABASE_ERROR',
      help: 'Run: npm run setup:wizard to configure your database',
      docs: 'https://developers.cloudflare.com/d1/'
    }, 500);
  }
  
  // Clerk authentication errors
  if (err.message.includes('CLERK') || err.message.includes('Unauthorized')) {
    return c.json({
      error: 'Authentication not configured',
      code: 'AUTH_ERROR',
      help: 'Add CLERK_SECRET_KEY to your .dev.vars file',
      docs: 'https://clerk.dev/docs'
    }, 401);
  }
  
  // KV errors
  if (err.message.includes('KV')) {
    return c.json({
      error: 'KV storage not configured',
      code: 'KV_ERROR',
      help: 'Run: npm run setup:wizard to configure KV storage',
      docs: 'https://developers.cloudflare.com/kv/'
    }, 500);
  }
  
  if (err.name === 'ValidationError') {
    return c.json(
      { error: err.message, code: 'VALIDATION_ERROR' },
      400
    )
  }
  
  if (err.name === 'UnauthorizedError') {
    return c.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      401
    )
  }
  
  // Generic error
  return c.json(
    { 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR',
      help: 'Check the console logs for more details',
      ...(c.env.ENVIRONMENT === 'development' && { details: err.message })
    },
    500
  )
}
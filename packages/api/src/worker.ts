import { trpcServer } from '@hono/trpc-server'
import { createContext } from '@cai/api/src/context'
import { appRouter } from '@cai/api/src/router'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { auth } from './lib/auth'

type Bindings = {
  DB: D1Database
  AUTH_SECRET: string
  APP_URL: string
  OPENAI_API_KEY: string
  RESEND_API_KEY: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  // Sharding bindings - dynamically discovered
  [key: string]: D1Database | string
}

const app = new Hono<{ Bindings: Bindings }>()

// Setup CORS for all routes
app.use('/*', async (c, next) => {
  if (c.env.APP_URL === undefined) {
    console.log(
      'APP_URL is not set. CORS errors may occur. Make sure the .dev.vars file is present at /packages/api/.dev.vars'
    )
  }
  return await cors({
    origin: (origin) => (origin.endsWith(new URL(c.env.APP_URL).host) ? origin : c.env.APP_URL),
    credentials: true,
    allowMethods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
    // https://hono.dev/middleware/builtin/cors#options
  })(c, next)
})

// Mount Better Auth routes
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw)
})

// Setup TRPC server with context
app.use('/trpc/*', async (c, next) => {
  return await trpcServer({
    router: appRouter,
    createContext: async (opts) => {
      return await createContext(c.env, opts)
    },
  })(c, next)
})

export default app

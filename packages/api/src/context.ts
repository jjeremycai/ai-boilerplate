import { type inferAsyncReturnType } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { createDb } from './db/client'
import { ShardContext } from './lib/sharding/shard-context'
import { AIService } from './services/ai.service'
import { auth } from './lib/auth'
import type { User } from './db/schema'

export interface Env {
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

interface ApiContextProps {
  user: User | null
  db: DrizzleD1Database
  env: Env
  shardContext: ShardContext
  ai: AIService
}

export const createContext = async (
  env: Env,
  opts: FetchCreateContextFnOptions
): Promise<ApiContextProps> => {
  const db = createDb(env.DB)

  // Initialize sharding context
  const shardContext = new ShardContext(env)

  // Initialize AI Service
  const ai = new AIService(env.OPENAI_API_KEY)

  async function getUser() {
    const sessionToken = opts.req.headers.get('authorization')?.split(' ')[1]

    if (sessionToken && sessionToken !== 'undefined') {
      try {
        // Validate session with Better Auth
        const session = await auth.api.getSession({ 
          headers: opts.req.headers as any 
        })
        
        if (session?.user) {
          return session.user
        }
      } catch (e) {
        console.error('Session validation error:', e)
      }
    }

    return null
  }

  const user = await getUser()

  return { user, db, env, shardContext, ai }
}

export type Context = inferAsyncReturnType<typeof createContext>

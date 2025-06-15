import { type inferAsyncReturnType } from '@trpc/server'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import jwt from '@tsndr/cloudflare-worker-jwt'
import { DrizzleD1Database } from 'drizzle-orm/d1'
import { createDb } from './db/client'
import { ShardContext } from './lib/sharding/shard-context'
import { AIService } from './services/ai.service'
import { createClient } from '@supabase/supabase-js'

interface User {
  id: string
}

export interface Env {
  DB: D1Database
  JWT_VERIFICATION_KEY: string
  APP_URL: string
  OPENAI_API_KEY: string
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  // Sharding bindings - dynamically discovered
  [key: string]: D1Database | string
}

interface ApiContextProps {
  user: User | null
  db: DrizzleD1Database
  env: Env
  shardContext: ShardContext
  ai: AIService
  supabase: ReturnType<typeof createClient>
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

  // Initialize Supabase
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

  async function getUser() {
    const sessionToken = opts.req.headers.get('authorization')?.split(' ')[1]

    if (sessionToken !== undefined && sessionToken !== 'undefined') {
      if (!env.JWT_VERIFICATION_KEY) {
        console.error('JWT_VERIFICATION_KEY is not set')
        return null
      }

      try {
        const authorized = await jwt.verify(sessionToken, env.JWT_VERIFICATION_KEY, {
          algorithm: 'HS256',
        })
        if (!authorized) {
          return null
        }

        const decodedToken = jwt.decode(sessionToken)

        // Check if token is expired
        const expirationTimestamp = decodedToken.payload.exp
        const currentTimestamp = Math.floor(Date.now() / 1000)
        if (!expirationTimestamp || expirationTimestamp < currentTimestamp) {
          return null
        }

        const userId = decodedToken?.payload?.sub

        if (userId) {
          return {
            id: userId,
          }
        }
      } catch (e) {
        console.error(e)
      }
    }

    return null
  }

  const user = await getUser()

  return { user, db, env, shardContext, ai, supabase }
}

export type Context = inferAsyncReturnType<typeof createContext>

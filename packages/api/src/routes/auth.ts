import { protectedProcedure, publicProcedure, router } from '../trpc'
import { auth } from '../lib/auth'

export const authRouter = router({
  getSession: publicProcedure.query(async ({ ctx }) => {
    // Get session from Better Auth
    const sessionId = ctx.req.headers.get('authorization')?.replace('Bearer ', '')
    if (!sessionId) return null
    
    const session = await auth.api.getSession({ sessionId })
    return session
  }),
  secretMessage: protectedProcedure.query(() => {
    return 'You are authenticated!'
  }),
})

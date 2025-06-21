import { aiRouter } from './routes/ai'
import { authRouter } from './routes/auth'
import { carsRouter } from './routes/cars'
import { helloRouter } from './routes/hello'
import { userRouter } from './routes/user'
import { router } from './trpc'

// Page routers for optimized data fetching
import { dashboardRouter } from './routers/pages/dashboard'
import { homeRouter } from './routers/pages/home'
import { profileRouter } from './routers/pages/profile'
import { postsRouter } from './routers/pages/posts'

export const appRouter = router({
  hello: helloRouter,
  user: userRouter,
  auth: authRouter,
  car: carsRouter,
  ai: aiRouter,
  
  // Page-specific routers for eliminating waterfalls
  pages: router({
    dashboard: dashboardRouter,
    home: homeRouter,
    profile: profileRouter,
    posts: postsRouter,
  }),
})

export type AppRouter = typeof appRouter

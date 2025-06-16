import type { AppRouter } from '@cai/api/src/router'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import superjson from 'superjson'

export const trpc = createTRPCNext<AppRouter>({
  config() {
    return {
      transformer: superjson,
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === 'development' ||
            (opts.direction === 'down' && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: `${process.env.PUBLIC_API_URL}/trpc`,
          credentials: 'include', // Include cookies for Better Auth
        }),
      ],
    }
  },
  ssr: false,
})

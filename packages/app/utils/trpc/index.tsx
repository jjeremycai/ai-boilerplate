import type { AppRouter } from '@cai/api/src/router'
import { createTRPCReact } from '@trpc/react-query'

/**
 * A wrapper for your app that provides the TRPC context.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { replaceLocalhost } from './localhost.native'

/**
 * A set of typesafe hooks for consuming your API.
 */
export const trpc = createTRPCReact<AppRouter>()

const getApiUrl = () => {
  const apiUrl = `${process.env.EXPO_PUBLIC_API_URL}`
  return replaceLocalhost(apiUrl)
}

export const TRPCProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getApiUrl()}/trpc`,
          // Better Auth handles authentication via cookies/headers automatically
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}

import { AuthProvider } from './auth'
import { SafeAreaProvider } from './safe-area'
import { SolitoImageProvider } from './solito-image'
import { TRPCProvider } from './trpc'

export function Provider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SafeAreaProvider>
      <SolitoImageProvider>
        <AuthProvider>
          <TRPCProvider>{children}</TRPCProvider>
        </AuthProvider>
      </SolitoImageProvider>
    </SafeAreaProvider>
  )
}
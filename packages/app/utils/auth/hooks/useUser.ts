import { useSession } from '../client'

export function useUser() {
  const { data: session, error, isPending } = useSession()
  
  return {
    user: session?.user || null,
    isLoading: isPending,
    error,
  }
}
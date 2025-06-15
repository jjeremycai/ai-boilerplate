import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useSession } from '../client'

export function useAuthRedirect(redirectTo = '/sign-in') {
  const router = useRouter()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace(redirectTo)
    }
  }, [session, isPending, router, redirectTo])

  return { session, isLoading: isPending }
}
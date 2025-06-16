import { useNavigate } from 'react-router'
import { useEffect } from 'react'
import { useSession } from '../client'

export function useAuthRedirect(redirectTo = '/sign-in') {
  const navigate = useNavigate()
  const { data: session, isPending } = useSession()

  useEffect(() => {
    if (!isPending && !session) {
      navigate(redirectTo, { replace: true })
    }
  }, [session, isPending, navigate, redirectTo])

  return { session, isLoading: isPending }
}
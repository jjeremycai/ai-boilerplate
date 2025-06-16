import { useNavigate, useLocation } from 'react-router'

export function useRouter() {
  const navigate = useNavigate()
  const location = useLocation()

  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => navigate(-1),
    pathname: location.pathname,
  }
}
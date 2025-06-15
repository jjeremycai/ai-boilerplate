import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const AuthProvider = ({ children }: Props): ReactNode => {
  // Better Auth handles session management internally
  // No need for explicit provider on web
  return <>{children}</>
}

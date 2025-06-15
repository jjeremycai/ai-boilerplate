import { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export const AuthProvider = ({ children }: Props) => {
  // Better Auth handles session management internally
  // No need for explicit provider on native
  return <>{children}</>
}

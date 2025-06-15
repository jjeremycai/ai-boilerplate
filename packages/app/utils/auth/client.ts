import { createAuthClient } from 'better-auth/react'
import type { Session, User } from '@cai/api/src/db/schema'

// Create Better Auth client
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
})

// Export auth methods
export const signIn = authClient.signIn
export const signUp = authClient.signUp
export const signOut = authClient.signOut
export const useSession = authClient.useSession
export const forgetPassword = authClient.forgetPassword
export const resetPassword = authClient.resetPassword

// Type exports for convenience
export type { Session, User }
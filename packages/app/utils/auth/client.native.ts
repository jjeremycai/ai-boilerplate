import { createAuthClient } from 'better-auth/react'
import * as SecureStore from 'expo-secure-store'
import type { Session, User } from '@cai/api/src/db/schema'

// Custom storage adapter for React Native using SecureStore
const secureStorage = {
  getItem: async (key: string) => {
    try {
      return await SecureStore.getItemAsync(key)
    } catch {
      return null
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      await SecureStore.setItemAsync(key, value)
    } catch (error) {
      console.error('SecureStore setItem error:', error)
    }
  },
  removeItem: async (key: string) => {
    try {
      await SecureStore.deleteItemAsync(key)
    } catch (error) {
      console.error('SecureStore removeItem error:', error)
    }
  },
}

// Create Better Auth client with secure storage for native
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787',
  storage: secureStorage,
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
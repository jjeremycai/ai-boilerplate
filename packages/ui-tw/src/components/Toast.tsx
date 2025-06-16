import React from 'react'

// Simple toast controller for web compatibility
export const useToastController = () => {
  return {
    show: (message: string, options?: { description?: string }) => {
      // For web/SSR, we can use console.log or implement a proper toast later
      console.log('[Toast]', message, options?.description || '')
    }
  }
}

// Re-export common stack components
export { View as YStack, View as XStack, View as Stack } from 'react-native'
export { Text as Paragraph } from 'react-native'

// VirtualList - using FlatList from react-native
export { FlatList as VirtualList } from 'react-native'

// Heading components
export const H1 = ({ children, ...props }: any) => (
  <h1 className="text-4xl font-bold" {...props}>{children}</h1>
)

export const H2 = ({ children, ...props }: any) => (
  <h2 className="text-3xl font-semibold" {...props}>{children}</h2>
)

export const H3 = ({ children, ...props }: any) => (
  <h3 className="text-2xl font-semibold" {...props}>{children}</h3>
)

export const H4 = ({ children, ...props }: any) => (
  <h4 className="text-xl font-medium" {...props}>{children}</h4>
)

// Generic Heading component (defaults to H1)
export const Heading = H1
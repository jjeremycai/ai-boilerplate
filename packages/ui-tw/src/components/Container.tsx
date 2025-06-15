import React from 'react'
import { View, ViewProps } from 'react-native'
import { cn } from '../lib/utils'

interface ContainerProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function Container({ className, children, ...props }: ContainerProps) {
  return (
    <View className={cn('flex-1 px-4', className)} {...props}>
      {children}
    </View>
  )
}

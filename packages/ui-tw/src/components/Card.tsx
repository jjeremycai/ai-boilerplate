import React from 'react'
import { View, ViewProps } from 'react-native'
import { cn } from '../lib/utils'

interface CardProps extends ViewProps {
  className?: string
  children: React.ReactNode
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn('bg-white rounded-lg shadow-sm border border-gray-200 p-4', className)}
      {...props}
    >
      {children}
    </View>
  )
}

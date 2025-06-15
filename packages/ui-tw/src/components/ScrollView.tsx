import React from 'react'
import { ScrollView as RNScrollView, ScrollViewProps as RNScrollViewProps } from 'react-native'
import { cn } from '../lib/utils'

interface ScrollViewProps extends RNScrollViewProps {
  className?: string
  children: React.ReactNode
}

export function ScrollView({ className, children, ...props }: ScrollViewProps) {
  return (
    <RNScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={false}
      {...props}
    >
      {children}
    </RNScrollView>
  )
}

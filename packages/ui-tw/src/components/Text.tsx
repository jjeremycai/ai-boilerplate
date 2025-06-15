import React from 'react'
import { Text as RNText, TextProps as RNTextProps } from 'react-native'
import { cn } from '../lib/utils'

interface TextProps extends RNTextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label'
  className?: string
  children: React.ReactNode
}

export function Text({ variant = 'body', className, children, ...props }: TextProps) {
  const variants = {
    h1: 'text-3xl font-bold',
    h2: 'text-2xl font-bold',
    h3: 'text-xl font-semibold',
    h4: 'text-lg font-semibold',
    body: 'text-base',
    caption: 'text-sm text-gray-600',
    label: 'text-sm font-medium',
  }

  return (
    <RNText className={cn(variants[variant], 'text-gray-900', className)} {...props}>
      {children}
    </RNText>
  )
}

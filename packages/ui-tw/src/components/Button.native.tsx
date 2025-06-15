// Native version (Expo/React Native)
// Uses React Native primitives

import React from 'react'
import { Pressable, Text, ActivityIndicator, View } from 'react-native'
import { cn } from '../lib/utils'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  onPress?: () => void
  disabled?: boolean
  children: React.ReactNode
  className?: string
  textClassName?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  onPress,
  className,
  textClassName,
}: ButtonProps) {
  const variants = {
    primary: {
      container: 'bg-primary-500 active:bg-primary-600',
      text: 'text-white',
    },
    secondary: {
      container: 'bg-secondary-500 active:bg-secondary-600',
      text: 'text-white',
    },
    ghost: {
      container: 'bg-transparent active:bg-gray-100',
      text: 'text-gray-900',
    },
    destructive: {
      container: 'bg-red-500 active:bg-red-600',
      text: 'text-white',
    },
  }

  const sizes = {
    sm: {
      container: 'px-3 py-1.5',
      text: 'text-sm',
    },
    md: {
      container: 'px-4 py-2',
      text: 'text-base',
    },
    lg: {
      container: 'px-6 py-3',
      text: 'text-lg',
    },
  }

  const variantStyle = variants[variant]
  const sizeStyle = sizes[size]

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        'flex-row items-center justify-center rounded-md',
        variantStyle.container,
        sizeStyle.container,
        (disabled || loading) && 'opacity-50',
        className
      )}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={variant === 'ghost' ? '#111827' : '#ffffff'}
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        className={cn(
          'font-medium text-center',
          variantStyle.text,
          sizeStyle.text,
          textClassName
        )}
      >
        {children}
      </Text>
    </Pressable>
  )
}
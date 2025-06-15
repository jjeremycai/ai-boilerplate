import React from 'react'
import { ActivityIndicator, ActivityIndicatorProps, View } from 'react-native'
import { cn } from '../lib/utils'

interface SpinnerProps extends ActivityIndicatorProps {
  className?: string
  containerClassName?: string
}

export function Spinner({
  className,
  containerClassName,
  size = 'small',
  color = '#3B82F6',
  ...props
}: SpinnerProps) {
  return (
    <View className={cn('items-center justify-center', containerClassName)}>
      <ActivityIndicator size={size} color={color} className={className} {...props} />
    </View>
  )
}

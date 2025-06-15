import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '../lib/utils'

type AlertColor = 'amber' | 'red' | 'green' | 'blue' | 'zinc'

interface AlertProps {
  children: React.ReactNode
  color?: AlertColor
  className?: string
}

const colorStyles: Record<AlertColor, string> = {
  zinc: 'bg-zinc-50 text-zinc-900 border-zinc-200',
  amber: 'bg-amber-50 text-amber-900 border-amber-200',
  red: 'bg-red-50 text-red-900 border-red-200',
  green: 'bg-green-50 text-green-900 border-green-200',
  blue: 'bg-blue-50 text-blue-900 border-blue-200'
}

export function Alert({
  children,
  color = 'zinc',
  className
}: AlertProps) {
  return (
    <View className={cn(
      'rounded-lg border p-4',
      colorStyles[color],
      className
    )}>
      {typeof children === 'string' ? (
        <Text className="text-sm">{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}
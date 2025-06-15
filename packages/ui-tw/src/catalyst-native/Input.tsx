import React from 'react'
import { TextInput, View } from 'react-native'
import { cn } from '../lib/utils'

interface InputProps extends React.ComponentProps<typeof TextInput> {
  invalid?: boolean
  className?: string
  containerClassName?: string
}

export function Input({
  invalid = false,
  className,
  containerClassName,
  ...props
}: InputProps) {
  return (
    <View className={cn('relative', containerClassName)}>
      <TextInput
        {...props}
        className={cn(
          'w-full rounded-lg border px-3 py-2 text-base',
          'bg-white text-zinc-950',
          'placeholder:text-zinc-500',
          invalid 
            ? 'border-red-500 focus:ring-red-500' 
            : 'border-zinc-950/10 focus:ring-indigo-500',
          'focus:border-transparent focus:ring-2',
          className
        )}
        placeholderTextColor="#71717a"
      />
    </View>
  )
}
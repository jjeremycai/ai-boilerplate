import React from 'react'
import { TextInput, TextInputProps, View, Text } from 'react-native'
import { cn } from '../lib/utils'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
  className?: string
  containerClassName?: string
}

export function Input({ label, error, className, containerClassName, ...props }: InputProps) {
  return (
    <View className={cn('mb-4', containerClassName)}>
      {label && <Text className='text-sm font-medium text-gray-700 mb-1'>{label}</Text>}
      <TextInput
        className={cn(
          'border border-gray-300 rounded-lg px-4 py-2 text-base',
          'focus:border-primary-500 focus:ring-2 focus:ring-primary-500',
          error && 'border-red-500',
          className
        )}
        placeholderTextColor='#9CA3AF'
        {...props}
      />
      {error && <Text className='text-sm text-red-500 mt-1'>{error}</Text>}
    </View>
  )
}

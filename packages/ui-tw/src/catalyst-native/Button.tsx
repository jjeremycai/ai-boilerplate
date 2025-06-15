import React from 'react'
import { Pressable, Text, View, ActivityIndicator } from 'react-native'
import { cn } from '../lib/utils'

type ButtonColor = 
  | 'dark/zinc' | 'light' | 'dark/white' | 'dark' | 'white' | 'zinc' 
  | 'indigo' | 'cyan' | 'red' | 'orange' | 'amber' | 'yellow' 
  | 'lime' | 'green' | 'emerald' | 'teal' | 'sky' | 'blue' 
  | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'

interface ButtonProps extends React.ComponentProps<typeof Pressable> {
  children: React.ReactNode
  color?: ButtonColor
  outline?: boolean
  plain?: boolean
  loading?: boolean
  className?: string
  textClassName?: string
}

const colorStyles: Record<ButtonColor, { container: string; text: string }> = {
  'dark/zinc': {
    container: 'bg-zinc-900 border-zinc-950/90',
    text: 'text-white'
  },
  light: {
    container: 'bg-white border-zinc-950/10',
    text: 'text-zinc-950'
  },
  'dark/white': {
    container: 'bg-zinc-900 border-zinc-950/90',
    text: 'text-white'
  },
  dark: {
    container: 'bg-zinc-900 border-zinc-950/90',
    text: 'text-white'
  },
  white: {
    container: 'bg-white border-zinc-950/10',
    text: 'text-zinc-950'
  },
  zinc: {
    container: 'bg-zinc-600 border-zinc-700/90',
    text: 'text-white'
  },
  indigo: {
    container: 'bg-indigo-500 border-indigo-600/90',
    text: 'text-white'
  },
  cyan: {
    container: 'bg-cyan-300 border-cyan-400/80',
    text: 'text-cyan-950'
  },
  red: {
    container: 'bg-red-600 border-red-700/90',
    text: 'text-white'
  },
  orange: {
    container: 'bg-orange-500 border-orange-600/90',
    text: 'text-white'
  },
  amber: {
    container: 'bg-amber-400 border-amber-500/80',
    text: 'text-amber-950'
  },
  yellow: {
    container: 'bg-yellow-300 border-yellow-400/80',
    text: 'text-yellow-950'
  },
  lime: {
    container: 'bg-lime-300 border-lime-400/80',
    text: 'text-lime-950'
  },
  green: {
    container: 'bg-green-600 border-green-700/90',
    text: 'text-white'
  },
  emerald: {
    container: 'bg-emerald-600 border-emerald-700/90',
    text: 'text-white'
  },
  teal: {
    container: 'bg-teal-600 border-teal-700/90',
    text: 'text-white'
  },
  sky: {
    container: 'bg-sky-500 border-sky-600/80',
    text: 'text-white'
  },
  blue: {
    container: 'bg-blue-600 border-blue-700/90',
    text: 'text-white'
  },
  violet: {
    container: 'bg-violet-500 border-violet-600/90',
    text: 'text-white'
  },
  purple: {
    container: 'bg-purple-500 border-purple-600/90',
    text: 'text-white'
  },
  fuchsia: {
    container: 'bg-fuchsia-500 border-fuchsia-600/90',
    text: 'text-white'
  },
  pink: {
    container: 'bg-pink-500 border-pink-600/90',
    text: 'text-white'
  },
  rose: {
    container: 'bg-rose-500 border-rose-600/90',
    text: 'text-white'
  }
}

export function Button({
  children,
  color = 'dark/zinc',
  outline = false,
  plain = false,
  loading = false,
  disabled,
  className,
  textClassName,
  ...props
}: ButtonProps) {
  const colorStyle = colorStyles[color]

  let containerStyle = cn(
    'rounded-lg px-3.5 py-2.5 border',
    'active:opacity-75'
  )

  let textStyle = cn(
    'text-base font-semibold text-center'
  )

  if (plain) {
    containerStyle = cn(
      'border-transparent',
      'active:bg-zinc-950/5',
      className
    )
    textStyle = cn(
      'text-zinc-950',
      textClassName
    )
  } else if (outline) {
    containerStyle = cn(
      'bg-transparent border-zinc-950/10',
      'active:bg-zinc-950/5',
      className
    )
    textStyle = cn(
      'text-zinc-950',
      textClassName
    )
  } else {
    containerStyle = cn(
      colorStyle.container,
      className
    )
    textStyle = cn(
      colorStyle.text,
      textClassName
    )
  }

  if (disabled || loading) {
    containerStyle = cn(containerStyle, 'opacity-50')
  }

  return (
    <Pressable
      {...props}
      disabled={disabled || loading}
      className={containerStyle}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={plain || outline ? '#18181b' : '#ffffff'}
        />
      ) : (
        <Text className={textStyle}>
          {children}
        </Text>
      )}
    </Pressable>
  )
}
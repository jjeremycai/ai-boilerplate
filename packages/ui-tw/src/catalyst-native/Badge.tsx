import React from 'react'
import { View, Text } from 'react-native'
import { cn } from '../lib/utils'

type BadgeColor = 
  | 'zinc' | 'red' | 'orange' | 'amber' | 'yellow' | 'lime' 
  | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky' | 'blue' 
  | 'indigo' | 'violet' | 'purple' | 'fuchsia' | 'pink' | 'rose'

interface BadgeProps {
  children: React.ReactNode
  color?: BadgeColor
  className?: string
  textClassName?: string
}

const colorStyles: Record<BadgeColor, { container: string; text: string; dot: string }> = {
  zinc: {
    container: 'bg-zinc-500/20 ring-zinc-500/30',
    text: 'text-zinc-700',
    dot: 'bg-zinc-500'
  },
  red: {
    container: 'bg-red-500/20 ring-red-500/30',
    text: 'text-red-700',
    dot: 'bg-red-500'
  },
  orange: {
    container: 'bg-orange-500/20 ring-orange-500/30',
    text: 'text-orange-700',
    dot: 'bg-orange-500'
  },
  amber: {
    container: 'bg-amber-400/30 ring-amber-400/40',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  yellow: {
    container: 'bg-yellow-400/30 ring-yellow-400/40',
    text: 'text-yellow-700',
    dot: 'bg-yellow-500'
  },
  lime: {
    container: 'bg-lime-400/30 ring-lime-400/40',
    text: 'text-lime-700',
    dot: 'bg-lime-500'
  },
  green: {
    container: 'bg-green-500/20 ring-green-500/30',
    text: 'text-green-700',
    dot: 'bg-green-500'
  },
  emerald: {
    container: 'bg-emerald-500/20 ring-emerald-500/30',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  teal: {
    container: 'bg-teal-500/20 ring-teal-500/30',
    text: 'text-teal-700',
    dot: 'bg-teal-500'
  },
  cyan: {
    container: 'bg-cyan-400/30 ring-cyan-400/40',
    text: 'text-cyan-700',
    dot: 'bg-cyan-500'
  },
  sky: {
    container: 'bg-sky-500/20 ring-sky-500/30',
    text: 'text-sky-700',
    dot: 'bg-sky-500'
  },
  blue: {
    container: 'bg-blue-500/20 ring-blue-500/30',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  indigo: {
    container: 'bg-indigo-500/20 ring-indigo-500/30',
    text: 'text-indigo-700',
    dot: 'bg-indigo-500'
  },
  violet: {
    container: 'bg-violet-500/20 ring-violet-500/30',
    text: 'text-violet-700',
    dot: 'bg-violet-500'
  },
  purple: {
    container: 'bg-purple-500/20 ring-purple-500/30',
    text: 'text-purple-700',
    dot: 'bg-purple-500'
  },
  fuchsia: {
    container: 'bg-fuchsia-400/30 ring-fuchsia-400/40',
    text: 'text-fuchsia-700',
    dot: 'bg-fuchsia-500'
  },
  pink: {
    container: 'bg-pink-400/30 ring-pink-400/40',
    text: 'text-pink-700',
    dot: 'bg-pink-500'
  },
  rose: {
    container: 'bg-rose-400/30 ring-rose-400/40',
    text: 'text-rose-700',
    dot: 'bg-rose-500'
  }
}

export function Badge({
  children,
  color = 'zinc',
  className,
  textClassName
}: BadgeProps) {
  const colorStyle = colorStyles[color]

  return (
    <View className={cn(
      'inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 ring-1 ring-inset',
      colorStyle.container,
      className
    )}>
      <View className={cn('h-1.5 w-1.5 rounded-full', colorStyle.dot)} />
      <Text className={cn(
        'text-xs font-medium',
        colorStyle.text,
        textClassName
      )}>
        {children}
      </Text>
    </View>
  )
}
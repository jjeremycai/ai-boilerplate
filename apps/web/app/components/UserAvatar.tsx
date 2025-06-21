import { cn } from '@cai/ui-tw/libs/string'

interface UserAvatarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showName?: boolean
  namePosition?: 'right' | 'bottom'
}

const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
}

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
}

export function UserAvatar({
  user,
  size = 'md',
  className,
  showName = false,
  namePosition = 'right',
}: UserAvatarProps) {
  const initials = getInitials(user?.name || user?.email || 'Unknown User')
  const displayName = user?.name || user?.email?.split('@')[0] || 'Unknown'

  const avatar = (
    <div
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium',
        sizeClasses[size],
        className
      )}
    >
      {user?.image ? (
        <img
          src={user.image}
          alt={displayName}
          className="h-full w-full object-cover"
          onError={(e) => {
            // Fallback to initials if image fails to load
            e.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span className="uppercase">{initials}</span>
      )}
    </div>
  )

  if (!showName) {
    return avatar
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2',
        namePosition === 'bottom' && 'flex-col'
      )}
    >
      {avatar}
      <span className={cn('font-medium text-gray-900 dark:text-gray-100', textSizeClasses[size])}>
        {displayName}
      </span>
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// User info component for displaying more details
interface UserInfoProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
    bio?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function UserInfo({ user, size = 'md', className }: UserInfoProps) {
  const avatarSize = size === 'sm' ? 'md' : size === 'lg' ? 'xl' : 'lg'
  
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <UserAvatar user={user} size={avatarSize} />
      <div className="flex-1 min-w-0">
        <h3 className={cn(
          'font-semibold text-gray-900 dark:text-gray-100 truncate',
          size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'
        )}>
          {user.name || 'Unknown User'}
        </h3>
        {user.email && (
          <p className={cn(
            'text-gray-600 dark:text-gray-400 truncate',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          )}>
            {user.email}
          </p>
        )}
        {user.role && (
          <p className={cn(
            'text-gray-500 dark:text-gray-500',
            size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
          )}>
            {user.role}
          </p>
        )}
        {user.bio && size !== 'sm' && (
          <p className={cn(
            'mt-1 text-gray-600 dark:text-gray-400 line-clamp-2',
            size === 'lg' ? 'text-base' : 'text-sm'
          )}>
            {user.bio}
          </p>
        )}
      </div>
    </div>
  )
}
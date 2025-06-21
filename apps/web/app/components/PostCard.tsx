import { Link } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { UserAvatar } from './UserAvatar'
import { cn } from '@cai/ui-tw/libs/string'

interface Post {
  id: string
  title: string
  excerpt?: string
  content?: string
  author: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
  publishedAt: Date | string
  tags?: string[]
  readTime?: number
  imageUrl?: string
  featured?: boolean
}

interface PostCardProps {
  post: Post
  variant?: 'default' | 'compact' | 'featured'
  className?: string
}

export function PostCard({ post, variant = 'default', className }: PostCardProps) {
  const publishedDate = new Date(post.publishedAt)
  const formattedDate = publishedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (variant === 'compact') {
    return (
      <article className={cn('group', className)}>
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="block"
        >
          <Catalyst.Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <Catalyst.CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <Catalyst.Heading level={3} className="line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {post.title}
                  </Catalyst.Heading>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formattedDate}</span>
                    {post.readTime && (
                      <>
                        <span>•</span>
                        <span>{post.readTime} min read</span>
                      </>
                    )}
                  </div>
                </div>
                <UserAvatar user={post.author} size="sm" />
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </Link>
      </article>
    )
  }

  if (variant === 'featured') {
    return (
      <article className={cn('group', className)}>
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="block"
        >
          <Catalyst.Card className="overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1">
            {post.imageUrl && (
              <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            )}
            <Catalyst.CardContent className="p-6">
              {post.featured && (
                <Catalyst.Badge color="amber" className="mb-3">
                  Featured
                </Catalyst.Badge>
              )}
              <Catalyst.Heading level={2} className="mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {post.title}
              </Catalyst.Heading>
              {post.excerpt && (
                <Catalyst.Text className="mb-4 line-clamp-3">
                  {post.excerpt}
                </Catalyst.Text>
              )}
              <div className="flex items-center justify-between">
                <UserAvatar user={post.author} size="sm" showName namePosition="right" />
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span>{formattedDate}</span>
                  {post.readTime && (
                    <>
                      <span>•</span>
                      <span>{post.readTime} min read</span>
                    </>
                  )}
                </div>
              </div>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Catalyst.Badge key={tag} color="zinc">
                      {tag}
                    </Catalyst.Badge>
                  ))}
                </div>
              )}
            </Catalyst.CardContent>
          </Catalyst.Card>
        </Link>
      </article>
    )
  }

  // Default variant
  return (
    <article className={cn('group', className)}>
      <Link
        to="/posts/$postId"
        params={{ postId: post.id }}
        className="block"
      >
        <Catalyst.Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
          <Catalyst.CardContent className="p-6">
            <div className="flex items-start gap-4">
              {post.imageUrl && (
                <div className="flex-shrink-0">
                  <div className="h-24 w-24 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Catalyst.Heading level={3} className="line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {post.title}
                    </Catalyst.Heading>
                    {post.excerpt && (
                      <Catalyst.Text className="mt-2 line-clamp-2">
                        {post.excerpt}
                      </Catalyst.Text>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <UserAvatar user={post.author} size="xs" showName namePosition="right" />
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <span>{formattedDate}</span>
                    {post.readTime && (
                      <>
                        <span>•</span>
                        <span>{post.readTime} min read</span>
                      </>
                    )}
                  </div>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <Catalyst.Badge key={tag} color="zinc" size="sm">
                        {tag}
                      </Catalyst.Badge>
                    ))}
                    {post.tags.length > 3 && (
                      <Catalyst.Badge color="zinc" size="sm">
                        +{post.tags.length - 3}
                      </Catalyst.Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </Link>
    </article>
  )
}
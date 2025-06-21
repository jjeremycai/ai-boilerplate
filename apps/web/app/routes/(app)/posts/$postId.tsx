import { createFileRoute, Link } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { SEO } from '~/components/SEO'
import { UserInfo } from '~/components/UserAvatar'
import { PostCard } from '~/components/PostCard'
import { LoadingSpinner, Skeleton } from '~/components/LoadingSpinner'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { z } from 'zod'

// Route configuration with no-waterfall pattern
export const Route = createFileRoute('/(app)/posts/$postId')({
  parseParams: (params) => ({
    postId: z.string().parse(params.postId),
  }),
  loader: async ({ context, params }) => {
    // Fetch post and related data in parallel (no waterfall)
    const [post, relatedPosts] = await Promise.all([
      context.trpc.posts.getById.query({ id: params.postId }),
      context.trpc.posts.getRelated.query({ 
        postId: params.postId, 
        limit: 3 
      }),
    ])

    if (!post) {
      throw new Error('Post not found')
    }

    return { post, relatedPosts }
  },
  pendingComponent: PostDetailSkeleton,
  errorComponent: ({ error }) => (
    <ErrorBoundary>
      <div className="min-h-screen flex items-center justify-center">
        <Catalyst.Card className="max-w-md w-full">
          <Catalyst.CardContent className="p-6 text-center">
            <Catalyst.Heading level={2} className="mb-2">
              Post Not Found
            </Catalyst.Heading>
            <Catalyst.Text className="mb-4 text-gray-600 dark:text-gray-400">
              {error.message || 'The post you are looking for does not exist.'}
            </Catalyst.Text>
            <Link to="/posts">
              <Catalyst.Button>Back to Posts</Catalyst.Button>
            </Link>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>
    </ErrorBoundary>
  ),
  component: PostDetailPage,
})

function PostDetailPage() {
  const { post, relatedPosts } = Route.useLoaderData()
  const publishedDate = new Date(post.publishedAt)
  
  // Calculate read time if not provided
  const readTime = post.readTime || Math.ceil(post.content.split(' ').length / 200)
  
  return (
    <>
      <SEO 
        title={post.title}
        description={post.excerpt || post.content.substring(0, 160) + '...'}
        image={post.imageUrl}
        type="article"
        author={post.author.name || undefined}
        publishedTime={publishedDate.toISOString()}
        modifiedTime={post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined}
        section={post.category?.name}
        tags={post.tags?.map(t => t.name)}
      />
      
      <article className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        {post.imageUrl && (
          <div className="relative h-[400px] lg:h-[500px] overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <div className="max-w-4xl mx-auto">
                <Catalyst.Heading level={1} className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  {post.title}
                </Catalyst.Heading>
              </div>
            </div>
          </div>
        )}
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Post Header (if no hero image) */}
          {!post.imageUrl && (
            <header className="mb-8">
              <Catalyst.Heading level={1} className="text-4xl lg:text-5xl font-bold mb-4">
                {post.title}
              </Catalyst.Heading>
            </header>
          )}
          
          {/* Post Meta */}
          <div className="flex flex-wrap items-center gap-4 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <UserInfo user={post.author} size="md" className="flex-1" />
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <time dateTime={publishedDate.toISOString()}>
                {publishedDate.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
              <span>•</span>
              <span>{readTime} min read</span>
              {post.views && (
                <>
                  <span>•</span>
                  <span>{post.views.toLocaleString()} views</span>
                </>
              )}
            </div>
          </div>
          
          {/* Categories and Tags */}
          {(post.category || (post.tags && post.tags.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2 mb-8">
              {post.category && (
                <Link to="/posts" search={{ category: post.category.slug }}>
                  <Catalyst.Badge color="blue" size="lg">
                    {post.category.name}
                  </Catalyst.Badge>
                </Link>
              )}
              {post.tags?.map((tag) => (
                <Link key={tag.slug} to="/posts" search={{ tag: tag.slug }}>
                  <Catalyst.Badge color="zinc">
                    #{tag.name}
                  </Catalyst.Badge>
                </Link>
              ))}
            </div>
          )}
          
          {/* Post Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
            {/* 
              In a real app, you'd parse and render the content properly
              (e.g., with markdown, MDX, or a rich text renderer)
            */}
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>
          
          {/* Author Bio */}
          {post.author.bio && (
            <Catalyst.Card className="mb-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <Catalyst.CardContent className="p-6">
                <Catalyst.Heading level={3} className="mb-4">
                  About the Author
                </Catalyst.Heading>
                <UserInfo user={post.author} size="lg" />
                {post.author.socials && (
                  <div className="mt-4 flex gap-3">
                    {post.author.socials.twitter && (
                      <Catalyst.Link href={`https://twitter.com/${post.author.socials.twitter}`}>
                        Twitter
                      </Catalyst.Link>
                    )}
                    {post.author.socials.github && (
                      <Catalyst.Link href={`https://github.com/${post.author.socials.github}`}>
                        GitHub
                      </Catalyst.Link>
                    )}
                    {post.author.socials.linkedin && (
                      <Catalyst.Link href={`https://linkedin.com/in/${post.author.socials.linkedin}`}>
                        LinkedIn
                      </Catalyst.Link>
                    )}
                  </div>
                )}
              </Catalyst.CardContent>
            </Catalyst.Card>
          )}
          
          {/* Share Section */}
          <div className="mb-12 flex items-center justify-center gap-4">
            <Catalyst.Text className="font-medium">Share this post:</Catalyst.Text>
            <div className="flex gap-2">
              <Catalyst.Button
                color="white"
                size="sm"
                onClick={() => {
                  const url = window.location.href
                  const text = `Check out "${post.title}" by ${post.author.name || 'Unknown'}`
                  window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
                }}
              >
                Twitter
              </Catalyst.Button>
              <Catalyst.Button
                color="white"
                size="sm"
                onClick={() => {
                  const url = window.location.href
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
                }}
              >
                LinkedIn
              </Catalyst.Button>
              <Catalyst.Button
                color="white"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href)
                  // In a real app, you'd show a toast notification here
                  alert('Link copied to clipboard!')
                }}
              >
                Copy Link
              </Catalyst.Button>
            </div>
          </div>
          
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section>
              <Catalyst.Heading level={2} className="mb-6">
                Related Posts
              </Catalyst.Heading>
              <div className="grid gap-6 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <PostCard key={relatedPost.id} post={relatedPost} variant="compact" />
                ))}
              </div>
            </section>
          )}
          
          {/* Comments Section */}
          <section className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
            <Catalyst.Heading level={2} className="mb-6">
              Comments
            </Catalyst.Heading>
            <Catalyst.Card>
              <Catalyst.CardContent className="p-6 text-center">
                <Catalyst.Text className="text-gray-600 dark:text-gray-400">
                  Comments are coming soon! 
                </Catalyst.Text>
              </Catalyst.CardContent>
            </Catalyst.Card>
          </section>
        </div>
      </article>
    </>
  )
}

function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Skeleton className="h-[400px] w-full" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  )
}
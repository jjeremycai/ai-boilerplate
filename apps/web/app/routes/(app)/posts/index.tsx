import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Catalyst } from '@cai/ui-tw'
import { SEO } from '~/components/SEO'
import { PostCard } from '~/components/PostCard'
import { LoadingList } from '~/components/LoadingSpinner'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { z } from 'zod'

// Search params validation
const searchSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  category: z.string().optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['latest', 'popular', 'trending']).optional().default('latest'),
})

// Route configuration with no-waterfall pattern
export const Route = createFileRoute('/(app)/posts/')({
  validateSearch: searchSchema,
  // Load data in parallel (no waterfall)
  loaderDeps: ({ search }) => ({ 
    page: search.page, 
    category: search.category,
    tag: search.tag,
    searchQuery: search.search,
    sort: search.sort,
  }),
  loader: async ({ context, deps }) => {
    // Parallel data fetching
    const [posts, categories, popularTags] = await Promise.all([
      context.trpc.posts.list.query({
        page: deps.page,
        limit: 12,
        category: deps.category,
        tag: deps.tag,
        search: deps.searchQuery,
        sort: deps.sort,
      }),
      context.trpc.posts.categories.query(),
      context.trpc.posts.popularTags.query({ limit: 10 }),
    ])

    return {
      posts,
      categories,
      popularTags,
    }
  },
  pendingComponent: PostsListingSkeleton,
  errorComponent: ({ error }) => (
    <ErrorBoundary>
      <div>Failed to load posts: {error.message}</div>
    </ErrorBoundary>
  ),
  component: PostsListingPage,
})

function PostsListingPage() {
  const { posts, categories, popularTags } = Route.useLoaderData()
  const { page, category, tag, search: searchQuery, sort } = Route.useSearch()
  const navigate = Route.useNavigate()
  
  const [searchInput, setSearchInput] = useState(searchQuery || '')
  
  // Featured post (first post on first page)
  const featuredPost = page === 1 && !category && !tag && !searchQuery ? posts.items[0] : null
  const regularPosts = featuredPost ? posts.items.slice(1) : posts.items

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    navigate({ 
      search: (prev) => ({ 
        ...prev, 
        search: searchInput || undefined,
        page: 1, // Reset to first page on new search
      }) 
    })
  }

  const handleFilterChange = (filterType: 'category' | 'tag' | 'sort', value: string | undefined) => {
    navigate({ 
      search: (prev) => ({ 
        ...prev,
        [filterType]: value,
        page: 1, // Reset to first page on filter change
      }) 
    })
  }

  const handlePageChange = (newPage: number) => {
    navigate({ search: (prev) => ({ ...prev, page: newPage }) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <SEO 
        title="Blog Posts"
        description="Explore our latest articles, tutorials, and insights about modern web development"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <Catalyst.Heading level={1} className="text-4xl font-bold">
                Blog
              </Catalyst.Heading>
              <Catalyst.Text className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                Discover the latest in web development, edge computing, and more
              </Catalyst.Text>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-6 max-w-2xl mx-auto">
              <div className="relative">
                <Catalyst.Input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              {/* Active Filters */}
              {(category || tag || searchQuery) && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
                  {category && (
                    <Catalyst.Badge 
                      color="blue"
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('category', undefined)}
                    >
                      {category} ×
                    </Catalyst.Badge>
                  )}
                  {tag && (
                    <Catalyst.Badge 
                      color="green"
                      className="cursor-pointer"
                      onClick={() => handleFilterChange('tag', undefined)}
                    >
                      #{tag} ×
                    </Catalyst.Badge>
                  )}
                  {searchQuery && (
                    <Catalyst.Badge 
                      color="gray"
                      className="cursor-pointer"
                      onClick={() => {
                        setSearchInput('')
                        handleFilterChange('search', undefined)
                      }}
                    >
                      "{searchQuery}" ×
                    </Catalyst.Badge>
                  )}
                </div>
              )}

              {/* Sort Options */}
              <div className="mb-6 flex justify-between items-center">
                <Catalyst.Text className="text-sm text-gray-600 dark:text-gray-400">
                  {posts.total} {posts.total === 1 ? 'post' : 'posts'} found
                </Catalyst.Text>
                <Catalyst.Select
                  value={sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </Catalyst.Select>
              </div>

              {/* Featured Post */}
              {featuredPost && (
                <div className="mb-8">
                  <PostCard post={featuredPost} variant="featured" />
                </div>
              )}

              {/* Posts Grid */}
              {regularPosts.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2">
                  {regularPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Catalyst.Card>
                  <Catalyst.CardContent className="py-12 text-center">
                    <Catalyst.Heading level={3} className="mb-2">
                      No posts found
                    </Catalyst.Heading>
                    <Catalyst.Text className="text-gray-600 dark:text-gray-400">
                      Try adjusting your filters or search query
                    </Catalyst.Text>
                  </Catalyst.CardContent>
                </Catalyst.Card>
              )}

              {/* Pagination */}
              {posts.totalPages > 1 && (
                <Catalyst.Pagination
                  className="mt-8"
                  current={page}
                  total={posts.totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-80 space-y-6">
              {/* Categories */}
              <Catalyst.Card>
                <Catalyst.CardHeader>
                  <Catalyst.Heading level={3}>Categories</Catalyst.Heading>
                </Catalyst.CardHeader>
                <Catalyst.CardContent className="p-4">
                  <ul className="space-y-2">
                    {categories.map((cat) => (
                      <li key={cat.slug}>
                        <button
                          onClick={() => handleFilterChange('category', cat.slug)}
                          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                            category === cat.slug
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span>{cat.name}</span>
                            <Catalyst.Badge color="gray" size="sm">
                              {cat.count}
                            </Catalyst.Badge>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Catalyst.CardContent>
              </Catalyst.Card>

              {/* Popular Tags */}
              <Catalyst.Card>
                <Catalyst.CardHeader>
                  <Catalyst.Heading level={3}>Popular Tags</Catalyst.Heading>
                </Catalyst.CardHeader>
                <Catalyst.CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((t) => (
                      <Catalyst.Badge
                        key={t.slug}
                        color={tag === t.slug ? 'green' : 'zinc'}
                        className="cursor-pointer"
                        onClick={() => handleFilterChange('tag', t.slug)}
                      >
                        #{t.name} ({t.count})
                      </Catalyst.Badge>
                    ))}
                  </div>
                </Catalyst.CardContent>
              </Catalyst.Card>

              {/* Newsletter CTA */}
              <Catalyst.Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                <Catalyst.CardContent className="p-6 text-center">
                  <Catalyst.Heading level={3} className="mb-2">
                    Stay Updated
                  </Catalyst.Heading>
                  <Catalyst.Text className="mb-4">
                    Get the latest posts delivered to your inbox
                  </Catalyst.Text>
                  <Catalyst.Button className="w-full">
                    Subscribe to Newsletter
                  </Catalyst.Button>
                </Catalyst.CardContent>
              </Catalyst.Card>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

function PostsListingSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-2" />
            <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingList count={6} />
      </div>
    </div>
  )
}
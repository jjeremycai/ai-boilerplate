import { useEffect, useState } from 'react'
import { Link } from 'wouter'
import { ChevronLeft } from 'lucide-react'

export default function BlogPost({ slug }: { slug: string }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPost()
  }, [slug])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/v1/blog/${slug}`)
      if (response.ok) {
        const data = await response.json()
        setPost(data)
      }
    } catch (error) {
      console.error('Failed to fetch blog post:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800">
            <ChevronLeft className="inline-block w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <article className="max-w-4xl mx-auto py-12 px-4">
        <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 inline-flex items-center mb-8">
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>
          <div className="text-sm text-gray-500">
            <time dateTime={post.created_at}>
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
          </div>
        </header>

        <div className="prose prose-lg max-w-none">
          {/* In a real app, you'd parse markdown here */}
          <div className="whitespace-pre-wrap">{post.content}</div>
        </div>

        {/* SEO Meta Tags would be set here with React Helmet or similar */}
      </article>
    </div>
  )
}
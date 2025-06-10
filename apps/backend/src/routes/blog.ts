import { Hono } from 'hono'
import type { Env } from '../index'

export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags: string[]
  featured?: boolean
  coverImage?: string
  metaDescription?: string
  metaKeywords?: string[]
}

export const blog = new Hono<{ Bindings: Env }>()

// Get all blog posts (public for SEO)
blog.get('/', async (c) => {
  try {
    // Get list of published posts from KV
    const postsList = await c.env.KV.get('blog:posts:index', 'json') as BlogPost[] || []
    
    // Sort by date, newest first
    const sortedPosts = postsList.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    
    return c.json({ 
      data: sortedPosts.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
        tags: post.tags,
        featured: post.featured,
        coverImage: post.coverImage
      }))
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// Get single blog post by slug (public for SEO)
blog.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  try {
    // Get post from KV
    const post = await c.env.KV.get(`blog:post:${slug}`, 'json') as BlogPost
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404)
    }
    
    // Track views (optional)
    const viewKey = `blog:views:${slug}`
    const currentViews = parseInt(await c.env.KV.get(viewKey) || '0')
    await c.env.KV.put(viewKey, String(currentViews + 1))
    
    return c.json({ 
      data: post,
      meta: {
        views: currentViews + 1
      }
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch post' }, 500)
  }
})

// Get posts by tag (public for SEO)
blog.get('/tag/:tag', async (c) => {
  const tag = c.req.param('tag')
  
  try {
    // Get all posts
    const postsList = await c.env.KV.get('blog:posts:index', 'json') as BlogPost[] || []
    
    // Filter by tag
    const taggedPosts = postsList.filter(post => 
      post.tags.map(t => t.toLowerCase()).includes(tag.toLowerCase())
    )
    
    return c.json({ 
      data: taggedPosts.map(post => ({
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        author: post.author,
        publishedAt: post.publishedAt,
        tags: post.tags,
        coverImage: post.coverImage
      }))
    })
  } catch (error) {
    return c.json({ error: 'Failed to fetch posts' }, 500)
  }
})

// RSS feed for SEO
blog.get('/rss', async (c) => {
  try {
    const postsList = await c.env.KV.get('blog:posts:index', 'json') as BlogPost[] || []
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog</title>
    <link>${new URL(c.req.url).origin}/blog</link>
    <description>Latest blog posts</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${postsList.map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${new URL(c.req.url).origin}/blog/${post.slug}</link>
      <description><![CDATA[${post.excerpt}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid>${new URL(c.req.url).origin}/blog/${post.slug}</guid>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>`).join('')}
  </channel>
</rss>`
    
    return new Response(rss, {
      headers: { 'Content-Type': 'application/rss+xml' }
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate RSS' }, 500)
  }
})

// Sitemap for SEO
blog.get('/sitemap', async (c) => {
  try {
    const postsList = await c.env.KV.get('blog:posts:index', 'json') as BlogPost[] || []
    
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${postsList.map(post => `
  <url>
    <loc>${new URL(c.req.url).origin}/blog/${post.slug}</loc>
    <lastmod>${post.updatedAt || post.publishedAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
</urlset>`
    
    return new Response(sitemap, {
      headers: { 'Content-Type': 'application/xml' }
    })
  } catch (error) {
    return c.json({ error: 'Failed to generate sitemap' }, 500)
  }
})
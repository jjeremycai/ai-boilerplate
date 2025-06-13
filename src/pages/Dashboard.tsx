import { useState, useEffect } from 'react'
import { useAuth, UserButton } from '@clerk/clerk-react'
import { Link } from 'wouter'
import { MessageSquare, Database, Globe, Send } from 'lucide-react'

export default function Dashboard() {
  const { getToken } = useAuth()
  const [activeTab, setActiveTab] = useState<'data' | 'blog' | 'chat'>('data')
  
  // D1 Data State
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Blog State
  const [blogPosts, setBlogPosts] = useState<any[]>([])
  const [newPost, setNewPost] = useState({ title: '', slug: '', content: '' })
  
  // Chat State
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Fetch D1 data
  useEffect(() => {
    fetchItems()
    fetchBlogPosts()
    connectWebSocket()
    
    return () => {
      ws?.close()
    }
  }, [])

  const fetchItems = async () => {
    try {
      const token = await getToken()
      const response = await fetch('/api/v1/items', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBlogPosts = async () => {
    try {
      const response = await fetch('/api/v1/blog')
      const data = await response.json()
      setBlogPosts(data.posts || [])
    } catch (error) {
      console.error('Failed to fetch blog posts:', error)
    }
  }

  const connectWebSocket = async () => {
    try {
      const token = await getToken()
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/api/v1/chat/agent/websocket`
      
      const websocket = new WebSocket(wsUrl, token ? [token] : [])
      
      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'message':
            setMessages(prev => [...prev, data.message])
            break
          case 'history':
            setMessages(data.messages)
            break
          case 'typing':
            // Handle typing indicators if needed
            break
        }
      }
      
      websocket.onopen = () => {
        console.log('Chat connected')
      }
      
      websocket.onerror = (error) => {
        console.error('WebSocket error:', error)
      }
      
      setWs(websocket)
    } catch (error) {
      console.error('WebSocket connection failed:', error)
    }
  }

  const createItem = async () => {
    const name = prompt('Enter item name:')
    if (!name) return
    
    try {
      const token = await getToken()
      const response = await fetch('/api/v1/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name })
      })
      
      if (response.ok) {
        fetchItems()
      }
    } catch (error) {
      console.error('Failed to create item:', error)
    }
  }

  const createBlogPost = async () => {
    if (!newPost.title || !newPost.slug || !newPost.content) {
      alert('Please fill all fields')
      return
    }
    
    try {
      const token = await getToken()
      const response = await fetch('/api/v1/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newPost)
      })
      
      if (response.ok) {
        setNewPost({ title: '', slug: '', content: '' })
        fetchBlogPosts()
      }
    } catch (error) {
      console.error('Failed to create blog post:', error)
    }
  }

  const sendMessage = () => {
    if (!newMessage.trim() || !ws) return
    
    ws.send(JSON.stringify({
      type: 'message',
      content: newMessage
    }))
    
    setNewMessage('')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <UserButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('data')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="inline-block w-4 h-4 mr-2" />
              D1 Database
            </button>
            <button
              onClick={() => setActiveTab('blog')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'blog'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="inline-block w-4 h-4 mr-2" />
              SEO Blog
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <MessageSquare className="inline-block w-4 h-4 mr-2" />
              Live Chat
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'data' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">D1 Database Items</h2>
                <button
                  onClick={createItem}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Item
                </button>
              </div>
              {loading ? (
                <p className="text-gray-500">Loading...</p>
              ) : items.length === 0 ? (
                <p className="text-gray-500">No items yet. Create one!</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <li key={item.id} className="py-3">
                      <div className="flex justify-between">
                        <span className="text-gray-900">{item.name}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === 'blog' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">SEO Blog (KV Store)</h2>
              
              {/* Create new post form */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-3">Create New Post</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="Slug (url-friendly)"
                    value={newPost.slug}
                    onChange={(e) => setNewPost({...newPost, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <textarea
                    placeholder="Content (Markdown supported)"
                    value={newPost.content}
                    onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md h-32"
                  />
                  <button
                    onClick={createBlogPost}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Publish Post
                  </button>
                </div>
              </div>

              {/* Blog posts list */}
              {blogPosts.length === 0 ? (
                <p className="text-gray-500">No blog posts yet. Create one for SEO!</p>
              ) : (
                <div className="space-y-4">
                  {blogPosts.map((post) => (
                    <div key={post.slug} className="border rounded-lg p-4">
                      <h3 className="font-semibold text-lg">
                        <Link href={`/blog/${post.slug}`} className="text-blue-600 hover:text-blue-800">
                          {post.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-500">/{post.slug}</p>
                      <p className="text-gray-600 mt-2 line-clamp-2">{post.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">AI Chat Assistant (Persistent)</h2>
              
              <div className="border rounded-lg h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.length === 0 ? (
                    <p className="text-gray-500 text-center">Loading chat history...</p>
                  ) : (
                    messages.map((msg, idx) => (
                      <div 
                        key={msg.id || idx} 
                        className={`rounded-lg p-3 ${msg.type === 'agent' ? 'bg-blue-50' : 'bg-gray-100'}`}
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {msg.userName} {msg.type === 'agent' && '🤖'}
                        </p>
                        <p className="text-gray-700">{msg.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
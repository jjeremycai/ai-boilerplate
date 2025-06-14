import React from 'react'
import { useAuth } from '@clerk/clerk-react'

// Use relative URL in production, absolute in development
const API_URL = import.meta.env.PROD 
  ? '' // Same origin in production
  : (import.meta.env.VITE_API_URL || 'http://localhost:8787')

export class ApiError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

export class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}/api/v1${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(
        data.code || 'UNKNOWN_ERROR',
        data.error || 'An error occurred',
        response.status
      )
    }

    return data.data
  }

  // User endpoints
  async getCurrentUser() {
    return this.request<any>('/users/me')
  }

  async updateUser(data: { firstName?: string; lastName?: string }) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getUserStats() {
    return this.request<any>('/users/me/stats')
  }

  // Project endpoints
  async listProjects() {
    return this.request<any[]>('/projects')
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}`)
  }

  async createProject(data: { name: string; description?: string; color?: string }) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: any) {
    return this.request<any>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    })
  }

  async getProjectStats(id: string) {
    return this.request<any>(`/projects/${id}/stats`)
  }

  // Task endpoints
  async listTasks(filters?: { projectId?: string; status?: string; priority?: string }) {
    const params = new URLSearchParams()
    if (filters?.projectId) params.append('projectId', filters.projectId)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    
    const query = params.toString() ? `?${params.toString()}` : ''
    return this.request<any[]>(`/tasks${query}`)
  }

  async getTask(id: string) {
    return this.request<any>(`/tasks/${id}`)
  }

  async createTask(data: any) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(id: string, data: any) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTask(id: string) {
    return this.request<any>(`/tasks/${id}`, {
      method: 'DELETE',
    })
  }

  async bulkUpdateTasks(taskIds: string[], updates: any) {
    return this.request<any>('/tasks/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ taskIds, updates }),
    })
  }

  // Chat endpoints
  async listChatRooms() {
    return this.request<any[]>('/chat/rooms')
  }

  async createChatRoom(data: { name: string; description?: string }) {
    return this.request<any>('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getChatWebSocketConfig(roomId: string) {
    return this.request<any>(`/chat/rooms/${roomId}/websocket`)
  }

  async getChatMessages(roomId: string) {
    return this.request<any[]>(`/chat/rooms/${roomId}/messages`)
  }

  async getChatUsers(roomId: string) {
    return this.request<any[]>(`/chat/rooms/${roomId}/users`)
  }

  // Blog endpoints
  async listBlogPosts() {
    return this.request<any[]>('/blog')
  }

  async getBlogPost(slug: string) {
    return this.request<any>(`/blog/${slug}`)
  }

  async getBlogPostsByTag(tag: string) {
    return this.request<any[]>(`/blog/tag/${tag}`)
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Hook to use API client with automatic token management
export function useApiClient() {
  const { getToken } = useAuth()
  
  React.useEffect(() => {
    const updateToken = async () => {
      const token = await getToken()
      apiClient.setToken(token)
    }
    
    updateToken()
  }, [getToken])
  
  return apiClient
}
import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { 
  Project, 
  Task, 
  ChatRoom, 
  ChatWebSocketConfig,
  CreateProjectInput,
  UpdateProjectInput,
  CreateTaskInput,
  UpdateTaskInput
} from '@shared/types';

// Use environment variable for API URL
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://your-worker.workers.dev';

export class ApiError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}/api/v1${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.code || 'UNKNOWN_ERROR',
        data.error || 'An error occurred',
        response.status
      );
    }

    return data.data;
  }

  // Project endpoints
  async listProjects() {
    return this.request<Project[]>('/projects');
  }

  async getProject(id: string) {
    return this.request<Project>(`/projects/${id}`);
  }

  async createProject(data: CreateProjectInput) {
    return this.request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectInput) {
    return this.request<Project>(`/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Task endpoints
  async listTasks(filters?: { projectId?: string; status?: string; priority?: string }) {
    const params = new URLSearchParams();
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Task[]>(`/tasks${query}`);
  }

  async createTask(data: CreateTaskInput) {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTask(id: string, data: UpdateTaskInput) {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Chat endpoints
  async listChatRooms() {
    return this.request<ChatRoom[]>('/chat/rooms');
  }

  async createChatRoom(data: { name: string; description?: string }) {
    return this.request<ChatRoom>('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Hook to use API client with automatic token management
export function useApiClient() {
  const { getToken } = useAuth();
  
  React.useEffect(() => {
    const updateToken = async () => {
      const token = await getToken();
      apiClient.setToken(token);
    };
    
    updateToken();
  }, [getToken]);
  
  return apiClient;
}
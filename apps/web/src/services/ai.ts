import { apiClient } from './api'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  response: {
    response: string
  }
  metadata: {
    model: string
    timestamp: string
    userId: string
  }
}

export interface AgentResponse {
  result: any
  usage?: any
  metadata: {
    model: string
    timestamp: string
    userId: string
  }
}

export interface GenerationResponse {
  response: {
    response: string
  }
  metadata: {
    model: string
    max_tokens: number
    temperature: number
    timestamp: string
    userId: string
  }
}

export interface ImageResponse {
  image: any
  metadata: {
    model: string
    prompt: string
    timestamp: string
    userId: string
  }
}

export interface ModelsResponse {
  models: {
    text: string[]
    chat: string[]
    image: string[]
    embedding: string[]
  }
}

export const aiService = {
  // Chat completion using conversational models
  async chat(messages: ChatMessage[], options?: {
    model?: string
    stream?: boolean
  }): Promise<ChatCompletionResponse> {
    return apiClient.request('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages,
        model: options?.model || '@cf/meta/llama-3.1-8b-instruct',
        stream: options?.stream || false
      })
    })
  },

  // Agent SDK for complex workflows
  async runAgent(prompt: string, options?: {
    context?: Record<string, any>
    tools?: any[]
  }): Promise<AgentResponse> {
    return apiClient.request('/ai/agent', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        context: options?.context || {},
        tools: options?.tools || []
      })
    })
  },

  // Simple text generation
  async generate(prompt: string, options?: {
    model?: string
    max_tokens?: number
    temperature?: number
    stream?: boolean
  }): Promise<GenerationResponse> {
    return apiClient.request('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model: options?.model || '@cf/meta/llama-3.1-8b-instruct',
        max_tokens: options?.max_tokens || 256,
        temperature: options?.temperature || 0.7,
        stream: options?.stream || false
      })
    })
  },

  // Image generation
  async generateImage(prompt: string, options?: {
    model?: string
  }): Promise<ImageResponse> {
    return apiClient.request('/ai/image', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        model: options?.model || '@cf/stabilityai/stable-diffusion-xl-base-1.0'
      })
    })
  },

  // Get available models
  async getModels(): Promise<ModelsResponse> {
    return apiClient.request('/ai/models')
  },

  // Health check
  async health() {
    return apiClient.request('/ai/health')
  }
}
import { OpenAI } from 'openai'

export class OpenRouterService {
  private client: OpenAI

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'T4 Boilerplate',
      },
    })
  }

  async createChatCompletion(params: {
    model?: string
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
    temperature?: number
    max_tokens?: number
    stream?: boolean
  }) {
    const { model = 'openai/gpt-4-turbo-preview', ...rest } = params

    return this.client.chat.completions.create({
      model,
      ...rest,
    })
  }

  async createCompletion(params: {
    model?: string
    prompt: string
    temperature?: number
    max_tokens?: number
  }) {
    const { model = 'openai/gpt-3.5-turbo-instruct', ...rest } = params

    return this.client.completions.create({
      model,
      ...rest,
    })
  }

  async listModels() {
    return this.client.models.list()
  }
}

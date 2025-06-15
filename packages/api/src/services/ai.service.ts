import { openai } from '@ai-sdk/openai'
import { generateText, streamText, generateObject } from 'ai'
import { object, string, number, array } from 'valibot'

export class AIService {
  private apiKey: string
  private model: string

  constructor(apiKey: string, model: string = 'gpt-4-turbo') {
    this.apiKey = apiKey
    this.model = model
  }

  // Get the OpenAI provider with API key
  private getProvider() {
    return openai({
      apiKey: this.apiKey,
    })
  }

  // Generate text completion
  async generateText(params: {
    prompt: string
    system?: string
    temperature?: number
    maxTokens?: number
  }) {
    const { prompt, system, temperature = 0.7, maxTokens = 1000 } = params

    const result = await generateText({
      model: this.getProvider()(this.model),
      system,
      prompt,
      temperature,
      maxTokens,
    })

    return {
      text: result.text,
      usage: result.usage,
      finishReason: result.finishReason,
    }
  }

  // Stream text completion
  async streamText(params: {
    prompt: string
    system?: string
    temperature?: number
    maxTokens?: number
  }) {
    const { prompt, system, temperature = 0.7, maxTokens = 1000 } = params

    const result = await streamText({
      model: this.getProvider()(this.model),
      system,
      prompt,
      temperature,
      maxTokens,
    })

    return result.toTextStreamResponse()
  }

  // Generate structured output
  async generateObject<T>(params: {
    prompt: string
    system?: string
    schema: any // Valibot schema
    temperature?: number
  }) {
    const { prompt, system, schema, temperature = 0.7 } = params

    const result = await generateObject({
      model: this.getProvider()(this.model),
      system,
      prompt,
      schema,
      temperature,
    })

    return result.object as T
  }

  // Chat completion with message history
  async chat(params: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
    temperature?: number
    maxTokens?: number
  }) {
    const { messages, temperature = 0.7, maxTokens = 1000 } = params

    const result = await generateText({
      model: this.getProvider()(this.model),
      messages,
      temperature,
      maxTokens,
    })

    return {
      message: result.text,
      usage: result.usage,
    }
  }

  // Example: Generate a summary
  async summarize(text: string, maxLength: number = 200) {
    return this.generateText({
      system: 'You are a helpful assistant that creates concise summaries.',
      prompt: `Summarize the following text in ${maxLength} characters or less:\n\n${text}`,
      temperature: 0.5,
    })
  }

  // Example: Extract structured data
  async extractData(text: string) {
    const schema = object({
      title: string(),
      category: string(),
      sentiment: string(),
      score: number(),
      keywords: array(string()),
    })

    return this.generateObject({
      system: 'Extract structured data from the given text.',
      prompt: text,
      schema,
      temperature: 0.3,
    })
  }
}

// Factory function for different AI providers
export function createAIService(provider: 'openai' | 'anthropic' | 'google', apiKey: string) {
  // For now, we only support OpenAI, but this can be extended
  // AI SDK supports multiple providers with the same interface
  switch (provider) {
    case 'openai':
      return new AIService(apiKey)
    default:
      throw new Error(`Provider ${provider} not supported yet`)
  }
}
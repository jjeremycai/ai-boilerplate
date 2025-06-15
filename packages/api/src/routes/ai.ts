import { protectedProcedure, publicProcedure, router } from '../trpc'
import * as v from 'valibot'

export const aiRouter = router({
  // Chat completion endpoint
  chat: protectedProcedure
    .input(
      v.object({
        messages: v.array(
          v.object({
            role: v.picklist(['system', 'user', 'assistant']),
            content: v.string(),
          })
        ),
        temperature: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
        maxTokens: v.optional(v.pipe(v.number(), v.minValue(1))),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.ai.chat({
        messages: input.messages,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      })

      return {
        content: result.message,
        usage: result.usage,
      }
    }),

  // Generate text completion
  generateText: protectedProcedure
    .input(
      v.object({
        prompt: v.string(),
        system: v.optional(v.string()),
        temperature: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
        maxTokens: v.optional(v.pipe(v.number(), v.minValue(1))),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.ai.generateText({
        prompt: input.prompt,
        system: input.system,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      })

      return result
    }),

  // Stream text completion
  streamText: protectedProcedure
    .input(
      v.object({
        prompt: v.string(),
        system: v.optional(v.string()),
        temperature: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
        maxTokens: v.optional(v.pipe(v.number(), v.minValue(1))),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Note: Streaming requires special handling in tRPC
      // This returns a Response object that can be streamed
      const stream = await ctx.ai.streamText({
        prompt: input.prompt,
        system: input.system,
        temperature: input.temperature,
        maxTokens: input.maxTokens,
      })

      return stream
    }),

  // Summarize text
  summarize: protectedProcedure
    .input(
      v.object({
        text: v.string(),
        maxLength: v.optional(v.pipe(v.number(), v.minValue(10), v.maxValue(1000))),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.ai.summarize(input.text, input.maxLength)
      return result
    }),

  // Extract structured data
  extractData: protectedProcedure
    .input(
      v.object({
        text: v.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.ai.extractData(input.text)
      return result
    }),

  // Generate structured output with custom schema
  generateStructured: protectedProcedure
    .input(
      v.object({
        prompt: v.string(),
        system: v.optional(v.string()),
        // Schema is passed as a string and parsed on the server
        schemaType: v.picklist(['product', 'user', 'event', 'custom']),
        temperature: v.optional(v.pipe(v.number(), v.minValue(0), v.maxValue(2))),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Define schemas based on type
      const schemas = {
        product: v.object({
          name: v.string(),
          description: v.string(),
          price: v.number(),
          category: v.string(),
          inStock: v.boolean(),
        }),
        user: v.object({
          name: v.string(),
          email: v.string(),
          role: v.string(),
          isActive: v.boolean(),
        }),
        event: v.object({
          title: v.string(),
          date: v.string(),
          location: v.string(),
          attendees: v.number(),
        }),
        custom: v.object({
          data: v.any(),
        }),
      }

      const schema = schemas[input.schemaType]

      const result = await ctx.ai.generateObject({
        prompt: input.prompt,
        system: input.system,
        schema,
        temperature: input.temperature,
      })

      return result
    }),
})
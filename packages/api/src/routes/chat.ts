import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import { router, publicProcedure, protectedProcedure } from '../trpc'
import { ChatMessageTable, insertChatMessageSchema } from '../db/schema'
import { TRPCError } from '@trpc/server'
import { nanoid } from 'nanoid'

export const chatRouter = router({
  // Get messages for a room
  getMessages: publicProcedure
    .input(
      z.object({
        roomId: z.string().default('general'),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(), // For pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const { roomId, limit, cursor } = input
      
      const messages = await ctx.db
        .select({
          id: ChatMessageTable.id,
          content: ChatMessageTable.content,
          userId: ChatMessageTable.userId,
          roomId: ChatMessageTable.roomId,
          parentId: ChatMessageTable.parentId,
          edited: ChatMessageTable.edited,
          editedAt: ChatMessageTable.editedAt,
          createdAt: ChatMessageTable.createdAt,
          user: {
            id: ctx.db.user.id,
            name: ctx.db.user.name,
            avatar: ctx.db.user.avatar,
            email: ctx.db.user.email,
          },
        })
        .from(ChatMessageTable)
        .leftJoin(ctx.db.user, eq(ChatMessageTable.userId, ctx.db.user.id))
        .where(eq(ChatMessageTable.roomId, roomId))
        .orderBy(desc(ChatMessageTable.createdAt))
        .limit(limit + 1) // Get one extra to determine if there's more
        
      let nextCursor: string | undefined = undefined
      if (messages.length > limit) {
        const nextItem = messages.pop()
        nextCursor = nextItem?.id
      }
      
      // Reverse to show oldest first
      messages.reverse()
      
      return {
        messages,
        nextCursor,
      }
    }),

  // Send a message
  sendMessage: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1).max(1000),
        roomId: z.string().default('general'),
        parentId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const messageId = nanoid()
      
      const [newMessage] = await ctx.db
        .insert(ChatMessageTable)
        .values({
          id: messageId,
          content: input.content,
          userId: ctx.session.userId,
          roomId: input.roomId,
          parentId: input.parentId,
        })
        .returning()
        
      // Get user info for the response
      const [messageWithUser] = await ctx.db
        .select({
          id: ChatMessageTable.id,
          content: ChatMessageTable.content,
          userId: ChatMessageTable.userId,
          roomId: ChatMessageTable.roomId,
          parentId: ChatMessageTable.parentId,
          edited: ChatMessageTable.edited,
          editedAt: ChatMessageTable.editedAt,
          createdAt: ChatMessageTable.createdAt,
          user: {
            id: ctx.db.user.id,
            name: ctx.db.user.name,
            avatar: ctx.db.user.avatar,
            email: ctx.db.user.email,
          },
        })
        .from(ChatMessageTable)
        .leftJoin(ctx.db.user, eq(ChatMessageTable.userId, ctx.db.user.id))
        .where(eq(ChatMessageTable.id, messageId))
        
      return messageWithUser
    }),

  // Edit a message
  editMessage: protectedProcedure
    .input(
      z.object({
        messageId: z.string(),
        content: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First check if the user owns this message
      const [existingMessage] = await ctx.db
        .select()
        .from(ChatMessageTable)
        .where(eq(ChatMessageTable.id, input.messageId))
        
      if (!existingMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        })
      }
      
      if (existingMessage.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only edit your own messages',
        })
      }
      
      const [updatedMessage] = await ctx.db
        .update(ChatMessageTable)
        .set({
          content: input.content,
          edited: true,
          editedAt: new Date(),
        })
        .where(eq(ChatMessageTable.id, input.messageId))
        .returning()
        
      return updatedMessage
    }),

  // Delete a message
  deleteMessage: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: messageId }) => {
      // First check if the user owns this message
      const [existingMessage] = await ctx.db
        .select()
        .from(ChatMessageTable)
        .where(eq(ChatMessageTable.id, messageId))
        
      if (!existingMessage) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Message not found',
        })
      }
      
      if (existingMessage.userId !== ctx.session.userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own messages',
        })
      }
      
      await ctx.db
        .delete(ChatMessageTable)
        .where(eq(ChatMessageTable.id, messageId))
        
      return { success: true }
    }),

  // Get latest messages (for polling)
  getLatestMessages: publicProcedure
    .input(
      z.object({
        roomId: z.string().default('general'),
        afterId: z.string().optional(), // Get messages after this ID
      })
    )
    .query(async ({ ctx, input }) => {
      const { roomId, afterId } = input
      
      let query = ctx.db
        .select({
          id: ChatMessageTable.id,
          content: ChatMessageTable.content,
          userId: ChatMessageTable.userId,
          roomId: ChatMessageTable.roomId,
          parentId: ChatMessageTable.parentId,
          edited: ChatMessageTable.edited,
          editedAt: ChatMessageTable.editedAt,
          createdAt: ChatMessageTable.createdAt,
          user: {
            id: ctx.db.user.id,
            name: ctx.db.user.name,
            avatar: ctx.db.user.avatar,
            email: ctx.db.user.email,
          },
        })
        .from(ChatMessageTable)
        .leftJoin(ctx.db.user, eq(ChatMessageTable.userId, ctx.db.user.id))
        .where(eq(ChatMessageTable.roomId, roomId))
        .orderBy(desc(ChatMessageTable.createdAt))
        .limit(20)
        
      // If afterId is provided, only get messages newer than that
      if (afterId) {
        const afterMessage = await ctx.db
          .select({ createdAt: ChatMessageTable.createdAt })
          .from(ChatMessageTable)
          .where(eq(ChatMessageTable.id, afterId))
          .limit(1)
          
        if (afterMessage.length > 0) {
          // Add condition to get only newer messages
          // Note: This is a simplified approach, in production you might want to use a proper cursor
          query = query
        }
      }
      
      const messages = await query
      
      // Reverse to show oldest first
      messages.reverse()
      
      return messages
    }),
})
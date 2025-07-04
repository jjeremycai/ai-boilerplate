import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-valibot'

// Better Auth Tables
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  name: text("name"),
  avatar: text("avatar"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: integer("expiresAt", { mode: "timestamp" }),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
})

// Export Better Auth user types
export type User = InferSelectModel<typeof user>
export type InsertUser = InferInsertModel<typeof user>
export const insertUserSchema = createInsertSchema(user)
export const selectUserSchema = createSelectSchema(user)

// Project - Sharded by project ID
export const ProjectTable = sqliteTable('Project', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('ownerId').notNull(),
  status: text('status', { enum: ['active', 'archived', 'deleted'] })
    .notNull()
    .default('active'),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Project = InferSelectModel<typeof ProjectTable>
export type InsertProject = InferInsertModel<typeof ProjectTable>
export const insertProjectSchema = createInsertSchema(ProjectTable)
export const selectProjectSchema = createSelectSchema(ProjectTable)

// Task - Sharded with project
export const TaskTable = sqliteTable('Task', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  projectId: text('projectId').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  assigneeId: text('assigneeId'),
  status: text('status', { enum: ['todo', 'in_progress', 'done', 'cancelled'] })
    .notNull()
    .default('todo'),
  priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] })
    .notNull()
    .default('medium'),
  dueDate: integer('dueDate', { mode: 'timestamp' }),
  completedAt: integer('completedAt', { mode: 'timestamp' }),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Task = InferSelectModel<typeof TaskTable>
export type InsertTask = InferInsertModel<typeof TaskTable>
export const insertTaskSchema = createInsertSchema(TaskTable)
export const selectTaskSchema = createSelectSchema(TaskTable)

// Comment - Sharded with task/project
export const CommentTable = sqliteTable('Comment', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  taskId: text('taskId').notNull(),
  projectId: text('projectId').notNull(),
  authorId: text('authorId').notNull(),
  content: text('content').notNull(),
  attachments: text('attachments', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type Comment = InferSelectModel<typeof CommentTable>
export type InsertComment = InferInsertModel<typeof CommentTable>
export const insertCommentSchema = createInsertSchema(CommentTable)
export const selectCommentSchema = createSelectSchema(CommentTable)

// Activity Log - Sharded with project
export const ActivityLogTable = sqliteTable('ActivityLog', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  projectId: text('projectId').notNull(),
  userId: text('userId').notNull(),
  action: text('action').notNull(),
  entityType: text('entityType').notNull(),
  entityId: text('entityId').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ActivityLog = InferSelectModel<typeof ActivityLogTable>
export type InsertActivityLog = InferInsertModel<typeof ActivityLogTable>
export const insertActivityLogSchema = createInsertSchema(ActivityLogTable)
export const selectActivityLogSchema = createSelectSchema(ActivityLogTable)

// File - Sharded with project
export const FileTable = sqliteTable('File', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  projectId: text('projectId').notNull(),
  name: text('name').notNull(),
  mimeType: text('mimeType').notNull(),
  size: integer('size').notNull(),
  url: text('url').notNull(),
  uploadedBy: text('uploadedBy').notNull(),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type File = InferSelectModel<typeof FileTable>
export type InsertFile = InferInsertModel<typeof FileTable>
export const insertFileSchema = createInsertSchema(FileTable)
export const selectFileSchema = createSelectSchema(FileTable)

// API Usage - Sharded by date/user
export const ApiUsageTable = sqliteTable('ApiUsage', {
  id: text('id').primaryKey(), // Uses universal ID with shard info
  userId: text('userId').notNull(),
  endpoint: text('endpoint').notNull(),
  model: text('model'),
  promptTokens: integer('promptTokens').notNull().default(0),
  completionTokens: integer('completionTokens').notNull().default(0),
  totalTokens: integer('totalTokens').notNull().default(0),
  cost: real('cost').notNull().default(0),
  metadata: text('metadata', { mode: 'json' }).$type<Record<string, any>>(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ApiUsage = InferSelectModel<typeof ApiUsageTable>
export type InsertApiUsage = InferInsertModel<typeof ApiUsageTable>
export const insertApiUsageSchema = createInsertSchema(ApiUsageTable)
export const selectApiUsageSchema = createSelectSchema(ApiUsageTable)

// Cross-shard reference tracking table (in primary DB)
export const ShardReferenceTable = sqliteTable('ShardReference', {
  id: text('id').primaryKey(),
  sourceShardId: text('sourceShardId').notNull(),
  sourceTable: text('sourceTable').notNull(),
  sourceId: text('sourceId').notNull(),
  targetShardId: text('targetShardId').notNull(),
  targetTable: text('targetTable').notNull(),
  targetId: text('targetId').notNull(),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ShardReference = InferSelectModel<typeof ShardReferenceTable>
export type InsertShardReference = InferInsertModel<typeof ShardReferenceTable>

// Shard metadata table (in primary DB)
export const ShardMetadataTable = sqliteTable('ShardMetadata', {
  id: text('id').primaryKey(),
  bindingName: text('bindingName').notNull().unique(),
  currentSize: integer('currentSize').notNull().default(0),
  maxSize: integer('maxSize').notNull(),
  recordCount: integer('recordCount').notNull().default(0),
  isActive: integer('isActive', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updatedAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ShardMetadata = InferSelectModel<typeof ShardMetadataTable>
export type InsertShardMetadata = InferInsertModel<typeof ShardMetadataTable>

// Chat Messages - Not sharded, stored in primary DB for simplicity
export const ChatMessageTable = sqliteTable('ChatMessage', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  userId: text('userId').notNull().references(() => user.id),
  roomId: text('roomId').notNull().default('general'), // For future room/channel support
  parentId: text('parentId'), // For threaded messages
  edited: integer('edited', { mode: 'boolean' }).notNull().default(false),
  editedAt: integer('editedAt', { mode: 'timestamp' }),
  createdAt: integer('createdAt', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
})

export type ChatMessage = InferSelectModel<typeof ChatMessageTable>
export type InsertChatMessage = InferInsertModel<typeof ChatMessageTable>
export const insertChatMessageSchema = createInsertSchema(ChatMessageTable)
export const selectChatMessageSchema = createSelectSchema(ChatMessageTable)

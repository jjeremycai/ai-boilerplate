// User types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
  stripeCustomerId?: string
  subscriptionTier: 'free' | 'pro' | 'team' | 'enterprise'
  subscriptionStatus: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
  createdAt: string
  updatedAt: string
}

// Project types
export interface Project {
  id: string
  userId: string
  organizationId?: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'completed'
  color: string
  createdAt: string
  updatedAt: string
  taskCount?: number
}

export interface CreateProjectInput {
  name: string
  description?: string
  color?: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  status?: 'active' | 'archived' | 'completed'
  color?: string
}

// Task types
export interface Task {
  id: string
  projectId: string
  userId: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
  project?: Project
  tags?: Tag[]
}

export interface CreateTaskInput {
  projectId: string
  title: string
  description?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  tagIds?: string[]
}

export interface UpdateTaskInput {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'done' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: string
  tagIds?: string[]
}

// Tag types
export interface Tag {
  id: string
  userId: string
  name: string
  color: string
  createdAt: string
}

export interface CreateTagInput {
  name: string
  color?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  error?: never
}

export interface ApiError {
  error: string
  code: string
  data?: never
}

export type ApiResult<T> = ApiResponse<T> | ApiError

// Pagination
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Chat types
export interface ChatRoom {
  id: string
  name: string
  description?: string
  createdBy: string
  createdAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'message' | 'system' | 'typing'
}

export interface ChatUser {
  id: string
  name: string
  joinedAt: string
  isTyping?: boolean
}

export interface ChatWebSocketConfig {
  url: string
  sessionToken: string
  roomId: string
}

// Blog types
export interface BlogPost {
  slug: string
  title: string
  content: string
  excerpt: string
  author: string
  publishedAt: string
  updatedAt?: string
  tags?: string[]
  metadata?: {
    views?: number
    readTime?: string
    featured?: boolean
  }
}

// Organization types
export interface Organization {
  id: string
  name: string
  slug: string
  ownerId: string
  createdAt: string
  updatedAt: string
}

export interface OrganizationMember {
  organizationId: string
  userId: string
  role: 'owner' | 'admin' | 'member'
  joinedAt: string
  user?: User
}

export interface CreateOrganizationInput {
  name: string
  slug: string
}

// Billing types
export interface SubscriptionPlan {
  id: string
  name: string
  slug: string
  stripePriceId?: string
  priceMonthly: number
  priceYearly?: number
  features: string[]
  limits: {
    projects: number
    members: number
    storage_gb: number
    api_calls_per_month?: number
    [key: string]: number | undefined
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId?: string
  organizationId?: string
  planId: string
  stripeSubscriptionId?: string
  stripeCustomerId?: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused'
  currentPeriodStart?: string
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  trialEnd?: string
  createdAt: string
  updatedAt: string
  plan?: SubscriptionPlan
}

export interface PaymentMethod {
  id: string
  userId?: string
  organizationId?: string
  stripePaymentMethodId: string
  type: string
  last4?: string
  brand?: string
  expMonth?: number
  expYear?: number
  isDefault: boolean
  createdAt: string
}

export interface Invoice {
  id: string
  subscriptionId: string
  stripeInvoiceId?: string
  amountPaid: number
  amountDue: number
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  invoicePdf?: string
  hostedInvoiceUrl?: string
  periodStart?: string
  periodEnd?: string
  createdAt: string
}

export interface UsageRecord {
  id: string
  subscriptionId: string
  metricName: string
  quantity: number
  timestamp: string
}

// Stripe checkout types
export interface CreateCheckoutSessionInput {
  priceId: string
  successUrl: string
  cancelUrl: string
  customerId?: string
  metadata?: Record<string, string>
}

export interface CreatePortalSessionInput {
  customerId: string
  returnUrl: string
}

export interface WebhookEvent {
  id: string
  type: string
  data: {
    object: any
  }
}
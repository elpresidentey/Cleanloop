import { z } from 'zod'

// User types
export type UserRole = 'resident' | 'collector' | 'admin'

export interface UserLocation {
  area: string
  street: string
  houseNumber: string
  coordinates?: [number, number]
}

export interface User {
  id: string
  email: string | undefined
  phone: string
  name: string
  role: UserRole
  location: UserLocation
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

// User validation schemas
export const UserRoleSchema = z.enum(['resident', 'collector', 'admin'])

export const UserLocationSchema = z.object({
  area: z.string().min(1, 'Area is required'),
  street: z.string().min(1, 'Street is required'),
  houseNumber: z.string().min(1, 'House number is required'),
  coordinates: z.tuple([z.number(), z.number()]).optional()
})

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: UserRoleSchema,
  location: UserLocationSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  isActive: z.boolean()
})

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().regex(/^(\+234|0)[789]\d{9}$/, 'Invalid Nigerian phone number format'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: UserRoleSchema,
  location: UserLocationSchema
})

// Subscription types
export type SubscriptionPlanType = 'weekly' | 'bi-weekly' | 'on-demand'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface SubscriptionPricing {
  amount: number
  currency: string
  billingCycle: string
}

export interface Subscription {
  id: string
  userId: string
  planType: SubscriptionPlanType
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  pricing: SubscriptionPricing
  createdAt: Date
  updatedAt: Date
}

// Subscription validation schemas
export const SubscriptionPlanTypeSchema = z.enum(['weekly', 'bi-weekly', 'on-demand'])
export const SubscriptionStatusSchema = z.enum(['active', 'paused', 'cancelled'])

export const SubscriptionPricingSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., NGN)'),
  billingCycle: z.string().min(1, 'Billing cycle is required')
})

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  planType: SubscriptionPlanTypeSchema,
  status: SubscriptionStatusSchema,
  startDate: z.date(),
  endDate: z.date().optional(),
  pricing: SubscriptionPricingSchema,
  createdAt: z.date(),
  updatedAt: z.date()
})

export const CreateSubscriptionSchema = z.object({
  userId: z.string().uuid(),
  planType: SubscriptionPlanTypeSchema,
  pricing: SubscriptionPricingSchema,
  startDate: z.date().default(() => new Date())
})

// Pickup Request types
export type PickupStatus = 'requested' | 'scheduled' | 'picked_up' | 'missed'

export interface PickupRequest {
  id: string
  userId: string
  collectorId?: string
  scheduledDate: Date
  status: PickupStatus
  notes?: string
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
  location: UserLocation
}

// Pickup Request validation schemas
export const PickupStatusSchema = z.enum(['requested', 'scheduled', 'picked_up', 'missed'])

export const PickupRequestSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  collectorId: z.string().uuid().optional(),
  scheduledDate: z.date().refine(date => date > new Date(), 'Scheduled date must be in the future'),
  status: PickupStatusSchema,
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  completedAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  location: UserLocationSchema
})

export const CreatePickupRequestSchema = z.object({
  userId: z.string().uuid(),
  scheduledDate: z.date().refine(date => date > new Date(), 'Scheduled date must be in the future'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional(),
  location: UserLocationSchema
})

export const UpdatePickupStatusSchema = z.object({
  status: PickupStatusSchema,
  collectorId: z.string().uuid().optional(),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters').optional()
})

// Payment types
export type PaymentMethod = 'cash' | 'transfer' | 'card'
export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface Payment {
  id: string
  userId: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  reference: string
  status: PaymentStatus
  createdAt: Date
  metadata?: Record<string, string | number | boolean>
}

// Payment validation schemas
export const PaymentMethodSchema = z.enum(['cash', 'transfer', 'card'])
export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed'])

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., NGN)'),
  paymentMethod: PaymentMethodSchema,
  reference: z.string().min(1, 'Payment reference is required'),
  status: PaymentStatusSchema,
  createdAt: z.date(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

export const CreatePaymentSchema = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., NGN)').default('NGN'),
  paymentMethod: PaymentMethodSchema,
  reference: z.string().min(1, 'Payment reference is required'),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

export const UpdatePaymentSchema = z.object({
  amount: z.number().positive('Amount must be positive').optional(),
  currency: z.string().length(3, 'Currency must be 3 characters (e.g., NGN)').optional(),
  paymentMethod: PaymentMethodSchema.optional(),
  reference: z.string().min(1, 'Payment reference is required').optional(),
  status: PaymentStatusSchema.optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

// Complaint types
export type ComplaintStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type ComplaintPriority = 'low' | 'medium' | 'high'

export interface Complaint {
  id: string
  userId: string
  pickupId: string
  description: string
  photoUrl?: string
  status: ComplaintStatus
  priority: ComplaintPriority
  createdAt: Date
  resolvedAt?: Date
  adminNotes?: string
}

// Complaint validation schemas
export const ComplaintStatusSchema = z.enum(['open', 'in_progress', 'resolved', 'closed'])
export const ComplaintPrioritySchema = z.enum(['low', 'medium', 'high'])

export const ComplaintSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  pickupId: z.string().uuid(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
  photoUrl: z.string().url('Invalid photo URL').optional(),
  status: ComplaintStatusSchema,
  priority: ComplaintPrioritySchema,
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
  adminNotes: z.string().max(500, 'Admin notes cannot exceed 500 characters').optional()
})

export const CreateComplaintSchema = z.object({
  userId: z.string().uuid(),
  pickupId: z.string().uuid(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description cannot exceed 1000 characters'),
  photoUrl: z.string().url('Invalid photo URL').optional(),
  priority: ComplaintPrioritySchema.default('medium')
})

export const UpdateComplaintSchema = z.object({
  status: ComplaintStatusSchema.optional(),
  priority: ComplaintPrioritySchema.optional(),
  adminNotes: z.string().max(500, 'Admin notes cannot exceed 500 characters').optional()
})

// Additional utility types for API responses and forms
export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>
export type CreatePickupRequestInput = z.infer<typeof CreatePickupRequestSchema>
export type UpdatePickupStatusInput = z.infer<typeof UpdatePickupStatusSchema>
export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>
export type UpdatePaymentInput = z.infer<typeof UpdatePaymentSchema>
export type CreateComplaintInput = z.infer<typeof CreateComplaintSchema>
export type UpdateComplaintInput = z.infer<typeof UpdateComplaintSchema>

// Audit Log types
export type AuditAction = 
  | 'user_created' | 'user_updated' | 'user_deleted' | 'user_suspended' | 'user_activated'
  | 'subscription_created' | 'subscription_updated' | 'subscription_cancelled'
  | 'pickup_created' | 'pickup_updated' | 'pickup_completed' | 'pickup_missed'
  | 'payment_created' | 'payment_updated' | 'payment_completed'
  | 'complaint_created' | 'complaint_updated' | 'complaint_resolved'
  | 'login_success' | 'login_failed' | 'logout'
  | 'password_changed' | 'password_reset_requested' | 'password_reset_completed'
  | 'admin_action' | 'data_export' | 'system_config_changed'

export type AuditEntityType = 
  | 'user' | 'subscription' | 'pickup_request' | 'payment' | 'complaint' | 'system'

export interface AuditLog {
  id: string
  userId: string
  action: AuditAction
  entityType: AuditEntityType
  entityId?: string
  oldData?: Record<string, any>
  newData?: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Audit Log validation schemas
export const AuditActionSchema = z.enum([
  'user_created', 'user_updated', 'user_deleted', 'user_suspended', 'user_activated',
  'subscription_created', 'subscription_updated', 'subscription_cancelled',
  'pickup_created', 'pickup_updated', 'pickup_completed', 'pickup_missed',
  'payment_created', 'payment_updated', 'payment_completed',
  'complaint_created', 'complaint_updated', 'complaint_resolved',
  'login_success', 'login_failed', 'logout',
  'password_changed', 'password_reset_requested', 'password_reset_completed',
  'admin_action', 'data_export', 'system_config_changed'
])

export const AuditEntityTypeSchema = z.enum([
  'user', 'subscription', 'pickup_request', 'payment', 'complaint', 'system'
])

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  action: AuditActionSchema,
  entityType: AuditEntityTypeSchema,
  entityId: z.string().uuid().optional(),
  oldData: z.record(z.string(), z.any()).optional(),
  newData: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/).optional(),
  userAgent: z.string().optional(),
  timestamp: z.date(),
  metadata: z.record(z.string(), z.any()).optional()
})

export const CreateAuditLogSchema = z.object({
  userId: z.string().uuid(),
  action: AuditActionSchema,
  entityType: AuditEntityTypeSchema,
  entityId: z.string().uuid().optional(),
  oldData: z.record(z.string(), z.any()).optional(),
  newData: z.record(z.string(), z.any()).optional(),
  ipAddress: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/).optional(),
  userAgent: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

export type CreateAuditLogInput = z.infer<typeof CreateAuditLogSchema>

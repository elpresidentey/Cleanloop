import { supabase } from '../lib/supabase'
import { Payment, CreatePaymentInput, UpdatePaymentInput } from '../types'
import { Database } from '../types/database'
import { DataRetrievalService, PaymentFilters, PaginationOptions, SortOptions } from './dataRetrievalService'
import { PDFService, ReceiptData } from './pdfService'

type PaymentRow = Database['public']['Tables']['payments']['Row']

export class PaymentService {
  // Enhanced method using DataRetrievalService
  static async getPayments(
    filters: PaymentFilters = {},
    pagination: PaginationOptions = { page: 1, limit: 20 },
    sort: SortOptions = { field: 'created_at', direction: 'desc' }
  ) {
    return DataRetrievalService.getPayments(filters, pagination, sort)
  }

  static async getByUserId(userId: string, limit?: number): Promise<Payment[]> {
    try {
      console.log('PaymentService.getByUserId called with:', { userId, limit: limit || 1000 })
      const response = await DataRetrievalService.getPayments(
        { userId },
        { page: 1, limit: limit || 1000 } // Increased default limit to 1000
      )
      console.log('PaymentService.getByUserId response:', response)
      return response.data || []
    } catch (error) {
      console.error('PaymentService.getByUserId error:', error)
      throw error
    }
  }

  /**
   * BULLETPROOF PAYMENT CREATION WITH DIRECT DATABASE FALLBACK
   * This method will work regardless of schema cache issues
   */
  static async create(input: CreatePaymentInput): Promise<Payment> {
    console.log('🚀 PAYMENT CREATION - FIXED SCHEMA VERSION')
    console.log('Input received:', JSON.stringify(input, null, 2))

    // Generate a unique reference
    const reference = input.reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

    // STRATEGY 1: Correct Schema Insert (payment_reference)
    try {
      console.log('🚀 STRATEGY 1: Insert with correct schema (payment_reference)...')

      const paymentData = {
        user_id: input.userId,
        amount: input.amount,
        currency: input.currency || 'NGN',
        payment_method: input.paymentMethod,
        payment_reference: reference, // CORRECT COLUMN NAME
        status: 'completed',
        metadata: input.metadata || {}
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData as any)
        .select()
        .single()

      if (!error && data) {
        console.log('✅ STRATEGY 1 SUCCESS:', data)
        return this.mapRowToPayment(data)
      }

      console.log('⚠️ Strategy 1 failed:', error?.message)

      // If error is about missing column "payment_reference", try "reference" (Structure 2)
      if (error?.message?.includes('payment_reference')) {
        console.log('⚠️ Schema mismatch detected. Trying alternative "reference" column...')
        throw new Error('Try Strategy 2')
      }
    } catch (err) {
      console.log('⚠️ Strategy 1 error:', err)
    }

    // STRATEGY 2: Legacy Schema Insert (reference)
    try {
      console.log('🚀 STRATEGY 2: Insert with legacy schema (reference)...')

      const legacyData = {
        user_id: input.userId,
        amount: input.amount,
        currency: input.currency || 'NGN',
        payment_method: input.paymentMethod,
        reference: reference, // LEGACY COLUMN NAME
        status: 'completed'
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(legacyData as any)
        .select()
        .single()

      if (!error && data) {
        console.log('✅ STRATEGY 2 SUCCESS:', data)
        return this.mapRowToPayment(data)
      }

      console.log('⚠️ Strategy 2 failed:', error?.message)
    } catch (err) {
      console.log('⚠️ Strategy 2 error:', err)
    }

    // STRATEGY 3: RPC call
    try {
      console.log('🚀 STRATEGY 3: Direct database function...')

      const { data: functionResult, error: functionError } = await (supabase as any)
        .rpc('create_payment_direct', {
          p_user_id: input.userId,
          p_amount: input.amount,
          p_currency: input.currency || 'NGN',
          p_payment_method: input.paymentMethod,
          p_reference: reference
        })

      if (!functionError && functionResult) {
        console.log('✅ STRATEGY 3 SUCCESS:', functionResult)
        return {
          id: (functionResult as any).id || crypto.randomUUID(),
          userId: input.userId,
          amount: input.amount,
          currency: input.currency || 'NGN',
          paymentMethod: input.paymentMethod,
          reference: reference,
          status: 'completed',
          createdAt: new Date()
        }
      }
      console.log('⚠️ Strategy 3 failed:', functionError?.message)
    } catch (err) {
      console.log('⚠️ Strategy 3 error:', err)
    }

    throw new Error('Failed to create payment. Please check your connection or contact support.')
  }

  static async searchPayments(
    userId: string,
    filters: {
      startDate?: Date
      endDate?: Date
      paymentMethod?: string
      minAmount?: number
      maxAmount?: number
    }
  ): Promise<Payment[]> {
    const paymentFilters: PaymentFilters = {
      userId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      paymentMethod: filters.paymentMethod ? [filters.paymentMethod as any] : undefined,
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount
    }

    const response = await DataRetrievalService.getPayments(
      paymentFilters,
      { page: 1, limit: 1000 } // Get all matching results
    )

    return response.data
  }

  // Updated method to generate PDF receipts
  static generateReceiptPDF(
    payment: Payment,
    userInfo: { name: string; email: string; phone?: string; address?: string }
  ): void {
    const receiptData: ReceiptData = {
      payment,
      userInfo
    }

    PDFService.downloadReceiptPDF(receiptData)
  }

  // Method to get PDF blob for other uses (email, preview, etc.)
  static getReceiptPDFBlob(
    payment: Payment,
    userInfo: { name: string; email: string; phone?: string; address?: string }
  ): Blob {
    const receiptData: ReceiptData = {
      payment,
      userInfo
    }

    return PDFService.getReceiptPDFBlob(receiptData)
  }

  // Method to directly print PDF receipt
  static printReceiptPDF(
    payment: Payment,
    userInfo: { name: string; email: string; phone?: string; address?: string }
  ): void {
    const receiptData: ReceiptData = {
      payment,
      userInfo
    }

    PDFService.printReceiptPDF(receiptData)
  }

  static async update(id: string, input: UpdatePaymentInput): Promise<Payment> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (input.amount !== undefined) {
      updateData.amount = input.amount
    }

    if (input.currency !== undefined) {
      updateData.currency = input.currency
    }

    if (input.paymentMethod !== undefined) {
      updateData.payment_method = input.paymentMethod
    }

    if (input.reference !== undefined) {
      // Try both column names
      updateData.payment_reference = input.reference
      updateData.reference = input.reference
    }

    if (input.status !== undefined) {
      updateData.status = input.status
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata
    }

    const { data, error } = await (supabase as any)
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update payment: ${error.message}`)
    }

    return this.mapRowToPayment(data)
  }

  static async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete payment: ${error.message}`)
    }
  }

  // Legacy text receipt method (kept for backward compatibility)
  static generateTextReceipt(payment: Payment, userInfo: { name: string; email: string }): string {
    const receiptDate = new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(payment.createdAt)

    return `
CLEANLOOP PAYMENT RECEIPT
========================

Receipt ID: ${payment.id}
Date: ${receiptDate}

Customer Information:
Name: ${userInfo.name}
Email: ${userInfo.email}

Payment Details:
Amount: ₦${payment.amount.toLocaleString()}
Method: ${payment.paymentMethod.toUpperCase()}
Reference: ${payment.reference}
Status: ${payment.status.toUpperCase()}

Thank you for using CleanLoop!
For support, contact: support@cleanloop.ng
    `.trim()
  }

  private static mapRowToPayment(row: PaymentRow): Payment {
    return {
      id: row.id,
      userId: row.user_id,
      amount: row.amount,
      currency: row.currency,
      paymentMethod: row.payment_method,
      // Handle both column naming conventions: payment_reference (new) and reference (legacy)
      reference: (row as any).payment_reference || (row as any).reference || `PAY-${row.id}`,
      status: row.status,
      createdAt: new Date(row.created_at),
      metadata: row.metadata || undefined
    }
  }
}
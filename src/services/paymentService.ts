import { supabase } from '../lib/supabase'
import { Payment, CreatePaymentInput } from '../types'
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
    const response = await DataRetrievalService.getPayments(
      { userId },
      { page: 1, limit: limit || 20 }
    )
    return response.data
  }

  /**
   * BULLETPROOF PAYMENT CREATION WITH DIRECT DATABASE FALLBACK
   * This method will work regardless of schema cache issues
   */
  static async create(input: CreatePaymentInput): Promise<Payment> {
    console.log('🚀 BULLETPROOF PAYMENT CREATION WITH FALLBACK')
    console.log('Input received:', JSON.stringify(input, null, 2))

    // Generate a unique reference if not provided
    const reference = input.reference || `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    
    console.log('🛡️ SAFE VALUES:', { reference, amount: input.amount, currency: input.currency || 'NGN' })
    
    // STRATEGY 1: Try minimal insert
    try {
      console.log('🚀 STRATEGY 1: Minimal payment insert...')
      
      const minimalData: any = {
        user_id: input.userId,
        amount: input.amount,
        currency: input.currency || 'NGN',
        payment_method: input.paymentMethod,
        reference: reference,
        status: 'completed'
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(minimalData)
        .select()
        .single()

      if (!error && data) {
        console.log('✅ STRATEGY 1 SUCCESS:', data)
        return this.mapRowToPayment(data)
      }
      
      console.log('⚠️ Strategy 1 failed:', error?.message)
    } catch (err) {
      console.log('⚠️ Strategy 1 error:', err)
    }

    // STRATEGY 2: Try with explicit typing
    try {
      console.log('🚀 STRATEGY 2: Explicit typed insert...')
      
      const typedData = {
        user_id: input.userId,
        amount: Number(input.amount),
        currency: String(input.currency || 'NGN'),
        payment_method: String(input.paymentMethod),
        reference: String(reference),
        status: 'completed' as const
      }

      const { data, error } = await supabase
        .from('payments')
        .insert(typedData as any)
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

    // STRATEGY 3: Use direct database function (bypasses PostgREST entirely)
    try {
      console.log('🚀 STRATEGY 3: Direct database function (schema cache bypass)...')
      
      const { data: functionResult, error: functionError } = await (supabase as any)
        .rpc('create_payment_direct', {
          p_user_id: input.userId,
          p_amount: input.amount,
          p_currency: input.currency || 'NGN',
          p_payment_method: input.paymentMethod,
          p_reference: reference
        })

      if (!functionError && functionResult && (functionResult as any)?.success) {
        console.log('✅ STRATEGY 3 SUCCESS (Direct DB):', functionResult)
        
        // Fetch the created record to return proper format
        if ((functionResult as any).id) {
          const { data: createdRecord } = await supabase
            .from('payments')
            .select('*')
            .eq('id', (functionResult as any).id)
            .single()
          
          if (createdRecord) {
            return this.mapRowToPayment(createdRecord)
          }
        }
        
        // Fallback: create a basic payment object
        return {
          id: (functionResult as any).id || crypto.randomUUID(),
          userId: input.userId,
          amount: input.amount,
          currency: input.currency || 'NGN',
          paymentMethod: input.paymentMethod,
          reference: (functionResult as any).reference || reference,
          status: 'completed',
          createdAt: new Date()
        }
      }
      
      console.log('⚠️ Strategy 3 failed:', functionError?.message || ((functionResult as any)?.error || 'Unknown error'))
    } catch (err) {
      console.log('⚠️ Strategy 3 error:', err)
    }

    // ALL STRATEGIES FAILED
    console.error('💥 ALL PAYMENT STRATEGIES FAILED')
    throw new Error('Unable to log payment. All methods failed. Please contact support.')
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
      reference: row.reference || `PAY-${row.id}`, // Fallback reference
      status: row.status,
      createdAt: new Date(row.created_at),
      metadata: row.metadata || undefined
    }
  }
}
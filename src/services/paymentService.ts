import { supabase } from '../lib/supabase'
import { Payment, CreatePaymentInput } from '../types'
import { Database } from '../types/database'
import { DataRetrievalService, PaymentFilters, PaginationOptions, SortOptions } from './dataRetrievalService'
import { PDFService, ReceiptData } from './pdfService'

type PaymentRow = Database['public']['Tables']['payments']['Row']
type PaymentInsert = Database['public']['Tables']['payments']['Insert']

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

  static async create(input: CreatePaymentInput): Promise<Payment> {
    try {
      // Generate a unique reference if not provided
      const reference = input.reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      
      // Try the standard approach first
      const { data, error } = await supabase
        .from('payments')
        .insert({
          user_id: input.userId,
          amount: input.amount,
          currency: input.currency || 'NGN',
          payment_method: input.paymentMethod,
          reference: reference,
          status: 'completed'
        })
        .select()
        .single()

      if (error) {
        console.error('Payment creation error:', error)
        
        // If it's a schema cache issue, provide helpful guidance
        if (error.message.includes('schema cache')) {
          throw new Error(`Database schema cache issue detected. Please try one of these solutions:
          
1. Use the SQL method: Go to Supabase Dashboard → SQL Editor → Run DIRECT_PAYMENT_INSERT.sql
2. Wait a few minutes for the cache to refresh automatically
3. Use the PDF test buttons instead (they work without database data)

The app functionality is working - this is just a temporary database connection issue.`)
        }
        
        throw new Error(`Failed to create payment record: ${error.message}`)
      }

      return this.mapRowToPayment(data)
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error(`Failed to create payment record: ${String(error)}`)
    }
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
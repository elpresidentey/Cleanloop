import React from 'react'
import { PDFService } from '../../services/pdfService'
import { Payment } from '../../types'

export const PDFReceiptDemo: React.FC = () => {
  const generateSampleReceipt = () => {
    // Sample payment data for demonstration
    const samplePayment: Payment = {
      id: 'demo-receipt-001',
      userId: 'demo-user',
      amount: 5000,
      currency: 'NGN',
      paymentMethod: 'transfer',
      reference: 'DEMO-REF-12345',
      status: 'completed',
      createdAt: new Date(),
      metadata: {
        notes: 'Weekly waste collection service payment - Demo receipt'
      }
    }

    const sampleUserInfo = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+234 801 234 5678',
      address: 'Victoria Island, Ahmadu Bello Way 123'
    }

    // Generate and download the PDF
    PDFService.downloadReceiptPDF({
      payment: samplePayment,
      userInfo: sampleUserInfo
    })
  }

  const previewSampleReceipt = () => {
    // Sample payment data for demonstration
    const samplePayment: Payment = {
      id: 'demo-receipt-001',
      userId: 'demo-user',
      amount: 5000,
      currency: 'NGN',
      paymentMethod: 'transfer',
      reference: 'DEMO-REF-12345',
      status: 'completed',
      createdAt: new Date(),
      metadata: {
        notes: 'Weekly waste collection service payment - Demo receipt'
      }
    }

    const sampleUserInfo = {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+234 801 234 5678',
      address: 'Victoria Island, Ahmadu Bello Way 123'
    }

    // Generate PDF blob and open in new tab for preview
    const blob = PDFService.getReceiptPDFBlob({
      payment: samplePayment,
      userInfo: sampleUserInfo
    })

    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    
    // Clean up the URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          PDF Receipt Demo
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Test the new PDF receipt generation functionality with sample data.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={previewSampleReceipt}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Sample Receipt
          </button>
          
          <button
            onClick={generateSampleReceipt}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Sample Receipt
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-500">
            <strong>Note:</strong> This demo uses sample data. Real receipts will use your actual payment information.
          </p>
        </div>
      </div>
    </div>
  )
}
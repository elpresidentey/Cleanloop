import React, { useState, useEffect, useRef } from 'react'
import { Payment } from '../../types'
import { PaymentService } from '../../services/paymentService'
import { useAuth } from '../../hooks/useAuth'

interface ReceiptPreviewModalProps {
  payment: Payment | null
  isOpen: boolean
  onClose: () => void
}

export const ReceiptPreviewModal: React.FC<ReceiptPreviewModalProps> = ({
  payment,
  isOpen,
  onClose
}) => {
  const { profile } = useAuth()
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const pdfUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (isOpen && payment && profile) {
      setLoading(true)
      setPdfUrl(null) // Reset previous URL
      
      // Use setTimeout to ensure this runs asynchronously and doesn't block
      const generatePreview = async () => {
        try {
          const blob = PaymentService.getReceiptPDFBlob(payment, {
            name: profile.name || 'Unknown User',
            email: profile.email || 'no-email@example.com',
            phone: profile.phone || '',
            address: profile.location 
              ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() 
              : ''
          })
          
          // Clean up previous URL if it exists
          if (pdfUrlRef.current) {
            URL.revokeObjectURL(pdfUrlRef.current)
          }
          
          const url = URL.createObjectURL(blob)
          pdfUrlRef.current = url
          setPdfUrl(url)
          setLoading(false)
        } catch (error) {
          console.error('Failed to generate receipt preview:', error)
          setLoading(false)
          setPdfUrl(null)
        }
      }
      
      generatePreview()
    } else {
      // Clean up when modal closes
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
        setPdfUrl(null)
      }
    }

    return () => {
      // Cleanup on unmount or when dependencies change
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }
    }
  }, [isOpen, payment, profile])

  if (!isOpen || !payment) return null

  const handleDownload = () => {
    if (!profile) return
    PaymentService.generateReceiptPDF(payment, {
      name: profile.name || 'Unknown User',
      email: profile.email || 'no-email@example.com',
      phone: profile.phone || '',
      address: profile.location 
        ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() 
        : ''
    })
  }

  const handlePrint = () => {
    if (!profile) return
    PaymentService.printReceiptPDF(payment, {
      name: profile.name || 'Unknown User',
      email: profile.email || 'no-email@example.com',
      phone: profile.phone || '',
      address: profile.location 
        ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() 
        : ''
    })
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 max-w-4xl w-full">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Receipt Preview</h3>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* PDF Preview */}
          <div className="p-6 bg-gray-100">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Generating receipt...</p>
                </div>
              </div>
            ) : pdfUrl ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-0"
                  title="Receipt Preview"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-600">Failed to load receipt preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Reference:</span> {payment.reference}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


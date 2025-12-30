import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PaymentService } from '../../services/paymentService'
import { Payment } from '../../types'
import { PaymentLoggingForm } from './PaymentLoggingForm'

export const PaymentHistory: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [showLoggingForm, setShowLoggingForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter states
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: '',
    searchTerm: ''
  })

  useEffect(() => {
    if (!profile) return

    const loadPayments = async () => {
      try {
        setLoading(true)
        const userPayments = await PaymentService.getByUserId(profile.id)
        setPayments(userPayments)
        setFilteredPayments(userPayments)
      } catch (error) {
        console.error('Failed to load payments:', error)
        setError(error instanceof Error ? error.message : 'Failed to load payment history')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [profile])

  useEffect(() => {
    // Apply filters
    let filtered = [...payments]

    if (filters.startDate) {
      const startDate = new Date(filters.startDate)
      filtered = filtered.filter(payment => payment.createdAt >= startDate)
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999) // End of day
      filtered = filtered.filter(payment => payment.createdAt <= endDate)
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filters.paymentMethod)
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(payment => 
        payment.reference.toLowerCase().includes(searchLower) ||
        payment.paymentMethod.toLowerCase().includes(searchLower) ||
        (payment.metadata?.notes && 
         typeof payment.metadata.notes === 'string' && 
         payment.metadata.notes.toLowerCase().includes(searchLower))
      )
    }

    setFilteredPayments(filtered)
  }, [payments, filters])

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      paymentMethod: '',
      searchTerm: ''
    })
  }

  const handleLoggingSuccess = async () => {
    setShowLoggingForm(false)
    
    // Reload payments
    if (profile) {
      try {
        const userPayments = await PaymentService.getByUserId(profile.id)
        setPayments(userPayments)
      } catch (error) {
        console.error('Failed to reload payments:', error)
      }
    }
  }

  const downloadReceipt = (payment: Payment) => {
    if (!profile) return

    try {
      // Generate and download PDF receipt
      PaymentService.generateReceiptPDF(payment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })
    } catch (error) {
      console.error('Failed to download receipt:', error)
      alert('Failed to generate PDF download. Please try again.')
    }
  }

  const previewReceipt = (payment: Payment) => {
    if (!profile) return

    try {
      // Generate PDF blob and open in new tab for preview
      const blob = PaymentService.getReceiptPDFBlob(payment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to preview receipt:', error)
      alert('Failed to generate PDF preview. Please try again.')
    }
  }

  // Test function to generate a sample receipt
  const generateTestReceipt = () => {
    if (!profile) return

    try {
      // Create sample payment data for testing
      const testPayment: Payment = {
        id: 'test-receipt-' + Date.now(),
        userId: profile.id,
        amount: 5000,
        currency: 'NGN',
        paymentMethod: 'transfer',
        reference: 'TEST-REF-' + Date.now(),
        status: 'completed',
        createdAt: new Date(),
        metadata: {
          notes: 'Test payment for PDF receipt generation'
        }
      }

      // Generate and download PDF receipt
      PaymentService.generateReceiptPDF(testPayment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })
    } catch (error) {
      console.error('Failed to generate test receipt:', error)
      alert('Failed to generate test PDF download. Please try again.')
    }
  }

  const printTestReceipt = () => {
    if (!profile) return

    try {
      // Create sample payment data for testing
      const testPayment: Payment = {
        id: 'test-receipt-' + Date.now(),
        userId: profile.id,
        amount: 5000,
        currency: 'NGN',
        paymentMethod: 'transfer',
        reference: 'TEST-REF-' + Date.now(),
        status: 'completed',
        createdAt: new Date(),
        metadata: {
          notes: 'Test payment for PDF receipt generation'
        }
      }

      // Print PDF receipt
      PaymentService.printReceiptPDF(testPayment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })
    } catch (error) {
      console.error('Failed to print test receipt:', error)
      alert('Failed to generate test PDF for printing. Please try again.')
    }
  }

  const printReceipt = (payment: Payment) => {
    if (!profile) return

    try {
      // Print PDF receipt
      PaymentService.printReceiptPDF(payment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })
    } catch (error) {
      console.error('Failed to print receipt:', error)
      alert('Failed to generate PDF for printing. Please try again.')
    }
  }

  const previewTestReceipt = () => {
    if (!profile) return

    try {
      // Create sample payment data for testing
      const testPayment: Payment = {
        id: 'test-preview-' + Date.now(),
        userId: profile.id,
        amount: 5000,
        currency: 'NGN',
        paymentMethod: 'transfer',
        reference: 'TEST-PREVIEW-' + Date.now(),
        status: 'completed',
        createdAt: new Date(),
        metadata: {
          notes: 'Test payment for PDF receipt preview'
        }
      }

      // Generate PDF blob and open in new tab for preview
      const blob = PaymentService.getReceiptPDFBlob(testPayment, {
        name: profile.name || 'Unknown User',
        email: profile.email || 'no-email@example.com',
        phone: profile.phone || '',
        address: profile.location ? `${profile.location.area || ''}, ${profile.location.street || ''} ${profile.location.houseNumber || ''}`.trim() : ''
      })

      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Failed to preview test receipt:', error)
      alert('Failed to generate test PDF preview. Please try again.')
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getTotalAmount = () => {
    return filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please log in to view payment history</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment history...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage your payment records
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={previewTestReceipt}
                  className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md shadow-sm text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Test Preview
                </button>
                <button
                  onClick={printTestReceipt}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md shadow-sm text-purple-700 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Test Print
                </button>
                <button
                  onClick={generateTestReceipt}
                  className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md shadow-sm text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Test Download
                </button>
                <button
                  onClick={() => setShowLoggingForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Log Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLoggingForm && (
          <div className="mb-8">
            <PaymentLoggingForm
              onSuccess={handleLoggingSuccess}
              onCancel={() => setShowLoggingForm(false)}
            />
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Filter Payments
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700">
                  Search
                </label>
                <input
                  type="text"
                  id="searchTerm"
                  name="searchTerm"
                  value={filters.searchTerm}
                  onChange={handleFilterChange}
                  placeholder="Reference, method, notes..."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                  From Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                  To Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  Payment Method
                </label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={filters.paymentMethod}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="card">Card Payment</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {filteredPayments.length}
                </div>
                <div className="text-sm text-gray-500">Total Payments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  ₦{getTotalAmount().toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  ₦{filteredPayments.length > 0 ? Math.round(getTotalAmount() / filteredPayments.length).toLocaleString() : '0'}
                </div>
                <div className="text-sm text-gray-500">Average Payment</div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Payment Records ({filteredPayments.length})
            </h3>
            
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {payments.length === 0 
                    ? 'Get started by logging your first payment or test the PDF receipt functionality.'
                    : 'Try adjusting your filters to see more results.'
                  }
                </p>
                {payments.length === 0 && (
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={previewTestReceipt}
                        className="inline-flex items-center px-4 py-2 border border-blue-300 shadow-sm text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Test PDF Preview
                      </button>
                      <button
                        onClick={generateTestReceipt}
                        className="inline-flex items-center px-4 py-2 border border-green-300 shadow-sm text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Test PDF Download
                      </button>
                    </div>
                    <button
                      onClick={() => setShowLoggingForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Log Payment
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ₦{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {payment.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payment.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => previewReceipt(payment)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-900 font-medium transition-colors"
                              title="Preview PDF"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Preview
                            </button>
                            <button
                              onClick={() => downloadReceipt(payment)}
                              className="inline-flex items-center text-green-600 hover:text-green-900 font-medium transition-colors"
                              title="Download PDF"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </button>
                            <button
                              onClick={() => printReceipt(payment)}
                              className="inline-flex items-center text-purple-600 hover:text-purple-900 font-medium transition-colors"
                              title="Print PDF"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
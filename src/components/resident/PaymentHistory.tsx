import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PaymentService } from '../../services/paymentService'
import { Payment } from '../../types'
import { PaymentLoggingForm } from './PaymentLoggingForm'
import { ReceiptPreviewModal } from './ReceiptPreviewModal'

export const PaymentHistory: React.FC = () => {
  const { profile } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [showLoggingForm, setShowLoggingForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null)
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null)
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
    if (!profile) {
      setLoading(false)
      return
    }

    const loadPayments = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log('Loading payments for user:', profile.id)
        
        // Increase limit to get all payments
        const userPayments = await PaymentService.getByUserId(profile.id, 1000)
        console.log('Payments loaded:', userPayments.length, userPayments)
        
        setPayments(userPayments)
        setFilteredPayments(userPayments)
        
        if (userPayments.length === 0) {
          console.log('No payments found for user')
        }
      } catch (error) {
        console.error('Failed to load payments:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load payment history'
        setError(errorMessage)
        // Set empty arrays on error so UI still renders
        setPayments([])
        setFilteredPayments([])
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
    setEditingPayment(null)
    
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

  const handleEditClick = (payment: Payment) => {
    setEditingPayment(payment)
    setShowLoggingForm(true)
  }

  const handleDeleteClick = (payment: Payment) => {
    setDeletingPayment(payment)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingPayment) return

    try {
      await PaymentService.delete(deletingPayment.id)
      setDeletingPayment(null)
      
      // Reload payments
      if (profile) {
        const userPayments = await PaymentService.getByUserId(profile.id)
        setPayments(userPayments)
      }
    } catch (error) {
      console.error('Failed to delete payment:', error)
      alert('Failed to delete payment. Please try again.')
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
    setPreviewPayment(payment)
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
          <p className="mt-4 text-gray-600 font-medium">Loading payment history...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your payments</p>
        </div>
      </div>
    )
  }

  // Debug info (only in development)
  const showDebug = import.meta.env.MODE === 'development'

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
          <div className="mb-6 bg-red-50 border-2 border-red-300 rounded-lg p-6 shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-bold text-red-800">Error Loading Payment History</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="font-medium">{error}</p>
                  <p className="mt-2 text-xs text-red-600">Please check your browser console for more details.</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      if (profile) {
                        const loadPayments = async () => {
                          try {
                            setLoading(true)
                            setError(null)
                            const userPayments = await PaymentService.getByUserId(profile.id, 1000)
                            setPayments(userPayments)
                            setFilteredPayments(userPayments)
                          } catch (error) {
                            console.error('Failed to reload payments:', error)
                            setError(error instanceof Error ? error.message : 'Failed to load payment history')
                          } finally {
                            setLoading(false)
                          }
                        }
                        loadPayments()
                      }
                    }}
                    className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry Loading
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showLoggingForm && (
          <div className="mb-8">
            <PaymentLoggingForm
              onSuccess={handleLoggingSuccess}
              onCancel={() => {
                setShowLoggingForm(false)
                setEditingPayment(null)
              }}
              initialData={editingPayment}
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

        {/* Debug Info - Development Only */}
        {showDebug && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs">
            <h4 className="font-bold text-yellow-800 mb-2">Debug Info:</h4>
            <div className="grid grid-cols-2 gap-2 text-yellow-700">
              <div>Profile ID: {profile?.id || 'None'}</div>
              <div>Loading: {loading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Total Payments: {payments.length}</div>
              <div>Filtered Payments: {filteredPayments.length}</div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-6 bg-white shadow-lg rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-700">
                  {filteredPayments.length}
                </div>
                <div className="text-sm font-medium text-green-600 mt-1">Total Payments</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-700">
                  ₦{getTotalAmount().toLocaleString()}
                </div>
                <div className="text-sm font-medium text-blue-600 mt-1">Total Amount</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <div className="text-3xl font-bold text-purple-700">
                  ₦{filteredPayments.length > 0 ? Math.round(getTotalAmount() / filteredPayments.length).toLocaleString() : '0'}
                </div>
                <div className="text-sm font-medium text-purple-600 mt-1">Average Payment</div>
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
              <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-bold text-gray-900">No payments found</h3>
                <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                  {payments.length === 0 
                    ? 'You haven\'t logged any payments yet. Get started by logging your first payment or test the PDF receipt functionality.'
                    : 'No payments match your current filters. Try adjusting your search criteria to see more results.'
                  }
                </p>
                {!error && (
                  <div className="mt-6 text-xs text-gray-500">
                    <p>Total payments in database: {payments.length}</p>
                    <p>Filtered results: {filteredPayments.length}</p>
                  </div>
                )}
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
              <div className="overflow-x-auto shadow-sm">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200">
                  <thead className="bg-gradient-to-r from-green-600 to-emerald-600">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-green-700">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-green-700">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-green-700">
                        Method
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-green-700">
                        Reference
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider border-r border-green-700">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment, index) => (
                      <tr 
                        key={payment.id} 
                        className={`hover:bg-green-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-r border-gray-200">
                          {formatDate(payment.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-700 border-r border-gray-200">
                          ₦{payment.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize border-r border-gray-200">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium">
                            {payment.paymentMethod.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono border-r border-gray-200">
                          {payment.reference}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap border-r border-gray-200">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize shadow-sm ${
                            payment.status === 'completed' 
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => previewReceipt(payment)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition-colors shadow-sm"
                              title="Preview PDF"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Preview
                            </button>
                            <button
                              onClick={() => downloadReceipt(payment)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md border border-green-200 transition-colors shadow-sm"
                              title="Download PDF"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </button>
                            <button
                              onClick={() => printReceipt(payment)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors shadow-sm"
                              title="Print PDF"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                            <button
                              onClick={() => handleEditClick(payment)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md border border-yellow-200 transition-colors shadow-sm"
                              title="Edit Payment"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClick(payment)}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors shadow-sm"
                              title="Delete Payment"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
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

      {/* Delete Confirmation Modal */}
      {deletingPayment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-5">
                Delete Payment
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this payment? This action cannot be undone.
                </p>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  Amount: ₦{deletingPayment.amount.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Reference: {deletingPayment.reference}
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={() => setDeletingPayment(null)}
                  className="mt-3 px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        payment={previewPayment}
        isOpen={!!previewPayment}
        onClose={() => setPreviewPayment(null)}
      />
    </div>
  )
}
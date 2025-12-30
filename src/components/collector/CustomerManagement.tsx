import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { CustomerService, CustomerWithDetails } from '../../services/customerService'
import { Payment } from '../../types'

interface CustomerManagementData {
  customers: CustomerWithDetails[]
  loading: boolean
  error: string | null
}

interface CustomerDetailModalProps {
  customer: CustomerWithDetails
  onClose: () => void
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, onClose }) => {
  const [paymentHistory, setPaymentHistory] = useState<Payment[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)

  useEffect(() => {
    const loadPaymentHistory = async () => {
      try {
        const payments = await CustomerService.getCustomerPaymentHistory(customer.id, 10)
        setPaymentHistory(payments)
      } catch (error) {
        console.error('Failed to load payment history:', error)
      } finally {
        setLoadingPayments(false)
      }
    }

    loadPaymentHistory()
  }, [customer.id])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Customer Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {customer.location.street} {customer.location.houseNumber}<br />
                    {customer.location.area}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Subscription</h4>
              {customer.subscription ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plan Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">
                      {customer.subscription.planType.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ml-2 ${
                      customer.subscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : customer.subscription.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.subscription.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Amount</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(customer.subscription.pricing.amount)} / {customer.subscription.pricing.billingCycle}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(customer.subscription.startDate)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No active subscription</p>
              )}
            </div>

            {/* Service Statistics */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-md font-medium text-gray-900 mb-3">Service Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Pickups</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{customer.pickupCount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Payments</label>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(customer.totalPayments)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Pickup</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {customer.lastPickupDate ? formatDate(customer.lastPickupDate) : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Payment</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {customer.lastPaymentDate ? formatDate(customer.lastPaymentDate) : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Recent Payment History</h4>
            <div className="bg-white border border-gray-200 rounded-lg">
              {loadingPayments ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading payments...</p>
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="text-sm text-gray-500">No payment history available</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(payment.amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.createdAt)} • {payment.paymentMethod}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CustomerManagement: React.FC = () => {
  const { profile } = useAuth()
  const [data, setData] = useState<CustomerManagementData>({
    customers: [],
    loading: true,
    error: null
  })
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithDetails | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithDetails[]>([])

  useEffect(() => {
    if (!profile || profile.role !== 'collector') return

    const loadCustomers = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        const customers = await CustomerService.getCollectorCustomers(profile.id)

        setData({
          customers,
          loading: false,
          error: null
        })
        setFilteredCustomers(customers)
      } catch (error) {
        console.error('Failed to load customers:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load customers'
        }))
      }
    }

    loadCustomers()
  }, [profile])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(data.customers)
    } else {
      const term = searchTerm.toLowerCase()
      const filtered = data.customers.filter(customer => 
        customer.name.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone.includes(term) ||
        customer.location.area.toLowerCase().includes(term) ||
        customer.location.street.toLowerCase().includes(term)
      )
      setFilteredCustomers(filtered)
    }
  }, [searchTerm, data.customers])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  if (!profile || profile.role !== 'collector') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">This page is only available to collectors.</p>
        </div>
      </div>
    )
  }

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customers...</p>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Customers</h3>
            <p className="mt-2 text-red-600">{data.error}</p>
          </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your assigned customers
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Customers
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by name, email, phone, or address..."
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Customers ({filteredCustomers.length})
            </h3>
            
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No customers found</h4>
                <p className="text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'You have no assigned customers yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{customer.name}</h4>
                        <p className="text-sm text-gray-500">{customer.phone}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {customer.location.area}
                        </p>
                      </div>
                      {customer.subscription && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          customer.subscription.status === 'active' 
                            ? 'bg-green-100 text-green-800'
                            : customer.subscription.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.subscription.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Pickups</p>
                        <p className="font-medium text-gray-900">{customer.pickupCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total Paid</p>
                        <p className="font-medium text-gray-900">{formatCurrency(customer.totalPayments)}</p>
                      </div>
                    </div>

                    {customer.lastPickupDate && (
                      <div className="mt-3">
                        <p className="text-xs text-gray-500">
                          Last pickup: {formatDate(customer.lastPickupDate)}
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="w-full inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  )
}
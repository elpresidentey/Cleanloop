import React, { useState } from 'react'
import { DataTable } from './DataTable'
import { SearchAndFilter } from './SearchAndFilter'
import { 
  usePickupRequests, 
  usePayments, 
  useComplaints, 
  useCustomerDetails,
  useGlobalSearch 
} from '../../hooks/useDataRetrieval'
import { 
  PickupRequestFilters, 
  PaymentFilters, 
  ComplaintFilters, 
  UserFilters 
} from '../../services/dataRetrievalService'
import { PickupRequest, Payment, Complaint } from '../../types'
import { useAuth } from '../../hooks/useAuth'

type DataType = 'pickups' | 'payments' | 'complaints' | 'customers'

export function DataRetrievalDemo() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<DataType>('pickups')
  const [searchTerm, setSearchTerm] = useState('')

  // Pickup requests state and filters
  const [pickupFilters, setPickupFilters] = useState<PickupRequestFilters>({})
  const pickupData = usePickupRequests(
    { ...pickupFilters, searchTerm: searchTerm || undefined },
    { autoFetch: activeTab === 'pickups' }
  )

  // Payments state and filters
  const [paymentFilters, setPaymentFilters] = useState<PaymentFilters>({})
  const paymentData = usePayments(
    { ...paymentFilters, searchTerm: searchTerm || undefined },
    { autoFetch: activeTab === 'payments' }
  )

  // Complaints state and filters
  const [complaintFilters, setComplaintFilters] = useState<ComplaintFilters>({})
  const complaintData = useComplaints(
    { ...complaintFilters, searchTerm: searchTerm || undefined },
    { autoFetch: activeTab === 'complaints' }
  )

  // Customer details (for collectors)
  const [customerFilters, setCustomerFilters] = useState<UserFilters>({})
  const customerData = useCustomerDetails(
    user?.role === 'collector' ? user.id : '',
    { ...customerFilters, searchTerm: searchTerm || undefined },
    { autoFetch: activeTab === 'customers' && user?.role === 'collector' }
  )

  // Global search
  const globalSearch = useGlobalSearch()

  const tabs = [
    { key: 'pickups' as const, label: 'Pickup Requests', count: pickupData.pagination?.total },
    { key: 'payments' as const, label: 'Payments', count: paymentData.pagination?.total },
    { key: 'complaints' as const, label: 'Complaints', count: complaintData.pagination?.total },
    ...(user?.role === 'collector' ? [
      { key: 'customers' as const, label: 'Customers', count: customerData.pagination?.total }
    ] : [])
  ]

  // Column definitions
  const pickupColumns = [
    { key: 'id', title: 'ID', width: '100px' },
    { key: 'scheduledDate', title: 'Scheduled Date', sortable: true },
    { key: 'status', title: 'Status', render: (status: string) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        status === 'picked_up' ? 'bg-green-100 text-green-800' :
        status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
        status === 'missed' ? 'bg-red-100 text-red-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { key: 'location.area', title: 'Area', sortable: true },
    { key: 'location.street', title: 'Street' },
    { key: 'notes', title: 'Notes', render: (notes: string) => notes || '-' },
    { key: 'createdAt', title: 'Created', sortable: true }
  ]

  const paymentColumns = [
    { key: 'id', title: 'ID', width: '100px' },
    { key: 'amount', title: 'Amount', render: (amount: number, record: Payment) => 
      `₦${amount.toLocaleString()} ${record.currency}`
    },
    { key: 'paymentMethod', title: 'Method', render: (method: string) => method.toUpperCase() },
    { key: 'reference', title: 'Reference' },
    { key: 'status', title: 'Status', render: (status: string) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        status === 'completed' ? 'bg-green-100 text-green-800' :
        status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {status.toUpperCase()}
      </span>
    )},
    { key: 'createdAt', title: 'Date', sortable: true }
  ]

  const complaintColumns = [
    { key: 'id', title: 'ID', width: '100px' },
    { key: 'description', title: 'Description', render: (desc: string) => 
      desc.length > 50 ? `${desc.substring(0, 50)}...` : desc
    },
    { key: 'status', title: 'Status', render: (status: string) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        status === 'resolved' ? 'bg-green-100 text-green-800' :
        status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
        status === 'closed' ? 'bg-gray-100 text-gray-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )},
    { key: 'priority', title: 'Priority', render: (priority: string) => (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        priority === 'high' ? 'bg-red-100 text-red-800' :
        priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
        'bg-green-100 text-green-800'
      }`}>
        {priority.toUpperCase()}
      </span>
    )},
    { key: 'createdAt', title: 'Created', sortable: true }
  ]

  const customerColumns = [
    { key: 'name', title: 'Name', sortable: true },
    { key: 'phone', title: 'Phone' },
    { key: 'location.area', title: 'Area' },
    { key: 'subscription.planType', title: 'Plan', render: (planType: string) => 
      planType ? planType.replace('_', ' ').toUpperCase() : 'No Plan'
    },
    { key: 'totalPayments', title: 'Total Payments', render: (amount: number) => 
      `₦${amount.toLocaleString()}`
    },
    { key: 'pickupCount', title: 'Pickups' },
    { key: 'completionRate', title: 'Completion Rate', render: (rate: number) => 
      `${rate.toFixed(1)}%`
    },
    { key: 'lastPickupDate', title: 'Last Pickup' }
  ]

  // Filter configurations
  const pickupFilterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect' as const,
      options: [
        { value: 'requested', label: 'Requested' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'picked_up', label: 'Picked Up' },
        { value: 'missed', label: 'Missed' }
      ]
    },
    {
      key: 'area',
      label: 'Area',
      type: 'select' as const,
      placeholder: 'All Areas'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const
    }
  ]

  const paymentFilterConfig = [
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      type: 'multiselect' as const,
      options: [
        { value: 'cash', label: 'Cash' },
        { value: 'transfer', label: 'Transfer' },
        { value: 'card', label: 'Card' }
      ]
    },
    {
      key: 'minAmount',
      label: 'Min Amount',
      type: 'number' as const,
      placeholder: 'Minimum amount'
    },
    {
      key: 'maxAmount',
      label: 'Max Amount',
      type: 'number' as const,
      placeholder: 'Maximum amount'
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const
    }
  ]

  const complaintFilterConfig = [
    {
      key: 'status',
      label: 'Status',
      type: 'multiselect' as const,
      options: [
        { value: 'open', label: 'Open' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'resolved', label: 'Resolved' },
        { value: 'closed', label: 'Closed' }
      ]
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'multiselect' as const,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as const
    }
  ]

  const customerFilterConfig = [
    {
      key: 'area',
      label: 'Area',
      type: 'select' as const,
      placeholder: 'All Areas'
    },
    {
      key: 'isActive',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
      ]
    }
  ]

  const getCurrentData = () => {
    switch (activeTab) {
      case 'pickups': return pickupData
      case 'payments': return paymentData
      case 'complaints': return complaintData
      case 'customers': return customerData
      default: return pickupData
    }
  }

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'pickups': return pickupColumns
      case 'payments': return paymentColumns
      case 'complaints': return complaintColumns
      case 'customers': return customerColumns
      default: return pickupColumns
    }
  }

  const getCurrentFilters = () => {
    switch (activeTab) {
      case 'pickups': return pickupFilters
      case 'payments': return paymentFilters
      case 'complaints': return complaintFilters
      case 'customers': return customerFilters
      default: return {}
    }
  }

  const getCurrentFilterConfig = () => {
    switch (activeTab) {
      case 'pickups': return pickupFilterConfig
      case 'payments': return paymentFilterConfig
      case 'complaints': return complaintFilterConfig
      case 'customers': return customerFilterConfig
      default: return []
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    switch (activeTab) {
      case 'pickups':
        setPickupFilters(prev => ({ ...prev, [key]: value }))
        break
      case 'payments':
        setPaymentFilters(prev => ({ ...prev, [key]: value }))
        break
      case 'complaints':
        setComplaintFilters(prev => ({ ...prev, [key]: value }))
        break
      case 'customers':
        setCustomerFilters(prev => ({ ...prev, [key]: value }))
        break
    }
  }

  const handleClearFilters = () => {
    switch (activeTab) {
      case 'pickups':
        setPickupFilters({})
        break
      case 'payments':
        setPaymentFilters({})
        break
      case 'complaints':
        setComplaintFilters({})
        break
      case 'customers':
        setCustomerFilters({})
        break
    }
  }

  const currentData = getCurrentData()

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Data Retrieval System</h2>
          <p className="mt-1 text-sm text-gray-500">
            Comprehensive data retrieval with pagination, filtering, and search functionality
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <SearchAndFilter
            searchPlaceholder={`Search ${activeTab}...`}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filters={getCurrentFilterConfig()}
            filterValues={getCurrentFilters()}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            className="mb-6"
          />

          {/* Data Table */}
          <DataTable
            data={currentData.data}
            columns={getCurrentColumns()}
            loading={currentData.loading}
            pagination={currentData.pagination}
            onPageChange={currentData.goToPage}
            onLimitChange={currentData.changeLimit}
            onSort={currentData.changeSort}
            currentSort={currentData.currentSort}
            emptyMessage={`No ${activeTab} found`}
          />

          {/* Error Display */}
          {currentData.error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{currentData.error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={currentData.refresh}
                      className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
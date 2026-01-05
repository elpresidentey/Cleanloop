import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PickupService } from '../../services/pickupService'
import { PickupRequest } from '../../types'
import { PickupDetailView } from './PickupDetailView'

interface PickupManagementData {
  pickups: PickupRequest[]
  loading: boolean
  error: string | null
}

export const PickupManagement: React.FC = () => {
  const { profile } = useAuth()
  const [data, setData] = useState<PickupManagementData>({
    pickups: [],
    loading: true,
    error: null
  })
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'missed'>('all')
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('week')

  useEffect(() => {
    if (!profile || profile.role !== 'collector') return

    const loadPickups = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        const pickups = await PickupService.getCollectorPickups(profile.id, 100)

        setData({
          pickups,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Failed to load pickups:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load pickups'
        }))
      }
    }

    loadPickups()
  }, [profile])

  const handlePickupUpdate = (updatedPickup: PickupRequest) => {
    setData(prev => ({
      ...prev,
      pickups: prev.pickups.map(pickup =>
        pickup.id === updatedPickup.id ? updatedPickup : pickup
      )
    }))
    setSelectedPickup(null)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'picked_up':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'missed':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Filter pickups based on selected filters
  const filteredPickups = data.pickups.filter(pickup => {
    // Status filter
    if (filter !== 'all') {
      if (filter === 'pending' && !['requested', 'scheduled'].includes(pickup.status)) return false
      if (filter === 'completed' && pickup.status !== 'picked_up') return false
      if (filter === 'missed' && pickup.status !== 'missed') return false
    }

    // Date filter
    const now = new Date()
    const pickupDate = pickup.scheduledDate

    switch (dateFilter) {
      case 'today': {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
        return pickupDate >= today && pickupDate < tomorrow
      }
      case 'week': {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return pickupDate >= weekAgo
      }
      case 'month': {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return pickupDate >= monthAgo
      }
      case 'all':
      default:
        return true
    }
  })

  // Group pickups by date for better organization
  const pickupsByDate = filteredPickups.reduce((acc, pickup) => {
    const dateKey = pickup.scheduledDate.toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(pickup)
    return acc
  }, {} as Record<string, PickupRequest[]>)

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
          <p className="mt-4 text-gray-600">Loading pickups...</p>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Pickups</h3>
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
            <h1 className="text-3xl font-bold text-gray-900">Pickup Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your assigned pickups and update their status
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  id="status-filter"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Pickups</option>
                  <option value="pending">Pending (Requested/Scheduled)</option>
                  <option value="completed">Completed</option>
                  <option value="missed">Missed</option>
                </select>
              </div>
              <div>
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Date
                </label>
                <select
                  id="date-filter"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value as any)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Pickups List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Pickups ({filteredPickups.length})
            </h3>

            {filteredPickups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No pickups found</h4>
                <p className="text-gray-500">Try adjusting your filters to see more results.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pickupsByDate)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .map(([dateKey, pickups]) => (
                    <div key={dateKey} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900">
                          {new Date(dateKey).toLocaleDateString('en-NG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })} ({pickups.length} pickup{pickups.length !== 1 ? 's' : ''})
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-200">
                        {pickups
                          .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
                          .map((pickup) => (
                            <div key={pickup.id} className="p-4 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pickup.status)}`}>
                                      {pickup.status.replace('_', ' ')}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900">
                                        {pickup.location.street} {pickup.location.houseNumber}
                                      </p>
                                      <p className="text-sm text-gray-500">
                                        {pickup.location.area} • {formatDate(pickup.scheduledDate)}
                                      </p>
                                    </div>
                                  </div>
                                  {pickup.notes && (
                                    <p className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      <span className="font-medium">Notes:</span> {pickup.notes}
                                    </p>
                                  )}
                                </div>
                                <div className="flex-shrink-0 ml-4">
                                  <button
                                    onClick={() => setSelectedPickup(pickup)}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                  >
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pickup Detail Modal */}
      {selectedPickup && (
        <PickupDetailView
          pickup={selectedPickup}
          onStatusUpdate={handlePickupUpdate}
          onClose={() => setSelectedPickup(null)}
        />
      )}
    </div>
  )
}
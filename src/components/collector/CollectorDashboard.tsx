import React, { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PickupService } from '../../services/pickupService'
import { PickupRequest } from '../../types'

interface DashboardData {
  todayPickups: PickupRequest[]
  completionStats: {
    total: number
    completed: number
    missed: number
    pending: number
    completionRate: number
  }
  loading: boolean
  error: string | null
}

export const CollectorDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData>({
    todayPickups: [],
    completionStats: {
      total: 0,
      completed: 0,
      missed: 0,
      pending: 0,
      completionRate: 0
    },
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!profile || profile.role !== 'collector') return

    const loadDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Get today's pickups assigned to this collector
        const todayPickups = await PickupService.getCollectorPickupsForDate(profile.id, new Date())

        // Get completion statistics for the last 30 days
        const stats = await PickupService.getCollectorStats(profile.id, 30)

        setData({
          todayPickups: todayPickups.sort((a, b) => {
            // Sort by priority: scheduled first, then by area
            if (a.status !== b.status) {
              const statusOrder = { 'scheduled': 0, 'requested': 1, 'picked_up': 2, 'missed': 3 }
              return statusOrder[a.status] - statusOrder[b.status]
            }
            return a.location.area.localeCompare(b.location.area)
          }),
          completionStats: stats,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Failed to load collector dashboard data:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load dashboard data'
        }))
      }
    }

    loadDashboardData()
  }, [profile])

  if (!profile || profile.role !== 'collector') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">This dashboard is only available to collectors.</p>
        </div>
      </div>
    )
  }

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-red-800">Error Loading Dashboard</h3>
            <p className="mt-2 text-red-600">{data.error}</p>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
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

  const getPriorityColor = (pickup: PickupRequest) => {
    // Priority based on status and how overdue it is
    if (pickup.status === 'missed') return 'border-l-red-500'
    if (pickup.status === 'scheduled') return 'border-l-blue-500'
    if (pickup.status === 'requested') return 'border-l-yellow-500'
    return 'border-l-green-500'
  }

  // Group pickups by area for better organization
  const pickupsByArea = data.todayPickups.reduce((acc, pickup) => {
    const area = pickup.location.area
    if (!acc[area]) acc[area] = []
    acc[area].push(pickup)
    return acc
  }, {} as Record<string, PickupRequest[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">Collector Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Welcome back, {profile.name} • {formatDate(new Date())}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{data.todayPickups.length}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today's Pickups</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.todayPickups.length} scheduled</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{data.completionStats.completed}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Completed (30d)</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.completionStats.completed} pickups</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{data.completionStats.missed}</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Missed (30d)</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.completionStats.missed} pickups</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{Math.round(data.completionStats.completionRate)}%</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{data.completionStats.completionRate.toFixed(1)}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Pickups */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => window.location.href = '/collector/pickups'}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Manage Pickups
              </button>
              <button
                onClick={() => window.location.href = '/collector/customers'}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                View Customers
              </button>
              <button
                onClick={() => window.location.href = '/collector/reports'}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Reports
              </button>
            </div>
          </div>
        </div>

        {/* Today's Pickups */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Today&apos;s Pickup Schedule
            </h3>

            {data.todayPickups.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No pickups scheduled for today</h4>
                <p className="text-gray-500">Check back later or contact your supervisor for assignments.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(pickupsByArea).map(([area, pickups]) => (
                  <div key={area} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {area} ({pickups.length} pickup{pickups.length !== 1 ? 's' : ''})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-200">
                      {pickups.map((pickup) => (
                        <div key={pickup.id} className={`p-4 hover:bg-gray-50 border-l-4 ${getPriorityColor(pickup)}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(pickup.status)}`}>
                                    {pickup.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {pickup.location.street} {pickup.location.houseNumber}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Scheduled: {formatTime(pickup.scheduledDate)}
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
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                onClick={() => {
                                  // Navigate to pickup management page
                                  window.location.href = '/collector/pickups'
                                }}
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
    </div>
  )
}
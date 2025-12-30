import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { HeroSection } from '../common/HeroSection'
import { SubscriptionService } from '../../services/subscriptionService'
import { PickupService } from '../../services/pickupService'
import { Subscription, PickupRequest } from '../../types'

interface DashboardData {
  subscription: Subscription | null
  nextPickup: PickupRequest | null
  recentPickups: PickupRequest[]
  loading: boolean
  error: string | null
}

export const ResidentDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData>({
    subscription: null,
    nextPickup: null,
    recentPickups: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!profile) return

    const loadDashboardData = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Load data in parallel for better performance
        const [subscription, nextPickup, recentPickups] = await Promise.all([
          SubscriptionService.getByUserId(profile.id),
          PickupService.getNextPickup(profile.id),
          PickupService.getByUserId(profile.id, 5) // Get last 5 pickups
        ])

        setData({
          subscription,
          nextPickup,
          recentPickups,
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Dashboard data loading error:', error)
        setData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }))
      }
    }

    // Load data with a small delay to show the UI first
    const timer = setTimeout(loadDashboardData, 100)
    return () => clearTimeout(timer)
  }, [profile])

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please log in to access your dashboard</h2>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'picked_up':
        return 'bg-green-100 text-green-800'
      case 'missed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection 
        userName={profile.name}
        location={`${profile.location.area}, ${profile.location.street} ${profile.location.houseNumber}`}
      />

      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8 overflow-x-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Subscription Status
                </h3>
                {data.loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading subscription...</p>
                  </div>
                ) : data.subscription ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Plan</span>
                      <span className="text-sm text-gray-900 capitalize">{data.subscription.planType}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        data.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                        data.subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {data.subscription.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Amount</span>
                      <span className="text-sm text-gray-900">
                        ₦{data.subscription.pricing.amount.toLocaleString()}/{data.subscription.pricing.billingCycle}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Start Date</span>
                      <span className="text-sm text-gray-900">{formatDate(data.subscription.startDate)}</span>
                    </div>
                    <div className="mt-4">
                      <Link 
                        to="/resident/subscription"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Manage Subscription
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No active subscription</p>
                    <Link 
                      to="/resident/subscription"
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Subscribe Now
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Next Pickup */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Next Pickup
                </h3>
                {data.loading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading pickup...</p>
                  </div>
                ) : data.nextPickup ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Date</span>
                      <span className="text-sm text-gray-900">{formatDate(data.nextPickup.scheduledDate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Status</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(data.nextPickup.status)}`}>
                        {data.nextPickup.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Location</span>
                      <span className="text-sm text-gray-900 text-right">
                        {data.nextPickup.location.area}<br />
                        {data.nextPickup.location.street} {data.nextPickup.location.houseNumber}
                      </span>
                    </div>
                    {data.nextPickup.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-500 block">Notes</span>
                        <span className="text-sm text-gray-900">{data.nextPickup.notes}</span>
                      </div>
                    )}
                    <div className="mt-4">
                      <Link 
                        to="/resident/pickup-requests"
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        View All Pickups
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No upcoming pickups scheduled</p>
                    <Link 
                      to="/resident/pickup-requests"
                      className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Request Pickup
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Account Information */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Account Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Email</span>
                    <span className="text-sm text-gray-900">{profile.email}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Phone</span>
                    <span className="text-sm text-gray-900">{profile.phone}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block">Location</span>
                    <span className="text-sm text-gray-900">
                      {profile.location.area}<br />
                      {profile.location.street} {profile.location.houseNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Link 
                    to="/resident/pickup-requests"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Request Pickup
                  </Link>
                  <Link 
                    to="/resident/payment-history"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Payment History
                  </Link>
                  <Link 
                    to="/resident/complaints"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    File Complaint
                  </Link>
                  <Link 
                    to="/resident/subscription"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Manage Subscription
                  </Link>
                  <Link 
                    to="/resident/location"
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Update Location
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Pickup Activity
              </h3>
              {data.loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                  <p className="mt-2 text-sm text-gray-500">Loading recent activity...</p>
                </div>
              ) : data.recentPickups.length > 0 ? (
                <div className="space-y-4">
                  {data.recentPickups.map((pickup) => (
                    <div key={pickup.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {formatDate(pickup.scheduledDate)}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(pickup.status)}`}>
                              {pickup.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {pickup.location.area}, {pickup.location.street} {pickup.location.houseNumber}
                          </p>
                          {pickup.notes && (
                            <p className="text-sm text-gray-600 mt-1">{pickup.notes}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          {pickup.completedAt ? `Completed ${formatDate(pickup.completedAt)}` : 'Scheduled'}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Link 
                      to="/resident/pickup-requests"
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      View all pickup history →
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No recent pickup activity</p>
                  <Link 
                    to="/resident/pickup-requests"
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500"
                  >
                    Request your first pickup →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
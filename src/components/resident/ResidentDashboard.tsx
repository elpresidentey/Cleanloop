import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { HeroSection } from '../common/HeroSection'
import { SubscriptionService } from '../../services/subscriptionService'
import { PickupService } from '../../services/pickupService'
import { PaymentService } from '../../services/paymentService'
import { ComplaintService } from '../../services/complaintService'
import { Subscription, PickupRequest } from '../../types'

interface DashboardData {
  subscription: Subscription | null
  nextPickup: PickupRequest | null
  recentPickups: PickupRequest[]
  stats: {
    totalPickups: number
    completedPickups: number
    pendingPickups: number
    totalPayments: number
    totalAmount: number
    openComplaints: number
  }
  loading: boolean
  error: string | null
}

export const ResidentDashboard: React.FC = () => {
  const { profile } = useAuth()
  const [data, setData] = useState<DashboardData>({
    subscription: null,
    nextPickup: null,
    recentPickups: [],
    stats: {
      totalPickups: 0,
      completedPickups: 0,
      pendingPickups: 0,
      totalPayments: 0,
      totalAmount: 0,
      openComplaints: 0
    },
    loading: true,
    error: null
  })

  useEffect(() => {
    if (!profile) return

    const loadDashboardData = async () => {
      try {
        setData((prev: DashboardData) => ({ ...prev, loading: true, error: null }))

        // Load data in parallel for better performance
        const [subscription, nextPickup, recentPickups, allPickups, payments, complaints] = await Promise.all([
          SubscriptionService.getByUserId(profile.id),
          PickupService.getNextPickup(profile.id),
          PickupService.getByUserId(profile.id, 5), // Get last 5 pickups
          PickupService.getByUserId(profile.id, 100), // Get all for stats
          PaymentService.getByUserId(profile.id),
          ComplaintService.getByUserId(profile.id)
        ])

        // Calculate statistics
        const completedPickups = allPickups.filter(p => p.status === 'picked_up').length
        const pendingPickups = allPickups.filter(p => p.status === 'requested' || p.status === 'scheduled').length
        const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0)
        const openComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length

        setData({
          subscription,
          nextPickup,
          recentPickups,
          stats: {
            totalPickups: allPickups.length,
            completedPickups,
            pendingPickups,
            totalPayments: payments.length,
            totalAmount,
            openComplaints
          },
          loading: false,
          error: null
        })
      } catch (error) {
        console.error('Dashboard data loading error:', error)
        setData((prev: DashboardData) => ({
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30">
      {/* Hero Section */}
      <HeroSection 
        userName={profile.name}
        location={`${profile.location.area}, ${profile.location.street} ${profile.location.houseNumber}`}
      />

      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-4 lg:py-8 overflow-x-hidden">
        {/* Alert for Open Complaints */}
        {!data.loading && data.stats.openComplaints > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-yellow-700">
                  You have <strong>{data.stats.openComplaints}</strong> open {data.stats.openComplaints === 1 ? 'complaint' : 'complaints'}. 
                  <Link to="/resident/complaints" className="ml-1 font-medium text-yellow-800 underline hover:text-yellow-900">
                    View details →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Cards - Modern Design */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Pickups</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.loading ? '...' : data.stats.totalPickups}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.loading ? '...' : data.stats.completedPickups}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Pending</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.loading ? '...' : data.stats.pendingPickups}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="group bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">Total Paid</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {data.loading ? '...' : `₦${data.stats.totalAmount.toLocaleString()}`}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-6">
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
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No active subscription</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by subscribing to our service.</p>
                    <div className="mt-6">
                      <Link 
                        to="/resident/subscription"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Subscribe Now
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Next Pickup */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-6">
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
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming pickups</h3>
                    <p className="mt-1 text-sm text-gray-500">Schedule your first waste collection pickup.</p>
                    <div className="mt-6">
                      <Link 
                        to="/resident/pickup-requests"
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Request Pickup
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Account Information */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-6">
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
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20 hover:shadow-xl transition-all duration-300">
              <div className="px-6 py-6">
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
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-2xl border border-white/20">
            <div className="px-6 py-6">
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
                    <div key={pickup.id} className="border border-gray-200 rounded-xl p-5 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-md transition-all duration-300">
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
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by requesting your first pickup.</p>
                  <div className="mt-6">
                    <Link 
                      to="/resident/pickup-requests"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Request Pickup
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
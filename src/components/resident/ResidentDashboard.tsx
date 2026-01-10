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
  lastSuccessfulPickup: PickupRequest | null
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
    lastSuccessfulPickup: null,
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

        // Find last successful pickup
        const successfulPickups = allPickups
          .filter(p => p.status === 'picked_up' && p.completedAt)
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime())
        const lastSuccessfulPickup = successfulPickups.length > 0 ? successfulPickups[0] : null

        setData({
          subscription,
          nextPickup,
          recentPickups,
          lastSuccessfulPickup,
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

  const formatShortDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'requested':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Requested'
        }
      case 'scheduled':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          label: 'Scheduled'
        }
      case 'picked_up':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          label: 'Completed'
        }
      case 'missed':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ),
          label: 'Missed'
        }
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          ),
          label: status.replace('_', ' ')
        }
    }
  }

  const getPlanTypeLabel = (planType: string) => {
    switch (planType.toLowerCase()) {
      case 'weekly':
        return 'Weekly'
      case 'bi-weekly':
      case 'biweekly':
        return 'Bi-weekly'
      case 'monthly':
        return 'Monthly'
      default:
        return planType.charAt(0).toUpperCase() + planType.slice(1).replace('_', '-')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30">
      {/* Hero Section with Primary CTA */}
      <HeroSection 
        userName={profile.name}
        location={`${profile.location.area}, ${profile.location.street} ${profile.location.houseNumber}`}
        showActions={true}
      />

      <div className="max-w-full mx-auto px-2 sm:px-4 lg:px-8 py-6 lg:py-8 overflow-x-hidden">
        {/* Alert for Open Complaints */}
        {!data.loading && data.stats.openComplaints > 0 && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
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

        {/* Top Summary Card - At a Glance */}
        <div className="mb-8 bg-white/90 backdrop-blur-sm overflow-hidden shadow-xl rounded-2xl border border-gray-100">
          <div className="p-6 lg:p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">At a Glance</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Subscription Status */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Subscription</h3>
                </div>
                
                {data.loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : data.subscription ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Plan: </span>
                      <span className="text-sm font-medium text-gray-900">{getPlanTypeLabel(data.subscription.planType)}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        data.subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                        data.subscription.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        Status: {data.subscription.status}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Amount: </span>
                      <span className="text-sm font-medium text-gray-900">
                        ₦{data.subscription.pricing.amount.toLocaleString()} / {data.subscription.pricing.billingCycle}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active subscription</p>
                )}
              </div>

              {/* Next Pickup */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Next Pickup</h3>
                </div>
                
                {data.loading ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : data.nextPickup ? (
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(data.nextPickup.scheduledDate)}</p>
                    </div>
                    <div>
                      {(() => {
                        const statusConfig = getStatusConfig(data.nextPickup.status)
                        return (
                          <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.icon}
                            <span>{statusConfig.label}</span>
                          </span>
                        )
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-500">No upcoming pickups scheduled</p>
                    <p className="text-xs text-gray-400">Request a pickup now to schedule your next collection</p>
                  </div>
                )}
              </div>

              {/* Service Area / Location */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-2">
                    <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Service Area</h3>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">{profile.location.area}</p>
                  <p className="text-xs text-gray-500">
                    {profile.location.street} {profile.location.houseNumber}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Reliability Snippet */}
            {data.lastSuccessfulPickup && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 bg-green-50 rounded-lg p-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Service Reliability</p>
                    <p className="text-xs text-gray-500">
                      Last successful pickup: {formatShortDate(data.lastSuccessfulPickup.completedAt!)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Next Pickup - Larger Section */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
              <div className="px-6 py-6 lg:px-8 lg:py-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Next Pickup</h2>
                
                {data.loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading pickup details...</p>
                  </div>
                ) : data.nextPickup ? (
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-4">
                            {(() => {
                              const statusConfig = getStatusConfig(data.nextPickup.status)
                              return (
                                <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                                  {statusConfig.icon}
                                  <span>{statusConfig.label}</span>
                                </span>
                              )
                            })()}
                          </div>
                          <p className="text-lg font-semibold text-gray-900 mb-2">
                            {formatDate(data.nextPickup.scheduledDate)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {data.nextPickup.location.area}, {data.nextPickup.location.street} {data.nextPickup.location.houseNumber}
                          </p>
                          {data.nextPickup.notes && (
                            <div className="mt-4 pt-4 border-t border-blue-200">
                              <p className="text-sm text-gray-700">{data.nextPickup.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link 
                      to="/resident/pickup-requests"
                      className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      View All Pickups
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No upcoming pickups scheduled</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                      Request a pickup now to schedule your next collection. Our team will confirm and collect your waste at the scheduled time.
                    </p>
                    <Link 
                      to="/resident/pickup-requests"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                      Request Pickup
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Pickup Activity */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
              <div className="px-6 py-6 lg:px-8 lg:py-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Pickup Activity</h3>
                
                {data.loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-500">Loading recent activity...</p>
                  </div>
                ) : data.recentPickups.length > 0 ? (
                  <div className="space-y-4">
                    {data.recentPickups.map((pickup) => {
                      const statusConfig = getStatusConfig(pickup.status)
                      return (
                        <div key={pickup.id} className="border border-gray-200 rounded-xl p-5 bg-white/50 backdrop-blur-sm hover:bg-white/80 hover:shadow-md transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                  {statusConfig.icon}
                                  <span>{statusConfig.label}</span>
                                </span>
                                <span className="text-sm font-medium text-gray-900">
                                  {formatDate(pickup.scheduledDate)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-1">
                                {pickup.location.area}, {pickup.location.street} {pickup.location.houseNumber}
                              </p>
                              {pickup.notes && (
                                <p className="text-sm text-gray-500 mt-2 italic">{pickup.notes}</p>
                              )}
                            </div>
                            {pickup.completedAt && (
                              <div className="text-xs text-gray-400 text-right ml-4">
                                <p className="font-medium">Completed</p>
                                <p>{formatShortDate(pickup.completedAt)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    <div className="text-center pt-4">
                      <Link 
                        to="/resident/pickup-requests"
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      >
                        View all pickup history
                        <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-sm text-gray-500 mb-6">Get started by requesting your first pickup.</p>
                    <Link 
                      to="/resident/pickup-requests"
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
                    >
                      Request Pickup
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions - Reduced to 2-3 most-used */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
              <div className="px-6 py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link 
                    to="/resident/pickup-requests"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Request Pickup
                  </Link>
                  <Link 
                    to="/resident/pickup-requests"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    View Pickup History
                  </Link>
                  <Link 
                    to="/resident/subscription"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Manage Subscription
                  </Link>
                </div>
              </div>
            </div>

            {/* Statistics Cards - Compact View */}
            <div className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-2xl border border-white/20">
              <div className="px-6 py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total Pickups</span>
                    <span className="text-lg font-bold text-gray-900">{data.loading ? '...' : data.stats.totalPickups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-lg font-bold text-green-600">{data.loading ? '...' : data.stats.completedPickups}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-lg font-bold text-yellow-600">{data.loading ? '...' : data.stats.pendingPickups}</span>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Paid</span>
                      <span className="text-lg font-bold text-purple-600">
                        {data.loading ? '...' : `₦${data.stats.totalAmount.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

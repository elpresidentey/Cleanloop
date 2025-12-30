import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { SubscriptionService } from '../../services/subscriptionService'
import { Subscription, SubscriptionPlanType, CreateSubscriptionInput } from '../../types'

interface SubscriptionPlan {
  type: SubscriptionPlanType
  name: string
  description: string
  amount: number
  billingCycle: string
  features: string[]
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    type: 'weekly',
    name: 'Weekly Plan',
    description: 'Regular weekly waste collection',
    amount: 2000,
    billingCycle: 'week',
    features: [
      'Weekly pickup',
      'SMS notifications',
      'Basic support',
      'Payment tracking'
    ]
  },
  {
    type: 'bi-weekly',
    name: 'Bi-Weekly Plan',
    description: 'Collection every two weeks',
    amount: 3500,
    billingCycle: 'bi-weekly',
    features: [
      'Bi-weekly pickup',
      'SMS notifications',
      'Priority support',
      'Payment tracking',
      'Flexible scheduling'
    ]
  },
  {
    type: 'on-demand',
    name: 'On-Demand Plan',
    description: 'Request pickup when needed',
    amount: 1500,
    billingCycle: 'per pickup',
    features: [
      'Request when needed',
      'Same-day pickup (when available)',
      'SMS notifications',
      'Premium support',
      'Payment tracking'
    ]
  }
]

export const SubscriptionManagement: React.FC = () => {
  const { profile } = useAuth()
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!profile) return

    const loadCurrentSubscription = async () => {
      try {
        setLoading(true)
        const subscription = await SubscriptionService.getByUserId(profile.id)
        setCurrentSubscription(subscription)
      } catch (error) {
        console.error('Failed to load subscription:', error)
        setError(error instanceof Error ? error.message : 'Failed to load subscription')
      } finally {
        setLoading(false)
      }
    }

    loadCurrentSubscription()
  }, [profile])

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan)
    setError(null)
    setSuccess(null)
  }

  const handleSubscribe = async () => {
    if (!profile || !selectedPlan) return

    try {
      setSubmitting(true)
      setError(null)

      const subscriptionInput: CreateSubscriptionInput = {
        userId: profile.id,
        planType: selectedPlan.type,
        pricing: {
          amount: selectedPlan.amount,
          currency: 'NGN',
          billingCycle: selectedPlan.billingCycle
        },
        startDate: new Date()
      }

      const newSubscription = await SubscriptionService.create(subscriptionInput)
      setCurrentSubscription(newSubscription)
      setSelectedPlan(null)
      setSuccess(`Successfully subscribed to ${selectedPlan.name}!`)
    } catch (error) {
      console.error('Failed to create subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to create subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return

    if (!confirm('Are you sure you want to cancel your subscription? This action cannot be undone.')) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const updatedSubscription = await SubscriptionService.updateStatus(
        currentSubscription.id,
        'cancelled'
      )
      setCurrentSubscription(updatedSubscription)
      setSuccess('Subscription cancelled successfully.')
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to cancel subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePauseSubscription = async () => {
    if (!currentSubscription) return

    try {
      setSubmitting(true)
      setError(null)

      const updatedSubscription = await SubscriptionService.updateStatus(
        currentSubscription.id,
        'paused'
      )
      setCurrentSubscription(updatedSubscription)
      setSuccess('Subscription paused successfully.')
    } catch (error) {
      console.error('Failed to pause subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to pause subscription')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResumeSubscription = async () => {
    if (!currentSubscription) return

    try {
      setSubmitting(true)
      setError(null)

      const updatedSubscription = await SubscriptionService.updateStatus(
        currentSubscription.id,
        'active'
      )
      setCurrentSubscription(updatedSubscription)
      setSuccess('Subscription resumed successfully.')
    } catch (error) {
      console.error('Failed to resume subscription:', error)
      setError(error instanceof Error ? error.message : 'Failed to resume subscription')
    } finally {
      setSubmitting(false)
    }
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please log in to manage your subscription</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription information...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your waste collection subscription plan
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
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

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>{success}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Current Subscription */}
        {currentSubscription && (
          <div className="mb-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Current Subscription
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Plan</span>
                    <span className="text-sm text-gray-900 capitalize">
                      {currentSubscription.planType.replace('-', ' ')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                      currentSubscription.status === 'active' 
                        ? 'bg-green-100 text-green-800'
                        : currentSubscription.status === 'paused'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentSubscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Amount</span>
                    <span className="text-sm text-gray-900">
                      ₦{currentSubscription.pricing.amount.toLocaleString()} / {currentSubscription.pricing.billingCycle}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-500">Start Date</span>
                    <span className="text-sm text-gray-900">
                      {new Intl.DateTimeFormat('en-NG').format(currentSubscription.startDate)}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {currentSubscription.status === 'active' && (
                    <>
                      <button
                        onClick={handlePauseSubscription}
                        disabled={submitting}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        {submitting ? 'Processing...' : 'Pause Subscription'}
                      </button>
                      <button
                        onClick={handleCancelSubscription}
                        disabled={submitting}
                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {submitting ? 'Processing...' : 'Cancel Subscription'}
                      </button>
                    </>
                  )}
                  {currentSubscription.status === 'paused' && (
                    <button
                      onClick={handleResumeSubscription}
                      disabled={submitting}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Resume Subscription'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        {(!currentSubscription || currentSubscription.status === 'cancelled') && (
          <div className="mb-8">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
              Choose a Subscription Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.type}
                  className={`relative rounded-lg border-2 p-6 cursor-pointer transition-colors ${
                    selectedPlan?.type === plan.type
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  onClick={() => handlePlanSelection(plan)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">{plan.name}</h4>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedPlan?.type === plan.type
                        ? 'border-green-500 bg-green-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedPlan?.type === plan.type && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-gray-900">
                      ₦{plan.amount.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500">/{plan.billingCycle}</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {selectedPlan && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleSubscribe}
                  disabled={submitting}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : `Subscribe to ${selectedPlan.name}`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Plan Comparison */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Plan Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Weekly
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bi-Weekly
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      On-Demand
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Price
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦2,000/week
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦3,500/bi-weekly
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₦1,500/pickup
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Pickup Frequency
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Weekly
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Every 2 weeks
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      As requested
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Support Level
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Basic
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Priority
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      Premium
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Flexible Scheduling
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ❌
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ✅
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ✅
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
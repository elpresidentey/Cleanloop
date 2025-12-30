import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PickupService } from '../../services/pickupService'
import { PickupRequest } from '../../types'
import { PickupRequestForm } from './PickupRequestForm'
import { PickupStatusTracker } from './PickupStatusTracker'

export const PickupRequestSystem: React.FC = () => {
  const { user } = useAuth()
  const [pickups, setPickups] = useState<PickupRequest[]>([])
  const [selectedPickup, setSelectedPickup] = useState<PickupRequest | null>(null)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadPickups = async () => {
      try {
        setLoading(true)
        const userPickups = await PickupService.getByUserId(user.id)
        setPickups(userPickups)
        
        // Auto-select the most recent pickup if none selected
        if (!selectedPickup && userPickups.length > 0) {
          setSelectedPickup(userPickups[0])
        }
      } catch (error) {
        console.error('Failed to load pickups:', error)
        setError(error instanceof Error ? error.message : 'Failed to load pickup requests')
      } finally {
        setLoading(false)
      }
    }

    loadPickups()
  }, [user, selectedPickup])

  const handleRequestSuccess = async () => {
    setShowRequestForm(false)
    
    // Reload pickups to show the new request
    if (user) {
      try {
        const userPickups = await PickupService.getByUserId(user.id)
        setPickups(userPickups)
        
        // Select the newest pickup (first in the list)
        if (userPickups.length > 0) {
          setSelectedPickup(userPickups[0])
        }
      } catch (error) {
        console.error('Failed to reload pickups:', error)
      }
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'requested':
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please log in to manage pickup requests</h2>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pickup requests...</p>
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
                <h1 className="text-3xl font-bold text-gray-900">Pickup Requests</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your waste collection requests and track their status
                </p>
              </div>
              <button
                onClick={() => setShowRequestForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                New Request
              </button>
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

        {showRequestForm && (
          <div className="mb-8">
            <PickupRequestForm
              onSuccess={handleRequestSuccess}
              onCancel={() => setShowRequestForm(false)}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pickup List */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Your Requests ({pickups.length})
                </h3>
                
                {pickups.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No pickup requests</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating your first pickup request.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => setShowRequestForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        Request Pickup
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pickups.map((pickup) => (
                      <div
                        key={pickup.id}
                        onClick={() => setSelectedPickup(pickup)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          selectedPickup?.id === pickup.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {formatDate(pickup.scheduledDate)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(pickup.status)}`}>
                            {pickup.status.replace('_', ' ')}
                          </span>
                        </div>
                        {pickup.notes && (
                          <p className="text-sm text-gray-500 truncate">
                            {pickup.notes}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          Created {pickup.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Pickup Details */}
          <div className="lg:col-span-2">
            {selectedPickup ? (
              <PickupStatusTracker pickup={selectedPickup} />
            ) : (
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Select a pickup request</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Choose a pickup request from the list to view its status and details.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
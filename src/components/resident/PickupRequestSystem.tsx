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
  const [editingPickup, setEditingPickup] = useState<PickupRequest | null>(null)
  const [deletingPickup, setDeletingPickup] = useState<PickupRequest | null>(null)
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
  }, [user])

  const loadPickups = async () => {
    if (!user) return
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

  const handleRequestSuccess = async () => {
    setShowRequestForm(false)
    setEditingPickup(null)
    await loadPickups()
    
    // Select the newest pickup (first in the list)
    if (pickups.length > 0) {
      setSelectedPickup(pickups[0])
    }
  }

  const handleEdit = (pickup: PickupRequest) => {
    setEditingPickup(pickup)
    setShowRequestForm(true)
  }

  const handleDelete = async () => {
    if (!deletingPickup) return
    
    try {
      await PickupService.delete(deletingPickup.id)
      setDeletingPickup(null)
      
      // If deleted pickup was selected, clear selection
      if (selectedPickup?.id === deletingPickup.id) {
        setSelectedPickup(null)
      }
      
      await loadPickups()
    } catch (error) {
      console.error('Failed to delete pickup:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete pickup request')
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Pickup Requests
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your waste collection requests and track their status
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPickup(null)
                  setShowRequestForm(true)
                }}
                className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
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
              pickup={editingPickup || undefined}
              onSuccess={handleRequestSuccess}
              onCancel={() => {
                setShowRequestForm(false)
                setEditingPickup(null)
              }}
            />
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingPickup && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Pickup Request?</h3>
              <p className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to delete the pickup request for {formatDate(deletingPickup.scheduledDate)}? This action cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeletingPickup(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
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
                        className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          selectedPickup?.id === pickup.id
                            ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md'
                            : 'border-gray-200 bg-white/80 backdrop-blur-sm hover:border-green-300 hover:shadow-md'
                        }`}
                        onClick={() => setSelectedPickup(pickup)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatDate(pickup.scheduledDate)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(pickup.status)}`}>
                            {pickup.status.replace('_', ' ')}
                          </span>
                        </div>
                        {pickup.notes && (
                          <p className="text-sm text-gray-600 truncate mb-2">
                            {pickup.notes}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-3">
                          <p className="text-xs text-gray-400">
                            {pickup.createdAt.toLocaleDateString()}
                          </p>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(pickup.status === 'requested' || pickup.status === 'scheduled') && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEdit(pickup)
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setDeletingPickup(pickup)
                                  }}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
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
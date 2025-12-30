import React, { useState } from 'react'
import { PickupRequest, User } from '../../types'
import { PickupService } from '../../services/pickupService'

interface PickupDetailViewProps {
  pickup: PickupRequest
  customer?: User
  onStatusUpdate?: (updatedPickup: PickupRequest) => void
  onClose?: () => void
}

export const PickupDetailView: React.FC<PickupDetailViewProps> = ({
  pickup,
  customer,
  onStatusUpdate,
  onClose
}) => {
  const [isUpdating, setIsUpdating] = useState(false)
  const [notes, setNotes] = useState(pickup.notes || '')
  const [error, setError] = useState<string | null>(null)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const handleStatusUpdate = async (newStatus: 'picked_up' | 'missed') => {
    try {
      setIsUpdating(true)
      setError(null)

      const updatedPickup = await PickupService.updateStatus(pickup.id, {
        status: newStatus,
        notes: notes.trim() || undefined
      })

      onStatusUpdate?.(updatedPickup)
    } catch (error) {
      console.error('Failed to update pickup status:', error)
      setError(error instanceof Error ? error.message : 'Failed to update pickup status')
    } finally {
      setIsUpdating(false)
    }
  }

  const canUpdateStatus = pickup.status === 'scheduled' || pickup.status === 'requested'

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Pickup Details</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Status and Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(pickup.status)}`}>
                    {pickup.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Pickup ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{pickup.id.slice(0, 8)}...</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(pickup.scheduledDate)}</p>
              </div>
              {pickup.completedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed At</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(pickup.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Customer Information</h4>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.phone}</p>
                    </div>
                  </>
                )}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {pickup.location.street} {pickup.location.houseNumber}<br />
                    {pickup.location.area}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
            <div className="space-y-3">
              {pickup.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Original Notes</label>
                  <p className="mt-1 text-sm text-gray-700 bg-gray-50 p-3 rounded-md">{pickup.notes}</p>
                </div>
              )}
              
              {canUpdateStatus && (
                <div>
                  <label htmlFor="notes" className="text-sm font-medium text-gray-500">
                    Add Notes (Optional)
                  </label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Add any notes about this pickup..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canUpdateStatus && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleStatusUpdate('picked_up')}
                disabled={isUpdating}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Completed
                  </>
                )}
              </button>
              
              <button
                onClick={() => handleStatusUpdate('missed')}
                disabled={isUpdating}
                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Mark as Missed
                  </>
                )}
              </button>
            </div>
          )}

          {!canUpdateStatus && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                This pickup has already been {pickup.status.replace('_', ' ')}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
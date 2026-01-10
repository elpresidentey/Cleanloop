import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PickupService } from '../../services/pickupService'
import { CreatePickupRequestInput, PickupRequest } from '../../types'

interface PickupRequestFormProps {
  pickup?: PickupRequest
  onSuccess?: () => void
  onCancel?: () => void
}

export const PickupRequestForm: React.FC<PickupRequestFormProps> = ({
  pickup,
  onSuccess,
  onCancel
}) => {
  const { profile } = useAuth()
  const isEditing = !!pickup
  const [formData, setFormData] = useState({
    scheduledDate: pickup ? new Date(pickup.scheduledDate).toISOString().split('T')[0] : '',
    notes: pickup?.notes || ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!profile) {
      setError('You must be logged in to request a pickup')
      return
    }

    if (!formData.scheduledDate) {
      setError('Please select a pickup date')
      return
    }

    const selectedDate = new Date(formData.scheduledDate)
    const now = new Date()
    
    if (selectedDate <= now) {
      setError('Pickup date must be in the future')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      // BULLETPROOF: Create request input with guaranteed location data
      const requestInput: CreatePickupRequestInput = {
        userId: profile.id,
        scheduledDate: selectedDate,
        notes: formData.notes.trim() || undefined,
        location: {
          area: profile.location?.area || 'Lagos Island',
          street: profile.location?.street || 'Marina Street',
          houseNumber: profile.location?.houseNumber || '123',
          coordinates: profile.location?.coordinates
        }
      }

      console.log('🚀 SUBMITTING PICKUP REQUEST:', requestInput)

      if (isEditing && pickup) {
        await PickupService.update(pickup.id, requestInput)
      } else {
        await PickupService.create(requestInput)
      }
      
      // Reset form
      setFormData({
        scheduledDate: '',
        notes: ''
      })

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create pickup request:', error)
      
      // User-friendly error message
      if (error instanceof Error) {
        setError(`Unable to create pickup request: ${error.message}`)
      } else {
        setError('Unable to create pickup request. Please try again or contact support.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Get minimum date (tomorrow)
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const minDate = tomorrow.toISOString().split('T')[0]

  return (
    <div className="max-w-2xl mx-auto bg-white/90 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden border border-white/20">
      <div className="px-8 py-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-6">
          {isEditing ? 'Edit Pickup Request' : 'Request Pickup'}
        </h3>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">
              Preferred Pickup Date *
            </label>
            <input
              type="date"
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleInputChange}
              min={minDate}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="mt-2 text-xs text-gray-500">
              Select your preferred pickup date (must be at least tomorrow)
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              maxLength={500}
              placeholder="Any special instructions for the collector (e.g., location of waste, access instructions, etc.)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              {formData.notes.length}/500 characters
            </p>
          </div>

          {profile && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Pickup Location</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium">{profile.location?.area || 'Lagos Island'}</p>
                <p>{(profile.location?.street || 'Marina Street')} {(profile.location?.houseNumber || '123')}</p>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                {(!profile.location?.area || !profile.location?.street || !profile.location?.houseNumber) 
                  ? 'Using default location values. You can update your profile to set a custom address.'
                  : 'This is your registered address. To change it, please update your profile.'
                }
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 border border-transparent text-sm font-medium rounded-xl shadow-lg text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 disabled:transform-none"
            >
              {submitting ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Pickup' : 'Request Pickup')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
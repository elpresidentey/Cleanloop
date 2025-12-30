import React, { useState } from 'react'
import { UserLocation, UserLocationSchema } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { PickupService } from '../../services/pickupService'
import { AuditService } from '../../services/auditService'
import { validateLocationChange } from '../../utils/validation'

interface LocationUpdateFormProps {
  currentLocation: UserLocation
  onSuccess?: (newLocation: UserLocation) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export const LocationUpdateForm: React.FC<LocationUpdateFormProps> = ({
  currentLocation,
  onSuccess,
  onError,
  onCancel
}) => {
  const { profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState<UserLocation>(currentLocation)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const validateForm = (): boolean => {
    try {
      UserLocationSchema.parse(formData)
      setErrors({})
      return true
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
      }
      setErrors(fieldErrors)
      return false
    }
  }

  const handleInputChange = (field: keyof UserLocation, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const formatLocationData = (location: UserLocation): UserLocation => {
    return {
      area: location.area.trim(),
      street: location.street.trim(),
      houseNumber: location.houseNumber.trim(),
      coordinates: location.coordinates
    }
  }

  const hasLocationChanged = (): boolean => {
    const formatted = formatLocationData(formData)
    const { hasChanged } = validateLocationChange(
      { area: currentLocation.area, street: currentLocation.street, houseNumber: currentLocation.houseNumber },
      { area: formatted.area, street: formatted.street, houseNumber: formatted.houseNumber }
    )
    return hasChanged
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!profile) {
      onError?.('User not authenticated')
      return
    }

    if (!hasLocationChanged()) {
      onError?.('No changes detected in location')
      return
    }

    setLoading(true)
    
    try {
      const formattedLocation = formatLocationData(formData)
      
      // Update user profile with new location using the useAuth hook
      const { error: updateError } = await updateProfile({
        location: formattedLocation
      })

      if (updateError) {
        throw new Error(updateError.message || 'Failed to update location')
      }

      // Propagate location changes to future pickup requests
      // Note: We only update future pickup requests, not past ones
      await propagateLocationToFuturePickups(profile.id, formattedLocation)

      // Log the location update
      await AuditService.logUserEvent(
        profile.id,
        'user_updated',
        profile.id,
        { location: currentLocation },
        { location: formattedLocation }
      )

      onSuccess?.(formattedLocation)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update location'
      setErrors({ submit: errorMessage })
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const propagateLocationToFuturePickups = async (userId: string, newLocation: UserLocation) => {
    try {
      // Update all future pickup requests with the new location
      await PickupService.updateLocationForFuturePickups(userId, newLocation)
    } catch (error) {
      console.error('Failed to propagate location to future pickups:', error)
      // Don't throw here as the main location update was successful
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-8 py-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Update Location
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Area Field */}
          <div>
            <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
              Area/District
            </label>
            <input
              type="text"
              id="area"
              value={formData.area}
              onChange={(e) => handleInputChange('area', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.area ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="e.g., Victoria Island, Ikeja, Lekki"
              disabled={loading}
            />
            {errors.area && <p className="mt-2 text-sm text-red-600">{errors.area}</p>}
          </div>

          {/* Street Field */}
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
              Street Name
            </label>
            <input
              type="text"
              id="street"
              value={formData.street}
              onChange={(e) => handleInputChange('street', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.street ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter street name"
              disabled={loading}
            />
            {errors.street && <p className="mt-2 text-sm text-red-600">{errors.street}</p>}
          </div>

          {/* House Number Field */}
          <div>
            <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-2">
              House Number
            </label>
            <input
              type="text"
              id="houseNumber"
              value={formData.houseNumber}
              onChange={(e) => handleInputChange('houseNumber', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.houseNumber ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter house number"
              disabled={loading}
            />
            {errors.houseNumber && <p className="mt-2 text-sm text-red-600">{errors.houseNumber}</p>}
          </div>

          {/* Current vs New Location Comparison */}
          {hasLocationChanged() && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Location Changes</h4>
              <div className="text-sm text-blue-700 space-y-2">
                <div><strong>Current:</strong> {currentLocation.area}, {currentLocation.street} {currentLocation.houseNumber}</div>
                <div><strong>New:</strong> {formData.area}, {formData.street} {formData.houseNumber}</div>
              </div>
              <p className="mt-3 text-xs text-blue-600">
                This change will apply to all future pickup requests.
              </p>
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !hasLocationChanged()}
              className={`px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
                loading || !hasLocationChanged()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              ) : (
                'Update Location'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
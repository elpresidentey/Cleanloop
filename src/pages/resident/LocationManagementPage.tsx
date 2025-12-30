import React, { useState } from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { useAuth } from '../../hooks/useAuth'
import { LocationUpdateForm } from '../../components/resident/LocationUpdateForm'
import { UserLocation } from '../../types'

export const LocationManagementPage: React.FC = () => {
  const { profile } = useAuth()
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!profile) {
    return (
      <ResidentLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900">Please log in to manage your location</h2>
          </div>
        </div>
      </ResidentLayout>
    )
  }

  const handleUpdateSuccess = (newLocation: UserLocation) => {
    setSuccessMessage('Location updated successfully! Changes will apply to all future pickup requests.')
    setErrorMessage(null)
    setShowUpdateForm(false)
    
    // Clear success message after 5 seconds
    setTimeout(() => setSuccessMessage(null), 5000)
  }

  const handleUpdateError = (error: string) => {
    setErrorMessage(error)
    setSuccessMessage(null)
  }

  const handleCancelUpdate = () => {
    setShowUpdateForm(false)
    setErrorMessage(null)
  }

  return (
    <ResidentLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your service location for waste collection
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Current Location Display */}
          {!showUpdateForm && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Current Location
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Area/District</span>
                    <span className="text-sm text-gray-900">{profile.location.area}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Street Name</span>
                    <span className="text-sm text-gray-900">{profile.location.street}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">House Number</span>
                    <span className="text-sm text-gray-900">{profile.location.houseNumber}</span>
                  </div>
                  {profile.location.coordinates && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Coordinates</span>
                      <span className="text-sm text-gray-900">
                        {profile.location.coordinates[1].toFixed(6)}, {profile.location.coordinates[0].toFixed(6)}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <button
                    onClick={() => setShowUpdateForm(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    Update Location
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Location Update Form */}
          {showUpdateForm && (
            <LocationUpdateForm
              currentLocation={profile.location}
              onSuccess={handleUpdateSuccess}
              onError={handleUpdateError}
              onCancel={handleCancelUpdate}
            />
          )}

          {/* Information Panel */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Important Information
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Location changes will automatically apply to all future pickup requests</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Past and completed pickup requests will retain their original location</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Ensure your location details are accurate to avoid missed pickups</span>
              </div>
              <div className="flex items-start">
                <svg className="flex-shrink-0 h-5 w-5 text-blue-400 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Location updates are logged for security and audit purposes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ResidentLayout>
  )
}
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ComplaintService } from '../../services/complaintService'
import { PickupService } from '../../services/pickupService'
import { CreateComplaintInput, PickupRequest, ComplaintPriority } from '../../types'

interface ComplaintFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  preselectedPickupId?: string
}

export const ComplaintForm: React.FC<ComplaintFormProps> = ({
  onSuccess,
  onCancel,
  preselectedPickupId
}) => {
  const { user } = useAuth()
  const [pickups, setPickups] = useState<PickupRequest[]>([])
  const [formData, setFormData] = useState({
    pickupId: preselectedPickupId || '',
    description: '',
    priority: 'medium' as ComplaintPriority
  })
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadPickups = async () => {
      try {
        // Load recent pickups that could have complaints
        const userPickups = await PickupService.getByUserId(user.id, 20)
        setPickups(userPickups)
      } catch (error) {
        console.error('Failed to load pickups:', error)
      }
    }

    loadPickups()
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo must be smaller than 5MB')
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    // Reset file input
    const fileInput = document.getElementById('photo') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to file a complaint')
      return
    }

    if (!formData.pickupId) {
      setError('Please select a pickup request')
      return
    }

    if (!formData.description.trim()) {
      setError('Please provide a description of the issue')
      return
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters long')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      let photoUrl: string | undefined

      // Upload photo if provided
      if (photoFile) {
        setUploadingPhoto(true)
        try {
          photoUrl = await ComplaintService.uploadPhoto(photoFile)
        } catch (photoError) {
          console.error('Failed to upload photo:', photoError)
          setError('Failed to upload photo. You can still submit the complaint without it.')
          setUploadingPhoto(false)
          return
        }
        setUploadingPhoto(false)
      }

      const complaintInput: CreateComplaintInput = {
        userId: user.id,
        pickupId: formData.pickupId,
        description: formData.description.trim(),
        photoUrl,
        priority: formData.priority
      }

      await ComplaintService.create(complaintInput)
      
      // Reset form
      setFormData({
        pickupId: preselectedPickupId || '',
        description: '',
        priority: 'medium'
      })
      setPhotoFile(null)
      setPhotoPreview(null)

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to create complaint:', error)
      setError(error instanceof Error ? error.message : 'Failed to create complaint')
    } finally {
      setSubmitting(false)
      setUploadingPhoto(false)
    }
  }

  const formatPickupOption = (pickup: PickupRequest) => {
    const date = new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(pickup.scheduledDate)
    
    return `${date} - ${pickup.status.replace('_', ' ').toUpperCase()}`
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-8 py-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          File a Complaint
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
            <label htmlFor="pickupId" className="block text-sm font-medium text-gray-700 mb-2">
              Related Pickup Request *
            </label>
            <select
              id="pickupId"
              name="pickupId"
              value={formData.pickupId}
              onChange={handleInputChange}
              required
              disabled={!!preselectedPickupId}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 transition-colors"
            >
              <option value="">Select a pickup request</option>
              {pickups.map((pickup) => (
                <option key={pickup.id} value={pickup.id}>
                  {formatPickupOption(pickup)}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-gray-500">
              Select the pickup request this complaint is related to
            </p>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="low">Low - Minor issue</option>
              <option value="medium">Medium - Standard issue</option>
              <option value="high">High - Urgent issue</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={formData.description}
              onChange={handleInputChange}
              required
              minLength={10}
              maxLength={1000}
              placeholder="Please describe the issue in detail. Include what happened, when it occurred, and any other relevant information."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
            />
            <p className="mt-2 text-xs text-gray-500">
              {formData.description.length}/1000 characters (minimum 10 characters)
            </p>
          </div>

          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-gray-700 mb-2">
              Photo Evidence (Optional)
            </label>
            <div className="mt-1">
              {photoPreview ? (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Complaint photo preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  id="photo"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-colors"
                />
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Upload a photo to help illustrate the issue (max 5MB, image files only)
            </p>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={submitting || uploadingPhoto}
                className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 transition-colors"
            >
              {uploadingPhoto ? 'Uploading Photo...' : submitting ? 'Filing Complaint...' : 'File Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
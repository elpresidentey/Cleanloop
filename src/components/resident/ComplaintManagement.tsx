import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { ComplaintService } from '../../services/complaintService'
import { PickupService } from '../../services/pickupService'
import { Complaint, PickupRequest } from '../../types'
import { ComplaintForm } from './ComplaintForm'

export const ComplaintManagement: React.FC = () => {
  const { user } = useAuth()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [pickups, setPickups] = useState<Record<string, PickupRequest>>({})
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [showComplaintForm, setShowComplaintForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load user's complaints
        const userComplaints = await ComplaintService.getByUserId(user.id)
        setComplaints(userComplaints)

        // Load pickup requests for complaint linking
        const userPickups = await PickupService.getByUserId(user.id)
        const pickupMap = userPickups.reduce((acc, pickup) => {
          acc[pickup.id] = pickup
          return acc
        }, {} as Record<string, PickupRequest>)
        setPickups(pickupMap)
      } catch (error) {
        console.error('Failed to load complaint data:', error)
        setError('Failed to load complaints. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleComplaintCreated = () => {
    setShowComplaintForm(false)
    // Reload complaints to show the new one
    if (user) {
      ComplaintService.getByUserId(user.id)
        .then(setComplaints)
        .catch(console.error)
    }
  }

  const getStatusColor = (status: Complaint['status']) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: Complaint['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatPickupInfo = (pickupId: string) => {
    const pickup = pickups[pickupId]
    if (!pickup) return 'Unknown pickup'
    
    const date = new Intl.DateTimeFormat('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(pickup.scheduledDate)
    
    return `${date} - ${pickup.status.replace('_', ' ').toUpperCase()}`
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (showComplaintForm) {
    return (
      <ComplaintForm
        onSuccess={handleComplaintCreated}
        onCancel={() => setShowComplaintForm(false)}
      />
    )
  }

  if (selectedComplaint) {
    const pickup = pickups[selectedComplaint.pickupId]
    
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Complaint Details
            </h3>
            <button
              onClick={() => setSelectedComplaint(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedComplaint.status)}`}>
                  {selectedComplaint.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(selectedComplaint.priority)}`}>
                  {selectedComplaint.priority.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Related Pickup</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatPickupInfo(selectedComplaint.pickupId)}
              </p>
              {pickup && (
                <p className="text-xs text-gray-500">
                  {pickup.location.area}, {pickup.location.street} {pickup.location.houseNumber}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.photoUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo Evidence</label>
                <img
                  src={selectedComplaint.photoUrl}
                  alt="Complaint evidence"
                  className="max-w-md h-auto rounded-lg border border-gray-300"
                />
              </div>
            )}

            {selectedComplaint.adminNotes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedComplaint.adminNotes}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
              <div>
                <label className="block font-medium">Filed On</label>
                <p>{formatDate(selectedComplaint.createdAt)}</p>
              </div>
              {selectedComplaint.resolvedAt && (
                <div>
                  <label className="block font-medium">Resolved On</label>
                  <p>{formatDate(selectedComplaint.resolvedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Complaints
          </h3>
          <button
            onClick={() => setShowComplaintForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            File New Complaint
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
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

        {complaints.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No complaints filed</h3>
            <p className="mt-1 text-sm text-gray-500">
              You haven't filed any complaints yet. If you experience issues with pickup service, you can file a complaint here.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setShowComplaintForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                File Your First Complaint
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <div
                key={complaint.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedComplaint(complaint)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                      {complaint.photoUrl && (
                        <span className="inline-flex items-center text-xs text-gray-500">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Photo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-900 mb-2 line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>Related to: {formatPickupInfo(complaint.pickupId)}</p>
                      <p>Filed: {formatDate(complaint.createdAt)}</p>
                      {complaint.resolvedAt && (
                        <p>Resolved: {formatDate(complaint.resolvedAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ComplaintManagement
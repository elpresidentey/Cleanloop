import React, { useState, useEffect } from 'react'
import { AdminService } from '../../services/adminService'
import { Complaint, ComplaintStatus, ComplaintPriority } from '../../types'

interface ComplaintCardProps {
  complaint: Complaint
  onUpdate: (id: string, updates: {
    status?: ComplaintStatus
    priority?: ComplaintPriority
    adminNotes?: string
  }) => void
  onViewDetails: (complaint: Complaint) => void
}

const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint, onUpdate, onViewDetails }) => {
  const getStatusColor = (status: ComplaintStatus) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: ComplaintPriority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getResolutionTime = () => {
    if (!complaint.resolvedAt) return null
    const diffMs = complaint.resolvedAt.getTime() - complaint.createdAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
              {complaint.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
              {complaint.priority.toUpperCase()} PRIORITY
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Complaint ID: <span className="font-mono">{complaint.id.slice(0, 8)}...</span>
          </p>
          <p className="text-sm text-gray-600">
            Pickup ID: <span className="font-mono">{complaint.pickupId.slice(0, 8)}...</span>
          </p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-900 line-clamp-3">{complaint.description}</p>
      </div>

      {complaint.photoUrl && (
        <div className="mb-4">
          <img
            src={complaint.photoUrl}
            alt="Complaint photo"
            className="w-full h-32 object-cover rounded border"
          />
        </div>
      )}

      <div className="space-y-2 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Created:</span>
          <span className="font-medium">{formatDate(complaint.createdAt)}</span>
        </div>
        {complaint.resolvedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Resolved:</span>
            <span className="font-medium">{formatDate(complaint.resolvedAt)}</span>
          </div>
        )}
        {complaint.resolvedAt && (
          <div className="flex justify-between">
            <span className="text-gray-600">Resolution Time:</span>
            <span className="font-medium">{getResolutionTime()}</span>
          </div>
        )}
      </div>

      {complaint.adminNotes && (
        <div className="mb-4 p-3 bg-blue-50 rounded border">
          <p className="text-sm text-blue-900">
            <strong>Admin Notes:</strong> {complaint.adminNotes}
          </p>
        </div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(complaint)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
        >
          View Details
        </button>
        {complaint.status === 'open' && (
          <button
            onClick={() => onUpdate(complaint.id, { status: 'in_progress' })}
            className="flex-1 px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded hover:bg-yellow-100 transition-colors"
          >
            Start Review
          </button>
        )}
        {complaint.status === 'in_progress' && (
          <button
            onClick={() => onUpdate(complaint.id, { status: 'resolved' })}
            className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded hover:bg-green-100 transition-colors"
          >
            Mark Resolved
          </button>
        )}
      </div>
    </div>
  )
}

interface ComplaintDetailsModalProps {
  complaint: Complaint | null
  onClose: () => void
  onUpdate: (id: string, updates: {
    status?: ComplaintStatus
    priority?: ComplaintPriority
    adminNotes?: string
  }) => void
}

const ComplaintDetailsModal: React.FC<ComplaintDetailsModalProps> = ({ complaint, onClose, onUpdate }) => {
  const [status, setStatus] = useState<ComplaintStatus>('open')
  const [priority, setPriority] = useState<ComplaintPriority>('medium')
  const [adminNotes, setAdminNotes] = useState('')

  useEffect(() => {
    if (complaint) {
      setStatus(complaint.status)
      setPriority(complaint.priority)
      setAdminNotes(complaint.adminNotes || '')
    }
  }, [complaint])

  if (!complaint) return null

  const handleSave = () => {
    const updates: any = {}
    if (status !== complaint.status) updates.status = status
    if (priority !== complaint.priority) updates.priority = priority
    if (adminNotes !== (complaint.adminNotes || '')) updates.adminNotes = adminNotes

    if (Object.keys(updates).length > 0) {
      onUpdate(complaint.id, updates)
    }
    onClose()
  }

  const formatDate = (date: Date) => {
    return date.toLocaleString()
  }

  const getResolutionTime = () => {
    if (!complaint.resolvedAt) return null
    const diffMs = complaint.resolvedAt.getTime() - complaint.createdAt.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}, ${diffHours % 24} hour${(diffHours % 24) > 1 ? 's' : ''}`
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Complaint Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Complaint Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Complaint ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{complaint.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{complaint.pickupId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{complaint.userId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(complaint.createdAt)}</p>
              </div>
              {complaint.resolvedAt && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolved At</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(complaint.resolvedAt)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Resolution Time</label>
                    <p className="mt-1 text-sm text-gray-900">{getResolutionTime()}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-3">Description</h3>
            <div className="bg-gray-50 p-4 rounded border">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{complaint.description}</p>
            </div>
          </div>

          {/* Photo */}
          {complaint.photoUrl && (
            <div>
              <h3 className="text-lg font-medium mb-3">Photo Evidence</h3>
              <div className="max-w-md">
                <img
                  src={complaint.photoUrl}
                  alt="Complaint photo"
                  className="w-full rounded border shadow-sm"
                />
              </div>
            </div>
          )}

          {/* Status and Priority Management */}
          <div>
            <h3 className="text-lg font-medium mb-3">Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ComplaintStatus)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as ComplaintPriority)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about the complaint resolution..."
              rows={4}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export const ComplaintReview: React.FC = () => {
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<ComplaintPriority | 'all'>('all')
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'status'>('created')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchComplaints()
  }, [])

  const fetchComplaints = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getAllComplaints()
      setComplaints(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load complaints')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (id: string, updates: {
    status?: ComplaintStatus
    priority?: ComplaintPriority
    adminNotes?: string
  }) => {
    try {
      const updatedComplaint = await AdminService.updateComplaint(id, updates)
      setComplaints(complaints.map(complaint => 
        complaint.id === id ? updatedComplaint : complaint
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update complaint')
    }
  }

  const filteredAndSortedComplaints = complaints
    .filter(complaint => {
      const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter
      return matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
        case 'status':
          const statusOrder = { open: 4, in_progress: 3, resolved: 2, closed: 1 }
          comparison = statusOrder[a.status] - statusOrder[b.status]
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

  const complaintStats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'open').length,
    inProgress: complaints.filter(c => c.status === 'in_progress').length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    closed: complaints.filter(c => c.status === 'closed').length,
    high: complaints.filter(c => c.priority === 'high').length,
    medium: complaints.filter(c => c.priority === 'medium').length,
    low: complaints.filter(c => c.priority === 'low').length
  }

  const averageResolutionTime = () => {
    const resolvedComplaints = complaints.filter(c => c.resolvedAt)
    if (resolvedComplaints.length === 0) return 'N/A'
    
    const totalTime = resolvedComplaints.reduce((sum, complaint) => {
      return sum + (complaint.resolvedAt!.getTime() - complaint.createdAt.getTime())
    }, 0)
    
    const avgMs = totalTime / resolvedComplaints.length
    const avgHours = Math.floor(avgMs / (1000 * 60 * 60))
    const avgDays = Math.floor(avgHours / 24)
    
    if (avgDays > 0) {
      return `${avgDays} day${avgDays > 1 ? 's' : ''}`
    } else {
      return `${avgHours} hour${avgHours > 1 ? 's' : ''}`
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Complaints</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchComplaints}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Complaint Review</h1>
          <p className="text-gray-600 mt-1">Review and manage customer complaints</p>
        </div>
        <button
          onClick={fetchComplaints}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-gray-900">{complaintStats.total}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-red-600">{complaintStats.open}</p>
          <p className="text-sm text-gray-600">Open</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-yellow-600">{complaintStats.inProgress}</p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-green-600">{complaintStats.resolved}</p>
          <p className="text-sm text-gray-600">Resolved</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-red-600">{complaintStats.high}</p>
          <p className="text-sm text-gray-600">High Priority</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-yellow-600">{complaintStats.medium}</p>
          <p className="text-sm text-gray-600">Medium Priority</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-green-600">{complaintStats.low}</p>
          <p className="text-sm text-gray-600">Low Priority</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-lg font-bold text-blue-600">{averageResolutionTime()}</p>
          <p className="text-sm text-gray-600">Avg Resolution</p>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | 'all')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as ComplaintPriority | 'all')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split('-')
                  setSortBy(by as 'created' | 'priority' | 'status')
                  setSortOrder(order as 'asc' | 'desc')
                }}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="created-desc">Newest First</option>
                <option value="created-asc">Oldest First</option>
                <option value="priority-desc">High Priority First</option>
                <option value="priority-asc">Low Priority First</option>
                <option value="status-desc">Open First</option>
                <option value="status-asc">Closed First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      {filteredAndSortedComplaints.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No complaints found</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedComplaints.map((complaint) => (
            <ComplaintCard
              key={complaint.id}
              complaint={complaint}
              onUpdate={handleUpdate}
              onViewDetails={setSelectedComplaint}
            />
          ))}
        </div>
      )}

      {/* Complaint Details Modal */}
      <ComplaintDetailsModal
        complaint={selectedComplaint}
        onClose={() => setSelectedComplaint(null)}
        onUpdate={handleUpdate}
      />
    </div>
  )
}
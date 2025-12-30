import React, { useState, useEffect } from 'react'
import { AdminService, UserManagementData } from '../../services/adminService'
import { UserRole } from '../../types'

interface UserCardProps {
  user: UserManagementData
  onStatusChange: (userId: string, isActive: boolean) => void
  onViewDetails: (user: UserManagementData) => void
}

const UserCard: React.FC<UserCardProps> = ({ user, onStatusChange, onViewDetails }) => {
  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'collector': return 'bg-blue-100 text-blue-800'
      case 'resident': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800'
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never'
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
          <p className="text-sm text-gray-600">{user.email || 'No email'}</p>
          <p className="text-sm text-gray-600">{user.phone}</p>
        </div>
        <div className="flex flex-col items-end space-y-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.isActive)}`}>
            {user.isActive ? 'Active' : 'Suspended'}
          </span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Location:</span>
          <span className="font-medium">{user.location.area}, {user.location.street}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Pickups:</span>
          <span className="font-medium">{user.totalPickups}</span>
        </div>
        {user.role === 'collector' && user.completionRate !== undefined && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Completion Rate:</span>
            <span className={`font-medium ${
              user.completionRate >= 80 ? 'text-green-600' :
              user.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {user.completionRate.toFixed(1)}%
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Complaints:</span>
          <span className="font-medium">{user.totalComplaints}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last Activity:</span>
          <span className="font-medium">{formatDate(user.lastActivity)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Joined:</span>
          <span className="font-medium">{formatDate(user.createdAt)}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(user)}
          className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
        >
          View Details
        </button>
        <button
          onClick={() => onStatusChange(user.id, !user.isActive)}
          className={`flex-1 px-3 py-2 text-sm font-medium rounded transition-colors ${
            user.isActive
              ? 'text-red-600 bg-red-50 hover:bg-red-100'
              : 'text-green-600 bg-green-50 hover:bg-green-100'
          }`}
        >
          {user.isActive ? 'Suspend' : 'Activate'}
        </button>
      </div>
    </div>
  )
}

interface UserDetailsModalProps {
  user: UserManagementData | null
  onClose: () => void
  onStatusChange: (userId: string, isActive: boolean) => void
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ user, onClose, onStatusChange }) => {
  if (!user) return null

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'Never'
    return date.toLocaleString()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">User Details</h2>
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
            <h3 className="text-lg font-medium mb-3">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900">{user.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{user.role}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className={`mt-1 text-sm font-medium ${
                  user.isActive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {user.isActive ? 'Active' : 'Suspended'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">User ID</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Area</label>
                <p className="mt-1 text-sm text-gray-900">{user.location.area}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Street</label>
                <p className="mt-1 text-sm text-gray-900">{user.location.street}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">House Number</label>
                <p className="mt-1 text-sm text-gray-900">{user.location.houseNumber}</p>
              </div>
              {user.location.coordinates && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coordinates</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {user.location.coordinates[0]}, {user.location.coordinates[1]}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Activity Statistics */}
          <div>
            <h3 className="text-lg font-medium mb-3">Activity Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Pickups</label>
                <p className="mt-1 text-sm text-gray-900">{user.totalPickups}</p>
              </div>
              {user.role === 'collector' && user.completionRate !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion Rate</label>
                  <p className={`mt-1 text-sm font-medium ${
                    user.completionRate >= 80 ? 'text-green-600' :
                    user.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {user.completionRate.toFixed(1)}%
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Complaints</label>
                <p className="mt-1 text-sm text-gray-900">{user.totalComplaints}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Activity</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.lastActivity)}</p>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-lg font-medium mb-3">Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created At</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => {
              onStatusChange(user.id, !user.isActive)
              onClose()
            }}
            className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
              user.isActive
                ? 'text-white bg-red-600 hover:bg-red-700'
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
          >
            {user.isActive ? 'Suspend User' : 'Activate User'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserManagementData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserManagementData | null>(null)
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const data = await AdminService.getAllUsers()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (userId: string, isActive: boolean) => {
    try {
      await AdminService.updateUserStatus(userId, isActive)
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user status')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'suspended' && !user.isActive)
    const matchesSearch = searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm) ||
      user.location.area.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesRole && matchesStatus && matchesSearch
  })

  const userStats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    suspended: users.filter(u => !u.isActive).length,
    residents: users.filter(u => u.role === 'resident').length,
    collectors: users.filter(u => u.role === 'collector').length,
    admins: users.filter(u => u.role === 'admin').length
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
          <h3 className="text-red-800 font-semibold">Error Loading Users</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={fetchUsers}
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
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-gray-900">{userStats.total}</p>
          <p className="text-sm text-gray-600">Total Users</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-green-600">{userStats.active}</p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-red-600">{userStats.suspended}</p>
          <p className="text-sm text-gray-600">Suspended</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-blue-600">{userStats.residents}</p>
          <p className="text-sm text-gray-600">Residents</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-purple-600">{userStats.collectors}</p>
          <p className="text-sm text-gray-600">Collectors</p>
        </div>
        <div className="bg-white p-4 rounded-lg border text-center">
          <p className="text-2xl font-bold text-yellow-600">{userStats.admins}</p>
          <p className="text-sm text-gray-600">Admins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Roles</option>
                <option value="resident">Residents</option>
                <option value="collector">Collectors</option>
                <option value="admin">Admins</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
                className="border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, phone, or area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No users found</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onStatusChange={handleStatusChange}
              onViewDetails={setSelectedUser}
            />
          ))}
        </div>
      )}

      {/* User Details Modal */}
      <UserDetailsModal
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}
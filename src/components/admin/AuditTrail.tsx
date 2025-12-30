import React, { useState, useEffect } from 'react'
import { AuditService } from '../../services/auditService'
import { AuditLog, AuditAction, AuditEntityType } from '../../types'

interface AuditTrailProps {
  userId?: string // If provided, show logs for specific user
  entityType?: AuditEntityType // If provided, filter by entity type
  entityId?: string // If provided, show logs for specific entity
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ 
  userId, 
  entityType, 
  entityId 
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [filters, setFilters] = useState({
    action: '' as AuditAction | '',
    entityType: entityType || '' as AuditEntityType | '',
    startDate: '',
    endDate: ''
  })

  const logsPerPage = 25

  useEffect(() => {
    loadAuditLogs()
  }, [currentPage, filters, userId, entityType, entityId])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      let result

      if (entityType && entityId) {
        // Load logs for specific entity
        const entityLogs = await AuditService.getEntityAuditLogs(entityType, entityId)
        result = { logs: entityLogs, total: entityLogs.length }
      } else if (userId) {
        // Load logs for specific user
        result = await AuditService.getUserAuditLogs(userId, currentPage, logsPerPage)
      } else {
        // Load all logs with filters (admin view)
        const filterParams = {
          action: filters.action || undefined,
          entityType: filters.entityType || undefined,
          startDate: filters.startDate ? new Date(filters.startDate) : undefined,
          endDate: filters.endDate ? new Date(filters.endDate) : undefined
        }
        result = await AuditService.getAllAuditLogs(currentPage, logsPerPage, filterParams)
      }

      setLogs(result.logs)
      setTotalLogs(result.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const clearFilters = () => {
    setFilters({
      action: '',
      entityType: entityType || '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
  }

  const formatTimestamp = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(timestamp)
  }

  const getActionColor = (action: AuditAction) => {
    if (action.includes('created')) return 'text-green-600'
    if (action.includes('updated')) return 'text-blue-600'
    if (action.includes('deleted') || action.includes('suspended')) return 'text-red-600'
    if (action.includes('login') || action.includes('logout')) return 'text-purple-600'
    return 'text-gray-600'
  }

  const totalPages = Math.ceil(totalLogs / logsPerPage)

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Audit Logs</h3>
            <div className="mt-2 text-sm text-red-700">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Audit Trail
            {userId && <span className="text-sm text-gray-500 ml-2">(User Specific)</span>}
            {entityType && entityId && (
              <span className="text-sm text-gray-500 ml-2">
                ({entityType}: {entityId})
              </span>
            )}
          </h3>

          {/* Filters */}
          {!entityId && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Actions</option>
                  <option value="user_created">User Created</option>
                  <option value="user_updated">User Updated</option>
                  <option value="user_suspended">User Suspended</option>
                  <option value="login_success">Login Success</option>
                  <option value="login_failed">Login Failed</option>
                  <option value="pickup_completed">Pickup Completed</option>
                  <option value="complaint_created">Complaint Created</option>
                  <option value="payment_created">Payment Created</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Entity Type</label>
                <select
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">All Types</option>
                  <option value="user">User</option>
                  <option value="subscription">Subscription</option>
                  <option value="pickup_request">Pickup Request</option>
                  <option value="payment">Payment</option>
                  <option value="complaint">Complaint</option>
                  <option value="system">System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{log.entityType}</div>
                        {log.entityId && (
                          <div className="text-gray-500 text-xs">{log.entityId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.userId}
                      {log.ipAddress && (
                        <div className="text-gray-500 text-xs">{log.ipAddress}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {log.metadata && (
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-800">
                            View Details
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-w-xs">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                      {log.oldData && log.newData && (
                        <details className="cursor-pointer mt-1">
                          <summary className="text-green-600 hover:text-green-800">
                            View Changes
                          </summary>
                          <div className="mt-2 text-xs space-y-1">
                            <div className="bg-red-50 p-2 rounded">
                              <strong>Before:</strong>
                              <pre className="overflow-auto max-w-xs">
                                {JSON.stringify(log.oldData, null, 2)}
                              </pre>
                            </div>
                            <div className="bg-green-50 p-2 rounded">
                              <strong>After:</strong>
                              <pre className="overflow-auto max-w-xs">
                                {JSON.stringify(log.newData, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {logs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No audit logs found.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * logsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * logsPerPage, totalLogs)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{totalLogs}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuditTrail
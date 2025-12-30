import React, { useState, useEffect } from 'react'
import { AdminService, AreaMetrics } from '../../services/adminService'

interface AreaCardProps {
  area: AreaMetrics
  isHighComplaint: boolean
}

const AreaCard: React.FC<AreaCardProps> = ({ area, isHighComplaint }) => {
  const getCompletionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getComplaintRateColor = (rate: number) => {
    if (rate <= 10) return 'text-green-600'
    if (rate <= 25) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${
      isHighComplaint 
        ? 'border-red-300 bg-red-50' 
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{area.area}</h3>
        {isHighComplaint && (
          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
            High Complaints
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Pickups</p>
          <p className="text-2xl font-bold text-gray-900">{area.totalPickups}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Complaints</p>
          <p className="text-2xl font-bold text-gray-900">{area.totalComplaints}</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Completion Rate:</span>
          <span className={`font-semibold ${getCompletionRateColor(area.completionRate)}`}>
            {area.completionRate.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Complaint Rate:</span>
          <span className={`font-semibold ${getComplaintRateColor(area.complaintRate)}`}>
            {area.complaintRate.toFixed(1)}%
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Completed:</span>
          <span className="font-semibold text-green-600">{area.completedPickups}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Missed:</span>
          <span className="font-semibold text-red-600">{area.missedPickups}</span>
        </div>
      </div>

      {/* Progress bars */}
      <div className="mt-4 space-y-2">
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Completion Progress</span>
            <span>{area.completionRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                area.completionRate >= 80 ? 'bg-green-500' :
                area.completionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(area.completionRate, 100)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Complaint Rate</span>
            <span>{area.complaintRate.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                area.complaintRate <= 10 ? 'bg-green-500' :
                area.complaintRate <= 25 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(area.complaintRate, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

const AreaSummaryTable: React.FC<{ areas: AreaMetrics[] }> = ({ areas }) => {
  const [sortBy, setSortBy] = useState<keyof AreaMetrics>('complaintRate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const sortedAreas = [...areas].sort((a, b) => {
    const aValue = a[sortBy]
    const bValue = b[sortBy]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const handleSort = (column: keyof AreaMetrics) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const getSortIcon = (column: keyof AreaMetrics) => {
    if (sortBy !== column) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h3 className="text-lg font-semibold">Area Performance Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('area')}
              >
                Area {getSortIcon('area')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalPickups')}
              >
                Total Pickups {getSortIcon('totalPickups')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('completionRate')}
              >
                Completion Rate {getSortIcon('completionRate')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('totalComplaints')}
              >
                Complaints {getSortIcon('totalComplaints')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('complaintRate')}
              >
                Complaint Rate {getSortIcon('complaintRate')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedAreas.map((area, index) => (
              <tr key={area.area} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {area.area}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {area.totalPickups}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-semibold ${
                    area.completionRate >= 80 ? 'text-green-600' :
                    area.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {area.completionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {area.totalComplaints}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`font-semibold ${
                    area.complaintRate <= 10 ? 'text-green-600' :
                    area.complaintRate <= 25 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {area.complaintRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {area.complaintRate > 25 ? (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      High Risk
                    </span>
                  ) : area.complaintRate > 10 ? (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Monitor
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                      Good
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export const AreaMonitoring: React.FC = () => {
  const [areas, setAreas] = useState<AreaMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  useEffect(() => {
    const fetchAreaMetrics = async () => {
      try {
        setLoading(true)
        const data = await AdminService.getAreaMetrics()
        setAreas(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load area metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchAreaMetrics()
  }, [])

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
          <h3 className="text-red-800 font-semibold">Error Loading Area Monitoring</h3>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const highComplaintAreas = areas.filter(area => area.complaintRate > 25)
  const averageComplaintRate = areas.length > 0 
    ? areas.reduce((sum, area) => sum + area.complaintRate, 0) / areas.length 
    : 0
  const averageCompletionRate = areas.length > 0
    ? areas.reduce((sum, area) => sum + area.completionRate, 0) / areas.length
    : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Area Monitoring</h1>
          <p className="text-gray-600 mt-1">Geographic performance analysis and complaint tracking</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm font-medium text-gray-600">Total Areas</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{areas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm font-medium text-gray-600">High-Complaint Areas</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{highComplaintAreas.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm font-medium text-gray-600">Avg Completion Rate</p>
          <p className={`text-3xl font-bold mt-1 ${
            averageCompletionRate >= 80 ? 'text-green-600' :
            averageCompletionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {averageCompletionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <p className="text-sm font-medium text-gray-600">Avg Complaint Rate</p>
          <p className={`text-3xl font-bold mt-1 ${
            averageComplaintRate <= 10 ? 'text-green-600' :
            averageComplaintRate <= 25 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {averageComplaintRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* High-Complaint Areas Alert */}
      {highComplaintAreas.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                High-Complaint Areas Detected
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {highComplaintAreas.length} area{highComplaintAreas.length > 1 ? 's' : ''} 
                {' '}ha{highComplaintAreas.length > 1 ? 've' : 's'} complaint rates above 25%. 
                Immediate attention recommended: {highComplaintAreas.map(a => a.area).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Area Data */}
      {areas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No area data available</p>
          <p className="text-gray-400 mt-2">Area metrics will appear here once pickup requests are created</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area) => (
            <AreaCard
              key={area.area}
              area={area}
              isHighComplaint={area.complaintRate > 25}
            />
          ))}
        </div>
      ) : (
        <AreaSummaryTable areas={areas} />
      )}
    </div>
  )
}
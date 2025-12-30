import React, { useState, useEffect } from 'react'
import { AdminService, AdminMetrics } from '../../services/adminService'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  trend, 
  color = 'blue' 
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  }

  const trendIcons = {
    up: '↗️',
    down: '↘️',
    neutral: '→'
  }

  return (
    <div className={`p-6 rounded-lg border-2 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm opacity-60 mt-1">{subtitle}</p>
          )}
        </div>
        {trend && (
          <div className="text-2xl">
            {trendIcons[trend]}
          </div>
        )}
      </div>
    </div>
  )
}

interface ChartData {
  label: string
  value: number
  color: string
}

const SimpleBarChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value))

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-20 text-sm font-medium text-gray-600 mr-3">
              {item.label}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-4 mr-3">
              <div
                className="h-4 rounded-full transition-all duration-300"
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color
                }}
              />
            </div>
            <div className="w-12 text-sm font-semibold text-right">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SimplePieChart: React.FC<{ data: ChartData[]; title: string }> = ({ data, title }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="bg-white p-6 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100
              const strokeDasharray = `${percentage} ${100 - percentage}`
              const strokeDashoffset = data
                .slice(0, index)
                .reduce((sum, prevItem) => sum + (prevItem.value / total) * 100, 0)

              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={-strokeDashoffset}
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
        </div>
      </div>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
            <span className="text-sm font-semibold">
              {item.value} ({Math.round((item.value / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const data = await AdminService.getMetrics()
        setMetrics(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load metrics')
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
  }, [])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg" />
            <div className="h-64 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-semibold">Error Loading Dashboard</h3>
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

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">No data available</div>
      </div>
    )
  }

  const pickupChartData: ChartData[] = [
    { label: 'Completed', value: metrics.completedPickups, color: '#10B981' },
    { label: 'Missed', value: metrics.missedPickups, color: '#EF4444' },
    { label: 'Pending', value: metrics.pendingPickups, color: '#F59E0B' }
  ]

  const complaintChartData: ChartData[] = [
    { label: 'Open', value: metrics.openComplaints, color: '#EF4444' },
    { label: 'Resolved', value: metrics.resolvedComplaints, color: '#10B981' }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of system performance and metrics</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics.totalCustomers}
          subtitle="Active residents"
          color="blue"
          trend="up"
        />
        <MetricCard
          title="Pickup Completion Rate"
          value={`${metrics.completionRate.toFixed(1)}%`}
          subtitle={`${metrics.completedPickups}/${metrics.totalPickups} completed`}
          color={metrics.completionRate >= 80 ? 'green' : metrics.completionRate >= 60 ? 'yellow' : 'red'}
          trend={metrics.completionRate >= 80 ? 'up' : 'down'}
        />
        <MetricCard
          title="Open Complaints"
          value={metrics.openComplaints}
          subtitle={`${metrics.totalComplaints} total complaints`}
          color={metrics.openComplaints === 0 ? 'green' : metrics.openComplaints <= 5 ? 'yellow' : 'red'}
          trend={metrics.openComplaints === 0 ? 'neutral' : 'up'}
        />
        <MetricCard
          title="Total Revenue"
          value={`₦${metrics.totalRevenue.toLocaleString()}`}
          subtitle="Completed payments"
          color="green"
          trend="up"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleBarChart
          title="Pickup Status Distribution"
          data={pickupChartData}
        />
        <SimplePieChart
          title="Complaint Status"
          data={complaintChartData}
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Pickup Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Pickups:</span>
              <span className="font-semibold">{metrics.totalPickups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-semibold text-green-600">{metrics.completedPickups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Missed:</span>
              <span className="font-semibold text-red-600">{metrics.missedPickups}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold text-yellow-600">{metrics.pendingPickups}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Complaint Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Complaints:</span>
              <span className="font-semibold">{metrics.totalComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Open:</span>
              <span className="font-semibold text-red-600">{metrics.openComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolved:</span>
              <span className="font-semibold text-green-600">{metrics.resolvedComplaints}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resolution Rate:</span>
              <span className="font-semibold">
                {metrics.totalComplaints > 0 
                  ? `${((metrics.resolvedComplaints / metrics.totalComplaints) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Performance Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Customers:</span>
              <span className="font-semibold">{metrics.totalCustomers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completion Rate:</span>
              <span className={`font-semibold ${
                metrics.completionRate >= 80 ? 'text-green-600' : 
                metrics.completionRate >= 60 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue:</span>
              <span className="font-semibold text-green-600">
                ₦{metrics.totalRevenue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Revenue/Customer:</span>
              <span className="font-semibold">
                ₦{metrics.totalCustomers > 0 
                  ? Math.round(metrics.totalRevenue / metrics.totalCustomers).toLocaleString()
                  : '0'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
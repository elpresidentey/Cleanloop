import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  height?: string
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className = '', 
  lines = 1,
  height = 'h-4'
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div 
          key={index} 
          className={`bg-gray-200 rounded ${height} ${index > 0 ? 'mt-2' : ''}`}
        />
      ))}
    </div>
  )
}

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <LoadingSkeleton className="w-64 h-8 mb-2" />
            <LoadingSkeleton className="w-96 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Skeleton */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscription Status Skeleton */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <LoadingSkeleton className="w-48 h-6 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <LoadingSkeleton className="w-24 h-4" />
                      <LoadingSkeleton className="w-32 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Pickup Skeleton */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <LoadingSkeleton className="w-32 h-6 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <LoadingSkeleton className="w-28 h-4" />
                      <LoadingSkeleton className="w-36 h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-8">
            {/* Account Information Skeleton */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <LoadingSkeleton className="w-40 h-6 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index}>
                      <LoadingSkeleton className="w-16 h-4 mb-1" />
                      <LoadingSkeleton className="w-full h-4" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions Skeleton */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <LoadingSkeleton className="w-32 h-6 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <LoadingSkeleton key={index} className="w-full h-10" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="mt-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <LoadingSkeleton className="w-48 h-6 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex space-x-3">
                    <LoadingSkeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <LoadingSkeleton className="w-3/4 h-4 mb-2" />
                      <LoadingSkeleton className="w-1/2 h-3" />
                    </div>
                    <LoadingSkeleton className="w-20 h-4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
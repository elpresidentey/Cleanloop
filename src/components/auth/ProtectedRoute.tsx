import React, { useState, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requireAuth?: boolean
  redirectTo?: string
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  requireAuth = true,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, profile, loading } = useAuth()
  const location = useLocation()
  const [maxLoadingReached, setMaxLoadingReached] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMaxLoadingReached(true)
    }, 2000) // Maximum 2 seconds loading

    return () => clearTimeout(timer)
  }, [])

  // Show loading spinner for a limited time
  if (loading && !maxLoadingReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If loading has taken too long and we need auth, redirect to login
  if (maxLoadingReached && requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check if authentication is required and user is not authenticated
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />
  }

  // Check if specific roles are required
  if (requiredRoles.length > 0 && profile) {
    const hasRequiredRole = requiredRoles.includes(profile.role)
    if (!hasRequiredRole) {
      // Redirect to appropriate dashboard based on user role
      const roleDashboards = {
        resident: '/resident/dashboard',
        collector: '/collector/dashboard',
        admin: '/admin/dashboard'
      }
      return <Navigate to={roleDashboards[profile.role]} replace />
    }
  }

  return <>{children}</>
}
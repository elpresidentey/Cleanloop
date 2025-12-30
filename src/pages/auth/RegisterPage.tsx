import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegistrationForm } from '../../components/auth/RegistrationForm'
import { useAuth } from '../../hooks/useAuth'
import { HeroSection } from '../../components/common/HeroSection'

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const handleRegistrationSuccess = () => {
    // Navigate to appropriate dashboard based on role
    const dashboardRoute = getDashboardRoute(profile?.role)
    navigate(dashboardRoute, { replace: true })
  }

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection showActions={false} />
      
      {/* Registration Form Section */}
      <div className="relative -mt-20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Create your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Join thousands of satisfied residents using CleanLoop
              </p>
            </div>
            
            <RegistrationForm 
              onSuccess={handleRegistrationSuccess}
              onError={handleRegistrationError}
            />
            
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>
              
              <div className="mt-6">
                <Link
                  to="/login"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Sign in to existing account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function getDashboardRoute(role?: string): string {
  switch (role) {
    case 'resident':
      return '/resident/dashboard'
    case 'collector':
      return '/collector/dashboard'
    case 'admin':
      return '/admin/dashboard'
    default:
      return '/dashboard'
  }
}
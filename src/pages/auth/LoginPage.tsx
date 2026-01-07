import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LoginForm } from '../../components/auth/LoginForm'
import { useAuth } from '../../hooks/useAuth'
import { HeroSection } from '../../components/common/HeroSection'

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile } = useAuth()

  const from = location.state?.from?.pathname || getDashboardRoute(profile?.role)

  const handleLoginSuccess = () => {
    navigate(from, { replace: true })
  }

  const handleLoginError = (error: string) => {
    console.error('Login error:', error)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection showActions={false} />

      {/* Login Form Section */}
      <div className="relative -mt-20 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Sign in to your account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Access your waste collection management dashboard
              </p>
            </div>

            <LoginForm
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
            />

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don&apos;t have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/register"
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  Create new account
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
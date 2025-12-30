import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface ResidentLayoutProps {
  children: React.ReactNode
}

export const ResidentLayout: React.FC<ResidentLayoutProps> = ({ children }) => {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const getHomeUrl = () => {
    if (!profile) return '/login'
    switch (profile.role) {
      case 'resident':
        return '/resident/dashboard'
      case 'collector':
        return '/collector/dashboard'
      case 'admin':
        return '/admin/dashboard'
      default:
        return '/resident/dashboard'
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/resident/dashboard' },
    { name: 'Pickups', href: '/resident/pickup-requests' },
    { name: 'Subscription', href: '/resident/subscription' },
    { name: 'Payments', href: '/resident/payment-history' },
    { name: 'Complaints', href: '/resident/complaints' },
    { name: 'Location', href: '/resident/location' },
  ]

  const isActive = (href: string) => location.pathname === href

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-full mx-auto px-2 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link 
                to={getHomeUrl()} 
                className="inline-block hover:opacity-80 transition-opacity duration-200"
              >
                <h1 className="text-lg sm:text-xl font-bold text-green-600 tracking-tight cursor-pointer">CleanLoop</h1>
              </Link>
            </div>

            {/* Navigation container */}
            <div className="flex-1 flex justify-center mx-4">
              {/* Desktop navigation */}
              <div className="hidden sm:flex space-x-1 md:space-x-2 lg:space-x-3 flex-1 justify-center">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-2 py-2 text-xs md:text-sm font-medium transition-colors duration-200 whitespace-nowrap rounded-md ${
                      isActive(item.href)
                        ? 'bg-green-50 text-green-700 font-semibold'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <span className="text-xs sm:text-sm text-gray-600 font-medium whitespace-nowrap hidden sm:block">
                Hi, {profile?.name?.split(' ')[0] || 'User'}
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 whitespace-nowrap"
              >
                Sign Out
              </button>

              {/* Mobile menu button */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="bg-white p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                >
                  <span className="sr-only">Open main menu</span>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1 bg-gray-50">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block pl-3 pr-4 py-3 border-l-4 text-base font-medium transition-colors duration-200 ${
                    isActive(item.href)
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300 hover:text-gray-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="pt-4 pb-3 border-t border-gray-200 bg-gray-50">
              <div className="px-4">
                <div className="text-base font-semibold text-gray-800">{profile?.name}</div>
                <div className="text-sm text-gray-500">{profile?.email}</div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 w-full text-left transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="w-full max-w-full">
          {children}
        </div>
      </main>
    </div>
  )
}
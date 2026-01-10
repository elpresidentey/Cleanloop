import React from 'react'
import { Link } from 'react-router-dom'

interface HeroSectionProps {
  userName?: string
  location?: string
  showActions?: boolean
}

export const HeroSection: React.FC<HeroSectionProps> = ({ 
  userName, 
  location, 
  showActions = true 
}) => {
  return (
    <div className="relative bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-black opacity-10"></div>
      <div className="absolute inset-0" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="text-center lg:text-left">
          {/* Main Content */}
          <div className="max-w-4xl mx-auto lg:mx-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight">
              {userName ? (
                <>
                  Welcome back,{' '}
                  <span className="text-green-200">{userName.split(' ')[0]}</span>
                </>
              ) : (
                <>
                  Clean Environment,{' '}
                  <span className="text-green-200">Better Future</span>
                </>
              )}
            </h1>
            
            <p className="mt-4 text-base sm:text-lg text-green-100 max-w-3xl mx-auto lg:mx-0">
              {userName ? (
                <>
                  Your waste collection dashboard is ready. Manage pickups, track payments, and keep your environment clean.
                  {location && (
                    <span className="block mt-2 text-sm text-green-200">
                      📍 {location}
                    </span>
                  )}
                </>
              ) : (
                'Professional waste collection services for a cleaner, healthier community. Join thousands of satisfied residents.'
              )}
            </p>

            {showActions && (
              <div className="mt-6 flex justify-center lg:justify-start">
                <Link
                  to="/resident/pickup-requests"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Request Pickup
                </Link>
              </div>
            )}
          </div>

          {/* Feature Icons */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto lg:mx-0">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Scheduled</h3>
              <p className="text-green-200 text-xs">Regular pickups</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Reliable</h3>
              <p className="text-green-200 text-xs">On-time service</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Affordable</h3>
              <p className="text-green-200 text-xs">Fair pricing</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 mx-auto bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white">Eco-Friendly</h3>
              <p className="text-green-200 text-xs">Green practices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white bg-opacity-10 rounded-full"></div>
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-white bg-opacity-5 rounded-full"></div>
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white bg-opacity-5 rounded-full"></div>
    </div>
  )
}
import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PasswordResetForm } from '../../components/auth'

export const PasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const accessToken = searchParams.get('access_token')
  const refreshToken = searchParams.get('refresh_token')
  const type = searchParams.get('type')
  
  // Determine if this is a reset request or actual reset
  const isResetMode = type === 'recovery' && accessToken && refreshToken

  const handleSuccess = () => {
    if (isResetMode) {
      // Redirect to login page after successful password reset
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successfully. Please sign in with your new password.' }
        })
      }, 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m0 0a2 2 0 01-2 2m2-2h.01M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isResetMode ? 'Set New Password' : 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isResetMode 
              ? 'Enter your new password below'
              : 'Enter your email address and we\'ll send you a link to reset your password'
            }
          </p>
        </div>

        <PasswordResetForm
          mode={isResetMode ? 'reset' : 'request'}
          accessToken={accessToken || undefined}
          refreshToken={refreshToken || undefined}
          onSuccess={handleSuccess}
          className="mt-8"
        />

        <div className="text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}

export default PasswordResetPage
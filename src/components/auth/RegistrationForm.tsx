import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { CreateUserInput, UserRole } from '../../types'
import { CreateUserSchema } from '../../types'
import { PasswordService } from '../../services/passwordService'
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator'

interface RegistrationFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  defaultRole?: UserRole
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  onSuccess,
  onError,
  defaultRole = 'resident'
}) => {
  const { signUp, loading } = useAuth()
  const [formData, setFormData] = useState<CreateUserInput>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: defaultRole,
    location: {
      area: '',
      street: '',
      houseNumber: ''
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const validateForm = (): boolean => {
    try {
      // First validate with Zod schema
      CreateUserSchema.parse(formData)
      
      // Then validate password strength
      const passwordStrength = PasswordService.validatePasswordStrength(formData.password)
      if (!passwordStrength.isValid) {
        setErrors({ password: passwordStrength.feedback.join(', ') })
        return false
      }
      
      setErrors({})
      return true
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {}
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.')
          fieldErrors[path] = err.message
        })
      }
      setErrors(fieldErrors)
      return false
    }
  }

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('location.')) {
      const locationField = field.split('.')[1]
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const { user, error } = await signUp(formData)
      
      if (error) {
        const errorMessage = error.message || 'Registration failed'
        setErrors({ submit: errorMessage })
        onError?.(errorMessage)
      } else if (user) {
        onSuccess?.()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      setErrors({ submit: errorMessage })
      onError?.(errorMessage)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-8 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter your full name"
              disabled={loading}
            />
            {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="Enter your email address"
              disabled={loading}
            />
            {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
          </div>

          {/* Phone Field */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="e.g., +2348012345678 or 08012345678"
              disabled={loading}
            />
            {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className={`w-full px-4 py-3 pr-12 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter a secure password"
                disabled={loading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            
            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3">
                <PasswordStrengthIndicator password={formData.password} />
              </div>
            )}
          </div>

          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Account Type
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.role ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              disabled={loading}
            >
              <option value="resident">Resident - I need waste collection services</option>
              <option value="collector">Collector - I provide waste collection services</option>
              <option value="admin">Admin - I manage the platform</option>
            </select>
            {errors.role && <p className="mt-2 text-sm text-red-600">{errors.role}</p>}
          </div>

          {/* Location Fields */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location Information</h3>
            
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Area/District
              </label>
              <input
                type="text"
                id="area"
                value={formData.location.area}
                onChange={(e) => handleInputChange('location.area', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors['location.area'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="e.g., Victoria Island, Ikeja, Lekki"
                disabled={loading}
              />
              {errors['location.area'] && <p className="mt-2 text-sm text-red-600">{errors['location.area']}</p>}
            </div>

            <div>
              <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                Street Name
              </label>
              <input
                type="text"
                id="street"
                value={formData.location.street}
                onChange={(e) => handleInputChange('location.street', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors['location.street'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter street name"
                disabled={loading}
              />
              {errors['location.street'] && <p className="mt-2 text-sm text-red-600">{errors['location.street']}</p>}
            </div>

            <div>
              <label htmlFor="houseNumber" className="block text-sm font-medium text-gray-700 mb-2">
                House Number
              </label>
              <input
                type="text"
                id="houseNumber"
                value={formData.location.houseNumber}
                onChange={(e) => handleInputChange('location.houseNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors['location.houseNumber'] ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                placeholder="Enter house number"
                disabled={loading}
              />
              {errors['location.houseNumber'] && <p className="mt-2 text-sm text-red-600">{errors['location.houseNumber']}</p>}
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-700">{errors.submit}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
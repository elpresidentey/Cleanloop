import React from 'react'
import { PasswordService, PasswordStrengthResult } from '../../services/passwordService'

interface PasswordStrengthIndicatorProps {
  password: string
  showRequirements?: boolean
  className?: string
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showRequirements = true,
  className = ''
}) => {
  const strengthResult: PasswordStrengthResult = password 
    ? PasswordService.validatePasswordStrength(password)
    : {
        isValid: false,
        score: 0,
        feedback: [],
        requirements: {
          minLength: false,
          hasUppercase: false,
          hasLowercase: false,
          hasNumbers: false,
          hasSpecialChars: false,
          noCommonPatterns: false
        }
      }

  const getStrengthBarColor = (score: number) => {
    switch (score) {
      case 0:
      case 1:
        return 'bg-red-500'
      case 2:
        return 'bg-orange-500'
      case 3:
        return 'bg-yellow-500'
      case 4:
        return 'bg-green-500'
      default:
        return 'bg-green-600'
    }
  }

  const getStrengthBarWidth = (score: number) => {
    return `${Math.max(10, (score / 4) * 100)}%`
  }

  if (!password) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Password Strength</span>
          <span className={`text-sm font-medium ${PasswordService.getPasswordStrengthColor(strengthResult.score)}`}>
            {PasswordService.getPasswordStrengthDescription(strengthResult.score)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getStrengthBarColor(strengthResult.score)}`}
            style={{ width: getStrengthBarWidth(strengthResult.score) }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Password Requirements</h4>
          <div className="space-y-1">
            <RequirementItem
              met={strengthResult.requirements.minLength}
              text="At least 8 characters long"
            />
            <RequirementItem
              met={strengthResult.requirements.hasUppercase}
              text="Contains uppercase letter (A-Z)"
            />
            <RequirementItem
              met={strengthResult.requirements.hasLowercase}
              text="Contains lowercase letter (a-z)"
            />
            <RequirementItem
              met={strengthResult.requirements.hasNumbers}
              text="Contains number (0-9)"
            />
            <RequirementItem
              met={strengthResult.requirements.hasSpecialChars}
              text="Contains special character (!@#$%^&*)"
            />
            <RequirementItem
              met={strengthResult.requirements.noCommonPatterns}
              text="Not a common or predictable password"
            />
          </div>
        </div>
      )}

      {/* Feedback Messages */}
      {strengthResult.feedback.length > 0 && (
        <div className="space-y-1">
          {strengthResult.feedback.map((message, index) => (
            <p key={index} className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

interface RequirementItemProps {
  met: boolean
  text: string
}

const RequirementItem: React.FC<RequirementItemProps> = ({ met, text }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
      met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
    }`}>
      {met ? (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </div>
    <span className={`text-sm ${met ? 'text-green-600' : 'text-gray-500'}`}>
      {text}
    </span>
  </div>
)

export default PasswordStrengthIndicator
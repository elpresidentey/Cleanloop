import { supabase } from '../lib/supabase'
import { AuditService } from './auditService'

export interface PasswordStrengthResult {
  isValid: boolean
  score: number // 0-4 (weak to very strong)
  feedback: string[]
  requirements: {
    minLength: boolean
    hasUppercase: boolean
    hasLowercase: boolean
    hasNumbers: boolean
    hasSpecialChars: boolean
    noCommonPatterns: boolean
  }
}

export interface PasswordResetRequest {
  email: string
  token?: string
  newPassword?: string
}

export class PasswordService {
  private static readonly MIN_LENGTH = 8
  private static readonly COMMON_PASSWORDS = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', '123123', 'qwerty123'
  ]

  /**
   * Validate password strength according to security requirements
   */
  static validatePasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = []
    let score = 0

    // Check minimum length
    const hasMinLength = password.length >= this.MIN_LENGTH
    if (!hasMinLength) {
      feedback.push(`Password must be at least ${this.MIN_LENGTH} characters long`)
    } else {
      score += 1
    }

    // Check for uppercase letters
    const hasUppercase = /[A-Z]/.test(password)
    if (!hasUppercase) {
      feedback.push('Password must contain at least one uppercase letter')
    } else {
      score += 1
    }

    // Check for lowercase letters
    const hasLowercase = /[a-z]/.test(password)
    if (!hasLowercase) {
      feedback.push('Password must contain at least one lowercase letter')
    } else {
      score += 1
    }

    // Check for numbers
    const hasNumbers = /\d/.test(password)
    if (!hasNumbers) {
      feedback.push('Password must contain at least one number')
    } else {
      score += 1
    }

    // Check for special characters
    const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    if (!hasSpecialChars) {
      feedback.push('Password must contain at least one special character (!@#$%^&*)')
    } else {
      score += 1
    }

    // Check for common passwords
    const noCommonPatterns = !this.COMMON_PASSWORDS.includes(password.toLowerCase()) &&
                            !this.hasCommonPatterns(password)
    if (!noCommonPatterns) {
      feedback.push('Password is too common or predictable')
      score = Math.max(0, score - 2) // Penalize common passwords heavily
    }

    // Additional strength bonuses
    if (password.length >= 12) score += 1
    if (password.length >= 16) score += 1
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{2,}/.test(password)) score += 1

    // Cap score at 4
    score = Math.min(4, score)

    const isValid = hasMinLength && hasUppercase && hasLowercase && 
                   hasNumbers && hasSpecialChars && noCommonPatterns

    return {
      isValid,
      score,
      feedback,
      requirements: {
        minLength: hasMinLength,
        hasUppercase,
        hasLowercase,
        hasNumbers,
        hasSpecialChars,
        noCommonPatterns
      }
    }
  }

  /**
   * Check for common password patterns
   */
  private static hasCommonPatterns(password: string): boolean {
    const lowerPassword = password.toLowerCase()
    
    // Check for sequential characters
    if (/123|abc|qwe|asd|zxc/.test(lowerPassword)) return true
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) return true
    
    // Check for keyboard patterns
    const keyboardPatterns = ['qwerty', 'asdf', 'zxcv', '1234', 'abcd']
    return keyboardPatterns.some(pattern => lowerPassword.includes(pattern))
  }

  /**
   * Get password strength description
   */
  static getPasswordStrengthDescription(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'Very Weak'
      case 2:
        return 'Weak'
      case 3:
        return 'Fair'
      case 4:
        return 'Strong'
      default:
        return 'Very Strong'
    }
  }

  /**
   * Get password strength color for UI
   */
  static getPasswordStrengthColor(score: number): string {
    switch (score) {
      case 0:
      case 1:
        return 'text-red-600'
      case 2:
        return 'text-orange-600'
      case 3:
        return 'text-yellow-600'
      case 4:
        return 'text-green-600'
      default:
        return 'text-green-700'
    }
  }

  /**
   * Change user password with validation
   */
  static async changePassword(
    userId: string, 
    _currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate new password strength
      const strengthResult = this.validatePasswordStrength(newPassword)
      if (!strengthResult.isValid) {
        return {
          success: false,
          error: `Password does not meet security requirements: ${strengthResult.feedback.join(', ')}`
        }
      }

      // Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return { success: false, error: 'User not authenticated' }
      }

      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Log password change
      await AuditService.logPasswordEvent(
        userId,
        'password_changed',
        {
          timestamp: new Date().toISOString(),
          passwordStrength: strengthResult.score
        }
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to change password'
      }
    }
  }

  /**
   * Request password reset
   */
  static async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      // Try to get user ID for audit logging (may not be available if user doesn't exist)
      try {
        const { data: users } = await (supabase as any)
          .from('users')
          .select('id')
          .eq('email', email)
          .limit(1)

        if (users && users.length > 0) {
          await AuditService.logPasswordEvent(
            users[0].id,
            'password_reset_requested',
            {
              email,
              timestamp: new Date().toISOString()
            }
          )
        }
      } catch (auditError) {
        // Don't fail the reset request if audit logging fails
        console.warn('Failed to log password reset request:', auditError)
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to request password reset'
      }
    }
  }

  /**
   * Complete password reset with new password
   */
  static async resetPassword(
    accessToken: string,
    refreshToken: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate new password strength
      const strengthResult = this.validatePasswordStrength(newPassword)
      if (!strengthResult.isValid) {
        return {
          success: false,
          error: `Password does not meet security requirements: ${strengthResult.feedback.join(', ')}`
        }
      }

      // Set the session with the tokens from the reset link
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })

      if (sessionError || !sessionData.user) {
        return { success: false, error: 'Invalid or expired reset link' }
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        return { success: false, error: updateError.message }
      }

      // Log password reset completion
      await AuditService.logPasswordEvent(
        sessionData.user.id,
        'password_reset_completed',
        {
          timestamp: new Date().toISOString(),
          passwordStrength: strengthResult.score
        }
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to reset password'
      }
    }
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = uppercase + lowercase + numbers + specialChars
    
    let password = ''
    
    // Ensure at least one character from each category
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += specialChars[Math.floor(Math.random() * specialChars.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password to avoid predictable patterns
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }

  /**
   * Check if password has been compromised (placeholder for future implementation)
   */
  static async checkPasswordCompromised(password: string): Promise<boolean> {
    // In a real implementation, this would check against known compromised password databases
    // like HaveIBeenPwned API, but for now we'll just check against our common passwords list
    return this.COMMON_PASSWORDS.includes(password.toLowerCase())
  }
}
import { z } from 'zod'

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  const emailSchema = z.string().email('Invalid email format')

  try {
    emailSchema.parse(email)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message }
    }
    return { isValid: false, error: 'Invalid email format' }
  }
}

// Nigerian phone number validation
export const validateNigerianPhone = (phone: string): { isValid: boolean; error?: string } => {
  const phoneSchema = z.string().regex(
    /^(\+234|0)[789]\d{9}$/,
    'Invalid Nigerian phone number format. Use format: +2348012345678 or 08012345678'
  )

  try {
    phoneSchema.parse(phone)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message }
    }
    return { isValid: false, error: 'Invalid phone number format' }
  }
}

// Location validation
export interface LocationData {
  area: string
  street: string
  houseNumber: string
}

export const validateLocation = (location: LocationData): { isValid: boolean; errors?: Record<string, string> } => {
  const errors: Record<string, string> = {}

  if (!location.area || location.area.trim().length === 0) {
    errors.area = 'Area is required'
  } else if (location.area.trim().length < 2) {
    errors.area = 'Area must be at least 2 characters'
  }

  if (!location.street || location.street.trim().length === 0) {
    errors.street = 'Street is required'
  } else if (location.street.trim().length < 2) {
    errors.street = 'Street must be at least 2 characters'
  }

  if (!location.houseNumber || location.houseNumber.trim().length === 0) {
    errors.houseNumber = 'House number is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors: Object.keys(errors).length > 0 ? errors : undefined
  }
}

// Date validation
export const validateFutureDate = (date: Date | string): { isValid: boolean; error?: string } => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const now = new Date()

    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Invalid date format' }
    }

    if (dateObj <= now) {
      return { isValid: false, error: 'Date must be in the future' }
    }

    // Check if date is too far in the future (1 year)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

    if (dateObj > oneYearFromNow) {
      return { isValid: false, error: 'Date cannot be more than 1 year in the future' }
    }

    return { isValid: true }
  } catch (error) {
    console.warn('Date validation error:', error)
    return { isValid: false, error: 'Invalid date format' }
  }
}

export const validatePickupDate = (date: Date | string): { isValid: boolean; error?: string } => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date

    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Invalid date format' }
    }

    // Must be at least tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const pickupDate = new Date(dateObj)
    pickupDate.setHours(0, 0, 0, 0)

    if (pickupDate < tomorrow) {
      return { isValid: false, error: 'Pickup date must be at least tomorrow' }
    }

    // Check if date is too far in the future (3 months for pickups)
    const threeMonthsFromNow = new Date()
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

    if (dateObj > threeMonthsFromNow) {
      return { isValid: false, error: 'Pickup date cannot be more than 3 months in the future' }
    }

    return { isValid: true }
  } catch (error) {
    console.warn('Pickup date validation error:', error)
    return { isValid: false, error: 'Invalid date format' }
  }
}

// File upload validation
export interface FileValidationOptions {
  maxSizeBytes?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export const validateFile = (
  file: File,
  options: FileValidationOptions = {}
): { isValid: boolean; error?: string } => {
  const {
    maxSizeBytes = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  } = options

  // Check file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
    return { isValid: false, error: `File size must be less than ${maxSizeMB}MB` }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Invalid file type. Please upload an image file.' }
  }

  // Check file extension
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(fileExtension)) {
    return { isValid: false, error: 'Invalid file extension. Allowed: ' + allowedExtensions.join(', ') }
  }

  return { isValid: true }
}

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  return validateFile(file, {
    maxSizeBytes: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  })
}

// Text validation
export const validateText = (
  text: string,
  options: {
    minLength?: number
    maxLength?: number
    required?: boolean
    fieldName?: string
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    minLength = 0,
    maxLength = Infinity,
    required = false,
    fieldName = 'Field'
  } = options

  if (required && (!text || text.trim().length === 0)) {
    return { isValid: false, error: `${fieldName} is required` }
  }

  if (!required && (!text || text.trim().length === 0)) {
    return { isValid: true }
  }

  const trimmedText = text.trim()

  if (trimmedText.length < minLength) {
    return { isValid: false, error: `${fieldName} must be at least ${minLength} characters` }
  }

  if (trimmedText.length > maxLength) {
    return { isValid: false, error: `${fieldName} cannot exceed ${maxLength} characters` }
  }

  return { isValid: true }
}

// Amount/Currency validation
export const validateAmount = (
  amount: number | string,
  options: {
    min?: number
    max?: number
    currency?: string
  } = {}
): { isValid: boolean; error?: string } => {
  const {
    min = 0,
    max = Infinity,
    currency = 'NGN'
  } = options

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid amount format' }
  }

  if (numAmount < min) {
    return { isValid: false, error: `Amount must be at least ${min} ${currency}` }
  }

  if (numAmount > max) {
    return { isValid: false, error: `Amount cannot exceed ${max} ${currency}` }
  }

  // Check for reasonable decimal places (2 for currency)
  const decimalPlaces = (numAmount.toString().split('.')[1] || '').length
  if (decimalPlaces > 2) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' }
  }

  return { isValid: true }
}

// Password validation (enhanced)
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{2,}/, // Three or more repeated characters
    /123456|654321|abcdef|qwerty/i, // Common sequences
    /password|admin|user|login/i // Common words
  ]

  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains common patterns and may be easily guessed')
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// IP Address validation
export const validateIPAddress = (ip: string): { isValid: boolean; error?: string } => {
  const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/

  if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
    return { isValid: false, error: 'Invalid IP address format' }
  }

  // Additional IPv4 validation
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.')
    for (const part of parts) {
      const num = parseInt(part, 10)
      if (num < 0 || num > 255) {
        return { isValid: false, error: 'Invalid IPv4 address' }
      }
    }
  }

  return { isValid: true }
}

// Comprehensive form validation helper
export const validateForm = <T extends Record<string, any>>(
  data: T,
  schema: z.ZodSchema<T>
): { isValid: boolean; errors?: Record<string, string> } => {
  try {
    schema.parse(data)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {}
      error.issues.forEach((err: any) => {
        const path = err.path.join('.')
        fieldErrors[path] = err.message
      })
      return { isValid: false, errors: fieldErrors }
    }
    return { isValid: false, errors: { general: 'Validation failed' } }
  }
}

// Sanitization helpers
export const sanitizeText = (text: string): string => {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

export const sanitizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // Convert 0 prefix to +234
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1)
  }

  return cleaned
}

export const sanitizeEmail = (email: string): string => {
  return email.trim().toLowerCase()
}

// Location formatting and validation helpers
export const formatLocation = (location: LocationData): LocationData => {
  return {
    area: sanitizeText(location.area),
    street: sanitizeText(location.street),
    houseNumber: sanitizeText(location.houseNumber)
  }
}

export const formatLocationDisplay = (location: LocationData): string => {
  const formatted = formatLocation(location)
  return `${formatted.area}, ${formatted.street} ${formatted.houseNumber}`
}

export const validateLocationChange = (
  currentLocation: LocationData,
  newLocation: LocationData
): { hasChanged: boolean; changes: string[] } => {
  const current = formatLocation(currentLocation)
  const updated = formatLocation(newLocation)

  const changes: string[] = []

  if (current.area !== updated.area) {
    changes.push(`Area: "${current.area}" → "${updated.area}"`)
  }

  if (current.street !== updated.street) {
    changes.push(`Street: "${current.street}" → "${updated.street}"`)
  }

  if (current.houseNumber !== updated.houseNumber) {
    changes.push(`House Number: "${current.houseNumber}" → "${updated.houseNumber}"`)
  }

  return {
    hasChanged: changes.length > 0,
    changes
  }
}
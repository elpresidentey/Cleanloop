import {
  validateEmail,
  validateNigerianPhone,
  validateLocation,
  validateFutureDate,
  validatePickupDate,
  validateImageFile,
  validateText,
  validateAmount,
  validatePassword,
  sanitizeText,
  sanitizePhoneNumber,
  sanitizeEmail
} from '../validation'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toEqual({ isValid: true })
      expect(validateEmail('user.name@domain.co.uk')).toEqual({ isValid: true })
    })

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toEqual({
        isValid: false,
        error: 'Invalid email format'
      })
      expect(validateEmail('')).toEqual({
        isValid: false,
        error: 'Invalid email format'
      })
    })
  })

  describe('validateNigerianPhone', () => {
    it('should validate correct Nigerian phone numbers', () => {
      expect(validateNigerianPhone('+2348012345678')).toEqual({ isValid: true })
      expect(validateNigerianPhone('08012345678')).toEqual({ isValid: true })
      expect(validateNigerianPhone('07012345678')).toEqual({ isValid: true })
      expect(validateNigerianPhone('09012345678')).toEqual({ isValid: true })
    })

    it('should reject invalid phone numbers', () => {
      expect(validateNigerianPhone('1234567890')).toEqual({
        isValid: false,
        error: 'Invalid Nigerian phone number format. Use format: +2348012345678 or 08012345678'
      })
      expect(validateNigerianPhone('+1234567890')).toEqual({
        isValid: false,
        error: 'Invalid Nigerian phone number format. Use format: +2348012345678 or 08012345678'
      })
    })
  })

  describe('validateLocation', () => {
    it('should validate complete location data', () => {
      const location = {
        area: 'Victoria Island',
        street: 'Ahmadu Bello Way',
        houseNumber: '123'
      }
      expect(validateLocation(location)).toEqual({ isValid: true })
    })

    it('should reject incomplete location data', () => {
      const location = {
        area: '',
        street: 'Ahmadu Bello Way',
        houseNumber: '123'
      }
      expect(validateLocation(location)).toEqual({
        isValid: false,
        errors: { area: 'Area is required' }
      })
    })
  })

  describe('validateFutureDate', () => {
    it('should validate future dates', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(validateFutureDate(tomorrow)).toEqual({ isValid: true })
    })

    it('should reject past dates', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(validateFutureDate(yesterday)).toEqual({
        isValid: false,
        error: 'Date must be in the future'
      })
    })
  })

  describe('validatePickupDate', () => {
    it('should validate pickup dates (at least tomorrow)', () => {
      const dayAfterTomorrow = new Date()
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
      expect(validatePickupDate(dayAfterTomorrow)).toEqual({ isValid: true })
    })

    it('should reject today or past dates', () => {
      const today = new Date()
      expect(validatePickupDate(today)).toEqual({
        isValid: false,
        error: 'Pickup date must be at least tomorrow'
      })
    })
  })

  describe('validateText', () => {
    it('should validate text with correct length', () => {
      expect(validateText('Hello World', { minLength: 5, maxLength: 20 })).toEqual({
        isValid: true
      })
    })

    it('should reject text that is too short', () => {
      expect(validateText('Hi', { minLength: 5, fieldName: 'Message' })).toEqual({
        isValid: false,
        error: 'Message must be at least 5 characters'
      })
    })

    it('should reject text that is too long', () => {
      expect(validateText('This is a very long message', { maxLength: 10, fieldName: 'Message' })).toEqual({
        isValid: false,
        error: 'Message cannot exceed 10 characters'
      })
    })
  })

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100.50)).toEqual({ isValid: true })
      expect(validateAmount('250.75')).toEqual({ isValid: true })
    })

    it('should reject negative amounts', () => {
      expect(validateAmount(-50)).toEqual({
        isValid: false,
        error: 'Amount must be at least 0 NGN'
      })
    })

    it('should reject amounts with too many decimal places', () => {
      expect(validateAmount(100.123)).toEqual({
        isValid: false,
        error: 'Amount cannot have more than 2 decimal places'
      })
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toEqual({
        isValid: true,
        errors: []
      })
    })

    it('should reject weak passwords', () => {
      const result = validatePassword('weak')
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('sanitizeText', () => {
    it('should trim and normalize whitespace', () => {
      expect(sanitizeText('  hello   world  ')).toBe('hello world')
      expect(sanitizeText('text\n\nwith\n\nmultiple\n\nlines')).toBe('text with multiple lines')
    })

    it('should remove potential HTML tags', () => {
      expect(sanitizeText('hello <script>alert("xss")</script> world')).toBe('hello scriptalert("xss")/script world')
    })
  })

  describe('sanitizePhoneNumber', () => {
    it('should convert 0 prefix to +234', () => {
      expect(sanitizePhoneNumber('08012345678')).toBe('+2348012345678')
    })

    it('should remove non-digit characters except +', () => {
      expect(sanitizePhoneNumber('+234-801-234-5678')).toBe('+2348012345678')
      expect(sanitizePhoneNumber('0801 234 5678')).toBe('+2348012345678')
    })
  })

  describe('sanitizeEmail', () => {
    it('should trim and convert to lowercase', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com')
    })
  })
})

// Mock File for testing file validation
class MockFile {
  name: string
  size: number
  type: string

  constructor(name: string, size: number, type: string) {
    this.name = name
    this.size = size
    this.type = type
  }
}

describe('File Validation', () => {
  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const file = new MockFile('test.jpg', 1024 * 1024, 'image/jpeg') as unknown as File
      expect(validateImageFile(file)).toEqual({ isValid: true })
    })

    it('should reject files that are too large', () => {
      const file = new MockFile('large.jpg', 10 * 1024 * 1024, 'image/jpeg') as unknown as File
      expect(validateImageFile(file)).toEqual({
        isValid: false,
        error: 'File size must be less than 5MB'
      })
    })

    it('should reject non-image files', () => {
      const file = new MockFile('document.pdf', 1024, 'application/pdf') as unknown as File
      expect(validateImageFile(file)).toEqual({
        isValid: false,
        error: 'Invalid file type. Please upload an image file.'
      })
    })
  })
})
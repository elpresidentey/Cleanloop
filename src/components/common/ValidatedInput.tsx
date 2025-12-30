import React, { useState, useEffect } from 'react'
import { validateEmail, validateNigerianPhone, validateText, sanitizeText, sanitizeEmail, sanitizePhoneNumber } from '../../utils/validation'

interface BaseInputProps {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  className?: string
  onBlur?: () => void
}

interface ValidatedInputProps extends BaseInputProps {
  type?: 'text' | 'email' | 'tel' | 'password'
  minLength?: number
  maxLength?: number
  autoValidate?: boolean
  sanitize?: boolean
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  className = '',
  type = 'text',
  minLength,
  maxLength,
  autoValidate = true,
  sanitize = true,
  onBlur
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const validateValue = (val: string) => {
    if (!autoValidate || !touched) return

    let validation: { isValid: boolean; error?: string } = { isValid: true }

    switch (type) {
      case 'email':
        validation = validateEmail(val)
        break
      case 'tel':
        validation = validateNigerianPhone(val)
        break
      default:
        validation = validateText(val, {
          minLength,
          maxLength,
          required,
          fieldName: label
        })
    }

    setLocalError(validation.error || '')
  }

  useEffect(() => {
    validateValue(value)
  }, [value, touched, autoValidate, type, minLength, maxLength, required, label])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Apply sanitization
    if (sanitize) {
      switch (type) {
        case 'email':
          newValue = sanitizeEmail(newValue)
          break
        case 'tel':
          newValue = sanitizePhoneNumber(newValue)
          break
        case 'text':
          newValue = sanitizeText(newValue)
          break
      }
    }

    onChange(name, newValue)
  }

  const handleBlur = () => {
    setTouched(true)
    validateValue(value)
    onBlur?.()
  }

  const displayError = error || localError
  const inputId = `input-${name}`

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        minLength={minLength}
        maxLength={maxLength}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${displayError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        `}
      />
      
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
      
      {maxLength && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  )
}

interface ValidatedTextareaProps extends BaseInputProps {
  rows?: number
  minLength?: number
  maxLength?: number
  autoValidate?: boolean
}

export const ValidatedTextarea: React.FC<ValidatedTextareaProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  placeholder,
  className = '',
  rows = 3,
  minLength,
  maxLength,
  autoValidate = true,
  onBlur
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const validateValue = (val: string) => {
    if (!autoValidate || !touched) return

    const validation = validateText(val, {
      minLength,
      maxLength,
      required,
      fieldName: label
    })

    setLocalError(validation.error || '')
  }

  useEffect(() => {
    validateValue(value)
  }, [value, touched, autoValidate, minLength, maxLength, required, label])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = sanitizeText(e.target.value)
    onChange(name, newValue)
  }

  const handleBlur = () => {
    setTouched(true)
    validateValue(value)
    onBlur?.()
  }

  const displayError = error || localError
  const textareaId = `textarea-${name}`

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <textarea
        id={textareaId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed resize-vertical
          ${displayError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        `}
      />
      
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
      
      {maxLength && (
        <p className="text-xs text-gray-500">
          {value.length}/{maxLength} characters
          {minLength && ` (minimum ${minLength} characters)`}
        </p>
      )}
    </div>
  )
}

interface ValidatedSelectProps extends Omit<BaseInputProps, 'value' | 'onChange'> {
  value: string
  onChange: (name: string, value: string) => void
  options: Array<{ value: string; label: string; disabled?: boolean }>
  autoValidate?: boolean
}

export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  options,
  autoValidate = true,
  onBlur
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const validateValue = (val: string) => {
    if (!autoValidate || !touched) return

    if (required && (!val || val.trim().length === 0)) {
      setLocalError(`${label} is required`)
    } else {
      setLocalError('')
    }
  }

  useEffect(() => {
    validateValue(value)
  }, [value, touched, autoValidate, required, label])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(name, e.target.value)
  }

  const handleBlur = () => {
    setTouched(true)
    validateValue(value)
    onBlur?.()
  }

  const displayError = error || localError
  const selectId = `select-${name}`

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${displayError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        `}
      >
        {!required && <option value="">Select {label}</option>}
        {options.map((option) => (
          <option 
            key={option.value} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}
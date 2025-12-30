import React, { useState, useEffect } from 'react'
import { validateFutureDate, validatePickupDate } from '../../utils/validation'

interface ValidatedDateInputProps {
  label: string
  name: string
  value: string
  onChange: (name: string, value: string) => void
  error?: string
  disabled?: boolean
  required?: boolean
  className?: string
  type?: 'future' | 'pickup' | 'any'
  minDate?: string
  maxDate?: string
  onBlur?: () => void
}

export const ValidatedDateInput: React.FC<ValidatedDateInputProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  type = 'any',
  minDate,
  maxDate,
  onBlur
}) => {
  const [localError, setLocalError] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const validateValue = (val: string) => {
    if (!touched || !val) {
      if (required && !val) {
        setLocalError(`${label} is required`)
      } else {
        setLocalError('')
      }
      return
    }

    let validation: { isValid: boolean; error?: string } = { isValid: true }

    switch (type) {
      case 'future':
        validation = validateFutureDate(val)
        break
      case 'pickup':
        validation = validatePickupDate(val)
        break
      case 'any':
        // Just check if it's a valid date
        const date = new Date(val)
        if (isNaN(date.getTime())) {
          validation = { isValid: false, error: 'Invalid date format' }
        }
        break
    }

    setLocalError(validation.error || '')
  }

  useEffect(() => {
    validateValue(value)
  }, [value, touched, type, required, label])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(name, e.target.value)
  }

  const handleBlur = () => {
    setTouched(true)
    validateValue(value)
    onBlur?.()
  }

  const getMinDate = (): string | undefined => {
    if (minDate) return minDate
    
    switch (type) {
      case 'future':
        return new Date().toISOString().split('T')[0]
      case 'pickup':
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return tomorrow.toISOString().split('T')[0]
      default:
        return undefined
    }
  }

  const getMaxDate = (): string | undefined => {
    if (maxDate) return maxDate
    
    switch (type) {
      case 'future':
        const oneYearFromNow = new Date()
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
        return oneYearFromNow.toISOString().split('T')[0]
      case 'pickup':
        const threeMonthsFromNow = new Date()
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)
        return threeMonthsFromNow.toISOString().split('T')[0]
      default:
        return undefined
    }
  }

  const getHelpText = (): string => {
    switch (type) {
      case 'future':
        return 'Select a future date'
      case 'pickup':
        return 'Select a date at least tomorrow (up to 3 months ahead)'
      default:
        return ''
    }
  }

  const displayError = error || localError
  const inputId = `date-${name}`
  const calculatedMinDate = getMinDate()
  const calculatedMaxDate = getMaxDate()
  const helpText = getHelpText()

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        type="date"
        id={inputId}
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
        min={calculatedMinDate}
        max={calculatedMaxDate}
        className={`
          mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
          focus:outline-none focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:cursor-not-allowed
          ${displayError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
        `}
      />
      
      {helpText && !displayError && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
      
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}
    </div>
  )
}

interface ValidatedDateTimeInputProps extends Omit<ValidatedDateInputProps, 'value' | 'onChange'> {
  value: string
  onChange: (name: string, value: string) => void
  includeTime?: boolean
}

export const ValidatedDateTimeInput: React.FC<ValidatedDateTimeInputProps> = ({
  includeTime = false,
  ...props
}) => {
  if (includeTime) {
    return (
      <div className={`space-y-1 ${props.className}`}>
        <label htmlFor={`datetime-${props.name}`} className="block text-sm font-medium text-gray-700">
          {props.label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <input
          type="datetime-local"
          id={`datetime-${props.name}`}
          name={props.name}
          value={props.value}
          onChange={(e) => props.onChange(props.name, e.target.value)}
          onBlur={props.onBlur}
          disabled={props.disabled}
          required={props.required}
          className={`
            mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
            focus:outline-none focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${props.error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
        />
        
        {props.error && (
          <p className="text-sm text-red-600">{props.error}</p>
        )}
      </div>
    )
  }

  return <ValidatedDateInput {...props} />
}
import { useState, useCallback } from 'react'
import { z } from 'zod'
import { validateForm } from '../utils/validation'

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>
  onSubmit: (data: T) => Promise<void> | void
  onError?: (error: string) => void
}

interface FormValidationState {
  errors: Record<string, string>
  isSubmitting: boolean
  submitError: string | null
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  onSubmit,
  onError
}: UseFormValidationOptions<T>) {
  const [state, setState] = useState<FormValidationState>({
    errors: {},
    isSubmitting: false,
    submitError: null
  })

  const validateField = useCallback((fieldName: string, value: any) => {
    try {
      // For single field validation, we'll use a simpler approach
      // Create a temporary object with just this field
      const tempData = { [fieldName]: value } as Partial<T>
      
      // Try to validate the full schema with partial data
      // This is a simplified approach - in a real app you might want more sophisticated field validation
      schema.parse({ ...tempData } as T)
      
      // Clear error for this field
      setState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: ''
        }
      }))
      
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.issues[0]?.message || 'Invalid value'
        setState(prev => ({
          ...prev,
          errors: {
            ...prev.errors,
            [fieldName]: fieldError
          }
        }))
        return false
      }
      return false
    }
  }, [schema])

  const validateAllFields = useCallback((data: T) => {
    const validation = validateForm(data, schema)
    
    setState(prev => ({
      ...prev,
      errors: validation.errors || {},
      submitError: null
    }))
    
    return validation.isValid
  }, [schema])

  const handleSubmit = useCallback(async (data: T) => {
    setState(prev => ({ ...prev, isSubmitting: true, submitError: null }))
    
    try {
      const isValid = validateAllFields(data)
      
      if (!isValid) {
        setState(prev => ({ ...prev, isSubmitting: false }))
        return false
      }
      
      await onSubmit(data)
      
      // Clear all errors on successful submit
      setState(prev => ({
        ...prev,
        errors: {},
        isSubmitting: false,
        submitError: null
      }))
      
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        submitError: errorMessage
      }))
      
      onError?.(errorMessage)
      return false
    }
  }, [validateAllFields, onSubmit, onError])

  const clearError = useCallback((fieldName: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: ''
      }
    }))
  }, [])

  const clearAllErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      submitError: null
    }))
  }, [])

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error
      }
    }))
  }, [])

  const setSubmitError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      submitError: error
    }))
  }, [])

  return {
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    submitError: state.submitError,
    validateField,
    validateAllFields,
    handleSubmit,
    clearError,
    clearAllErrors,
    setFieldError,
    setSubmitError
  }
}

// Note: For specialized validation hooks, import the schemas directly in your components
// Example:
// import { CreateUserSchema } from '../types'
// const validation = useFormValidation({ schema: CreateUserSchema, onSubmit })
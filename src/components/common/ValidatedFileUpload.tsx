import React, { useState, useRef } from 'react'
import { validateImageFile, FileValidationOptions, validateFile } from '../../utils/validation'

interface ValidatedFileUploadProps {
  label: string
  name: string
  accept?: string
  multiple?: boolean
  required?: boolean
  disabled?: boolean
  error?: string
  className?: string
  validationOptions?: FileValidationOptions
  onFileSelect: (name: string, files: File[]) => void
  onError?: (error: string) => void
  preview?: boolean
  maxFiles?: number
}

export const ValidatedFileUpload: React.FC<ValidatedFileUploadProps> = ({
  label,
  name,
  accept = 'image/*',
  multiple = false,
  required = false,
  disabled = false,
  error,
  className = '',
  validationOptions,
  onFileSelect,
  onError,
  preview = true,
  maxFiles = 1
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [validationError, setValidationError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = (files: File[]): { isValid: boolean; error?: string } => {
    if (required && files.length === 0) {
      return { isValid: false, error: `${label} is required` }
    }

    if (files.length > maxFiles) {
      return { isValid: false, error: `Maximum ${maxFiles} file(s) allowed` }
    }

    for (const file of files) {
      let validation: { isValid: boolean; error?: string }
      
      if (validationOptions) {
        validation = validateFile(file, validationOptions)
      } else if (accept.startsWith('image/')) {
        validation = validateImageFile(file)
      } else {
        validation = validateFile(file)
      }

      if (!validation.isValid) {
        return validation
      }
    }

    return { isValid: true }
  }

  const createPreviews = (files: File[]) => {
    const newPreviews: string[] = []
    
    files.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          newPreviews.push(e.target?.result as string)
          if (newPreviews.length === files.length) {
            setPreviews(newPreviews)
          }
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    
    const validation = validateFiles(files)
    
    if (!validation.isValid) {
      setValidationError(validation.error || 'File validation failed')
      onError?.(validation.error || 'File validation failed')
      return
    }

    setValidationError('')
    setSelectedFiles(files)
    
    if (preview && files.length > 0) {
      createPreviews(files)
    }
    
    onFileSelect(name, files)
  }

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    
    setSelectedFiles(newFiles)
    setPreviews(newPreviews)
    onFileSelect(name, newFiles)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const clearAllFiles = () => {
    setSelectedFiles([])
    setPreviews([])
    setValidationError('')
    onFileSelect(name, [])
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayError = error || validationError
  const inputId = `file-${name}`

  return (
    <div className={`space-y-3 ${className}`}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* File Input */}
      <div className="flex items-center space-x-3">
        <input
          ref={fileInputRef}
          type="file"
          id={inputId}
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleFileChange}
          disabled={disabled}
          required={required}
          className="hidden"
        />
        
        <label
          htmlFor={inputId}
          className={`
            inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm
            text-sm font-medium cursor-pointer
            ${disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }
          `}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Choose {multiple ? 'Files' : 'File'}
        </label>

        {selectedFiles.length > 0 && (
          <button
            type="button"
            onClick={clearAllFiles}
            disabled={disabled}
            className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            Clear All
          </button>
        )}
      </div>

      {/* File Info */}
      {validationOptions && (
        <div className="text-xs text-gray-500">
          <p>
            Max size: {Math.round((validationOptions.maxSizeBytes || 5242880) / (1024 * 1024))}MB
            {validationOptions.allowedExtensions && (
              <span> • Allowed: {validationOptions.allowedExtensions.join(', ')}</span>
            )}
            {multiple && <span> • Max files: {maxFiles}</span>}
          </p>
        </div>
      )}

      {/* Error Display */}
      {displayError && (
        <p className="text-sm text-red-600">{displayError}</p>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center space-x-3">
                  {previews[index] && (
                    <img
                      src={previews[index]}
                      alt={`Preview ${index + 1}`}
                      className="w-12 h-12 object-cover rounded border"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  disabled={disabled}
                  className="inline-flex items-center p-1 border border-transparent rounded-full text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Grid for Multiple Images */}
      {preview && previews.length > 1 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((previewUrl, index) => (
            <div key={index} className="relative">
              <img
                src={previewUrl}
                alt={`Preview ${index + 1}`}
                className="w-full h-24 object-cover rounded border"
              />
              <button
                type="button"
                onClick={() => removeFile(index)}
                disabled={disabled}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
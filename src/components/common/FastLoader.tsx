import React from 'react'

interface FastLoaderProps {
  message?: string
}

export const FastLoader: React.FC<FastLoaderProps> = ({ message = "Loading..." }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
      </div>
    </div>
  )
}
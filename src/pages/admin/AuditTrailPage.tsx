import React from 'react'
import { AuditTrail } from '../../components/admin'

export const AuditTrailPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Audit Trail</h1>
          <p className="mt-2 text-gray-600">
            View and monitor all system activities and user actions for security and compliance.
          </p>
        </div>
        
        <AuditTrail />
      </div>
    </div>
  )
}

export default AuditTrailPage
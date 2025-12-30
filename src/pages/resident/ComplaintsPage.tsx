import React from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { ComplaintManagement } from '../../components/resident/ComplaintManagement'

export const ComplaintsPage: React.FC = () => {
  return (
    <ResidentLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Complaints</h1>
          <p className="mt-1 text-sm text-gray-500">
            File and track complaints about pickup service issues
          </p>
        </div>
        <ComplaintManagement />
      </div>
    </ResidentLayout>
  )
}
import React from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { ResidentDashboard } from '../../components/resident/ResidentDashboard'

export const DashboardPage: React.FC = () => {
  return (
    <ResidentLayout>
      <ResidentDashboard />
    </ResidentLayout>
  )
}
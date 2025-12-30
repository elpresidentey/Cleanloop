import React from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { SubscriptionManagement } from '../../components/resident/SubscriptionManagement'

export const SubscriptionPage: React.FC = () => {
  return (
    <ResidentLayout>
      <SubscriptionManagement />
    </ResidentLayout>
  )
}
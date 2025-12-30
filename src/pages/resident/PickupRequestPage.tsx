import React from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { PickupRequestSystem } from '../../components/resident/PickupRequestSystem'

export const PickupRequestPage: React.FC = () => {
  return (
    <ResidentLayout>
      <PickupRequestSystem />
    </ResidentLayout>
  )
}
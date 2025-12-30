import React from 'react'
import { ResidentLayout } from '../../components/layout/ResidentLayout'
import { PaymentHistory } from '../../components/resident/PaymentHistory'

export const PaymentHistoryPage: React.FC = () => {
  return (
    <ResidentLayout>
      <PaymentHistory />
    </ResidentLayout>
  )
}
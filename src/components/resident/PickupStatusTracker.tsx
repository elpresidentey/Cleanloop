import React from 'react'
import { PickupRequest } from '../../types'

interface PickupStatusTrackerProps {
  pickup: PickupRequest
}

const STATUS_STEPS = [
  { key: 'requested', label: 'Requested', description: 'Pickup request submitted' },
  { key: 'scheduled', label: 'Scheduled', description: 'Assigned to collector' },
  { key: 'picked_up', label: 'Completed', description: 'Waste collected successfully' }
]

export const PickupStatusTracker: React.FC<PickupStatusTrackerProps> = ({ pickup }) => {
  const getCurrentStepIndex = () => {
    if (pickup.status === 'missed') return -1 // Special case for missed
    return STATUS_STEPS.findIndex(step => step.key === pickup.status)
  }

  const currentStepIndex = getCurrentStepIndex()
  const isMissed = pickup.status === 'missed'

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-NG', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStepStatus = (stepIndex: number) => {
    if (isMissed) {
      return stepIndex === 0 ? 'completed' : 'upcoming'
    }
    
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'current'
    return 'upcoming'
  }

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )
      case 'current':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )
    }
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Pickup Status
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
            pickup.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
            pickup.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
            pickup.status === 'picked_up' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {pickup.status.replace('_', ' ')}
          </span>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Scheduled for: {formatDate(pickup.scheduledDate)}</span>
            {pickup.completedAt && (
              <span>Completed: {formatDate(pickup.completedAt)}</span>
            )}
          </div>
          {pickup.notes && (
            <p className="text-sm text-gray-500 bg-gray-50 rounded p-2">
              <strong>Notes:</strong> {pickup.notes}
            </p>
          )}
        </div>

        {/* Status Timeline */}
        <div className="flow-root">
          <ul className="-mb-8">
            {isMissed ? (
              // Special layout for missed pickups
              <>
                {/* Requested step */}
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-red-200" aria-hidden="true" />
                    <div className="relative flex space-x-3">
                      <div>{getStepIcon('completed')}</div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Requested</p>
                          <p className="text-sm text-gray-500">Pickup request submitted</p>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          <time dateTime={pickup.createdAt.toISOString()}>
                            {formatDate(pickup.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
                {/* Missed step */}
                <li>
                  <div className="relative">
                    <div className="relative flex space-x-3">
                      <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-red-900">Missed</p>
                          <p className="text-sm text-red-600">Pickup was not completed on scheduled date</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </>
            ) : (
              // Normal timeline for other statuses
              STATUS_STEPS.map((step, stepIndex) => {
                const status = getStepStatus(stepIndex)
                const isLast = stepIndex === STATUS_STEPS.length - 1

                return (
                  <li key={step.key}>
                    <div className="relative pb-8">
                      {!isLast && (
                        <span 
                          className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                            status === 'completed' ? 'bg-green-200' : 'bg-gray-200'
                          }`} 
                          aria-hidden="true" 
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>{getStepIcon(status)}</div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <div>
                            <p className={`text-sm font-medium ${
                              status === 'completed' ? 'text-green-900' :
                              status === 'current' ? 'text-blue-900' :
                              'text-gray-500'
                            }`}>
                              {step.label}
                            </p>
                            <p className={`text-sm ${
                              status === 'completed' ? 'text-green-600' :
                              status === 'current' ? 'text-blue-600' :
                              'text-gray-500'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                          {status === 'completed' && (
                            <div className="mt-2 text-sm text-gray-500">
                              <time dateTime={
                                step.key === 'requested' ? pickup.createdAt.toISOString() :
                                step.key === 'picked_up' && pickup.completedAt ? pickup.completedAt.toISOString() :
                                pickup.updatedAt.toISOString()
                              }>
                                {formatDate(
                                  step.key === 'requested' ? pickup.createdAt :
                                  step.key === 'picked_up' && pickup.completedAt ? pickup.completedAt :
                                  pickup.updatedAt
                                )}
                              </time>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>
        </div>

        {/* Action buttons based on status */}
        <div className="mt-6 flex justify-end space-x-3">
          {pickup.status === 'missed' && (
            <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Request New Pickup
            </button>
          )}
          {(pickup.status === 'requested' || pickup.status === 'scheduled') && (
            <button className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
              Cancel Request
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
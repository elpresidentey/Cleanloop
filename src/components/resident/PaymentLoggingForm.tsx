import React, { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { PaymentService } from '../../services/paymentService'
import { CreatePaymentInput, PaymentMethod, Payment, UpdatePaymentInput } from '../../types'

interface PaymentLoggingFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialData?: Payment | null
}

export const PaymentLoggingForm: React.FC<PaymentLoggingFormProps> = ({
  onSuccess,
  onCancel,
  initialData
}) => {
  const { user } = useAuth()
  const isEditMode = !!initialData
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: 'cash' as PaymentMethod,
    reference: '',
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount.toString(),
        paymentMethod: initialData.paymentMethod,
        reference: initialData.reference,
        notes: initialData.metadata?.notes as string || ''
      })
    }
  }, [initialData])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('You must be logged in to log a payment')
      return
    }

    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!formData.reference.trim()) {
      setError('Please enter a payment reference')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      if (isEditMode && initialData) {
        const updateInput: UpdatePaymentInput = {
          amount,
          paymentMethod: formData.paymentMethod,
          reference: formData.reference.trim(),
          metadata: formData.notes.trim() ? { notes: formData.notes.trim() } : undefined
        }
        await PaymentService.update(initialData.id, updateInput)
      } else {
        const paymentInput: CreatePaymentInput = {
          userId: user.id,
          amount,
          currency: 'NGN',
          paymentMethod: formData.paymentMethod,
          reference: formData.reference.trim(),
          metadata: formData.notes.trim() ? { notes: formData.notes.trim() } : undefined
        }
        await PaymentService.create(paymentInput)
      }
      
      // Reset form
      if (!isEditMode) {
        setFormData({
          amount: '',
          paymentMethod: 'cash',
          reference: '',
          notes: ''
        })
      }

      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error('Failed to log payment:', error)
      setError(error instanceof Error ? error.message : 'Failed to log payment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-8 py-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          {isEditMode ? 'Edit Payment' : 'Log Payment'}
        </h3>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₦) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="cash">Cash</option>
              <option value="transfer">Bank Transfer</option>
              <option value="card">Card Payment</option>
            </select>
          </div>

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
              Payment Reference *
            </label>
            <input
              type="text"
              id="reference"
              name="reference"
              value={formData.reference}
              onChange={handleInputChange}
              required
              placeholder="e.g., Receipt number, transaction ID, or description"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            />
            <p className="mt-2 text-xs text-gray-500">
              Enter a unique identifier for this payment (receipt number, transaction ID, etc.)
            </p>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Any additional notes about this payment"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
            >
              {submitting ? (isEditMode ? 'Updating...' : 'Logging...') : (isEditMode ? 'Update Payment' : 'Log Payment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
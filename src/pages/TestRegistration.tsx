import React, { useState } from 'react'
import { AuthService } from '../services/authService'

export const TestRegistration: React.FC = () => {
  const [status, setStatus] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const handleTestRegistration = async () => {
    setLoading(true)
    setStatus('Starting registration...')

    try {
      const testData = {
        email: `test${Date.now()}@gmail.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        phone: '+2348012345678',
        role: 'resident' as const,
        location: {
          area: 'Lagos Island',
          street: 'Marina Street',
          houseNumber: '123'
        }
      }

      setStatus(`Registering user: ${testData.email}`)

      const result = await AuthService.signUp(testData)

      if (result.error) {
        setStatus(`❌ Registration failed: ${result.error.message}`)
      } else {
        setStatus(`✅ Registration successful! User ID: ${result.user?.id}`)
      }
    } catch (error) {
      setStatus(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Registration Test Page</h1>
      <p>This page tests registration directly without form validation.</p>
      
      <button 
        onClick={handleTestRegistration}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: loading ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Testing...' : 'Test Registration'}
      </button>

      <div style={{ 
        marginTop: '20px', 
        padding: '10px', 
        backgroundColor: '#f8f9fa', 
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap'
      }}>
        {status || 'Click the button to test registration'}
      </div>

      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: '#007bff' }}>← Back to main app</a>
      </div>
    </div>
  )
}
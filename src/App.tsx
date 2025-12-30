import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleGuard } from './components/auth/RoleGuard'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { PasswordResetPage } from './pages/auth/PasswordResetPage'
import { ProfileSetupPage } from './pages/auth/ProfileSetupPage'
import { TestRegistration } from './pages/TestRegistration'
import { DashboardPage as ResidentDashboardPage } from './pages/resident/DashboardPage'
import { CollectorDashboardPage, PickupManagementPage, CustomerManagementPage } from './pages/collector'
import { AdminDashboardPage } from './pages/admin/DashboardPage'
import { AuditTrailPage } from './pages/admin/AuditTrailPage'
import { PickupRequestPage } from './pages/resident/PickupRequestPage'
import { PaymentHistoryPage } from './pages/resident/PaymentHistoryPage'
import { ComplaintsPage } from './pages/resident/ComplaintsPage'
import { SubscriptionPage } from './pages/resident/SubscriptionPage'
import { LocationManagementPage } from './pages/resident/LocationManagementPage'
import { useAuth } from './hooks/useAuth'

const DashboardRedirect: React.FC = () => {
  const { profile, loading, needsProfileSetup, user } = useAuth()

  // Reduce loading time by setting a maximum wait time
  const [maxLoadingReached, setMaxLoadingReached] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setMaxLoadingReached(true)
    }, 3000) // Maximum 3 seconds loading

    return () => clearTimeout(timer)
  }, [])

  if (loading && !maxLoadingReached) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If loading has taken too long, redirect to login
  if (maxLoadingReached && !user) {
    return <Navigate to="/login" replace />
  }

  // If user needs profile setup, redirect to profile setup page
  if (needsProfileSetup) {
    return <Navigate to="/profile-setup" replace />
  }

  if (!profile && user) {
    // User exists but no profile - redirect to profile setup
    return <Navigate to="/profile-setup" replace />
  }

  if (!profile) {
    return <Navigate to="/login" replace />
  }

  // Redirect based on user role
  switch (profile.role) {
    case 'resident':
      return <Navigate to="/resident/dashboard" replace />
    case 'collector':
      return <Navigate to="/collector/dashboard" replace />
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function App() {
  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/test-registration" element={<TestRegistration />} />
        
        {/* Protected routes */}
        <Route path="/" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardRedirect /></ProtectedRoute>} />
        
        {/* Resident routes */}
        <Route 
          path="/resident/dashboard" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <ResidentDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resident/pickup-requests" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <PickupRequestPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resident/payment-history" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <PaymentHistoryPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resident/complaints" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <ComplaintsPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resident/subscription" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <SubscriptionPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/resident/location" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['resident']}>
                <LocationManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        
        {/* Collector routes */}
        <Route 
          path="/collector/dashboard" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['collector']}>
                <CollectorDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collector/pickups" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['collector']}>
                <PickupManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/collector/customers" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['collector']}>
                <CustomerManagementPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        
        {/* Admin routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AdminDashboardPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/audit-trail" 
          element={
            <ProtectedRoute>
              <RoleGuard allowedRoles={['admin']}>
                <AuditTrailPage />
              </RoleGuard>
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App

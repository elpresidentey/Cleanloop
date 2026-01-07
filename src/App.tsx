import React, { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RoleGuard } from './components/auth/RoleGuard'
import { FastLoader } from './components/common/FastLoader'
import { useAuth } from './hooks/useAuth'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const PasswordResetPage = lazy(() => import('./pages/auth/PasswordResetPage').then(m => ({ default: m.PasswordResetPage })))
const ProfileSetupPage = lazy(() => import('./pages/auth/ProfileSetupPage').then(m => ({ default: m.ProfileSetupPage })))
const TestRegistration = lazy(() => import('./pages/TestRegistration').then(m => ({ default: m.TestRegistration })))
const PrivacyPolicyPage = lazy(() => import('./pages/legal/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })))
const TermsOfServicePage = lazy(() => import('./pages/legal/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })))
const ResidentDashboardPage = lazy(() => import('./pages/resident/DashboardPage').then(m => ({ default: m.DashboardPage })))
const PickupRequestPage = lazy(() => import('./pages/resident/PickupRequestPage').then(m => ({ default: m.PickupRequestPage })))
const PaymentHistoryPage = lazy(() => import('./pages/resident/PaymentHistoryPage').then(m => ({ default: m.PaymentHistoryPage })))
const ComplaintsPage = lazy(() => import('./pages/resident/ComplaintsPage').then(m => ({ default: m.ComplaintsPage })))
const SubscriptionPage = lazy(() => import('./pages/resident/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const LocationManagementPage = lazy(() => import('./pages/resident/LocationManagementPage').then(m => ({ default: m.LocationManagementPage })))

// Collector pages
const { CollectorDashboardPage: CollectorDashboardPageLazy, PickupManagementPage: PickupManagementPageLazy, CustomerManagementPage: CustomerManagementPageLazy } = {
  CollectorDashboardPage: lazy(() => import('./pages/collector').then(m => ({ default: m.CollectorDashboardPage }))),
  PickupManagementPage: lazy(() => import('./pages/collector').then(m => ({ default: m.PickupManagementPage }))),
  CustomerManagementPage: lazy(() => import('./pages/collector').then(m => ({ default: m.CustomerManagementPage })))
}
const CollectorDashboardPage = CollectorDashboardPageLazy
const PickupManagementPage = PickupManagementPageLazy
const CustomerManagementPage = CustomerManagementPageLazy

const AdminDashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.AdminDashboardPage })))
const AuditTrailPage = lazy(() => import('./pages/admin/AuditTrailPage').then(m => ({ default: m.AuditTrailPage })))

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
      <Suspense fallback={<FastLoader />}>
        <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<PasswordResetPage />} />
        <Route path="/profile-setup" element={<ProfileSetupPage />} />
        <Route path="/test-registration" element={<TestRegistration />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        
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
      </Suspense>
    </Router>
  )
}

export default App

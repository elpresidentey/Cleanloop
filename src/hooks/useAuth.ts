import { useState, useEffect, useCallback } from 'react'
import { User as SupabaseUser, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { AuthService, SignUpData } from '../services/authService'
import { User, UserRole } from '../types'

interface AuthState {
  user: SupabaseUser | null
  profile: User | null
  session: Session | null
  loading: boolean
  error: string | null
  needsProfileSetup?: boolean
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
    error: null,
    needsProfileSetup: false
  })

  // Load user profile with timeout and caching
  const loadUserProfile = useCallback(async (user: SupabaseUser | null) => {
    if (!user) {
      setAuthState(prev => ({ ...prev, profile: null, loading: false }))
      return
    }

    try {
      // Set a timeout for profile loading to prevent hanging
      const profilePromise = AuthService.getUserProfile(user.id)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 3000)
      )

      const { profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any

      if (error) {
        if (error.code === 'PGRST116') {
          setAuthState(prev => ({ 
            ...prev, 
            profile: null, 
            error: null,
            needsProfileSetup: true,
            loading: false
          }))
        } else {
          // Don't block the UI for profile errors - set a default state
          setAuthState(prev => ({ 
            ...prev, 
            profile: null,
            error: null,
            loading: false
          }))
        }
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          profile, 
          error: null, 
          needsProfileSetup: false,
          loading: false
        }))
      }
    } catch (error) {
      // Don't block the UI - just set loading to false
      setAuthState(prev => ({ 
        ...prev, 
        profile: null,
        error: null,
        loading: false
      }))
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a shorter timeout for initial session
        const sessionPromise = AuthService.getSession()
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        )

        const { session, error } = await Promise.race([sessionPromise, timeoutPromise]) as any

        if (!mounted) return

        if (error) {
          setAuthState(prev => ({ ...prev, error: null, loading: false }))
        } else {
          setAuthState(prev => ({
            ...prev,
            session,
            user: session?.user || null,
            loading: session?.user ? true : false // Keep loading if we have a user to load profile
          }))
          
          // Load user profile if user exists
          if (session?.user) {
            await loadUserProfile(session.user)
          } else {
            setAuthState(prev => ({ ...prev, loading: false }))
          }
        }
      } catch (error) {
        if (!mounted) return
        // Don't show errors on initial load - just set loading to false
        setAuthState(prev => ({
          ...prev,
          error: null,
          loading: false
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user || null,
          loading: session?.user ? true : false,
          error: null
        }))

        // Load user profile when user signs in
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setAuthState(prev => ({ ...prev, profile: null, loading: false }))
        } else {
          setAuthState(prev => ({ ...prev, loading: false }))
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  const signUp = async (userData: SignUpData) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { user, error } = await AuthService.signUp(userData)
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { user: null, error }
      }
      
      return { user, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { user: null, error: { message: errorMessage } }
    }
  }

  const signIn = async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { user, error } = await AuthService.signIn(email, password)
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { user: null, error }
      }
      
      return { user, error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { user: null, error: { message: errorMessage } }
    }
  }

  const signOut = async () => {
    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { error } = await AuthService.signOut()
      if (error) {
        setAuthState(prev => ({ ...prev, error: error.message, loading: false }))
        return { error }
      }
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: { message: errorMessage } }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!authState.user) {
      return { error: { message: 'No authenticated user' } }
    }

    setAuthState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const { error } = await AuthService.updateUserProfile(authState.user.id, updates)
      if (error) {
        setAuthState(prev => ({ ...prev, error: 'Failed to update profile', loading: false }))
        return { error }
      }

      // Reload profile
      await loadUserProfile(authState.user)
      return { error: null }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setAuthState(prev => ({ ...prev, error: errorMessage, loading: false }))
      return { error: { message: errorMessage } }
    }
  }

  const hasRole = (role: UserRole): boolean => {
    return authState.profile?.role === role || false
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return authState.profile ? roles.includes(authState.profile.role) : false
  }

  return {
    ...authState,
    signUp,
    signIn,
    signOut,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!authState.user,
    isResident: hasRole('resident'),
    isCollector: hasRole('collector'),
    isAdmin: hasRole('admin')
  }
}
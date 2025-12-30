import { supabase } from '../lib/supabase'
import { CreateUserInput, User, UserRole } from '../types'
import { AuthError, User as SupabaseUser } from '@supabase/supabase-js'
import { AuditService } from './auditService'

export interface AuthResponse {
  user: SupabaseUser | null
  error: AuthError | null
}

export interface SignUpData extends CreateUserInput {
  password: string
}

export class AuthService {
  /**
   * Sign up a new user with role-based user creation
   */
  static async signUp(userData: SignUpData): Promise<AuthResponse> {
    try {
      // Create the auth user with metadata - let the trigger handle profile creation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            area: userData.location.area,
            street: userData.location.street,
            house_number: userData.location.houseNumber,
            coordinates: userData.location.coordinates
          }
        }
      })

      if (authError) {
        return { user: null, error: authError }
      }

      // Don't manually insert into users table - let the trigger handle it
      // Just return success if auth user creation worked
      if (authData.user) {
        // Log successful user creation (but don't fail if audit fails)
        try {
          await AuditService.logUserEvent(
            authData.user.id,
            'user_created',
            authData.user.id,
            undefined,
            {
              email: userData.email,
              name: userData.name,
              role: userData.role,
              location: userData.location
            }
          )
        } catch (auditError) {
          console.warn('Audit logging failed:', auditError)
          // Don't fail registration if audit fails
        }
      }

      return { user: authData.user, error: null }
    } catch (error) {
      return { 
        user: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'UnknownError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Sign in with email and password
   */
  static async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (data.user && !error) {
        // Log successful login
        await AuditService.logAuthEvent(
          data.user.id,
          'login_success',
          { email, timestamp: new Date().toISOString() }
        )
      } else if (error) {
        // For failed login, we don't have a user ID, so we'll use a placeholder
        // In a real implementation, you might want to log this differently
        console.warn('Login failed for email:', email)
      }

      return { user: data.user, error }
    } catch (error) {
      return { 
        user: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'UnknownError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      // Get current user before signing out
      const { data: { user } } = await supabase.auth.getUser()
      
      const { error } = await supabase.auth.signOut()
      
      // Log logout if user was signed in
      if (user && !error) {
        await AuditService.logAuthEvent(
          user.id,
          'logout',
          { timestamp: new Date().toISOString() }
        )
      }
      
      return { error }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'UnknownError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<{ user: SupabaseUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      return { user, error }
    } catch (error) {
      return { 
        user: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'UnknownError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Get current session
   */
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return { session, error }
    } catch (error) {
      return { 
        session: null, 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'UnknownError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Get user profile from database
   */
  static async getUserProfile(userId: string): Promise<{ profile: User | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Handle case where user profile doesn't exist (PGRST116)
        if (error.code === 'PGRST116') {
          console.log('User profile not found, this might be a new user that needs profile creation')
          return { profile: null, error: { ...error, message: 'User profile not found. Please complete registration.' } }
        }
        return { profile: null, error }
      }

      if (!data) {
        return { profile: null, error: 'User not found' }
      }

      // Transform database row to User type
      const dbUser = data as any
      const profile: User = {
        id: dbUser.id,
        email: dbUser.email,
        phone: dbUser.phone,
        name: dbUser.name,
        role: dbUser.role as UserRole,
        location: {
          area: dbUser.area,
          street: dbUser.street,
          houseNumber: dbUser.house_number,
          coordinates: dbUser.coordinates ? this.parseCoordinates(dbUser.coordinates as string) : undefined
        },
        createdAt: new Date(dbUser.created_at),
        updatedAt: new Date(dbUser.updated_at),
        isActive: dbUser.is_active
      }

      return { profile, error: null }
    } catch (error) {
      return { profile: null, error }
    }
  }

  /**
   * Create user profile in database (for users who signed up but don't have a profile)
   */
  static async createUserProfile(profileData: {
    id: string
    email: string
    phone: string
    name: string
    role: UserRole
    area: string
    street: string
    houseNumber: string
  }): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('users')
        .insert({
          id: profileData.id,
          email: profileData.email,
          phone: profileData.phone,
          name: profileData.name,
          role: profileData.role,
          area: profileData.area,
          street: profileData.street,
          house_number: profileData.houseNumber,
          coordinates: null,
          is_active: true
        })

      if (error) {
        return { error }
      }

      // Log profile creation
      try {
        await AuditService.logAuthEvent(
          profileData.id,
          'profile_created',
          { 
            role: profileData.role,
            area: profileData.area,
            timestamp: new Date().toISOString() 
          }
        )
      } catch (auditError) {
        console.warn('Audit logging failed:', auditError)
        // Don't fail profile creation if audit fails
      }

      return { error: null }
    } catch (error) {
      return { 
        error: { 
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          name: 'ProfileCreationError',
          status: 500
        } as AuthError 
      }
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId: string, updates: Partial<User>): Promise<{ error: any }> {
    try {
      // Get current profile for audit logging
      const { profile: currentProfile } = await this.getUserProfile(userId)
      
      const updateData: any = {}
      
      if (updates.name) updateData.name = updates.name
      if (updates.phone) updateData.phone = updates.phone
      if (updates.email) updateData.email = updates.email
      if (updates.location) {
        updateData.area = updates.location.area
        updateData.street = updates.location.street
        updateData.house_number = updates.location.houseNumber
        if (updates.location.coordinates) {
          updateData.coordinates = `POINT(${updates.location.coordinates[0]} ${updates.location.coordinates[1]})`
        }
      }
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive

      const { error } = await (supabase as any)
        .from('users')
        .update(updateData)
        .eq('id', userId)

      if (!error) {
        // Log user profile update
        await AuditService.logUserEvent(
          userId,
          'user_updated',
          userId,
          currentProfile ? {
            name: currentProfile.name,
            phone: currentProfile.phone,
            email: currentProfile.email,
            location: currentProfile.location,
            isActive: currentProfile.isActive
          } : undefined,
          updates
        )
      }

      return { error }
    } catch (error) {
      return { error }
    }
  }

  /**
   * Check if user has specific role
   */
  static async hasRole(userId: string, role: UserRole): Promise<boolean> {
    try {
      const { profile } = await this.getUserProfile(userId)
      return profile?.role === role || false
    } catch (error) {
      return false
    }
  }

  /**
   * Parse PostGIS POINT coordinates
   */
  private static parseCoordinates(coordinates: any): [number, number] | undefined {
    if (typeof coordinates === 'string') {
      // Parse "POINT(lng lat)" format
      const match = coordinates.match(/POINT\(([^)]+)\)/)
      if (match) {
        const [lng, lat] = match[1].split(' ').map(Number)
        return [lng, lat]
      }
    }
    return undefined
  }
}
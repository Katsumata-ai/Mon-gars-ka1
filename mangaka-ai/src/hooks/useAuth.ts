'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  initialized: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    initialized: false
  })
  
  const supabase = createClient()

  const initializeAuth = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      // Ne pas logger l'erreur AuthSessionMissingError car c'est normal quand l'utilisateur n'est pas connecté
      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Error getting user:', error)
      }

      setAuthState({
        user,
        loading: false,
        initialized: true
      })
    } catch (error: any) {
      // Ne pas logger l'erreur AuthSessionMissingError car c'est normal quand l'utilisateur n'est pas connecté
      if (error?.name !== 'AuthSessionMissingError') {
        console.error('Auth initialization error:', error)
      }
      setAuthState({
        user: null,
        loading: false,
        initialized: true
      })
    }
  }, [supabase.auth])

  useEffect(() => {
    // Initialize auth state
    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setAuthState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
          initialized: true
        }))
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth, initializeAuth])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [supabase.auth])

  return {
    user: authState.user,
    loading: authState.loading,
    initialized: authState.initialized,
    signOut
  }
}

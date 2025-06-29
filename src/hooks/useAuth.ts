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
      // Attendre un tick pour éviter les problèmes d'hydratation
      await new Promise(resolve => setTimeout(resolve, 0))

      // D'abord vérifier s'il y a une session active
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError) {
        // Ignorer les erreurs de token invalide pour les utilisateurs non connectés
        if (sessionError.message?.includes('Invalid Refresh Token') ||
            sessionError.message?.includes('Refresh Token Not Found') ||
            sessionError.name === 'AuthSessionMissingError') {
          setAuthState({
            user: null,
            loading: false,
            initialized: true
          })
          return
        }
        console.error('Session error:', sessionError)
      }

      // Si pas de session, pas besoin d'appeler getUser
      if (!session) {
        setAuthState({
          user: null,
          loading: false,
          initialized: true
        })
        return
      }

      // Si session valide, récupérer les infos utilisateur
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error && error.name !== 'AuthSessionMissingError') {
        console.error('Error getting user:', error)
      }

      setAuthState({
        user,
        loading: false,
        initialized: true
      })
    } catch (error: any) {
      // Ignorer les erreurs de token pour les utilisateurs non connectés
      if (error?.message?.includes('Invalid Refresh Token') ||
          error?.message?.includes('Refresh Token Not Found') ||
          error?.name === 'AuthSessionMissingError') {
        setAuthState({
          user: null,
          loading: false,
          initialized: true
        })
        return
      }
      console.error('Auth initialization error:', error)
      setAuthState({
        user: null,
        loading: false,
        initialized: true
      })
    }
  }, [supabase.auth])

  useEffect(() => {
    // Éviter l'initialisation côté serveur pour prévenir l'hydratation
    if (typeof window === 'undefined') return

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

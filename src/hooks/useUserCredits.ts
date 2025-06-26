'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface UserCredits {
  character_images: number
  decor_images: number
  scene_generation: number
  project_pages: number
  total_projects: number
  project_exports: number
  monthly_generations: number
  storage_space: number
}

export function useUserCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const supabase = createClient()

  const fetchCredits = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_usage_stats', { p_user_id: userId })

      if (error) {
        console.error('Error fetching user usage stats:', error)
        // Initialiser avec des valeurs par défaut si pas de données
        const defaultCredits: UserCredits = {
          character_images: 0,
          decor_images: 0,
          scene_generation: 0,
          project_pages: 0,
          total_projects: 0,
          project_exports: 0,
          monthly_generations: 0,
          storage_space: 0
        }
        setCredits(defaultCredits)
      } else {
        // CORRECTION: Les fonctions RPC retournent des tableaux
        const usageData = Array.isArray(data) ? data[0] : data

        // Convertir les données de la fonction RPC vers notre interface
        const userCredits: UserCredits = {
          character_images: usageData?.character_images || 0,
          decor_images: usageData?.decor_images || 0,
          scene_generation: usageData?.scene_generation || 0,
          project_pages: usageData?.project_pages || 0,
          total_projects: usageData?.total_projects || 0,
          project_exports: usageData?.project_exports || 0,
          monthly_generations: usageData?.monthly_generations || 0,
          storage_space: usageData?.storage_space || 0
        }
        setCredits(userCredits)
      }
    } catch (err) {
      console.error('Unexpected error fetching credits:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        await fetchCredits(user.id)
      } else {
        setLoading(false)
      }
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const newUser = session?.user ?? null
        setUser(newUser)

        if (newUser) {
          await fetchCredits(newUser.id)
        } else {
          setCredits(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth]) // Supprimer fetchCredits des dépendances pour éviter les boucles infinies

  const refreshCredits = async () => {
    if (user) {
      setLoading(true)
      await fetchCredits(user.id)
    }
  }

  return {
    credits,
    loading,
    user,
    refreshCredits
  }
}

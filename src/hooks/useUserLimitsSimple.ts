'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface SimpleUserUsage {
  character_images: number
  decor_images: number
  scene_generation: number
  monthly_generations: number
  total_projects: number
}

interface SimpleUserLimits {
  character_images: number
  decor_images: number
  scene_generation: number
  monthly_generations: number
  total_projects: number
}

export function useUserLimitsSimple() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<SimpleUserUsage | null>(null)
  const [limits, setLimits] = useState<SimpleUserLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Récupérer l'usage et les limites
  const fetchData = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLimits(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Récupérer les statistiques d'usage
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_user_usage_stats', { p_user_id: user.id })

      if (usageError) {
        console.error('Error fetching usage:', usageError)
        throw usageError
      }

      // Récupérer les limites
      const { data: limitsData, error: limitsError } = await supabase
        .rpc('get_user_limits', { p_user_id: user.id })

      if (limitsError) {
        console.error('Error fetching limits:', limitsError)
        throw limitsError
      }

      // CORRECTION: Les fonctions RPC retournent des tableaux
      const usageResult = Array.isArray(usageData) ? usageData[0] : usageData
      const limitsResult = Array.isArray(limitsData) ? limitsData[0] : limitsData

      // Mettre à jour l'état
      setUsage({
        character_images: usageResult?.character_images || 0,
        decor_images: usageResult?.decor_images || 0,
        scene_generation: usageResult?.scene_generation || 0,
        monthly_generations: usageResult?.monthly_generations || 0,
        total_projects: usageResult?.total_projects || 0
      })

      setLimits({
        character_images: limitsResult?.character_images || 2,
        decor_images: limitsResult?.decor_images || 2,
        scene_generation: limitsResult?.scene_generation || 1,
        monthly_generations: limitsResult?.monthly_generations || 5,
        total_projects: limitsResult?.total_projects || 1
      })

    } catch (err) {
      console.error('Error fetching user data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Vérifier si une limite est atteinte
  const isLimitReached = useCallback((type: keyof SimpleUserUsage): boolean => {
    if (!usage || !limits) return false
    
    const currentUsage = usage[type]
    const currentLimit = limits[type]
    
    // Si la limite est -1, c'est illimité
    if (currentLimit === -1) return false
    
    return currentUsage >= currentLimit
  }, [usage, limits])

  // Obtenir les informations de limite
  const getLimitInfo = useCallback((type: keyof SimpleUserUsage) => {
    if (!usage || !limits) return null

    const currentUsage = usage[type]
    const currentLimit = limits[type]
    
    return {
      current: currentUsage,
      limit: currentLimit,
      isUnlimited: currentLimit === -1,
      isReached: currentUsage >= currentLimit && currentLimit !== -1,
      percentage: currentLimit === -1 ? 0 : Math.min((currentUsage / currentLimit) * 100, 100)
    }
  }, [usage, limits])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    usage,
    limits,
    loading,
    error,
    isLimitReached,
    getLimitInfo,
    refreshData: fetchData
  }
}

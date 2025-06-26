'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { useSubscriptionSafe } from './useSubscriptionSafe'
import { 
  LimitationType, 
  UserLimits, 
  UserUsage, 
  PLAN_LIMITS 
} from '@/types/upselling'

export function useUserLimits() {
  const { user } = useAuth()
  const { currentPlan, hasActiveSubscription } = useSubscriptionSafe()
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [limits, setLimits] = useState<UserLimits | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  // Fetch limits based on user plan
  const fetchLimits = useCallback(() => {
    // 🎨 FOUNDER EXCEPTION: Unlimited limits for founder
    if (user?.email === 'nefziamenallah2007@gmail.com') {
      setLimits(PLAN_LIMITS.senior) // Unlimited limits
      return
    }

    const planLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.junior
    setLimits(planLimits)
  }, [currentPlan, user?.email])

  // Fetch current user usage
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Récupérer les statistiques d'usage depuis la base de données
      const { data: usageData, error: usageError } = await supabase
        .rpc('get_user_usage_stats', { p_user_id: user.id })

      if (usageError) {
        throw usageError
      }

      // CORRECTION: Les fonctions RPC retournent des tableaux
      const usageResult = Array.isArray(usageData) ? usageData[0] : usageData

      // Si pas de données, initialiser avec des valeurs par défaut
      const currentUsage: UserUsage = {
        character_images: usageResult?.character_images || 0,
        decor_images: usageResult?.decor_images || 0,
        scene_generation: usageResult?.scene_generation || 0,
        project_pages: usageResult?.project_pages || 0,
        total_projects: usageResult?.total_projects || 0,
        project_exports: usageResult?.project_exports || 0,
        monthly_generations: usageResult?.monthly_generations || 0,
        storage_space: usageResult?.storage_space || 0
      }

      setUsage(currentUsage)
    } catch (err) {
      console.error('Error fetching user usage:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch usage')
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  // Vérifier si une limite est atteinte
  const isLimitReached = useCallback((limitationType: LimitationType): boolean => {
    if (!usage || !limits) return false
    
    // Les utilisateurs payants n'ont pas de limites (valeurs -1)
    if (hasActiveSubscription) return false
    
    const currentUsage = usage[limitationType]
    const currentLimit = limits[limitationType]
    
    // Si la limite est -1, c'est illimité
    if (currentLimit === -1) return false
    
    // Pour les booléens (advanced_tools)
    if (typeof currentLimit === 'boolean') {
      return !currentLimit
    }
    
    // Pour les valeurs numériques
    return currentUsage >= currentLimit
  }, [usage, limits, hasActiveSubscription])

  // Check if approaching limit (80% or more)
  const isApproachingLimit = useCallback((limitationType: LimitationType): boolean => {
    if (!usage || !limits) return false
    
    // Paid users have no limits
    if (hasActiveSubscription) return false
    
    const currentUsage = usage[limitationType]
    const currentLimit = limits[limitationType]
    
    // If limit is -1, it's unlimited
    if (currentLimit === -1) return false
    
    // For booleans, no notion of approaching
    if (typeof currentLimit === 'boolean') return false
    
    // For numeric values, check if we're at 80% or more
    return currentUsage >= (currentLimit * 0.8)
  }, [usage, limits, hasActiveSubscription])

  // Obtenir le pourcentage d'usage pour une limitation
  const getUsagePercentage = useCallback((limitationType: LimitationType): number => {
    if (!usage || !limits) return 0
    
    const currentUsage = usage[limitationType]
    const currentLimit = limits[limitationType]
    
    // Si la limite est -1, c'est illimité
    if (currentLimit === -1) return 0
    
    // Pour les booléens
    if (typeof currentLimit === 'boolean') {
      return currentLimit ? 0 : 100
    }
    
    // Pour les valeurs numériques
    if (currentLimit === 0) return 100
    return Math.min((currentUsage / currentLimit) * 100, 100)
  }, [usage, limits])

  // Incrémenter l'usage pour une action donnée
  const incrementUsage = useCallback(async (limitationType: LimitationType, amount: number = 1) => {
    if (!user || !usage) return false

    try {
      // Mettre à jour l'usage en base de données
      const { error } = await supabase
        .rpc('increment_user_usage', {
          p_user_id: user.id,
          p_usage_type: limitationType,
          p_amount: amount
        })

      if (error) {
        throw error
      }

      // Mettre à jour l'état local
      setUsage(prev => {
        if (!prev) return prev
        return {
          ...prev,
          [limitationType]: prev[limitationType] + amount
        }
      })

      return true
    } catch (err) {
      console.error('Error incrementing usage:', err)
      return false
    }
  }, [user, usage, supabase])

  // Check if an action is allowed
  const canPerformAction = useCallback((limitationType: LimitationType): boolean => {
    return !isLimitReached(limitationType)
  }, [isLimitReached])

  // Get limit information for display
  const getLimitInfo = useCallback((limitationType: LimitationType) => {
    if (!usage || !limits) return null

    const currentUsage = usage[limitationType]
    const currentLimit = limits[limitationType]
    
    return {
      current: currentUsage,
      limit: currentLimit,
      isUnlimited: currentLimit === -1,
      isReached: isLimitReached(limitationType),
      isApproaching: isApproachingLimit(limitationType),
      percentage: getUsagePercentage(limitationType)
    }
  }, [usage, limits, isLimitReached, isApproachingLimit, getUsagePercentage])

  useEffect(() => {
    fetchLimits()
  }, [fetchLimits])

  useEffect(() => {
    fetchUsage()
  }, [fetchUsage])

  return {
    usage,
    limits,
    loading,
    error,
    isLimitReached,
    isApproachingLimit,
    getUsagePercentage,
    incrementUsage,
    canPerformAction,
    getLimitInfo,
    refreshUsage: fetchUsage,
    hasActiveSubscription
  }
}

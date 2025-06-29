'use client'

import { useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from './useUserCredits'
import { useUpsellContext } from '@/components/upselling'
import toast from 'react-hot-toast'

type GenerationType = 'characters' | 'decors' | 'scenes'

export function useGenerationLimits() {
  const { credits, refreshCredits, user } = useUserCredits()
  const { hasActiveSubscription, checkCharacterImageLimit, checkDecorImageLimit, checkSceneGenerationLimit } = useUpsellContext()
  const supabase = createClient()

  // Vérifier si une génération est possible (côté serveur)
  const canGenerate = useCallback(async (type: GenerationType): Promise<{ allowed: boolean; reason?: string }> => {
    if (!user) {
      return { allowed: false, reason: 'Utilisateur non connecté' }
    }

    // Les utilisateurs premium peuvent toujours générer
    if (hasActiveSubscription) {
      return { allowed: true }
    }

    try {
      const response = await fetch('/api/check-generation-limits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        if (response.status === 404) {
          console.error('API check-generation-limits not found')
          return { allowed: false, reason: 'Service de vérification indisponible' }
        }

        const errorText = await response.text()
        console.error('Response error:', errorText)
        return { allowed: false, reason: 'Erreur lors de la vérification des limites' }
      }

      const data = await response.json()

      if (!data.success) {
        return { allowed: false, reason: data.error || 'Erreur lors de la vérification' }
      }

      if (!data.limits.allowed) {
        return { allowed: false, reason: data.limits.reason }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error)
      return { allowed: false, reason: 'Erreur de connexion' }
    }
  }, [user, hasActiveSubscription])

  // Incrémenter les compteurs après une génération réussie
  const incrementGeneration = useCallback(async (type: GenerationType): Promise<boolean> => {
    if (!user || !credits) {
      console.error('Utilisateur ou crédits non disponibles')
      return false
    }

    // Les utilisateurs premium n'ont pas de limites
    if (hasActiveSubscription) {
      return true
    }

    try {
      // Utiliser la fonction increment_user_usage pour mettre à jour les compteurs
      let usageType: string
      switch (type) {
        case 'characters':
          usageType = 'character_images'
          break
        case 'decors':
          usageType = 'decor_images'
          break
        case 'scenes':
          usageType = 'scene_generation'
          break
        default:
          usageType = 'monthly_generations'
      }

      // Mettre à jour l'usage en base de données
      const { error } = await supabase
        .rpc('increment_user_usage', {
          p_user_id: user.id,
          p_usage_type: usageType,
          p_amount: 1
        })

      if (error) {
        console.error('Error updating counters:', error)
        toast.error('Error updating limits')
        return false
      }

      // Refresh data immediately
      await refreshCredits()

      console.log(`✅ Counter ${type} incremented successfully`)
      return true
    } catch (error) {
      console.error('Unexpected error during increment:', error)
      toast.error('Error updating limits')
      return false
    }
  }, [user, credits, hasActiveSubscription, supabase, refreshCredits])

  // Check limits and show upsell if necessary
  const checkLimitsAndShowUpsell = useCallback(async (type: GenerationType): Promise<boolean> => {
    const { allowed, reason } = await canGenerate(type)

    if (!allowed && reason) {
      toast.error(reason)

      // Show appropriate upsell modal
      switch (type) {
        case 'characters':
          checkCharacterImageLimit()
          break
        case 'decors':
          checkDecorImageLimit()
          break
        case 'scenes':
          checkSceneGenerationLimit()
          break
      }

      return false
    }

    return true
  }, [canGenerate, checkCharacterImageLimit, checkDecorImageLimit, checkSceneGenerationLimit])

  // Get statistics for a type
  const getTypeStats = useCallback((type: GenerationType) => {
    if (!credits) return null

    switch (type) {
      case 'characters':
        return {
          used: credits.characters_used,
          limit: credits.characters_limit,
          remaining: Math.max(0, credits.characters_limit - credits.characters_used),
          isLimitReached: credits.characters_used >= credits.characters_limit
        }
      case 'decors':
        return {
          used: credits.decors_used,
          limit: credits.decors_limit,
          remaining: Math.max(0, credits.decors_limit - credits.decors_used),
          isLimitReached: credits.decors_used >= credits.decors_limit
        }
      case 'scenes':
        return {
          used: credits.scenes_used,
          limit: credits.scenes_limit,
          remaining: Math.max(0, credits.scenes_limit - credits.scenes_used),
          isLimitReached: credits.scenes_used >= credits.scenes_limit
        }
      default:
        return null
    }
  }, [credits])

  // Get global statistics
  const getGlobalStats = useCallback(() => {
    if (!credits) return null

    return {
      used: credits.image_generations_used,
      limit: credits.image_generations_limit,
      remaining: Math.max(0, credits.image_generations_limit - credits.image_generations_used),
      isLimitReached: credits.image_generations_used >= credits.image_generations_limit
    }
  }, [credits])

  return {
    canGenerate,
    incrementGeneration,
    checkLimitsAndShowUpsell,
    getTypeStats,
    getGlobalStats,
    hasActiveSubscription,
    credits,
    refreshCredits
  }
}

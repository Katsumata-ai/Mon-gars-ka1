'use client'

import { useState, useCallback } from 'react'
import { useAuth } from './useAuth'
import { useUserLimits } from './useUserLimits'
import { LimitationType } from '@/types/upselling'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

export function useUpselling() {
  const { user } = useAuth()
  const { isLimitReached, canPerformAction, hasActiveSubscription, getLimitInfo } = useUserLimits()
  const [activeModal, setActiveModal] = useState<{
    type: LimitationType
    isOpen: boolean
  } | null>(null)

  // Check if user can see upselling modals
  const canShowUpsell = useCallback((): boolean => {
    // Don't show for non-logged users
    if (!user) return false
    
    // Don't show for paid users
    if (hasActiveSubscription) return false
    
    return true
  }, [user, hasActiveSubscription])

  // Check and potentially show upselling modal
  const checkAndShowUpsell = useCallback((limitationType: LimitationType): boolean => {
    // If user can't see upsell, allow action
    if (!canShowUpsell()) return true

    // For projects, force modal display if we get here
    if (limitationType === 'total_projects') {
      setActiveModal({
        type: limitationType,
        isOpen: true
      })
      return false
    }

    // If limit not reached, allow action
    if (canPerformAction(limitationType)) return true

    // Afficher la modale d'upselling
    setActiveModal({
      type: limitationType,
      isOpen: true
    })

    // Bloquer l'action
    return false
  }, [canShowUpsell, canPerformAction])

  // Fermer la modale active
  const closeModal = useCallback(() => {
    setActiveModal(null)
  }, [])

  // Handle upgrade to paid plan
  const handleUpgrade = useCallback((planType: 'monthly' | 'yearly') => {
    const interval = planType === 'monthly' ? 'monthly' : 'yearly'
    const paymentLink = STRIPE_CONFIG.paymentLinks[interval]

    if (paymentLink) {
      window.location.href = paymentLink
    }
  }, [])

  // Vérifications spécifiques par type d'action
  const checkCharacterImageLimit = useCallback(() => {
    return checkAndShowUpsell('character_images')
  }, [checkAndShowUpsell])

  const checkDecorImageLimit = useCallback(() => {
    return checkAndShowUpsell('decor_images')
  }, [checkAndShowUpsell])

  const checkSceneGenerationLimit = useCallback(() => {
    return checkAndShowUpsell('scene_generation')
  }, [checkAndShowUpsell])

  const checkProjectPagesLimit = useCallback(() => {
    return checkAndShowUpsell('project_pages')
  }, [checkAndShowUpsell])

  const checkTotalProjectsLimit = useCallback(() => {
    return checkAndShowUpsell('total_projects')
  }, [checkAndShowUpsell])

  const checkProjectExportsLimit = useCallback(() => {
    return checkAndShowUpsell('project_exports')
  }, [checkAndShowUpsell])

  const checkMonthlyGenerationsLimit = useCallback(() => {
    return checkAndShowUpsell('monthly_generations')
  }, [checkAndShowUpsell])

  const checkStorageSpaceLimit = useCallback(() => {
    return checkAndShowUpsell('storage_space')
  }, [checkAndShowUpsell])

  const checkAdvancedToolsAccess = useCallback(() => {
    return checkAndShowUpsell('advanced_tools')
  }, [checkAndShowUpsell])

  // Obtenir les informations de la modale active
  const getActiveModalInfo = useCallback(() => {
    if (!activeModal) return null

    const limitInfo = getLimitInfo(activeModal.type)
    
    return {
      limitationType: activeModal.type,
      isOpen: activeModal.isOpen,
      currentUsage: limitInfo?.current,
      limit: limitInfo?.limit
    }
  }, [activeModal, getLimitInfo])

  // Vérifier si une action spécifique est autorisée (sans afficher de modale)
  const isActionAllowed = useCallback((limitationType: LimitationType): boolean => {
    if (!canShowUpsell()) return true
    return canPerformAction(limitationType)
  }, [canShowUpsell, canPerformAction])

  // Obtenir le statut d'une limite spécifique
  const getLimitStatus = useCallback((limitationType: LimitationType) => {
    const limitInfo = getLimitInfo(limitationType)
    if (!limitInfo) return null

    return {
      ...limitInfo,
      canShowUpsell: canShowUpsell(),
      isBlocked: !canShowUpsell() ? false : limitInfo.isReached
    }
  }, [getLimitInfo, canShowUpsell])

  return {
    // État de la modale
    activeModal: getActiveModalInfo(),
    closeModal,
    handleUpgrade,
    
    // Vérifications génériques
    checkAndShowUpsell,
    isActionAllowed,
    getLimitStatus,
    canShowUpsell,
    
    // Vérifications spécifiques
    checkCharacterImageLimit,
    checkDecorImageLimit,
    checkSceneGenerationLimit,
    checkProjectPagesLimit,
    checkTotalProjectsLimit,
    checkProjectExportsLimit,
    checkMonthlyGenerationsLimit,
    checkStorageSpaceLimit,
    checkAdvancedToolsAccess,
    
    // Informations utilisateur
    hasActiveSubscription
  }
}

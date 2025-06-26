'use client'

import { useContext } from 'react'
import { LimitationType } from '@/types/upselling'

// Import du contexte d'upselling - utilisation d'un import dynamique pour éviter les erreurs
let UpsellContext: any = null

try {
  const { UpsellContext: ImportedContext } = require('@/components/upselling/UpsellProvider')
  UpsellContext = ImportedContext
} catch (error) {
  // Le contexte n'est pas disponible, on utilisera les valeurs par défaut
  console.warn('UpsellContext not available, using safe defaults')
}

/**
 * Hook sécurisé pour l'upselling qui ne lance pas d'erreur si le provider n'est pas disponible
 * Utile pour les composants qui peuvent être utilisés avec ou sans le système d'upselling
 */
export function useUpsellingSafe() {
  const context = useContext(UpsellContext)
  
  // Si le contexte n'est pas disponible, retourner des valeurs par défaut
  if (!context) {
    return {
      // Méthodes de vérification - autorisent tout par défaut
      checkCharacterImageLimit: () => true,
      checkDecorImageLimit: () => true,
      checkSceneGenerationLimit: () => true,
      checkProjectPagesLimit: () => true,
      checkTotalProjectsLimit: () => true,
      checkProjectExportsLimit: () => true,
      checkMonthlyGenerationsLimit: () => true,
      checkStorageSpaceLimit: () => true,
      checkAdvancedToolsAccess: () => true,
      checkAndShowUpsell: (limitationType: LimitationType) => true,
      
      // Méthodes d'information - valeurs par défaut
      isActionAllowed: (limitationType: LimitationType) => true,
      getLimitStatus: (limitationType: LimitationType) => ({
        current: 0,
        limit: -1,
        isUnlimited: true,
        isReached: false,
        isApproaching: false,
        percentage: 0
      }),
      
      // États - valeurs par défaut sécurisées
      canShowUpsell: false,
      hasActiveSubscription: true, // Considérer comme premium par défaut pour éviter les blocages
      
      // Indicateur que le provider n'est pas disponible
      isProviderAvailable: false
    }
  }
  
  // Si le contexte est disponible, retourner les vraies valeurs avec un indicateur
  return {
    ...context,
    isProviderAvailable: true
  }
}

/**
 * Hook pour vérifier si le système d'upselling est disponible
 */
export function useIsUpsellingAvailable(): boolean {
  const context = useContext(UpsellContext)
  return context !== undefined
}

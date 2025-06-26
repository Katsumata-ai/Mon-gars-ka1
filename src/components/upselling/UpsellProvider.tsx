'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useUpselling } from '@/hooks/useUpselling'
import { UpsellModal } from './UpsellModal'
import { PremiumUpgradeModal } from './PremiumUpgradeModal'
import { LimitationType } from '@/types/upselling'

interface UpsellContextType {
  checkCharacterImageLimit: () => boolean
  checkDecorImageLimit: () => boolean
  checkSceneGenerationLimit: () => boolean
  checkProjectPagesLimit: () => boolean
  checkTotalProjectsLimit: () => boolean
  checkProjectExportsLimit: () => boolean
  checkMonthlyGenerationsLimit: () => boolean
  checkStorageSpaceLimit: () => boolean
  checkAdvancedToolsAccess: () => boolean
  checkAndShowUpsell: (limitationType: LimitationType) => boolean
  isActionAllowed: (limitationType: LimitationType) => boolean
  getLimitStatus: (limitationType: LimitationType) => any
  canShowUpsell: boolean
  hasActiveSubscription: boolean
}

const UpsellContext = createContext<UpsellContextType | undefined>(undefined)

interface UpsellProviderProps {
  children: ReactNode
}

export function UpsellProvider({ children }: UpsellProviderProps) {
  const upselling = useUpselling()

  const contextValue: UpsellContextType = {
    checkCharacterImageLimit: upselling.checkCharacterImageLimit,
    checkDecorImageLimit: upselling.checkDecorImageLimit,
    checkSceneGenerationLimit: upselling.checkSceneGenerationLimit,
    checkProjectPagesLimit: upselling.checkProjectPagesLimit,
    checkTotalProjectsLimit: upselling.checkTotalProjectsLimit,
    checkProjectExportsLimit: upselling.checkProjectExportsLimit,
    checkMonthlyGenerationsLimit: upselling.checkMonthlyGenerationsLimit,
    checkStorageSpaceLimit: upselling.checkStorageSpaceLimit,
    checkAdvancedToolsAccess: upselling.checkAdvancedToolsAccess,
    checkAndShowUpsell: upselling.checkAndShowUpsell,
    isActionAllowed: upselling.isActionAllowed,
    getLimitStatus: upselling.getLimitStatus,
    canShowUpsell: upselling.canShowUpsell,
    hasActiveSubscription: upselling.hasActiveSubscription
  }

  return (
    <UpsellContext.Provider value={contextValue}>
      {children}
      
      {/* Modale d'upselling automatique */}
      {upselling.activeModal && (
        <PremiumUpgradeModal
          isOpen={upselling.activeModal.isOpen}
          onClose={upselling.closeModal}
          limitType={upselling.activeModal.limitationType as 'characters' | 'decors' | 'scenes' | 'projects' | 'general'}
          currentUsage={upselling.activeModal.currentUsage ? {
            used: upselling.activeModal.currentUsage,
            limit: upselling.activeModal.limit,
            type: upselling.activeModal.limitationType
          } : undefined}
        />
      )}
    </UpsellContext.Provider>
  )
}

export function useUpsellContext() {
  const context = useContext(UpsellContext)
  if (context === undefined) {
    throw new Error('useUpsellContext must be used within an UpsellProvider')
  }
  return context
}

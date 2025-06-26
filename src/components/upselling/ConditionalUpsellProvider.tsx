'use client'

import { ReactNode } from 'react'
import { UpsellProvider } from './UpsellProvider'

interface ConditionalUpsellProviderProps {
  children: ReactNode
  enabled?: boolean
}

/**
 * Provider conditionnel pour l'upselling qui ne se charge que quand nécessaire
 * Cela évite les erreurs sur les pages qui n'ont pas besoin du système d'upselling
 */
export function ConditionalUpsellProvider({ 
  children, 
  enabled = true 
}: ConditionalUpsellProviderProps) {
  if (!enabled) {
    return <>{children}</>
  }

  return (
    <UpsellProvider>
      {children}
    </UpsellProvider>
  )
}

'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useCurrency, Currency } from '@/hooks/useCurrency'

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  toggleCurrency: () => void
  formatPrice: (amount: number, options?: { 
    minimumFractionDigits?: number
    maximumFractionDigits?: number 
  }) => string
  formatSavings: (monthlyPrice: number, yearlyPrice: number) => string
  getCurrencySymbol: () => string
  getCurrencyCode: () => string
  getLocale: () => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

interface CurrencyProviderProps {
  children: ReactNode
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const currencyHook = useCurrency()

  return (
    <CurrencyContext.Provider value={currencyHook}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrencyContext() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error('useCurrencyContext must be used within a CurrencyProvider')
  }
  return context
}

// Hook pour utiliser la devise dans les composants
export function useGlobalCurrency() {
  return useCurrencyContext()
}

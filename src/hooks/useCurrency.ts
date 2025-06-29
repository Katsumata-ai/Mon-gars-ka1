'use client'

import { useState, useEffect } from 'react'
import { detectUserCurrency } from '@/lib/stripe/config'

export type Currency = 'eur' | 'usd'

const CURRENCY_STORAGE_KEY = 'mangaka-ai-currency-preference'

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>('eur')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Charger la préférence sauvegardée ou détecter automatiquement
    const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY) as Currency
    const detectedCurrency = savedCurrency || detectUserCurrency()
    setCurrency(detectedCurrency)
    setIsLoading(false)
  }, [])

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency)
  }

  const toggleCurrency = () => {
    const newCurrency = currency === 'eur' ? 'usd' : 'eur'
    updateCurrency(newCurrency)
  }

  const formatPrice = (amount: number, options?: {
    minimumFractionDigits?: number
    maximumFractionDigits?: number
  }) => {
    const locale = currency === 'usd' ? 'en-US' : 'fr-FR'
    const currencyCode = currency === 'usd' ? 'USD' : 'EUR'

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: options?.minimumFractionDigits ?? 2,
      maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    }).format(amount)
  }

  const formatSavings = (monthlyPrice: number, yearlyPrice: number) => {
    const annualCost = monthlyPrice * 12
    const savings = annualCost - yearlyPrice

    // Arrondir à 2 décimales pour éviter les problèmes de précision
    const roundedSavings = Math.round(savings * 100) / 100

    return formatPrice(roundedSavings, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  }

  const getCurrencySymbol = () => {
    return currency === 'usd' ? '$' : '€'
  }

  const getCurrencyCode = () => {
    return currency === 'usd' ? 'USD' : 'EUR'
  }

  const getLocale = () => {
    return currency === 'usd' ? 'en-US' : 'fr-FR'
  }

  const clearCurrencyCache = () => {
    localStorage.removeItem('mangaka-currency')
    window.location.reload()
  }

  return {
    currency,
    setCurrency: updateCurrency,
    toggleCurrency,
    formatPrice,
    formatSavings,
    getCurrencySymbol,
    getCurrencyCode,
    getLocale,
    isLoading,
    clearCurrencyCache
  }
}

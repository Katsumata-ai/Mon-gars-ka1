'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useSubscription } from '@/hooks/useStripe'

/**
 * Hook sécurisé qui n'active useSubscription que pour les utilisateurs connectés
 * Évite les appels API 401 pour les utilisateurs non connectés
 */
export function useSubscriptionSafe() {
  const { user, initialized } = useAuth()
  const subscriptionHook = useSubscription()

  useEffect(() => {
    // Activer le fetch seulement si l'utilisateur est connecté et l'auth est initialisée
    if (initialized && user && subscriptionHook.enableFetching) {
      subscriptionHook.enableFetching()
    }
  }, [user, initialized, subscriptionHook.enableFetching])

  // Retourner des valeurs par défaut pour les utilisateurs non connectés
  if (!user || !initialized) {
    return {
      subscription: null,
      credits: { credits_remaining: 10, credits_total: 10, last_reset_date: new Date() },
      currentPlan: 'junior',
      features: ['basic_generation', 'limited_export'],
      loading: false,
      error: null,
      fetchSubscription: () => Promise.resolve(),
      useCredit: () => Promise.resolve(false),
      hasFeature: () => false,
      canGenerate: () => true,
      hasActiveSubscription: false,
      enableFetching: () => {},
    }
  }

  // 🎨 EXCEPTION FONDATEUR : Accès premium gratuit pour le fondateur
  if (user.email === 'nefziamenallah2007@gmail.com') {
    return {
      ...subscriptionHook,
      currentPlan: 'senior',
      features: ['unlimited_generation', 'unlimited_characters', 'unlimited_backgrounds', 'unlimited_scenes', 'unlimited_pages', 'unlimited_projects', 'unlimited_export', 'advanced_tools', 'hd_export', 'priority_support'],
      hasActiveSubscription: true,
      hasFeature: () => true,
      canGenerate: () => true,
    }
  }

  return subscriptionHook
}

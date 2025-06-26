'use client'

import { useState, useEffect } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

let stripePromise: Promise<Stripe | null>

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey)
  }
  return stripePromise
}

export function useStripe() {
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStripe().then((stripeInstance) => {
      setStripe(stripeInstance)
      setLoading(false)
    })
  }, [])

  return { stripe, loading }
}

export function usePayment() {
  const { stripe, loading: stripeLoading } = useStripe()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createPaymentIntent = async (planId: string, userId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const data = await response.json()
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const confirmPayment = async (clientSecret: string, paymentMethod: any) => {
    if (!stripe) {
      throw new Error('Stripe not loaded')
    }

    try {
      setLoading(true)
      setError(null)

      const { error, paymentIntent } = await stripe.confirmPayment({
        clientSecret,
        confirmParams: {
          payment_method: paymentMethod,
        },
        redirect: 'if_required',
      })

      if (error) {
        throw new Error(error.message)
      }

      return paymentIntent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment confirmation failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const redirectToCheckout = (planId: string, billing: 'monthly' | 'yearly' = 'monthly') => {
    const plan = STRIPE_CONFIG.plans.find(p => p.id === planId) as any
    if (plan?.paymentLinks) {
      window.open(plan.paymentLinks[billing], '_blank')
    }
  }

  return {
    stripe,
    loading: loading || stripeLoading,
    error,
    createPaymentIntent,
    confirmPayment,
    redirectToCheckout,
  }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<any>(null)
  const [credits, setCredits] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<string>('junior')
  const [features, setFeatures] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [shouldFetch, setShouldFetch] = useState(false)

  const fetchSubscription = async (force = false) => {
    // Cache pendant 30 secondes pour éviter les appels répétés
    const now = Date.now()
    if (!force && now - lastFetch < 30000 && subscription !== null) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // Timeout 5s

      const response = await fetch('/api/user/subscription', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
        }
      })

      clearTimeout(timeoutId)

      if (response.status === 401) {
        // Utilisateur non authentifié - définir des valeurs par défaut
        setSubscription(null)
        setCredits({ credits_remaining: 10, credits_total: 10, last_reset_date: new Date() })
        setCurrentPlan('junior')
        setFeatures(['basic_generation', 'limited_export'])
        setLastFetch(now)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }

      const data = await response.json()
      setSubscription(data.subscription)
      setCredits(data.credits)
      setCurrentPlan(data.currentPlan)
      setFeatures(data.features)
      setLastFetch(now)
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Timeout: La requête a pris trop de temps')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load subscription'
        setError(errorMessage)

        // En cas d'erreur, définir des valeurs par défaut pour éviter les blocages
        setSubscription(null)
        setCredits({ credits_remaining: 10, credits_total: 10, last_reset_date: new Date() })
        setCurrentPlan('junior')
        setFeatures(['basic_generation', 'limited_export'])
      }
    } finally {
      setLoading(false)
    }
  }

  const useCredit = async (amount: number = 1) => {
    try {
      const response = await fetch('/api/user/subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'use_credit', amount }),
      })

      if (!response.ok) {
        throw new Error('Failed to use credit')
      }

      const data = await response.json()
      
      if (data.success) {
        // Rafraîchir les données
        await fetchSubscription()
      }

      return data.success
    } catch (err) {
      return false
    }
  }

  const hasFeature = (feature: string) => {
    return features.includes(feature)
  }

  const canGenerate = () => {
    return hasFeature('unlimited_generation') || (credits?.credits_remaining > 0)
  }

  // Activer le fetch seulement quand nécessaire (pour les utilisateurs connectés)
  const enableFetching = () => {
    setShouldFetch(true)
  }

  useEffect(() => {
    // Éviter l'appel côté serveur pour prévenir l'hydratation
    if (typeof window === 'undefined') return

    // Ne faire l'appel que si explicitement activé
    if (!shouldFetch) return

    // Attendre un tick pour s'assurer que l'authentification est initialisée
    const timer = setTimeout(() => {
      fetchSubscription()
    }, 100)

    return () => clearTimeout(timer)
  }, [shouldFetch])

  return {
    subscription,
    credits,
    currentPlan,
    features,
    loading,
    error,
    fetchSubscription,
    useCredit,
    hasFeature,
    canGenerate,
    hasActiveSubscription: currentPlan === 'senior',
    enableFetching, // Nouvelle méthode pour activer le fetch
  }
}

export default getStripe

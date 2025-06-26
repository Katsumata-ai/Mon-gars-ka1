'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePayment, useSubscription } from '@/hooks/useStripe'
import { useAuth } from '@/hooks/useAuth'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

interface CheckoutButtonProps {
  planId: string
  planName: string
  price: number
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'highlight'
}

export function CheckoutButton({ 
  planId, 
  planName, 
  price, 
  className, 
  children,
  variant = 'default'
}: CheckoutButtonProps) {
  const { user } = useAuth()
  const { redirectToCheckout, loading } = usePayment()
  const { currentPlan } = useSubscription()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCheckout = async () => {
    // Si c'est le plan gratuit, rediriger vers l'inscription ou le dashboard
    if (price === 0) {
      if (!user) {
        window.location.href = '/signup'
      } else {
        window.location.href = '/dashboard'
      }
      return
    }

    // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription avec paramètres de redirection
    if (!user) {
      const plan = STRIPE_CONFIG.plans.find(p => p.id === planId)
      if (plan?.paymentLinks?.monthly) {
        const encodedLink = encodeURIComponent(plan.paymentLinks.monthly)
        window.location.href = `/signup?redirect=${encodedLink}`
      } else {
        window.location.href = '/signup'
      }
      return
    }

    // Si l'utilisateur a déjà ce plan
    if (currentPlan === planId) {
      window.location.href = '/dashboard'
      return
    }

    // Use direct Stripe checkout links
    const paymentLink = STRIPE_CONFIG.paymentLinks.monthly
    if (paymentLink) {
      window.location.href = paymentLink
    }
  }

  const buttonStyles = {
    default: cn(
      "h-12 bg-slate-800 hover:bg-slate-700",
      "text-white border border-slate-600",
      "hover:border-primary-500 shadow-sm hover:shadow-md",
      "text-sm font-medium font-comic",
    ),
    highlight: cn(
      "h-12 bg-primary-500 hover:bg-primary-600",
      "text-white shadow-lg hover:shadow-xl",
      "font-semibold text-base font-comic",
      "border border-primary-400",
    ),
  }

  const isLoading = loading || isProcessing

  return (
    <Button
      onClick={handleCheckout}
      disabled={isLoading}
      className={cn(
        "w-full relative transition-all duration-300",
        variant === 'highlight' ? buttonStyles.highlight : buttonStyles.default,
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children || (
          <>
            {price === 0 ? 'Essayer gratuitement' : 'Commencer maintenant'}
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
        {isLoading && (
          <div className="ml-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </span>
    </Button>
  )
}

export default CheckoutButton

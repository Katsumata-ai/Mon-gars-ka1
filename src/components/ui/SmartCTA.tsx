'use client'

import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/useCurrency'
import { getPricesByCurrency } from '@/lib/stripe/config'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

interface SmartCTAProps {
  plan: 'monthly' | 'yearly'
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  showIcon?: boolean
}

export function SmartCTA({ 
  plan, 
  className, 
  children, 
  variant = 'default',
  size = 'md',
  disabled = false,
  showIcon = true
}: SmartCTAProps) {
  const { currency } = useCurrency()
  const { user } = useAuth()
  const router = useRouter()

  const handleClick = () => {
    if (disabled) return

    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!user) {
      router.push('/auth/login')
      return
    }

    // Obtenir les prix selon la devise
    const prices = getPricesByCurrency(currency)
    const priceId = prices[plan].id

    // Créer l'URL de checkout avec la devise appropriée
    const currentPath = window.location.pathname
    const returnUrl = encodeURIComponent(currentPath)
    const checkoutUrl = `/api/stripe/create-checkout-session?plan=${plan}&currency=${currency}&price_id=${priceId}&return_url=${returnUrl}`

    // Rediriger vers Stripe Checkout
    window.location.href = checkoutUrl
  }

  const defaultText = plan === 'yearly' ? 'Get Started - Annual' : 'Get Started - Monthly'

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      variant={variant}
      size={size}
      className={cn(
        "group transition-all duration-300",
        className
      )}
    >
      {children || defaultText}
      {showIcon && (
        <ArrowRightIcon className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
      )}
    </Button>
  )
}

// Composant spécialisé pour les boutons de pricing
interface PricingCTAProps extends Omit<SmartCTAProps, 'children'> {
  tierName: string
  isHighlight?: boolean
}

export function PricingCTA({ 
  tierName, 
  isHighlight = false, 
  plan, 
  className,
  ...props 
}: PricingCTAProps) {
  const { user } = useAuth()

  const getButtonText = () => {
    if (!user) {
      return 'Sign Up'
    }
    
    if (tierName === 'Mangaka Junior') {
      return 'Start Free'
    }
    
    return plan === 'yearly' ? 'Subscribe Annual' : 'Subscribe Monthly'
  }

  return (
    <SmartCTA
      plan={plan}
      variant={isHighlight ? 'default' : 'outline'}
      className={cn(
        "w-full",
        isHighlight && "bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700",
        className
      )}
      {...props}
    >
      {getButtonText()}
    </SmartCTA>
  )
}

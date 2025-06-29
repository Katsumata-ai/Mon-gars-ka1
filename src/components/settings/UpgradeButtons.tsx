'use client'

import { STRIPE_CONFIG, getPricesByCurrency } from '@/lib/stripe/config'
import { useCurrency } from '@/hooks/useCurrency'

interface UpgradeButtonsProps {
  className?: string
}

export default function UpgradeButtons({ className = '' }: UpgradeButtonsProps) {
  const { currency, formatPrice } = useCurrency()

  // Helper function to get price based on currency
  const getPrice = (interval: 'monthly' | 'yearly') => {
    const seniorPlan = STRIPE_CONFIG.plans.find(p => p.id === 'senior')
    if (!seniorPlan) return 0

    if (seniorPlan.price.eur && seniorPlan.price.usd) {
      return seniorPlan.price[currency][interval]
    } else {
      return seniorPlan.price[interval]
    }
  }

  const handleUpgrade = (plan: 'monthly' | 'yearly') => {
    const prices = getPricesByCurrency(currency)
    const priceId = prices[plan].id

    // Créer l'URL de checkout avec la devise appropriée
    const currentPath = window.location.pathname
    const returnUrl = encodeURIComponent(currentPath)
    const checkoutUrl = `/api/stripe/create-checkout-session?plan=${plan}&currency=${currency}&price_id=${priceId}&return_url=${returnUrl}`

    window.location.href = checkoutUrl
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={() => handleUpgrade('monthly')}
        className="bg-gradient-to-r from-primary-500 to-yellow-500 hover:from-primary-600 hover:to-yellow-600 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg text-sm"
      >
        Monthly - {formatPrice(getPrice('monthly'))}
      </button>
      <button
        onClick={() => handleUpgrade('yearly')}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg text-sm relative"
      >
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          Save
        </span>
        Annual - {formatPrice(getPrice('yearly'))}
      </button>
    </div>
  )
}

'use client'

import { useCurrency } from '@/hooks/useCurrency'
import { STRIPE_CONFIG } from '@/lib/stripe/config'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'

export function PricingDebug() {
  const { currency, setCurrency, formatPrice, formatSavings, clearCurrencyCache } = useCurrency()

  const seniorPlan = STRIPE_CONFIG.plans.find(p => p.id === 'senior')
  
  const getPrice = (interval: 'monthly' | 'yearly') => {
    if (!seniorPlan) return 0
    
    if (seniorPlan.price.eur && seniorPlan.price.usd) {
      return seniorPlan.price[currency][interval]
    } else {
      return seniorPlan.price[interval]
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 text-white text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Pricing Debug</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span>Currency:</span>
          <CurrencyToggle 
            currency={currency}
            onCurrencyChange={setCurrency}
            size="xs"
            variant="minimal"
          />
        </div>
        
        <div>
          <strong>Current Prices:</strong>
          <div>Monthly: {formatPrice(getPrice('monthly'))}</div>
          <div>Yearly: {formatPrice(getPrice('yearly'))}</div>
          <div>Savings: {formatSavings(getPrice('monthly'), getPrice('yearly'))}</div>
        </div>
        
        <div>
          <strong>Raw Config:</strong>
          <div>EUR: {seniorPlan?.price.eur?.monthly}€ / {seniorPlan?.price.eur?.yearly}€</div>
          <div>USD: ${seniorPlan?.price.usd?.monthly} / ${seniorPlan?.price.usd?.yearly}</div>
        </div>
        
        <button 
          onClick={clearCurrencyCache}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
        >
          Clear Cache & Reload
        </button>
      </div>
    </div>
  )
}

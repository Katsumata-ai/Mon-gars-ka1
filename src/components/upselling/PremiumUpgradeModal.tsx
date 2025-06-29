'use client'

import { useState } from 'react'
import { X, Check, Zap, Crown, Infinity } from 'lucide-react'
import { STRIPE_CONFIG, getPricesByCurrency } from '@/lib/stripe/config'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/useCurrency'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'

interface PremiumUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  limitType?: 'characters' | 'decors' | 'scenes' | 'projects' | 'general'
  currentUsage?: {
    used: number
    limit: number
    type: string
  }
}

export function PremiumUpgradeModal({
  isOpen,
  onClose,
  limitType = 'general',
  currentUsage
}: PremiumUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual')
  const { currency, setCurrency, formatPrice, formatSavings } = useCurrency()

  if (!isOpen) return null

  const getLimitMessage = () => {
    switch (limitType) {
      case 'characters':
        return {
          title: '🚫 Character limit reached',
          subtitle: 'You have used all your free characters this month',
          icon: '👥'
        }
      case 'decors':
        return {
          title: '🚫 Background limit reached',
          subtitle: 'You have used all your free backgrounds this month',
          icon: '🏞️'
        }
      case 'scenes':
        return {
          title: '🚫 Scene limit reached',
          subtitle: 'You have used all your free scenes this month',
          icon: '🎬'
        }
      case 'projects':
        return {
          title: '🚫 Project limit reached',
          subtitle: 'You have reached your limit of 1 free project',
          icon: '📝'
        }
      default:
        return {
          title: '🚫 Limit reached',
          subtitle: 'Upgrade to premium plan to continue',
          icon: '⚡'
        }
    }
  }

  const { title, subtitle, icon } = getLimitMessage()

  const freeFeatures = [
    'Limited characters',
    'Limited backgrounds',
    'Limited scenes',
    'Limited pages',
    'Limited projects',
    'Limited export'
  ]

  const premiumFeatures = [
    'Unlimited characters',
    'Unlimited backgrounds',
    'Unlimited scenes',
    'Unlimited pages',
    'Unlimited projects',
    'Unlimited export',
    'Advanced tools',
    'HD export',
    'Priority support'
  ]

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    const interval = plan === 'annual' ? 'yearly' : 'monthly'
    const prices = getPricesByCurrency(currency)
    const priceId = prices[interval].id

    // Créer l'URL de checkout avec la devise appropriée
    const currentPath = window.location.pathname
    const returnUrl = encodeURIComponent(currentPath)
    const checkoutUrl = `/api/stripe/create-checkout-session?plan=${interval}&currency=${currency}&price_id=${priceId}&return_url=${returnUrl}`

    window.location.href = checkoutUrl
  }

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl relative z-[101]">
        {/* Header */}
        <div className="relative p-6 border-b border-slate-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="text-4xl mb-2">{icon}</div>
            <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
            <p className="text-slate-400">{subtitle}</p>
            {currentUsage && (
              <div className="mt-3 inline-block bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm">
                {currentUsage.used}/{currentUsage.limit} {currentUsage.type} used
              </div>
            )}

            {/* Currency Toggle */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Currency:</span>
                <CurrencyToggle
                  currency={currency}
                  onCurrencyChange={setCurrency}
                  size="xs"
                  variant="subtle"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Plans Comparison */}
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Plan */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-600">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                <div className="text-3xl font-bold text-slate-400">{formatPrice(0)}</div>
                <div className="text-slate-500 text-sm">per month</div>
              </div>
              
              <ul className="space-y-3 mb-6">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="text-center">
                <div className="bg-slate-700 text-slate-400 py-2 px-4 rounded-lg text-sm">
                  Current plan
                </div>
              </div>
            </div>

            {/* Plan Premium */}
            <div className="bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-xl p-6 border border-red-500/50 relative overflow-hidden">
              {/* Popular badge */}
              <div className="absolute top-0 right-0 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1 text-xs font-bold rounded-bl-lg shadow-lg shadow-red-500/50">
                POPULAR
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <Crown className="w-6 h-6 text-yellow-400 mr-2" />
                  <h3 className="text-xl font-bold text-white">Senior Plan</h3>
                </div>
                
                {/* Toggle monthly/annual with special effects */}
                <div className="flex items-center justify-center mb-4 relative">
                  <div className={cn(
                    "flex rounded-lg border transition-all duration-500",
                    selectedPlan === 'annual'
                      ? "border-red-500/50 shadow-lg shadow-red-500/25"
                      : "border-slate-600"
                  )}>
                    <button
                      onClick={() => setSelectedPlan('monthly')}
                      className={`px-3 py-1 text-sm rounded-l-lg transition-all duration-300 ${
                        selectedPlan === 'monthly'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setSelectedPlan('annual')}
                      className={`px-3 py-1 text-sm rounded-r-lg transition-all duration-300 relative ${
                        selectedPlan === 'annual'
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Annual
                      <span className="absolute -top-2 -right-1 bg-red-500 text-white text-xs px-1 rounded shadow-lg shadow-red-500/50">
                        Save {formatSavings(getPrice('monthly'), getPrice('yearly'))}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div className="text-3xl font-bold text-white">
                  {formatPrice(getPrice(selectedPlan === 'monthly' ? 'monthly' : 'yearly'))}
                </div>
                <div className="text-red-300 text-sm">
                  {selectedPlan === 'monthly' ? 'per month' : 'per year'}
                </div>
                {selectedPlan === 'annual' && (
                  <div className="text-red-400 text-xs mt-1">
                    🎉 Special launch offer - Save {formatSavings(getPrice('monthly'), getPrice('yearly'))}/year
                  </div>
                )}
              </div>
              
              <ul className="space-y-3 mb-6">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-white">
                    <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full mr-3 flex items-center justify-center flex-shrink-0">
                      {feature.includes('Unlimited') ? (
                        <Infinity className="w-2 h-2 text-white" />
                      ) : (
                        <Check className="w-2 h-2 text-white" />
                      )}
                    </div>
                    <span className="text-sm font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(selectedPlan)}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-6 rounded-lg font-bold text-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center shadow-lg shadow-red-500/50"
              >
                <Zap className="w-5 h-5 mr-2" />
                Upgrade to Senior Plan
              </button>

              <div className="text-center mt-3 text-red-300 text-xs">
                7-day refund guarantee
              </div>
            </div>
          </div>
          
          {/* Guarantee */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center bg-green-500/20 text-green-400 px-4 py-2 rounded-lg text-sm">
              <Check className="w-4 h-4 mr-2" />
              7-day refund guarantee
            </div>
          </div>
        </div>
      </div>


    </div>
  )
}

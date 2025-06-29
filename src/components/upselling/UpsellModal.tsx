'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { X, Crown, Check, Zap, Star } from 'lucide-react'
import { UpsellModalProps, UPSELL_CONTENT } from '@/types/upselling'
import { STRIPE_CONFIG, getPricesByCurrency } from '@/lib/stripe/config'
import { useCurrency } from '@/hooks/useCurrency'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'

export function UpsellModal({
  isOpen,
  onClose,
  limitationType,
  currentUsage,
  limit,
  onUpgrade
}: UpsellModalProps) {
  const content = UPSELL_CONTENT[limitationType]
  const seniorPlan = STRIPE_CONFIG.plans.find(plan => plan.id === 'senior')
  const { currency, setCurrency, formatPrice, formatSavings } = useCurrency()

  // Helper function to get price based on currency
  const getPrice = (interval: 'monthly' | 'yearly') => {
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

  if (!content || !seniorPlan) return null

  const handleUpgradeOld = (planType: 'monthly' | 'yearly') => {
    onUpgrade(planType)
    onClose()
  }

  const monthlyDiscount = 0
  const yearlyDiscount = Math.round((1 - (getPrice('yearly') / 12) / getPrice('monthly')) * 100)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gradient-to-br from-dark-800 to-dark-900 border border-primary-500/20 p-8 text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="text-4xl">{content.icon}</div>
                    <div>
                      <Dialog.Title className="text-2xl font-bold text-white">
                        {content.title}
                      </Dialog.Title>
                      {currentUsage !== undefined && limit !== undefined && (
                        <p className="text-sm text-gray-400 mt-1">
                          Usage: {currentUsage}/{limit === -1 ? '∞' : limit}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-dark-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="mb-8">
                  <p className="text-gray-300 text-lg leading-relaxed mb-4">
                    {content.description}
                  </p>
                  {content.urgency && (
                    <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-5 h-5 text-primary-400" />
                        <p className="text-primary-300 font-medium">{content.urgency}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Benefits */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Crown className="w-5 h-5 text-primary-400 mr-2" />
                    With Mangaka Senior, you unlock:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {content.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Options */}
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <h3 className="text-lg font-semibold text-white text-center">
                      Choose your plan
                    </h3>

                    {/* Currency Toggle */}
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Monthly Plan */}
                    <div className="relative bg-dark-700 border border-gray-600 rounded-xl p-6 hover:border-primary-500/50 transition-colors">
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">Monthly</h4>
                        <div className="mb-4">
                          <span className="text-3xl font-bold text-white">{formatPrice(getPrice('monthly'))}</span>
                          <span className="text-gray-400">/month</span>
                        </div>
                        <button
                          onClick={() => handleUpgrade('monthly')}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                          Start now
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                          7-day refund guarantee
                        </p>
                      </div>
                    </div>

                    {/* Plan Annuel */}
                    <div className="relative bg-gradient-to-br from-primary-600/20 to-primary-800/20 border-2 border-primary-500 rounded-xl p-6">
                      {yearlyDiscount > 0 && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                            <Star className="w-4 h-4" />
                            <span>Économisez {yearlyDiscount}%</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <h4 className="text-lg font-semibold text-white mb-2">Annual</h4>
                        <div className="mb-2">
                          <span className="text-3xl font-bold text-white">{formatPrice(getPrice('yearly'))}</span>
                          <span className="text-gray-400">/year</span>
                        </div>
                        <div className="mb-4">
                          <span className="text-sm text-primary-300">
                            That's {formatPrice(getPrice('yearly') / 12)}/month
                          </span>
                        </div>
                        <button
                          onClick={() => handleUpgrade('yearly')}
                          className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
                        >
                          Save now
                        </button>
                        <p className="text-xs text-gray-400 mt-2">
                          Annual billing
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-dark-600">
                  <div className="flex items-center justify-center space-x-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Easy cancellation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Priority support</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span>Instant access</span>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

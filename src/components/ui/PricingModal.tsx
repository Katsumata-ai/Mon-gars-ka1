'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckIcon, XIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'
import { useCurrency } from '@/hooks/useCurrency'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'
import { SmartCTA } from '@/components/ui/SmartCTA'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

interface PricingModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  subtitle?: string
}

export function PricingModal({ 
  isOpen, 
  onClose, 
  title = "Choose Your Plan",
  subtitle = "Unlock unlimited manga creation"
}: PricingModalProps) {
  const [isYearly, setIsYearly] = useState(true)
  const { currency, setCurrency, formatPrice, formatSavings } = useCurrency()

  // Helper function to get price based on currency
  const getPrice = (tier: any, interval: 'monthly' | 'yearly') => {
    if (tier.price.eur && tier.price.usd) {
      return tier.price[currency][interval]
    } else {
      return tier.price[interval]
    }
  }

  const plans = STRIPE_CONFIG.plans

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <DialogHeader className="text-center space-y-4 pb-6">
          <DialogTitle className="text-2xl font-bold text-white font-comic">
            {title}
          </DialogTitle>
          <p className="text-gray-400">{subtitle}</p>
          
          {/* Currency Toggle */}
          <div className="flex justify-center">
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

          {/* Plan Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn("text-sm", !isYearly ? "text-white" : "text-gray-400")}>
              Monthly
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                isYearly ? "bg-primary-500" : "bg-gray-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  isYearly ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
            <span className={cn("text-sm", isYearly ? "text-white" : "text-gray-400")}>
              Annual
            </span>
            {isYearly && (
              <Badge variant="secondary" className="bg-primary-500/20 text-primary-400 border-primary-500/50">
                Save up to 50%
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-xl border p-6 transition-all duration-300",
                plan.highlight
                  ? "border-primary-500 bg-primary-500/10 shadow-lg shadow-primary-500/25"
                  : "border-slate-700 bg-slate-800/50"
              )}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white">
                  Most Popular
                </Badge>
              )}

              <div className="text-center space-y-4">
                <h3 className="text-xl font-bold text-white font-comic">
                  {plan.name}
                </h3>
                
                <div className="space-y-2">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(getPrice(plan, isYearly ? 'yearly' : 'monthly'))}
                    </span>
                    <span className="text-gray-400">
                      /{isYearly ? 'year' : 'month'}
                    </span>
                  </div>
                  
                  {isYearly && getPrice(plan, 'monthly') > 0 && (
                    <div className="text-sm text-primary-400">
                      Save {formatSavings(getPrice(plan, 'monthly'), getPrice(plan, 'yearly'))}/year
                    </div>
                  )}
                </div>

                <p className="text-gray-400 text-sm">{plan.description}</p>

                <div className="space-y-3">
                  {plan.features.slice(0, 4).map((feature) => (
                    <div key={feature.name} className="flex items-center gap-3 text-sm">
                      <CheckIcon className="h-4 w-4 text-primary-500 flex-shrink-0" />
                      <span className="text-gray-300">{feature.name}</span>
                    </div>
                  ))}
                </div>

                <SmartCTA
                  plan={isYearly ? 'yearly' : 'monthly'}
                  variant={plan.highlight ? 'default' : 'outline'}
                  className="w-full"
                >
                  {plan.name === 'Mangaka Junior' ? 'Start Free' : 'Get Started'}
                </SmartCTA>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
            <XIcon className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

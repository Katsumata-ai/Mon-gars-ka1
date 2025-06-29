"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
// Import dynamique pour éviter le chargement de Stripe sur la landing page
// import { usePayment } from "@/hooks/useStripe"
import { useAuth } from "@/hooks/useAuth"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

// Function to highlight all words containing "unlimited"
function highlightUnlimited(text: string) {
  const regex = /(\bunlimited\w*)/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (/\bunlimited\w*/i.test(part)) {
      return (
        <span
          key={index}
          className="relative inline-block highlight-unlimited"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

interface Feature {
  name: string
  description?: string
  included: boolean
  highlight?: string
}

interface PricingTier {
  name: string
  price: {
    monthly: number
    yearly: number
  }
  description: string
  features: Feature[]
  highlight?: boolean
  badge?: string
  icon: React.ReactNode
}

interface PricingSectionProps {
  tiers: PricingTier[]
  className?: string
}

function PricingSection({ tiers, className }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(true) // Default to annual plan for better value proposition
  const { user } = useAuth()

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

  const badgeStyles = cn(
    "px-4 py-1.5 text-sm font-medium font-comic",
    "bg-primary-500 text-white",
    "border-none shadow-lg",
  )

  const handleStripeCheckout = (plan: 'monthly' | 'yearly') => {
    const interval = plan === 'yearly' ? 'yearly' : 'monthly'
    const paymentLink = STRIPE_CONFIG.paymentLinks[interval]

    // Ajouter l'URL de retour actuelle
    const currentPath = window.location.pathname
    const returnUrl = encodeURIComponent(currentPath)

    if (paymentLink) {
      window.location.href = `${paymentLink}&return_url=${returnUrl}`
    }
  }

  const handlePlanSelection = (tier: PricingTier) => {
    // If it's the free plan, redirect to signup
    if (tier.price.monthly === 0) {
      if (!user) {
        window.location.href = '/signup'
      } else {
        window.location.href = '/dashboard'
      }
      return
    }

    // For paid plans, check authentication
    if (!user) {
      // If user is not logged in, redirect to signup with plan info
      const plan = isYearly ? 'yearly' : 'monthly'
      const paymentLink = STRIPE_CONFIG.paymentLinks[plan]
      if (paymentLink) {
        // Ajouter l'URL de retour actuelle au lien de paiement
        const currentPath = window.location.pathname
        const returnUrl = encodeURIComponent(currentPath)
        const fullPaymentLink = `${paymentLink}&return_url=${returnUrl}`
        const encodedLink = encodeURIComponent(fullPaymentLink)
        window.location.href = `/signup?redirect=${encodedLink}`
      } else {
        window.location.href = '/signup'
      }
      return
    }

    // If user is logged in, create a checkout session
    handleStripeCheckout(isYearly ? 'yearly' : 'monthly')
  }

  return (
    <section
      id="pricing"
      className={cn(
        "relative bg-dark-900 text-white",
        "py-16 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        className,
      )}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
          .highlight-unlimited {
            position: relative;
            z-index: 1;
            background: linear-gradient(
              135deg,
              rgba(255, 193, 7, 0.8) 0%,
              rgba(255, 152, 0, 0.9) 50%,
              rgba(255, 87, 34, 0.8) 100%
            );
            color: #000 !important;
            font-weight: 700 !important;
            padding: 3px 8px;
            border-radius: 12px;
            box-shadow:
              0 2px 8px rgba(255, 193, 7, 0.4),
              0 0 0 1px rgba(255, 152, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
            transform: rotate(-1deg);
            display: inline-block;
            margin: 0 2px;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            animation: unlimited-glow 3s ease-in-out infinite;
          }

          @keyframes unlimited-glow {
            0%, 100% {
              box-shadow:
                0 2px 8px rgba(255, 193, 7, 0.4),
                0 0 0 1px rgba(255, 152, 0, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
            }
            50% {
              box-shadow:
                0 4px 16px rgba(255, 193, 7, 0.6),
                0 0 0 2px rgba(255, 152, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.4);
            }
          }

          .highlight-unlimited:nth-child(even) {
            transform: rotate(0.8deg);
            background: linear-gradient(
              -135deg,
              rgba(255, 193, 7, 0.8) 0%,
              rgba(255, 152, 0, 0.9) 50%,
              rgba(255, 87, 34, 0.8) 100%
            );
          }

          .highlight-unlimited:hover {
            background: linear-gradient(
              135deg,
              rgba(255, 193, 7, 1) 0%,
              rgba(255, 152, 0, 1) 50%,
              rgba(255, 87, 34, 1) 100%
            );
            transform: rotate(0deg) scale(1.05);
            transition: all 0.3s ease;
            box-shadow:
              0 6px 20px rgba(255, 193, 7, 0.6),
              0 0 0 3px rgba(255, 152, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.5);
          }
        `
      }} />
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white font-comic text-center">
            Simple and Transparent Pricing
          </h2>
          <p className="text-xl text-gray-300 text-center max-w-2xl">
            Start free, scale according to your manga creation needs
          </p>
          <div className="relative">
            <div className={cn(
              "inline-flex items-center p-1.5 rounded-full border shadow-lg transition-all duration-500",
              isYearly
                ? "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50 shadow-red-500/25"
                : "bg-slate-800/50 border-slate-700"
            )}>
              {["Monthly", "Annual"].map((period) => (
                <button
                  key={period}
                  onClick={() => setIsYearly(period === "Annual")}
                  className={cn(
                    "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300 font-comic relative",
                    (period === "Annual") === isYearly
                      ? period === "Annual"
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50"
                        : "bg-primary-500 text-white shadow-lg"
                      : "text-gray-400 hover:text-white"
                  )}
                >
                  {period}
                  {period === "Annual" && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full shadow-lg shadow-red-500/50">
                      -50%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative group backdrop-blur-sm",
                "rounded-3xl transition-all duration-300",
                "flex flex-col",
                tier.highlight
                  ? "bg-gradient-to-b from-slate-800/80 to-slate-900/80 border-2 border-primary-500 shadow-2xl"
                  : "bg-slate-800/50 border border-slate-700 shadow-lg",
                "hover:translate-y-[-4px] hover:shadow-xl",
              )}
            >
              {tier.badge && tier.highlight && (
                <div className="absolute -top-4 left-6">
                  <Badge className={badgeStyles}>{tier.badge}</Badge>
                </div>
              )}

              <div className="p-8 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div
                    className={cn(
                      "p-3 rounded-xl",
                      tier.highlight
                        ? "bg-primary-500/20 text-primary-500"
                        : "bg-slate-700 text-gray-400",
                    )}
                  >
                    {tier.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white font-comic">
                    {tier.name}
                  </h3>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-white font-comic">
                      {isYearly ? tier.price.yearly : tier.price.monthly}€
                    </span>
                    <span className="text-sm text-gray-400">
                      /{isYearly ? "year" : "month"}
                    </span>
                  </div>
                  {isYearly && tier.price.monthly > 0 && (
                    <div className="mt-2 text-sm text-primary-400 font-medium">
                      🎉 Special launch offer - Save {(tier.price.monthly * 12 - tier.price.yearly)}€/year
                    </div>
                  )}
                  <p className="mt-3 text-base text-gray-300">
                    {tier.description}
                  </p>
                </div>

                <div className="space-y-4">
                  {tier.features.map((feature) => (
                    <div key={feature.name} className="flex gap-4">
                      <div
                        className={cn(
                          "mt-1 p-0.5 rounded-full transition-colors duration-200",
                          feature.included
                            ? "text-primary-500"
                            : "text-gray-600",
                        )}
                      >
                        <CheckIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-base font-medium text-white">
                          {feature.highlight ? highlightUnlimited(feature.name) : feature.name}
                        </div>
                        {feature.description && (
                          <div className="text-sm text-gray-400">
                            {feature.description}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 pt-0 mt-auto">
                <Button
                  className={cn(
                    "w-full relative transition-all duration-300",
                    tier.highlight
                      ? buttonStyles.highlight
                      : buttonStyles.default,
                  )}
                  onClick={() => handlePlanSelection(tier)}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {tier.highlight ? (
                      <>
                        Get Started Now
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Try Free
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export { PricingSection }

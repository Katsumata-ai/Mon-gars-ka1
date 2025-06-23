"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRightIcon, CheckIcon } from "@radix-ui/react-icons"
import { cn } from "@/lib/utils"
import { usePayment } from "@/hooks/useStripe"
import { useAuth } from "@/hooks/useAuth"
import { STRIPE_CONFIG } from "@/lib/stripe/config"

// Fonction pour surligner tous les mots contenant "illimité"
function highlightUnlimited(text: string) {
  const regex = /(\billimité\w*)/gi;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (/\billimité\w*/i.test(part)) {
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
  const [isYearly, setIsYearly] = useState(false)
  const { redirectToCheckout } = usePayment()
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

  const handlePlanSelection = (tier: PricingTier) => {
    // Si c'est le plan gratuit, rediriger vers l'inscription
    if (tier.price.monthly === 0) {
      if (!user) {
        window.location.href = '/signup'
      } else {
        window.location.href = '/dashboard'
      }
      return
    }

    // Pour les plans payants, utiliser les liens Stripe
    const stripePlan = STRIPE_CONFIG.plans.find(p => p.name === tier.name)
    if (stripePlan?.paymentLinks) {
      const link = isYearly ? stripePlan.paymentLinks.yearly : stripePlan.paymentLinks.monthly
      window.open(link, '_blank')
    }
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
              90deg,
              rgba(255, 193, 7, 0.3) 0%,
              rgba(255, 152, 0, 0.4) 50%,
              rgba(255, 193, 7, 0.3) 100%
            );
            padding: 2px 4px;
            border-radius: 3px;
            box-shadow: 0 2px 4px rgba(255, 193, 7, 0.2);
            transform: rotate(-0.5deg);
            display: inline-block;
            margin: 0 1px;
          }

          .highlight-unlimited:nth-child(even) {
            transform: rotate(0.3deg);
          }

          .highlight-unlimited:hover {
            background: linear-gradient(
              90deg,
              rgba(255, 193, 7, 0.5) 0%,
              rgba(255, 152, 0, 0.6) 50%,
              rgba(255, 193, 7, 0.5) 100%
            );
            transform: rotate(0deg) scale(1.02);
            transition: all 0.2s ease;
          }
        `
      }} />
      <div className="w-full max-w-5xl mx-auto">
        <div className="flex flex-col items-center gap-6 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white font-comic text-center">
            Tarifs Simples et Transparents
          </h2>
          <p className="text-xl text-gray-300 text-center max-w-2xl">
            Commencez gratuitement, évoluez selon vos besoins de création manga
          </p>
          <div className="inline-flex items-center p-1.5 bg-slate-800/50 rounded-full border border-slate-700 shadow-sm">
            {["Mensuel", "Annuel"].map((period) => (
              <button
                key={period}
                onClick={() => setIsYearly(period === "Annuel")}
                className={cn(
                  "px-8 py-2.5 text-sm font-medium rounded-full transition-all duration-300 font-comic",
                  (period === "Annuel") === isYearly
                    ? "bg-primary-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white",
                )}
              >
                {period}
              </button>
            ))}
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
                      /{isYearly ? "an" : "mois"}
                    </span>
                  </div>
                  {isYearly && tier.price.monthly > 0 && (
                    <div className="mt-2 text-sm text-primary-400 font-medium">
                      🎉 Offre spéciale de lancement - Économisez {(tier.price.monthly * 12 - tier.price.yearly)}€/an
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
                        Commencer maintenant
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Essayer gratuitement
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

'use client'

import { STRIPE_CONFIG } from '@/lib/stripe/config'

interface UpgradeButtonsProps {
  className?: string
}

export default function UpgradeButtons({ className = '' }: UpgradeButtonsProps) {
  const handleMonthlyUpgrade = () => {
    const link = STRIPE_CONFIG.paymentLinks.monthly
    if (link) {
      // Ajouter l'URL de retour actuelle
      const currentPath = window.location.pathname
      const returnUrl = encodeURIComponent(currentPath)
      window.open(`${link}&return_url=${returnUrl}`, '_blank')
    }
  }

  const handleAnnualUpgrade = () => {
    const link = STRIPE_CONFIG.paymentLinks.yearly
    if (link) {
      // Ajouter l'URL de retour actuelle
      const currentPath = window.location.pathname
      const returnUrl = encodeURIComponent(currentPath)
      window.open(`${link}&return_url=${returnUrl}`, '_blank')
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <button
        onClick={handleMonthlyUpgrade}
        className="bg-gradient-to-r from-primary-500 to-yellow-500 hover:from-primary-600 hover:to-yellow-600 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg text-sm"
      >
        Mensuel - 25€
      </button>
      <button
        onClick={handleAnnualUpgrade}
        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-2 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg text-sm relative"
      >
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          Promo
        </span>
        Annuel - 80€
      </button>
    </div>
  )
}

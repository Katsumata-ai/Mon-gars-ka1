'use client'

import { useState } from 'react'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useSubscription } from '@/hooks/useStripe'
import { PremiumUpgradeModal } from '@/components/upselling/PremiumUpgradeModal'
import { Crown } from 'lucide-react'

interface GlobalLimitsIndicatorProps {
  className?: string
  compact?: boolean
}

export function GlobalLimitsIndicator({ 
  className = '', 
  compact = false 
}: GlobalLimitsIndicatorProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { usage, limits, isLimitReached, getLimitInfo } = useUserLimits()
  const { hasActiveSubscription } = useSubscription()

  // Si l'utilisateur est premium, ne pas afficher les limites
  if (hasActiveSubscription) {
    return (
      <div className={`bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          <span className="text-yellow-400 font-medium text-sm">
            Senior Plan - Unlimited generations
          </span>
        </div>
      </div>
    )
  }

  if (!usage || !limits) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading limits...
      </div>
    )
  }

  const charactersInfo = getLimitInfo('character_images')
  const decorsInfo = getLimitInfo('decor_images')
  const scenesInfo = getLimitInfo('scene_generation')
  const monthlyInfo = getLimitInfo('monthly_generations')

  const hasAnyLimitReached = isLimitReached('character_images') ||
                            isLimitReached('decor_images') ||
                            isLimitReached('scene_generation') ||
                            isLimitReached('monthly_generations')

  if (compact) {
    return (
      <div className={`space-y-2 ${className}`}>
        {/* Version compacte - juste la limite globale */}
        <div className="bg-slate-700/50 rounded-lg p-2 border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-300">
              🎨 Total images
            </span>
            <span className={`text-xs font-bold ${
              monthlyInfo?.isReached ? 'text-red-400' : 'text-green-400'
            }`}>
              {monthlyInfo?.current || 0}/{monthlyInfo?.isUnlimited ? '∞' : monthlyInfo?.limit || 0}
            </span>
          </div>
        </div>

        {hasAnyLimitReached && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all duration-200 shadow-lg shadow-red-500/50"
          >
            🚀 Upgrade to Senior Plan
          </button>
        )}

        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="general"
        />
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        🎨 Generation limits
      </h3>

      {/* Limite globale d'images */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            🎨 Total image generations
          </span>
          <span className={`text-sm font-bold ${
            monthlyInfo?.isReached ? 'text-red-400' : 'text-green-400'
          }`}>
            {monthlyInfo?.current || 0}/{monthlyInfo?.isUnlimited ? '∞' : monthlyInfo?.limit || 0}
          </span>
        </div>
        
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              monthlyInfo?.isReached ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(monthlyInfo?.percentage || 0, 100)}%` }}
          />
        </div>
      </div>

      {/* Specific limits */}
      <div className="grid grid-cols-3 gap-2">
        {/* Characters */}
        <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50">
          <div className="text-center">
            <div className="text-lg mb-1">👥</div>
            <div className={`text-xs font-bold ${
              charactersInfo?.isReached ? 'text-red-400' : 'text-green-400'
            }`}>
              {charactersInfo?.current || 0}/{charactersInfo?.isUnlimited ? '∞' : charactersInfo?.limit || 0}
            </div>
            <div className="text-xs text-slate-400">Characters</div>
          </div>
        </div>

        {/* Backgrounds */}
        <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50">
          <div className="text-center">
            <div className="text-lg mb-1">🏞️</div>
            <div className={`text-xs font-bold ${
              decorsInfo?.isReached ? 'text-red-400' : 'text-green-400'
            }`}>
              {decorsInfo?.current || 0}/{decorsInfo?.isUnlimited ? '∞' : decorsInfo?.limit || 0}
            </div>
            <div className="text-xs text-slate-400">Backgrounds</div>
          </div>
        </div>

        {/* Scenes */}
        <div className="bg-slate-700/30 rounded-lg p-2 border border-slate-600/50">
          <div className="text-center">
            <div className="text-lg mb-1">🎬</div>
            <div className={`text-xs font-bold ${
              scenesInfo?.isReached ? 'text-red-400' : 'text-green-400'
            }`}>
              {scenesInfo?.current || 0}/{scenesInfo?.isUnlimited ? '∞' : scenesInfo?.limit || 0}
            </div>
            <div className="text-xs text-slate-400">Scenes</div>
          </div>
        </div>
      </div>

      {/* Bouton d'upgrade si limites atteintes */}
      {hasAnyLimitReached && (
        <button
          onClick={() => setShowUpgradeModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 text-sm font-medium w-full"
        >
          Upgrade Pro
        </button>
      )}

      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="general"
        currentUsage={hasAnyLimitReached ? {
          used: monthlyInfo?.current || 0,
          limit: monthlyInfo?.limit || 0,
          type: 'monthly generations'
        } : undefined}
      />
    </div>
  )
}

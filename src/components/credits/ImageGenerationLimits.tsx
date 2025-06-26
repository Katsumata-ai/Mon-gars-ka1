'use client'

import { useState } from 'react'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useSubscriptionSafe } from '@/hooks/useSubscriptionSafe'
import { PremiumUpgradeModal } from '@/components/upselling/PremiumUpgradeModal'

interface ImageGenerationLimitsProps {
  type: 'characters' | 'decors' | 'scenes'
  className?: string
  showUpgradeButton?: boolean
}

export function ImageGenerationLimits({
  type,
  className = '',
  showUpgradeButton = false
}: ImageGenerationLimitsProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const { usage, limits, getLimitInfo } = useUserLimits()
  const { hasActiveSubscription } = useSubscriptionSafe()

  const limitationType = type === 'characters' ? 'character_images' : 
                        type === 'decors' ? 'decor_images' : 'scene_generation'
  
  const typeInfo = getLimitInfo(limitationType)
  const monthlyInfo = getLimitInfo('monthly_generations')

  const getTypeData = () => {
    switch (type) {
      case 'characters':
        return { label: 'characters', emoji: '👥' }
      case 'decors':
        return { label: 'backgrounds', emoji: '🏞️' }
      case 'scenes':
        return { label: 'scenes', emoji: '🎬' }
      default:
        return { label: '', emoji: '' }
    }
  }

  // Obtenir les données du type une seule fois
  const { emoji, label } = getTypeData()

  // Affichage immédiat avec valeurs par défaut si pas encore chargé
  const isLoading = !usage || !limits

  // Si l'utilisateur a un abonnement actif, afficher "Illimité"
  if (hasActiveSubscription) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-500/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-400">
              {emoji} {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
            <span className="text-sm font-bold text-green-400">
              ∞ Unlimited
            </span>
          </div>
          <div className="mt-2 text-xs text-green-300">
            Premium plan active - Unlimited generations
          </div>
        </div>
      </div>
    )
  }

  // Si en cours de chargement, afficher un état par défaut
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-300">
              {emoji} {label.charAt(0).toUpperCase() + label.slice(1)}
            </span>
            <span className="text-sm font-bold text-slate-400">
              Loading...
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Checking your limits...
          </div>
        </div>
      </div>
    )
  }

  const effectivelyBlocked = typeInfo?.isReached || monthlyInfo?.isReached

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Limite globale d'images */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            🎨 Monthly generations
          </span>
          <span className={`text-sm font-bold ${
            monthlyInfo?.isReached ? 'text-red-400' : 'text-green-400'
          }`}>
            {monthlyInfo?.current || 0}/{monthlyInfo?.limit || 0}
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

      {/* Limite spécifique au type */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">
            {emoji} {label.charAt(0).toUpperCase() + label.slice(1)}
          </span>
          <span className={`text-sm font-bold ${
            typeInfo?.isReached ? 'text-red-400' : 'text-green-400'
          }`}>
            {typeInfo?.current || 0}/{typeInfo?.limit || 0}
          </span>
        </div>
        
        <div className="w-full bg-slate-600 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              typeInfo?.isReached ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(typeInfo?.percentage || 0, 100)}%` }}
          />
        </div>
        
        {typeInfo?.isReached && (
          <div className="mt-2 text-xs text-red-400">
            ⚠️ You've reached your {label} limit for this month
          </div>
        )}
        
        {monthlyInfo?.isReached && !typeInfo?.isReached && (
          <div className="mt-2 text-xs text-red-400">
            ⚠️ You've reached your total monthly generation limit
          </div>
        )}
      </div>

      {/* Bouton d'upgrade si demandé */}
      {showUpgradeButton && effectivelyBlocked && (
        <>
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 text-sm font-medium w-full"
          >
            Upgrade Pro
          </button>

          <PremiumUpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            limitType={type}
            currentUsage={typeInfo && typeof typeInfo.limit === 'number' ? {
              used: typeInfo.current,
              limit: typeInfo.limit,
              type: label
            } : undefined}
          />
        </>
      )}
    </div>
  )
}

// Composant pour afficher toutes les limites d'images
export function AllImageGenerationLimits({ className = '' }: { className?: string }) {
  const { usage, limits } = useUserLimits()
  const { hasActiveSubscription } = useSubscriptionSafe()

  // Affichage immédiat même en cours de chargement
  const isLoading = !usage || !limits

  if (hasActiveSubscription) {
    return (
      <div className={`space-y-3 ${className}`}>
        <h3 className="text-sm font-medium text-slate-300 mb-3">
          🎨 Image generation limits
        </h3>
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-lg p-3 border border-green-500/30">
          <div className="text-center">
            <span className="text-sm font-bold text-green-400">
              ∞ Unlimited Generations
            </span>
            <div className="mt-1 text-xs text-green-300">
              Premium plan active
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Valeurs par défaut si en cours de chargement
  const safeUsage = usage || {
    monthly_generations: 0,
    character_images: 0,
    decor_images: 0,
    scene_generation: 0,
    project_pages: 0,
    total_projects: 0,
    project_exports: 0,
    storage_space: 0
  }

  const safeLimits = limits || {
    monthly_generations: 10,
    character_images: 3,
    decor_images: 3,
    scene_generation: 3,
    project_pages: 5,
    total_projects: 1,
    project_exports: 1,
    storage_space: 100,
    advanced_tools: false
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-medium text-slate-300 mb-3">
        🎨 Image generation limits {isLoading && <span className="text-xs text-slate-500">(Loading...)</span>}
      </h3>

      {/* Limite globale */}
      <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-slate-300">Monthly generations:</span>
          <span className={`text-sm font-bold ${
            safeUsage.monthly_generations >= safeLimits.monthly_generations ? 'text-red-400' : 'text-green-400'
          }`}>
            {safeUsage.monthly_generations}/{safeLimits.monthly_generations}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-600 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              safeUsage.monthly_generations >= safeLimits.monthly_generations ? 'bg-red-500' : 'bg-green-500'
            }`}
            style={{
              width: `${Math.min((safeUsage.monthly_generations / safeLimits.monthly_generations) * 100, 100)}%`
            }}
          />
        </div>
      </div>

      {/* Limites spécifiques */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <span className="text-slate-400">👥 Characters:</span>
          <div className={safeUsage.character_images >= safeLimits.character_images ? 'text-red-400 font-medium' : 'text-slate-300'}>
            {safeUsage.character_images}/{safeLimits.character_images}
          </div>
        </div>

        <div className="text-center">
          <span className="text-slate-400">🏞️ Backgrounds:</span>
          <div className={safeUsage.decor_images >= safeLimits.decor_images ? 'text-red-400 font-medium' : 'text-slate-300'}>
            {safeUsage.decor_images}/{safeLimits.decor_images}
          </div>
        </div>

        <div className="text-center">
          <span className="text-slate-400">🎬 Scenes:</span>
          <div className={safeUsage.scene_generation >= safeLimits.scene_generation ? 'text-red-400 font-medium' : 'text-slate-300'}>
            {safeUsage.scene_generation}/{safeLimits.scene_generation}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-600">
        <p className="text-xs text-slate-500">
          Limits reset every month.
          <br />
          Upgrade to premium plan for unlimited generations.
        </p>
      </div>
    </div>
  )
}

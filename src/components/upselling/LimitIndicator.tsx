'use client'

import { AlertTriangle, Crown, Check } from 'lucide-react'
import { LimitationType } from '@/types/upselling'
import { useUpsellContext } from './UpsellProvider'

interface LimitIndicatorProps {
  limitationType: LimitationType
  className?: string
  showDetails?: boolean
}

export function LimitIndicator({ 
  limitationType, 
  className = '', 
  showDetails = true 
}: LimitIndicatorProps) {
  const { getLimitStatus, hasActiveSubscription } = useUpsellContext()
  
  const status = getLimitStatus(limitationType)
  
  if (!status) return null

  // Ne pas afficher pour les utilisateurs premium
  if (hasActiveSubscription) {
    return showDetails ? (
      <div className={`flex items-center space-x-2 text-green-400 ${className}`}>
        <Crown className="w-4 h-4" />
        <span className="text-sm font-medium">Illimité</span>
      </div>
    ) : null
  }

  const getStatusColor = () => {
    if (status.isReached) return 'text-red-400'
    if (status.isApproaching) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = () => {
    if (status.isReached) return <AlertTriangle className="w-4 h-4" />
    if (status.isApproaching) return <AlertTriangle className="w-4 h-4" />
    return <Check className="w-4 h-4" />
  }

  const getStatusText = () => {
    if (status.isUnlimited) return 'Illimité'
    if (status.isReached) return 'Limite atteinte'
    if (status.isApproaching) return 'Limite proche'
    return 'Disponible'
  }

  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-1 ${getStatusColor()} ${className}`}>
        {getStatusIcon()}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center space-x-2">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
      
      {!status.isUnlimited && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">
            {status.current}/{status.limit}
          </span>
          <div className="w-16 h-2 bg-dark-600 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                status.isReached 
                  ? 'bg-red-500' 
                  : status.isApproaching 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(status.percentage, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Composant pour afficher un résumé de toutes les limites
export function LimitsSummary({ className = '' }: { className?: string }) {
  const { hasActiveSubscription } = useUpsellContext()

  const limitTypes: Array<{ type: LimitationType; label: string }> = [
    { type: 'character_images', label: 'Personnages' },
    { type: 'decor_images', label: 'Décors' },
    { type: 'scene_generation', label: 'Scènes' },
    { type: 'project_pages', label: 'Pages' },
    { type: 'total_projects', label: 'Projets' },
    { type: 'project_exports', label: 'Exports' },
    { type: 'monthly_generations', label: 'Générations' }
  ]

  if (hasActiveSubscription) {
    return (
      <div className={`bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20 rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-2">
          <Crown className="w-5 h-5 text-primary-400" />
          <h3 className="font-semibold text-white">Plan Senior Actif</h3>
        </div>
        <p className="text-sm text-gray-300">
          Vous bénéficiez de toutes les fonctionnalités illimitées !
        </p>
      </div>
    )
  }

  return (
    <div className={`bg-dark-800 border border-dark-600 rounded-lg p-4 ${className}`}>
      <h3 className="font-semibold text-white mb-4">Utilisation actuelle</h3>
      <div className="space-y-3">
        {limitTypes.map(({ type, label }) => (
          <div key={type} className="flex items-center justify-between">
            <span className="text-sm text-gray-300">{label}</span>
            <LimitIndicator 
              limitationType={type} 
              showDetails={false}
              className="ml-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

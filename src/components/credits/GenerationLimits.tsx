'use client'

import { useUserCredits } from '@/hooks/useUserCredits'

interface GenerationLimitsProps {
  type: 'characters' | 'decors' | 'scenes'
  className?: string
}

export function GenerationLimits({ type, className = '' }: GenerationLimitsProps) {
  const { credits, loading } = useUserCredits()

  if (loading || !credits) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading limits...
      </div>
    )
  }

  const getTypeData = () => {
    switch (type) {
      case 'characters':
        return {
          used: credits.characters_used,
          limit: credits.characters_limit,
          label: 'characters'
        }
      case 'decors':
        return {
          used: credits.decors_used,
          limit: credits.decors_limit,
          label: 'backgrounds'
        }
      case 'scenes':
        return {
          used: credits.scenes_used,
          limit: credits.scenes_limit,
          label: 'scenes'
        }
      default:
        return { used: 0, limit: 0, label: '' }
    }
  }

  const { used, limit, label } = getTypeData()
  const remaining = Math.max(0, limit - used)
  const isLimitReached = used >= limit

  return (
    <div className={`text-sm ${className}`}>
      <span className={isLimitReached ? 'text-red-600 font-medium' : 'text-gray-700'}>
        {remaining} {label} restant{remaining !== 1 ? 's' : ''} 
        <span className="text-gray-500 ml-1">
          ({used}/{limit})
        </span>
      </span>
      {isLimitReached && (
        <div className="text-xs text-red-500 mt-1">
          Limite atteinte - Passez au plan premium pour plus de générations
        </div>
      )}
    </div>
  )
}

// Composant pour afficher toutes les limites
export function AllGenerationLimits({ className = '' }: { className?: string }) {
  const { credits, loading } = useUserCredits()

  if (loading || !credits) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        Loading limits...
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-sm font-medium text-gray-800 mb-3">
        Free plan limits
      </h3>
      
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Characters:</span>
          <span className={credits.characters_used >= credits.characters_limit ? 'text-red-600 font-medium' : 'text-gray-800'}>
            {credits.characters_used}/{credits.characters_limit}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Backgrounds:</span>
          <span className={credits.decors_used >= credits.decors_limit ? 'text-red-600 font-medium' : 'text-gray-800'}>
            {credits.decors_used}/{credits.decors_limit}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Scenes:</span>
          <span className={credits.scenes_used >= credits.scenes_limit ? 'text-red-600 font-medium' : 'text-gray-800'}>
            {credits.scenes_used}/{credits.scenes_limit}
          </span>
        </div>
        
        {/* SUPPRIMÉ: Système obsolète des "Panneaux BD" - remplacé par le système de limites unifié */}
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Générations mensuelles :</span>
          <span className={credits.monthly_generations_used >= credits.monthly_generations_limit ? 'text-red-600 font-medium' : 'text-gray-800'}>
            {credits.monthly_generations_used}/{credits.monthly_generations_limit}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Les limites se réinitialisent chaque mois. 
          <br />
          Passez au plan premium pour des limites plus élevées.
        </p>
      </div>
    </div>
  )
}

'use client'

import React from 'react'
import { X } from 'lucide-react'
import { BubbleType } from '../types/assembly.types'
import { cn } from '@/lib/utils'

interface BubbleTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => void
  onSelectType: (type: BubbleType) => void
  className?: string
}

interface BubbleTypeState {
  selectedType: BubbleType | null
  isConfirmed: boolean
}

const BUBBLE_TYPES = [
  {
    type: 'speech' as BubbleType,
    name: 'Dialogue',
    icon: '💬',
    description: 'Bulle classique avec queue triangulaire',
    preview: 'Salut !',
    color: 'bg-blue-500'
  },
  {
    type: 'thought' as BubbleType,
    name: 'Pensée',
    icon: '💭',
    description: 'Bulle ovale avec petites bulles',
    preview: 'Je pense que...',
    color: 'bg-purple-500'
  },
  {
    type: 'shout' as BubbleType,
    name: 'Cri',
    icon: '💥',
    description: 'Contour en étoile/explosion',
    preview: 'AAAAH !',
    color: 'bg-red-500'
  },
  {
    type: 'whisper' as BubbleType,
    name: 'Chuchotement',
    icon: '🤫',
    description: 'Contour en pointillés',
    preview: 'Psst...',
    color: 'bg-gray-500'
  },
  {
    type: 'explosion' as BubbleType,
    name: 'Explosion',
    icon: '💢',
    description: 'Forme irrégulière avec pointes',
    preview: 'BOOM !',
    color: 'bg-orange-500'
  }
]

export default function BubbleTypeModal({
  isOpen,
  onClose,
  onCancel,
  onSelectType,
  className
}: BubbleTypeModalProps) {
  const [state, setState] = React.useState<BubbleTypeState>({
    selectedType: null,
    isConfirmed: false
  })

  // ✅ CORRECTION : Réinitialiser l'état quand la modal s'ouvre
  React.useEffect(() => {
    if (isOpen) {
      console.log('💬 BubbleTypeModal - Modal ouverte, réinitialisation état')
      setState({ selectedType: null, isConfirmed: false })
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleTypeSelect = (type: BubbleType) => {
    setState(prev => ({ ...prev, selectedType: type }))
  }

  const handleConfirm = () => {
    console.log('💬 BubbleTypeModal - handleConfirm appelé:', state.selectedType)
    if (state.selectedType) {
      console.log('💬 BubbleTypeModal - Appel onSelectType avec:', state.selectedType)
      try {
        onSelectType(state.selectedType)
        console.log('💬 BubbleTypeModal - onSelectType réussi, nettoyage état')
        setState({ selectedType: null, isConfirmed: false })
        console.log('💬 BubbleTypeModal - Appel onClose')
        onClose()
        console.log('💬 BubbleTypeModal - onClose réussi')
      } catch (error) {
        console.error('❌ BubbleTypeModal - Erreur dans handleConfirm:', error)
      }
    } else {
      console.warn('⚠️ BubbleTypeModal - Aucun type sélectionné')
    }
  }

  const handleCancel = () => {
    console.log('💬 BubbleTypeModal - handleCancel appelé')
    setState({ selectedType: null, isConfirmed: false })
    // ✅ CORRECTION : Utiliser onCancel si disponible, sinon onClose
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      console.log('💬 BubbleTypeModal - Clic sur backdrop')
      handleCancel()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className={cn(
        'bg-dark-800 rounded-xl border border-dark-700 shadow-2xl',
        'w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-700">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Choisir le Type de Bulle
            </h2>
            <p className="text-sm text-dark-400 mt-1">
              Sélectionnez le style de bulle de dialogue à créer
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUBBLE_TYPES.map((bubbleType) => (
              <button
                key={bubbleType.type}
                onClick={() => handleTypeSelect(bubbleType.type)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                  'hover:border-primary-500 hover:bg-primary-500/10',
                  'focus:outline-none focus:border-primary-500 focus:bg-primary-500/10',
                  state.selectedType === bubbleType.type
                    ? 'border-primary-500 bg-primary-500/20'
                    : 'border-dark-600 bg-dark-750'
                )}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-2xl',
                    bubbleType.color
                  )}>
                    {bubbleType.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white mb-1">
                      {bubbleType.name}
                    </h3>
                    <p className="text-sm text-dark-400 mb-2">
                      {bubbleType.description}
                    </p>
                    
                    {/* Preview */}
                    <div className="inline-block px-3 py-1 rounded-full bg-dark-600 text-xs text-dark-300">
                      Exemple: "{bubbleType.preview}"
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-dark-700 bg-dark-750">
          <div className="flex items-center justify-between">
            <p className="text-xs text-dark-400">
              💡 Cliquez pour placer la bulle sur le canvas
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm text-dark-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirm}
                disabled={!state.selectedType}
                className={cn(
                  'px-6 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                  state.selectedType
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-dark-600 text-dark-400 cursor-not-allowed'
                )}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

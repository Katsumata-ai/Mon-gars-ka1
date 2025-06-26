'use client'

// TipTapBubbleTypeModal - Modal pour sélectionner le type de bulle TipTap
// Interface moderne et intuitive pour choisir le style de bulle

import React from 'react'
import { BubbleType } from '../types/assembly.types'

interface TipTapBubbleTypeModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectType: (type: BubbleType) => void
  currentType?: BubbleType
}

const BUBBLE_TYPES = [
  {
    type: 'speech' as BubbleType,
    name: 'Dialogue',
    icon: '💬',
    description: 'Classic bubble with triangular tail',
    preview: 'Hello!',
    color: 'bg-blue-500',
    borderColor: 'border-blue-500'
  },
  {
    type: 'thought' as BubbleType,
    name: 'Thought',
    icon: '💭',
    description: 'Oval bubble for thoughts',
    preview: 'I think that...',
    color: 'bg-purple-500',
    borderColor: 'border-purple-500'
  },
  {
    type: 'shout' as BubbleType,
    name: 'Shout',
    icon: '💥',
    description: 'Star outline for shouts',
    preview: 'AAAAH!',
    color: 'bg-red-500',
    borderColor: 'border-red-500'
  }
]

/**
 * Modal pour sélectionner le type de bulle TipTap
 * Interface moderne avec prévisualisations
 */
export default function TipTapBubbleTypeModal({
  isOpen,
  onClose,
  onSelectType,
  currentType = 'speech'
}: TipTapBubbleTypeModalProps) {
  const [selectedType, setSelectedType] = React.useState<BubbleType | null>(null)



  if (!isOpen) return null

  const handleSelectType = (type: BubbleType) => {

    setSelectedType(type)
  }

  const handleConfirm = () => {
    if (selectedType) {

      onSelectType(selectedType)
      onClose()
      setSelectedType(null)
    }
  }

  const handleCancel = () => {
    setSelectedType(null)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center backdrop-blur-md"
      style={{
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.8)' // Fond sombre avec transparence comme l'image
      }}
      onClick={handleBackdropClick}
    >
      <div
        className="rounded-xl shadow-2xl max-w-xs w-full mx-4 overflow-hidden border"
        style={{
          backgroundColor: '#1e293b', // Fond sombre comme l'image de référence
          borderColor: '#334155'
        }}
      >
        {/* Header minimaliste */}
        <div className="p-4 border-b" style={{ borderColor: '#334155' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Bubble Type
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content compact */}
        <div className="p-4">
          <div className="space-y-2">
            {BUBBLE_TYPES.map((bubbleType) => {
              const isSelected = selectedType === bubbleType.type

              return (
                <button
                  key={bubbleType.type}
                  onClick={() => handleSelectType(bubbleType.type)}
                  className={`
                    relative w-full p-3 rounded-lg border transition-all duration-200 text-left
                    ${isSelected
                      ? 'border-red-500 bg-red-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500 bg-gray-700 bg-opacity-50'
                    }
                  `}
                  style={{
                    backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.15)' : 'rgba(55, 65, 81, 0.5)'
                  }}
                >
                  {/* Badge de sélection simple */}
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Contenu compact */}
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{bubbleType.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{bubbleType.name}</h3>
                      <p className="text-xs text-gray-300">{bubbleType.description}</p>
                    </div>
                  </div>

                </button>
              )
            })}
          </div>
        </div>

        {/* Footer compact */}
        <div className="p-4 border-t" style={{ borderColor: '#334155' }}>
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-300 bg-gray-600 border border-gray-500 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedType}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${selectedType
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

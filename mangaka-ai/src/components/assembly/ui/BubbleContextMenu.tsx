'use client'

import React from 'react'
import { BubbleType } from '../types/assembly.types'
import { cn } from '@/lib/utils'

interface BubbleContextMenuProps {
  isOpen: boolean
  position: { x: number, y: number }
  currentType: BubbleType
  onSelectType: (type: BubbleType) => void
  onClose: () => void
  className?: string
}

const BUBBLE_TYPES = [
  {
    type: 'speech' as BubbleType,
    name: 'Dialogue',
    icon: '💬',
    shortcut: '1',
    color: 'text-blue-400'
  },
  {
    type: 'thought' as BubbleType,
    name: 'Pensée',
    icon: '💭',
    shortcut: '2',
    color: 'text-purple-400'
  },
  {
    type: 'shout' as BubbleType,
    name: 'Cri',
    icon: '💥',
    shortcut: '3',
    color: 'text-red-400'
  },
  {
    type: 'whisper' as BubbleType,
    name: 'Chuchotement',
    icon: '🤫',
    shortcut: '4',
    color: 'text-gray-400'
  },
  {
    type: 'explosion' as BubbleType,
    name: 'Explosion',
    icon: '💢',
    shortcut: '5',
    color: 'text-orange-400'
  }
]

export default function BubbleContextMenu({
  isOpen,
  position,
  currentType,
  onSelectType,
  onClose,
  className
}: BubbleContextMenuProps) {
  if (!isOpen) return null

  const handleSelectType = (type: BubbleType) => {
    onSelectType(type)
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Backdrop invisible pour fermer le menu */}
      <div 
        className="fixed inset-0 z-40"
        onClick={handleBackdropClick}
      />
      
      {/* Menu contextuel */}
      <div 
        className={cn(
          'fixed z-50 bg-dark-800 rounded-lg border border-dark-700 shadow-2xl',
          'min-w-[200px] py-2',
          className
        )}
        style={{
          left: position.x,
          top: position.y,
          transform: 'translate(-50%, -10px)' // Centré horizontalement, légèrement au-dessus
        }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-dark-700">
          <h3 className="text-sm font-medium text-white">
            Type de Bulle
          </h3>
          <p className="text-xs text-dark-400">
            Clic ou raccourci clavier
          </p>
        </div>

        {/* Options */}
        <div className="py-1">
          {BUBBLE_TYPES.map((bubbleType) => (
            <button
              key={bubbleType.type}
              onClick={() => handleSelectType(bubbleType.type)}
              className={cn(
                'w-full px-3 py-2 text-left transition-colors duration-150',
                'hover:bg-dark-700 focus:outline-none focus:bg-dark-700',
                'flex items-center justify-between',
                currentType === bubbleType.type && 'bg-primary-500/20 border-l-2 border-primary-500'
              )}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{bubbleType.icon}</span>
                <div>
                  <span className="text-sm text-white font-medium">
                    {bubbleType.name}
                  </span>
                  {currentType === bubbleType.type && (
                    <span className="text-xs text-primary-400 ml-2">
                      ✓ Actuel
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <kbd className={cn(
                  'px-2 py-1 text-xs rounded border',
                  'bg-dark-700 border-dark-600 text-dark-300'
                )}>
                  {bubbleType.shortcut}
                </kbd>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-dark-700">
          <p className="text-xs text-dark-400">
            💡 Double-clic pour éditer le texte
          </p>
        </div>
      </div>
    </>
  )
}

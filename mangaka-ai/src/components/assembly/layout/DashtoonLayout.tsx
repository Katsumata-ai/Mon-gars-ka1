'use client'

import React from 'react'

interface DashtoonLayoutProps {
  leftToolbar: React.ReactNode
  centerCanvas: React.ReactNode
  rightPanel: React.ReactNode
  className?: string
}

/**
 * Layout principal reproduisant l'interface Dashtoon
 * - Barre d'outils verticale gauche (fine, ~60px)
 * - Zone centrale pour le canvas (fond distinctif)
 * - Menu droit dual-fonction (Pages/Images)
 */
export default function DashtoonLayout({
  leftToolbar,
  centerCanvas,
  rightPanel,
  className = ''
}: DashtoonLayoutProps) {
  return (
    <div className={`h-full flex bg-dark-900 overflow-hidden ${className}`}>
      {/* Barre d'outils gauche - Fine et verticale */}
      <div className="w-16 bg-dark-800 border-r border-dark-700 flex-shrink-0">
        {leftToolbar}
      </div>

      {/* Zone centrale - Canvas avec fond distinctif */}
      <div className="flex-1 bg-dark-600 overflow-hidden">
        {centerCanvas}
      </div>

      {/* Menu droit - Dual-fonction Pages/Images */}
      <div className="w-80 bg-dark-800 border-l border-dark-700 flex-shrink-0">
        {rightPanel}
      </div>
    </div>
  )
}

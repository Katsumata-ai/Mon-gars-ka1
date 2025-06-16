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
    <div className={`h-screen overflow-hidden relative ${className}`}>
      {/* Zone centrale - Canvas PLEIN ÉCRAN */}
      <div className="absolute inset-0 overflow-hidden">
        {centerCanvas}
      </div>

      {/* Barre d'outils gauche - POSITIONNEMENT DIRECT sans overlay */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-dark-800/90 backdrop-blur-sm border-r border-dark-700/50 z-50">
        {leftToolbar}
      </div>

      {/* Menu droit - POSITIONNEMENT DIRECT sans overlay */}
      <div className="absolute right-0 top-0 bottom-0 w-80 bg-dark-800/90 backdrop-blur-sm border-l border-dark-700/50 z-50">
        {rightPanel}
      </div>
    </div>
  )
}

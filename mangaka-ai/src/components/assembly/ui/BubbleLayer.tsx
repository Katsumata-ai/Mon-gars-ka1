'use client'

// Couche HTML pour les bulles de dialogue - Remplace le système PixiJS
// Gère le positionnement, la synchronisation et les interactions

import React, { useEffect, useRef, useMemo } from 'react'
import { useCanvasContext } from '../context/CanvasContext'
import { CanvasTransform, ViewportInfo } from '../core/CoordinateSystem'
import { LayerManager } from '../core/LayerManager'
import HtmlBubble from './HtmlBubble'
import { DialogueElement } from '../types/assembly.types'

interface BubbleLayerProps {
  canvasTransform: CanvasTransform
  canvasSize: { width: number; height: number }
  viewport: ViewportInfo
  className?: string
}

/**
 * Couche HTML pour les bulles de dialogue
 * Positionnée au-dessus du canvas PixiJS avec synchronisation parfaite
 */
export default function BubbleLayer({
  canvasTransform,
  canvasSize,
  viewport,
  className = ''
}: BubbleLayerProps) {
  const {
    elements,
    selectedElementIds,
    updateElement,
    selectElement,
    ui,
    placeBubbleAtPosition,
    cancelBubblePlacement
  } = useCanvasContext()
  const layerRef = useRef<HTMLDivElement>(null)
  const layerManagerRef = useRef<LayerManager>(LayerManager.getInstance())

  // ✅ HTML PUR : Plus besoin de système de coordonnées complexe !

  // ✅ FILTRER LES BULLES DE DIALOGUE
  const bubbleElements = useMemo(() => {
    return elements.filter((el): el is DialogueElement => 
      el.type === 'dialogue' && el.layerType === 'dialogue'
    )
  }, [elements])

  // ✅ HTML PUR : Plus de système de coordonnées complexe !

  // ✅ GESTION DES ÉVÉNEMENTS GLOBAUX
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Vérifier si le clic est sur une bulle
      const target = event.target as HTMLElement
      const bubbleElement = target.closest('[data-bubble-id]')
      
      if (!bubbleElement) {
        // Clic en dehors des bulles - désélectionner
        // Cette logique sera gérée par le gestionnaire de sélection unifié
        console.log('🖱️ Click outside bubbles')
      }
    }

    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Gestion des raccourcis clavier globaux
      if (event.key === 'Escape') {
        // Sortir du mode édition
        document.dispatchEvent(new CustomEvent('bubble-exit-edit'))
      }
    }

    document.addEventListener('click', handleGlobalClick)
    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('click', handleGlobalClick)
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [])

  // ✅ NETTOYAGE DES Z-INDEX
  useEffect(() => {
    return () => {
      // Libérer les z-index des bulles supprimées
      const currentBubbleIds = new Set(bubbleElements.map(b => b.id))
      layerManagerRef.current.getLayerStats().forEach((stats, layerType) => {
        if (layerType === 'DOM_BUBBLES') {
          // Nettoyer les éléments qui n'existent plus
          // Cette logique sera améliorée dans la prochaine version
        }
      })
    }
  }, [bubbleElements])

  // ✅ GESTION DE LA SÉLECTION - CONNEXION AU SYSTÈME EXISTANT
  const handleBubbleSelect = (bubbleId: string) => {
    console.log(`🎯 Bubble selected: ${bubbleId}`)

    // ✅ CONNEXION : Utiliser le système de sélection existant du CanvasContext
    selectElement(bubbleId)
  }

  // ✅ GESTION DE L'ÉDITION
  const handleBubbleEdit = (bubbleId: string) => {
    console.log(`✏️ Bubble edit started: ${bubbleId}`)
    
    // Désactiver la sélection pendant l'édition
    document.dispatchEvent(new CustomEvent('bubble-edit-start', {
      detail: { bubbleId }
    }))
  }

  // ✅ MISE À JOUR DES BULLES
  const handleBubbleUpdate = (bubbleId: string, updates: Partial<DialogueElement>) => {
    updateElement(bubbleId, updates)
  }

  // ✅ HTML PUR : Manipulation simplifiée (sera ajoutée plus tard si nécessaire)
  const handleStartManipulation = () => {
    console.log('🔧 Manipulation HTML pure - À implémenter si nécessaire pour MVP')
  }

  // ✅ SOLUTION HTML PURE : Gestionnaire de clic DOM simple
  const handleLayerClick = (event: React.MouseEvent) => {
    // Vérifier si on est en mode placement de bulle
    if (ui.bubblePlacementMode && ui.bubbleTypeToPlace) {
      console.log('🔥 CLIC HTML PUR - Mode placement bulle actif')

      // Empêcher la propagation
      event.stopPropagation()
      event.preventDefault()

      // ✅ COORDONNÉES DOM DIRECTES - Plus de conversion !
      const rect = layerRef.current?.getBoundingClientRect()
      if (!rect) return

      // Position absolue directe dans le layer
      const bubbleX = event.clientX - rect.left - 75  // -75 pour centrer la bulle (150px/2)
      const bubbleY = event.clientY - rect.top - 40   // -40 pour centrer la bulle (80px/2)

      console.log('🎯 POSITION HTML PURE - DIRECTE:', {
        clic: { clientX: event.clientX, clientY: event.clientY },
        rect: { left: rect.left, top: rect.top },
        bulle: { x: bubbleX, y: bubbleY }
      })

      // Créer la bulle avec les coordonnées DOM pures
      placeBubbleAtPosition(bubbleX, bubbleY, ui.bubbleTypeToPlace)
      return
    }

    // ✅ PHASE 2C : Désélection si clic sur zone vide
    const target = event.target as HTMLElement
    if (target === layerRef.current) {
      console.log('🖱️ Clic sur zone vide - désélection')
      selectElement(null)
    }
  }

  // ✅ STYLE DE LA COUCHE - CORRECTION ALIGNEMENT
  // Supprimer la transformation CSS pour éviter la double transformation
  const layerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%', // ✅ CORRECTION : Prendre toute la taille du conteneur
    height: '100%', // ✅ CORRECTION : Prendre toute la taille du conteneur
    // ✅ SOLUTION RADICALE : Permettre les clics pour la création de bulles
    pointerEvents: ui.bubblePlacementMode ? 'auto' : 'none' as const,
    zIndex: layerManagerRef.current.assignZIndex('bubble-layer', 'DOM_BUBBLES', 'normal'),
    // ✅ CORRECTION : Supprimer la transformation CSS - HtmlBubble gère le positionnement
    // transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
    // transformOrigin: 'center',
    // transition: 'transform 0.2s ease-out'
  }), [canvasSize, ui.bubblePlacementMode])

  // ✅ DEBUG INFO
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🎈 BubbleLayer Debug:', {
        bubbleCount: bubbleElements.length,
        canvasTransform,
        viewport,
        layerStyle: {
          transform: layerStyle.transform,
          zIndex: layerStyle.zIndex
        }
      })
    }
  }, [bubbleElements.length, canvasTransform, viewport, layerStyle])

  return (
    <div
      ref={layerRef}
      className={`bubble-layer ${className}`}
      style={layerStyle}
      data-testid="bubble-layer"
      onClick={handleLayerClick}
    >
      {bubbleElements.map(bubble => (
        <HtmlBubble
          key={bubble.id}
          element={bubble}
          coordinateSystem={null as any} // ✅ HTML PUR : Plus besoin !
          isSelected={selectedElementIds.includes(bubble.id)}
          onSelect={handleBubbleSelect}
          onEdit={handleBubbleEdit}
          onUpdate={handleBubbleUpdate}
          onStartManipulation={handleStartManipulation}
        />
      ))}
      
      {/* ✅ DEBUG OVERLAY (développement uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs p-2 rounded pointer-events-auto"
          style={{ zIndex: 9999 }}
        >
          <div>Bulles: {bubbleElements.length}</div>
          <div>Scale: {canvasTransform.scale.toFixed(2)}</div>
          <div>Pos: {canvasTransform.x.toFixed(0)}, {canvasTransform.y.toFixed(0)}</div>
        </div>
      )}
    </div>
  )
}

// ✅ HOOK PERSONNALISÉ POUR UTILISER LA COUCHE
export function useBubbleLayer() {
  const layerManager = LayerManager.getInstance()
  
  return {
    assignZIndex: (elementId: string, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal') => 
      layerManager.assignZIndex(elementId, 'DOM_BUBBLES', priority),
    releaseZIndex: (elementId: string) => 
      layerManager.releaseZIndex(elementId),
    getStats: () => 
      layerManager.getLayerStats()
  }
}

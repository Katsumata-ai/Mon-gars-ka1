'use client'

// TipTapBubbleLayer - Couche HTML pour les nouvelles bulles TipTap
// Intégration avec le système de coordonnées unifié et gestionnaire de modes

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { CanvasTransform, ViewportInfo } from '../core/CoordinateSystem'
import { LayerManager } from '../core/LayerManager'
import { useCanvasContext } from '../context/CanvasContext'
import { usePolotnoContext } from '../context/PolotnoContext'
import TipTapBubble, { BubbleMode } from './TipTapBubble'
import { DialogueElement } from '../types/assembly.types'
import { transformManager } from '../core/UnifiedTransformManager'
import './TipTapBubble.css'

interface TipTapBubbleLayerProps {
  canvasTransform: CanvasTransform
  zoomLevel: number
  canvasSize: { width: number; height: number }
  viewport: ViewportInfo
  className?: string
}

/**
 * Couche HTML pour les bulles TipTap
 * Gère le positionnement, la synchronisation et les modes UX
 */
export default function TipTapBubbleLayer({
  canvasTransform,
  zoomLevel,
  canvasSize,
  viewport,
  className = ''
}: TipTapBubbleLayerProps) {
  const {
    elements,
    addElement,
    updateElement,
    setActiveTool
  } = useCanvasContext()

  // ✅ NOUVEAU : Obtenir l'outil actif depuis Polotno pour vérifier l'outil main
  const { activeTool } = usePolotnoContext()

  const layerRef = useRef<HTMLDivElement>(null)
  const layerManager = LayerManager.getInstance()

  // États locaux pour l'édition
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null)

  // ✅ FILTRER LES BULLES DIALOGUE
  const bubbles = useMemo(() => {
    return elements.filter((element): element is DialogueElement =>
      element.type === 'dialogue'
    )
  }, [elements])

  // ✅ RESTAURÉ : Écouter les événements de création de bulles TipTap-first
  useEffect(() => {
    const handleCreateBubble = (event: CustomEvent) => {
      const { x, y, bubbleType } = event.detail
      console.log('🎯 TipTapBubbleLayer: Réception événement création bulle', { x, y, bubbleType })

      const optimalWidth = 150
      const optimalHeight = 80

      const bubble: DialogueElement = {
        id: `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'dialogue',
        layerType: 'dialogue',
        text: '',
        transform: {
          x: x - optimalWidth / 2,
          y: y - optimalHeight / 2,
          rotation: 0,
          alpha: 1,
          zIndex: 200,
          width: optimalWidth,
          height: optimalHeight
        },
        dialogueStyle: {
          type: bubbleType as any,
          backgroundColor: 0xffffff,
          outlineColor: 0x000000,
          outlineWidth: 2,
          textColor: 0x000000,
          fontSize: 16,
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          dashedOutline: false,
          // ✅ LEGACY SUPPORT
          tailPosition: 'bottom-left',
          tailLength: 30,
          tailAngleDegrees: 225,
          tailAttachmentSide: 'bottom',
          // ✅ NEW ENHANCED QUEUE SYSTEM - Configuration simplifiée
          queue: {
            angle: 225, // Bottom-left direction
            length: 40, // Longueur réduite
            thickness: 16, // ✅ ÉPAISSEUR RÉDUITE
            style: 'triangle',
            seamlessConnection: true,
            isManipulating: false,
            showHandles: false,
            snapToCardinal: false,
            curvature: 0.3,
            tapering: 0.8 // Tapering modéré
          }
        },
        properties: {
          visible: true,
          locked: false,
          selectable: true,
          name: `Bulle ${bubbleType}`
        }
      }

      // Ajouter la bulle au contexte
      addElement(bubble)

      // Switch vers select tool
      setActiveTool('select')

      console.log('✅ Bulle TipTap créée:', bubble.id)
    }

    window.addEventListener('createTipTapBubble', handleCreateBubble as EventListener)
    return () => window.removeEventListener('createTipTapBubble', handleCreateBubble as EventListener)
  }, [addElement, setActiveTool])

  // ✅ SYNCHRONISATION AVEC LE SYSTÈME DE SÉLECTION GLOBAL DE SIMPLECANVASEDITOR
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null)

  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE SÉLECTION GLOBAUX
  useEffect(() => {
    // Écouter les sélections depuis SimpleCanvasEditor
    const handleElementSelection = (event: CustomEvent) => {
      const element = event.detail
      if (element && element.id && element.id.startsWith('bubble_')) {
        console.log('🎯 TipTapBubbleLayer: Bulle sélectionnée via système global:', element.id)
        setSelectedBubbleId(element.id)
      } else {
        // Autre élément sélectionné ou désélection
        setSelectedBubbleId(null)
      }
    }

    // Écouter les désélections globales (clic dans le vide)
    const handleGlobalDeselect = () => {
      console.log('🎯 TipTapBubbleLayer: Désélection globale')
      setSelectedBubbleId(null)
      setEditingBubbleId(null)
    }

    // ✅ NOUVEAU : Écouter les désélections forcées depuis l'outil main
    const handleForceDeselectAll = (event: CustomEvent) => {
      console.log('🖐️ TipTapBubbleLayer: Désélection forcée reçue:', event.detail)
      setSelectedBubbleId(null)
      setEditingBubbleId(null)
    }

    // Écouter les changements de mode depuis SimpleCanvasEditor
    const handleBubbleModeChange = (event: CustomEvent) => {
      const { bubbleId, newMode } = event.detail
      console.log('🎯 TipTapBubbleLayer: Mode change:', bubbleId, newMode)

      if (newMode === 'reading') {
        setSelectedBubbleId(null)
        setEditingBubbleId(null)
      } else if (newMode === 'editing') {
        setEditingBubbleId(bubbleId)
      }
    }

    // ✅ NOUVEAU : Écouter les mises à jour de transform depuis BubbleSelectionOverlay
    const handleBubbleTransformUpdate = (event: CustomEvent) => {
      const { bubbleId, transform } = event.detail
      console.log('🎯 TipTapBubbleLayer: Mise à jour transform bulle:', bubbleId, transform)

      // Mettre à jour la bulle dans le contexte
      updateElement(bubbleId, { transform })
    }

    window.addEventListener('elementSelected', handleElementSelection as EventListener)
    window.addEventListener('globalDeselect', handleGlobalDeselect as EventListener)
    window.addEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
    window.addEventListener('bubbleModeChange', handleBubbleModeChange as EventListener)
    window.addEventListener('updateTipTapBubbleTransform', handleBubbleTransformUpdate as EventListener)

    return () => {
      window.removeEventListener('elementSelected', handleElementSelection as EventListener)
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
      window.removeEventListener('bubbleModeChange', handleBubbleModeChange as EventListener)
      window.removeEventListener('updateTipTapBubbleTransform', handleBubbleTransformUpdate as EventListener)
    }
  }, [])

  // ✅ GESTION DES MODES UX - INTÉGRATION AVEC LE SYSTÈME UNIFIÉ
  const getBubbleMode = useCallback((bubbleId: string): BubbleMode => {
    const mode = editingBubbleId === bubbleId ? 'editing'
                : selectedBubbleId === bubbleId ? 'manipulating'
                : 'reading'

    console.log('🔍 TipTapBubbleLayer: getBubbleMode pour', bubbleId, '→', mode, {
      editingBubbleId,
      selectedBubbleId,
      isEditing: editingBubbleId === bubbleId,
      isSelected: selectedBubbleId === bubbleId
    })

    return mode
  }, [editingBubbleId, selectedBubbleId])

  // ✅ NOUVEAU : Gestionnaire de changement de mode
  const handleModeChange = useCallback((bubbleId: string, newMode: BubbleMode) => {
    console.log('🎯 TipTapBubbleLayer: Mode change:', bubbleId, newMode)

    if (newMode === 'editing') {
      setEditingBubbleId(bubbleId)
    } else if (newMode === 'reading') {
      setEditingBubbleId(null)
    }

    // Dispatcher l'événement pour SimpleCanvasEditor
    const modeChangeEvent = new CustomEvent('bubbleModeChangeFromBubble', {
      detail: { bubbleId, newMode }
    })
    window.dispatchEvent(modeChangeEvent)
  }, [setEditingBubbleId])

  // ✅ GESTION DU DOUBLE-CLIC POUR ÉDITION
  const handleBubbleDoubleClick = useCallback((bubbleId: string) => {
    console.log('🔍 TipTapBubbleLayer: handleBubbleDoubleClick appelé!', {
      bubbleId,
      currentEditingBubbleId: editingBubbleId,
      currentSelectedBubbleId: selectedBubbleId
    })

    console.log('🎨 TipTapBubbleLayer: Passage en mode édition pour bulle:', bubbleId)
    setEditingBubbleId(bubbleId)

    // Vérifier que l'état a bien changé
    setTimeout(() => {
      console.log('🔍 TipTapBubbleLayer: État après setEditingBubbleId:', {
        editingBubbleId: bubbleId,
        expectedMode: 'editing'
      })
    }, 0)
  }, [editingBubbleId, selectedBubbleId])

  // ✅ GESTION DES CLICS POUR DÉSÉLECTION (SYNCHRONISÉ AVEC SIMPLECANVASEDITOR)
  const handleLayerClick = useCallback((e: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      console.log('🖐️ TipTapBubbleLayer: Outil main actif - aucune interaction bulle')
      return // Pas d'interaction avec les bulles
    }

    // Seulement si le clic est directement sur le layer (pas sur une bulle)
    if (e.target === e.currentTarget) {
      console.log('🎯 TipTapBubbleLayer: Clic sur layer, désélection globale')

      // ✅ DÉSÉLECTION LOCALE
      setEditingBubbleId(null)
      setSelectedBubbleId(null)

      // ✅ PROPAGER AU SYSTÈME GLOBAL (comme SimpleCanvasEditor)
      // Ceci va déclencher la désélection dans SimpleCanvasEditor
      e.stopPropagation() // Empêcher la propagation pour éviter les conflits
    }
    // Si on ne stop pas la propagation, le clic va remonter à SimpleCanvasEditor
    // qui va gérer la désélection globale
  }, [activeTool])

  // ✅ SOLUTION ALTERNATIVE : Calculer les coordonnées directement par rapport à la couche
  const getLayerRelativeCoordinates = useCallback((canvasEvent: MouseEvent) => {
    if (!layerRef.current) return { x: 0, y: 0 }

    const layerRect = layerRef.current.getBoundingClientRect()
    const x = canvasEvent.clientX - layerRect.left
    const y = canvasEvent.clientY - layerRect.top

    console.log('🔍 getLayerRelativeCoordinates:', {
      clientX: canvasEvent.clientX,
      clientY: canvasEvent.clientY,
      layerRect: { left: layerRect.left, top: layerRect.top },
      result: { x, y }
    })

    return { x, y }
  }, [])

  // ✅ GESTION DE LA MANIPULATION
  const handleStartManipulation = (
    element: DialogueElement, 
    handleType: string, 
    globalX: number, 
    globalY: number
  ) => {
    console.log('🎯 TipTapBubbleLayer: Début manipulation', {
      elementId: element.id,
      handleType,
      position: { globalX, globalY }
    })
    
    // Passer en mode manipulation
    handleModeChange(element.id, 'reading') // 'manipulating' n'existe pas dans BubbleMode
  }

  // ✅ STYLES DE LA COUCHE
  const layerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const, // ✅ CORRECTION CRITIQUE : Ne pas intercepter les événements
    zIndex: 30, // ✅ Z-index réduit pour rester sous les sidebars (z-50)
    overflow: 'hidden' // ✅ ÉLIMINER SCROLLBARS
  }), [])

  // ✅ NOUVEAU : SYNCHRONISATION PARFAITE VIA GESTIONNAIRE UNIFIÉ
  const canvasScale = zoomLevel / 100

  // Enregistrement de la couche HTML dans le gestionnaire unifié
  useEffect(() => {
    if (!layerRef.current) return

    const layerId = 'tiptap-bubble-layer'
    const layer = layerRef.current

    // Enregistrer la couche dans le gestionnaire unifié
    transformManager.registerHTMLTarget(layerId, layer)

    console.log('✅ TipTapBubbleLayer: Enregistré dans le gestionnaire unifié', {
      layerId,
      element: layer
    })

    // Nettoyage au démontage
    return () => {
      transformManager.unregisterTarget(layerId)
      console.log('🗑️ TipTapBubbleLayer: Désenregistré du gestionnaire unifié')
    }
  }, [])

  // Mise à jour du gestionnaire unifié quand les transformations changent
  useEffect(() => {
    const transform = {
      x: canvasTransform.x,
      y: canvasTransform.y,
      scale: canvasScale
    }

    transformManager.updateTransform(transform, 'TipTapBubbleLayer')

    console.log('🔄 TipTapBubbleLayer: Transformation envoyée au gestionnaire unifié', {
      transform,
      zoomLevel,
      bubblesCount: bubbles.length
    })
  }, [canvasTransform.x, canvasTransform.y, canvasScale, bubbles.length])

  return (
    <div
      ref={layerRef}
      className={`tiptap-bubble-layer no-scrollbar ${className}`}
      style={layerStyle}
      onClick={handleLayerClick}
    >
      {bubbles.map(bubble => {
        const mode = getBubbleMode(bubble.id)

        console.log('🔍 TipTapBubbleLayer: Rendu bulle', bubble.id, 'en mode', mode)

        return (
          <TipTapBubble
            key={bubble.id}
            element={bubble}
            isSelected={false} // ✅ SUPPRIMÉ : Sélection gérée par SimpleCanvasEditor
            mode={mode}
            onUpdate={updateElement}
            onDoubleClick={handleBubbleDoubleClick}
            onModeChange={handleModeChange}
          />
        )
      })}
    </div>
  )
}

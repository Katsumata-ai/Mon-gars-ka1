'use client'

// TipTapBubbleLayer - Couche HTML pour les nouvelles bulles TipTap
// Intégration avec le système de coordonnées unifié et gestionnaire de modes

import React, { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { CanvasTransform, ViewportInfo } from '../core/CoordinateSystem'
import { LayerManager } from '../core/LayerManager'
import { useCanvasContext } from '../context/CanvasContext'
import { usePolotnoContext } from '../context/PolotnoContext'
import { useAssemblyStore } from '../managers/StateManager'
import TipTapBubble, { BubbleMode } from './TipTapBubble'
import { DialogueElement } from '../types/assembly.types'
import { transformManager } from '../core/UnifiedTransformManager'
// import { useCanvasTransform, useElementCreation } from '../../../hooks/useCanvasTransform' // 🚨 SUPPRIMÉ - Solution radicale
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
    setActiveTool,
    zoom
  } = useCanvasContext()

  // ✅ CRITIQUE : Accès au StateManager pour la synchronisation (comme les panels)
  const { addElement: addElementToStateManager, updateElement: updateElementInStateManager } = useAssemblyStore()

  // ✅ CRITIQUE : Wrapper pour synchroniser les mises à jour avec StateManager
  const updateElementWithSync = useCallback((id: string, updates: any) => {
    // Mettre à jour dans CanvasContext
    updateElement(id, updates)

    // ✅ SYNCHRONISER avec StateManager pour la sauvegarde
    try {
      updateElementInStateManager(id, updates)
    } catch (error) {
      console.error('❌ Erreur de synchronisation mise à jour speech bubble avec StateManager:', error)
    }
  }, [updateElement, updateElementInStateManager])

  // ✅ NOUVEAU : Obtenir l'outil actif depuis Polotno pour vérifier l'outil main
  const { activeTool } = usePolotnoContext()

  const layerRef = useRef<HTMLDivElement>(null)
  const layerManager = LayerManager.getInstance()

  // États locaux pour l'édition
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null)

  // ✅ CORRECTION : Nettoyage lors du démontage pour éviter les états obsolètes
  useEffect(() => {
    // Écouter l'événement de démontage de l'onglet assembly
    const handleAssemblyTabUnmount = () => {
      setEditingBubbleId(null)
      setSelectedBubbleId(null)
    }

    window.addEventListener('assemblyTabUnmount', handleAssemblyTabUnmount)

    return () => {
      // Nettoyer les états locaux lors du démontage
      setEditingBubbleId(null)
      setSelectedBubbleId(null)
      window.removeEventListener('assemblyTabUnmount', handleAssemblyTabUnmount)
    }
  }, [])

  // ✅ FILTRER LES BULLES DIALOGUE ET ÉLIMINER LES DOUBLONS
  const bubbles = useMemo(() => {
    const dialogueElements = elements.filter((element): element is DialogueElement =>
      element.type === 'dialogue'
    )

    // ✅ CORRECTION : Éliminer les doublons par ID pour éviter les clés dupliquées
    const uniqueBubbles = dialogueElements.reduce((acc, bubble) => {
      if (!acc.find(existing => existing.id === bubble.id)) {
        acc.push(bubble)
      }
      return acc
    }, [] as DialogueElement[])

    return uniqueBubbles
  }, [elements])

  // ✅ RESTAURÉ : Écouter les événements de création de bulles TipTap-first
  useEffect(() => {
    const handleCreateBubble = (event: CustomEvent) => {
      const { x, y, bubbleType } = event.detail



      // ✅ SOLUTION FINALE : Utilisation directe des coordonnées canvas converties
      // getHTMLLayerCoordinates fournit des coordonnées canvas (converties pour le zoom)
      // Le CSS transform du layer s'occupe du pan, le zoom est déjà converti

      const optimalWidth = 150
      const optimalHeight = 80

      // ✅ COORDONNÉES CANVAS : Utiliser les coordonnées canvas de getHTMLLayerCoordinates
      // Ces coordonnées sont converties pour le zoom, le CSS transform gère le pan
      // Positionnement direct sans double transformation
      const elementPosition = {
        x: x - optimalWidth / 2,   // Centrer directement sur les coordonnées canvas
        y: y - optimalHeight / 2   // Centrer directement sur les coordonnées canvas
      }



      // ✅ CORRECTION : Générer un ID vraiment unique avec timestamp et random
      const generateUniqueId = () => {
        const timestamp = Date.now()
        const random = Math.random().toString(36).substr(2, 9)
        const counter = Math.floor(Math.random() * 1000)
        return `bubble_${timestamp}_${random}_${counter}`
      }

      const bubble: DialogueElement = {
        id: generateUniqueId(),
        type: 'dialogue',
        layerType: 'dialogue',
        text: '',
        transform: {
          x: elementPosition.x,
          y: elementPosition.y,
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
          blendMode: 'normal',
          name: `Bulle ${bubbleType}`
        }
      }

      // Ajouter la bulle au contexte
      addElement(bubble)

      // ✅ CRITIQUE : Synchroniser avec StateManager pour la sauvegarde (comme les panels)
      try {
        addElementToStateManager(bubble)

      } catch (error) {
        console.error('❌ Erreur de synchronisation speech bubble avec StateManager:', error)
      }

      // Switch vers select tool
      setActiveTool('select')

      // ✅ NOUVEAU : Synchroniser avec le système de sélection global (comme la sélection manuelle)
      // Sélectionner la bulle localement
      setSelectedBubbleId(bubble.id)

      // ✅ NOUVEAU : Émettre l'événement elementSelected pour synchroniser avec SimpleCanvasEditor
      const elementSelectedEvent = new CustomEvent('elementSelected', {
        detail: { id: bubble.id, type: 'bubble' }
      })
      window.dispatchEvent(elementSelectedEvent)

      // ✅ NOUVEAU : Créer un CanvasElement virtuel et déclencher onElementClick
      // Ceci va synchroniser avec PolotnoAssemblyApp et useAssemblyStore
      setTimeout(() => {
        const bubbleElement = document.querySelector(`[data-bubble-id="${bubble.id}"]`) as HTMLElement
        if (bubbleElement) {
          const virtualElement = {
            id: bubble.id,
            type: 'bubble',
            x: bubbleElement.offsetLeft,
            y: bubbleElement.offsetTop,
            width: bubbleElement.offsetWidth,
            height: bubbleElement.offsetHeight,
            bubbleType: bubbleType
          }

          // Déclencher l'événement bubbleClicked pour synchroniser avec SimpleCanvasEditor
          const bubbleClickEvent = new CustomEvent('bubbleClicked', {
            detail: {
              bubbleId: bubble.id,
              clientX: 0,
              clientY: 0,
              element: bubbleElement
            }
          })
          window.dispatchEvent(bubbleClickEvent)


        }
      }, 50) // Petit délai pour que l'élément DOM soit créé


    }

    window.addEventListener('createTipTapBubble', handleCreateBubble as EventListener)
    return () => window.removeEventListener('createTipTapBubble', handleCreateBubble as EventListener)
  }, [addElement, addElementToStateManager, setActiveTool, zoomLevel, canvasTransform])

  // ✅ SYNCHRONISATION AVEC LE SYSTÈME DE SÉLECTION GLOBAL DE SIMPLECANVASEDITOR
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null)

  // 🚨 SOLUTION RADICALE : BYPASS COMPLET - Calcul direct et simple
  const canvasScale = zoomLevel / 100
  const panX = canvasTransform.x
  const panY = canvasTransform.y



  // ✅ CONVERSION DIRECTE DOM → CANVAS (même logique que Konva)
  const domToCanvas = useCallback((x: number, y: number) => {
    const result = {
      x: (x - panX) / canvasScale,
      y: (y - panY) / canvasScale
    }



    return result
  }, [panX, panY, canvasScale])



  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE SÉLECTION GLOBAUX
  useEffect(() => {
    // Écouter les sélections depuis SimpleCanvasEditor
    const handleElementSelection = (event: CustomEvent) => {
      const element = event.detail
      if (element && element.id && element.id.startsWith('bubble_')) {
        setSelectedBubbleId(element.id)
      } else {
        // Autre élément sélectionné ou désélection
        setSelectedBubbleId(null)
      }
    }

    // Écouter les désélections globales (clic dans le vide)
    const handleGlobalDeselect = () => {
      setSelectedBubbleId(null)
      setEditingBubbleId(null)
    }

    // ✅ NOUVEAU : Écouter les désélections forcées depuis l'outil main
    const handleForceDeselectAll = (event: CustomEvent) => {
      setSelectedBubbleId(null)
      setEditingBubbleId(null)
    }

    // Écouter les changements de mode depuis SimpleCanvasEditor
    const handleBubbleModeChange = (event: CustomEvent) => {
      const { bubbleId, newMode } = event.detail

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

      // Mettre à jour la bulle dans le contexte avec synchronisation StateManager
      updateElementWithSync(bubbleId, { transform })
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



    return mode
  }, [editingBubbleId, selectedBubbleId])

  // ✅ NOUVEAU : Gestionnaire de changement de mode
  const handleModeChange = useCallback((bubbleId: string, newMode: BubbleMode) => {

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
    setEditingBubbleId(bubbleId)
  }, [editingBubbleId, selectedBubbleId])

  // ✅ GESTION DES CLICS POUR DÉSÉLECTION (SYNCHRONISÉ AVEC SIMPLECANVASEDITOR)
  const handleLayerClick = useCallback((e: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      return // Pas d'interaction avec les bulles
    }

    // Seulement si le clic est directement sur le layer (pas sur une bulle)
    if (e.target === e.currentTarget) {

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



    return { x, y }
  }, [])

  // ✅ GESTION DE LA MANIPULATION
  const handleStartManipulation = (
    element: DialogueElement, 
    handleType: string, 
    globalX: number, 
    globalY: number
  ) => {

    
    // Passer en mode manipulation
    handleModeChange(element.id, 'reading') // 'manipulating' n'existe pas dans BubbleMode
  }

  // ✅ STYLES DE LA COUCHE - CORRECTION CRITIQUE : Appliquer la transformation comme TipTapFreeTextLayer
  const layerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none' as const, // ✅ CORRECTION CRITIQUE : Ne pas intercepter les événements
    zIndex: 30, // ✅ Z-index réduit pour rester sous les sidebars (z-50)
    overflow: 'hidden', // ✅ ÉLIMINER SCROLLBARS
    // ✅ CORRECTION CRITIQUE : Appliquer la transformation complète comme TipTapFreeTextLayer
    // Inclure le pan (translate) ET le zoom (scale) pour synchronisation parfaite
    transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasScale})`,
    transformOrigin: 'center',
    // ✅ SUPPRESSION TRANSITION : Pour synchronisation instantanée
    transition: 'none'
  }), [canvasTransform.x, canvasTransform.y, canvasScale])

  // ✅ NOUVEAU : SYNCHRONISATION PARFAITE VIA GESTIONNAIRE UNIFIÉ

  // Enregistrement de la couche HTML dans le gestionnaire unifié
  useEffect(() => {
    if (!layerRef.current) return

    const layerId = 'tiptap-bubble-layer'
    const layer = layerRef.current

    // Enregistrer la couche dans le gestionnaire unifié
    transformManager.registerHTMLTarget(layerId, layer)

    // Nettoyage au démontage
    return () => {
      transformManager.unregisterTarget(layerId)
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
  }, [canvasTransform.x, canvasTransform.y, canvasScale, bubbles.length])

  return (
    <div
      ref={layerRef}
      className={`tiptap-bubble-layer no-scrollbar ${className}`}
      style={layerStyle}
      onClick={handleLayerClick}
    >
      {bubbles.map((bubble, index) => {
        const mode = getBubbleMode(bubble.id)

        // ✅ CORRECTION : Clé unique combinant ID et index pour éviter les doublons
        const uniqueKey = `${bubble.id}_${index}`

        return (
          <TipTapBubble
            key={uniqueKey}
            element={bubble}
            isSelected={false} // [FR-UNTRANSLATED: ✅ SUPPRIMÉ : Sélection gérée par SimpleCanvasEditor]
            mode={mode}
            onUpdate={updateElementWithSync}
            onDoubleClick={handleBubbleDoubleClick}
            onModeChange={handleModeChange}
          />
        )
      })}
    </div>
  )
}

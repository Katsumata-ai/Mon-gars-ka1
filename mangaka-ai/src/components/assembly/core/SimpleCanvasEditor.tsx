'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import BubbleSelectionOverlay from '../ui/BubbleSelectionOverlay'
import TextSelectionOverlay from '../ui/TextSelectionOverlay'
import { usePolotnoContext } from '../context/PolotnoContext'
import { useCanvasContext } from '../context/CanvasContext'
import { BubbleType } from '../types/polotno.types'
import { TextElement, AssemblyElement, PanelElement, DialogueElement } from '../types/assembly.types'
import { transformManager } from './UnifiedTransformManager'
import { useAssemblyStore } from '../managers/StateManager'

interface SimpleCanvasEditorProps {
  width?: number
  height?: number
  onElementClick?: (element: any) => void
  onCanvasClick?: (x: number, y: number) => void
  onBubbleDoubleClick?: (element: any, position: { x: number, y: number }) => void
  onBubbleRightClick?: (element: any, position: { x: number, y: number }) => void
  onCanvasTransformChange?: (transform: { x: number, y: number, scale: number }) => void
  className?: string
}

interface CanvasElement {
  id: string
  type: 'panel' | 'bubble' | 'text' | 'image'
  x: number
  y: number
  width: number
  height: number
  content?: string
  bubbleType?: BubbleType
  // Propriétés pour les images dans les panels
  imageUrl?: string
  imageElement?: HTMLImageElement
  hasImage?: boolean
  // ✅ NOUVELLES PROPRIÉTÉS POUR LES IMAGES SÉPARÉES
  imageData?: {
    src: string
    originalWidth: number
    originalHeight: number
    alt?: string
  }
  metadata?: {
    parentPanelId?: string
    isUnifiedWithPanel?: boolean
    sourceType?: string
    addedAt?: string
    lastModified?: string
  }
  // Propriétés avancées pour les bulles Canvas Editor
  isEditing?: boolean
  canvasEditor?: any // Instance Canvas Editor
  bubbleShape?: 'oval' | 'rectangular' | 'cloud' | 'thought'
  textContent?: string
  fontSize?: number
  fontFamily?: string
  textAlign?: 'left' | 'center' | 'right'
  style?: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
  }
}

interface ResizeHandle {
  id: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' |
            'top-center' | 'bottom-center' | 'middle-left' | 'middle-right'
  x: number
  y: number
  size: number
}

interface CreationState {
  isCreating: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  elementType: 'panel' | 'bubble' | 'text' | null
}

interface ManipulationState {
  isDragging: boolean
  isResizing: boolean
  draggedElementId: string | null
  resizeHandle: ResizeHandle | null
  startMouseX: number
  startMouseY: number
  startElementX: number
  startElementY: number
  startElementWidth: number
  startElementHeight: number
}

/**
 * Éditeur Canvas simple compatible React 19
 * Implémente les fonctionnalités de base de l'ancien système PixiJS/Konva
 */
export default function SimpleCanvasEditor({
  width = 1200,
  height = 1600,
  onElementClick,
  onCanvasClick,
  onBubbleDoubleClick,
  onBubbleRightClick,
  onCanvasTransformChange,
  className = ''
}: SimpleCanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // ✅ NOUVEAU : Registre des bulles TipTap DOM pour la détection
  const [tipTapBubbles, setTipTapBubbles] = useState<Map<string, { element: HTMLElement, bounds: DOMRect }>>(new Map())
  const [resizeHandles, setResizeHandles] = useState<ResizeHandle[]>([])
  const [creationState, setCreationState] = useState<CreationState>({
    isCreating: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    elementType: null
  })
  const [manipulationState, setManipulationState] = useState<ManipulationState>({
    isDragging: false,
    isResizing: false,
    draggedElementId: null,
    resizeHandle: null,
    startMouseX: 0,
    startMouseY: 0,
    startElementX: 0,
    startElementY: 0,
    startElementWidth: 0,
    startElementHeight: 0
  })

  // États pour le drag-and-drop d'images
  const [isDragOverPanel, setIsDragOverPanel] = useState<string | null>(null)
  const [collisionError, setCollisionError] = useState<string | null>(null)
  // ✅ SYSTÈME UNIFIÉ : Plus besoin d'éditeurs externes
  // const [bubbleEditors, setBubbleEditors] = useState<Map<string, any>>(new Map())
  // const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null)

  const {
    activeTool,
    bubbleCreationMode,
    bubbleTypeToCreate,
    cancelBubbleCreation,
    setActiveTool,
    gridVisible,
    zoomLevel,
    zoomIn,
    zoomOut,
    setZoom
  } = usePolotnoContext()

  // 🔍 Debug: Vérifier que zoomLevel est reçu
  console.log('🔍 SimpleCanvasEditor: zoomLevel reçu du contexte:', zoomLevel)

  // 🔍 Calculer le scale CSS à partir du zoomLevel
  const canvasScale = zoomLevel / 100

  // 🔍 Réagir aux changements de zoom
  useEffect(() => {
    console.log('🔍 SimpleCanvasEditor: zoomLevel changé:', zoomLevel, '→ scale:', canvasScale)

    // ✨ SYNCHRONISER LE SCALE AVEC LE ZOOM
    setCanvasTransform(prev => ({
      ...prev,
      scale: canvasScale
    }))
  }, [zoomLevel, canvasScale])

  // ✅ NOUVEAU : Accès au contexte Canvas pour synchronisation
  const { elements: canvasElements, updateElement, addElement: addElementToCanvas } = useCanvasContext()

  // ✅ CRITIQUE : Accès au StateManager pour l'isolation des pages
  const { addElement: addElementToStateManager } = useAssemblyStore()

  // ✅ SYNCHRONISATION BIDIRECTIONNELLE COMPLÈTE : CanvasContext ↔ SimpleCanvasEditor
  useEffect(() => {
    console.log('🔄 SimpleCanvasEditor: Synchronisation avec CanvasContext', {
      canvasElementsCount: canvasElements.length,
      localElementsCount: elements.length,
      canvasElementIds: canvasElements.map(el => el.id),
      localElementIds: elements.map(el => el.id)
    })

    // ✅ CONVERSION : AssemblyElement → CanvasElement pour l'affichage
    const convertToCanvasElement = (assemblyElement: AssemblyElement): CanvasElement => {
      if (assemblyElement.type === 'panel') {
        const panelElement = assemblyElement as PanelElement
        const canvasElement: CanvasElement = {
          id: panelElement.id,
          type: 'panel',
          x: panelElement.transform.x,
          y: panelElement.transform.y,
          width: panelElement.transform.width,
          height: panelElement.transform.height,
          style: {
            backgroundColor: `#${(panelElement.panelStyle.fillColor || 0x1a1a1a).toString(16).padStart(6, '0')}`,
            borderColor: `#${(panelElement.panelStyle.borderColor || 0x000000).toString(16).padStart(6, '0')}`,
            borderWidth: panelElement.panelStyle.borderWidth || 2,
            borderRadius: panelElement.panelStyle.cornerRadius || 0
          }
        }

        // ✅ CRITIQUE : Convertir imageData en propriétés pour le rendu
        if (panelElement.imageData) {
          console.log('🖼️ Panel avec imageData détecté:', panelElement.id, panelElement.imageData.src)
          canvasElement.imageUrl = panelElement.imageData.src
          canvasElement.hasImage = true

          // ✅ CHARGER L'IMAGE IMMÉDIATEMENT pour le rendu
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            console.log('✅ Image rechargée pour le rendu:', panelElement.imageData!.src)
            // Forcer un re-render en mettant à jour le state
            setElements(prev => [...prev])
          }
          img.onerror = () => {
            console.error('❌ Erreur de rechargement image:', panelElement.imageData!.src)
          }
          img.src = panelElement.imageData.src
          canvasElement.imageElement = img
        }

        return canvasElement
      }

      // ✅ SUPPORT DES IMAGES : Conversion ImageElement → CanvasElement
      if (assemblyElement.type === 'image') {
        const imageElement = assemblyElement as any // ImageElement
        return {
          id: imageElement.id,
          type: 'image',
          x: imageElement.transform.x,
          y: imageElement.transform.y,
          width: imageElement.transform.width,
          height: imageElement.transform.height,
          imageUrl: imageElement.imageData.src, // ✅ URL de l'image pour le rendu
          imageData: imageElement.imageData, // ✅ Données complètes de l'image
          metadata: imageElement.metadata // ✅ Métadonnées (parentPanelId, etc.)
        }
      }

      // Pour d'autres types, retourner un élément de base
      return {
        id: assemblyElement.id,
        type: assemblyElement.type as any,
        x: assemblyElement.transform?.x || 0,
        y: assemblyElement.transform?.y || 0,
        width: assemblyElement.transform?.width || 100,
        height: assemblyElement.transform?.height || 100
      }
    }

    // ✅ SYNCHRONISATION COMPLÈTE : Remplacer tous les éléments locaux par ceux du CanvasContext
    const newElements = canvasElements.map(convertToCanvasElement)

    setElements(newElements)
    console.log('✅ SimpleCanvasEditor: Éléments synchronisés depuis CanvasContext:', newElements.length)

    // Si l'élément sélectionné n'existe plus, désélectionner
    const canvasElementIds = canvasElements.map(el => el.id)
    if (selectedElementId && !canvasElementIds.includes(selectedElementId)) {
      console.log('🗑️ SimpleCanvasEditor: Élément sélectionné supprimé, désélection:', selectedElementId)
      setSelectedElementId(null)
    }
  }, [canvasElements]) // ✅ SUPPRIMÉ selectedElementId des dépendances pour éviter les boucles

  // ✨ ÉTAT POUR L'OUTIL MAIN (PAN/ZOOM)
  const [panState, setPanState] = useState({
    isPanning: false,
    startX: 0,
    startY: 0,
    startTransformX: 0,
    startTransformY: 0
  })

  // ✨ ÉTAT DE TRANSFORMATION DU CANVAS (pour le pan)
  const [canvasTransform, setCanvasTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  })

  // ✅ FONCTION DE CONVERSION : CanvasElement → AssemblyElement
  const convertToAssemblyElement = useCallback((canvasElement: CanvasElement): AssemblyElement => {
    if (canvasElement.type === 'panel') {
      return {
        id: canvasElement.id,
        type: 'panel',
        layerType: 'panels',
        transform: {
          x: canvasElement.x,
          y: canvasElement.y,
          width: canvasElement.width,
          height: canvasElement.height,
          rotation: 0,
          alpha: 1,
          zIndex: 100
        },
        panelStyle: {
          shape: 'rectangle',
          borderColor: parseInt((canvasElement.style?.borderColor || '#000000').replace('#', ''), 16),
          borderWidth: canvasElement.style?.borderWidth || 2,
          borderStyle: 'solid',
          fillColor: parseInt((canvasElement.style?.backgroundColor || '#1a1a1a').replace('#', ''), 16),
          fillAlpha: 1.0,
          cornerRadius: canvasElement.style?.borderRadius || 0
        },
        properties: {
          name: `Panel`,
          locked: false,
          visible: true,
          blendMode: 'normal'
        },
        metadata: {
          sourceType: 'manual',
          addedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      } as PanelElement
    }

    // ✅ CORRECTION CHIRURGICALE : Support des éléments TipTap pour éviter l'erreur de synchronisation
    if (canvasElement.type === 'text' || canvasElement.type === 'dialogue' || canvasElement.type === 'bubble') {
      console.warn(`⚠️ Élément TipTap ignoré dans convertToAssemblyElement: ${canvasElement.type}`)
      // Retourner un objet minimal pour éviter l'erreur (la vraie synchronisation se fait via TipTap)
      return {
        id: canvasElement.id,
        type: canvasElement.type,
        layerType: 'dialogue',
        transform: {
          x: canvasElement.x,
          y: canvasElement.y,
          width: canvasElement.width,
          height: canvasElement.height,
          rotation: 0,
          alpha: 1,
          zIndex: 150
        },
        properties: {
          name: 'TipTap Element',
          locked: false,
          visible: true,
          blendMode: 'normal'
        }
      } as any
    }

    // Pour d'autres types d'éléments non supportés
    throw new Error(`Type d'élément non supporté: ${canvasElement.type}`)
  }, [])

  // Fonction pour créer un panel avec des dimensions optimales
  const createOptimalPanel = useCallback((x: number, y: number): CanvasElement => {
    // Dimensions optimales pour les panels de manga/comic (proportions portrait)
    const optimalWidth = 300
    const optimalHeight = 400

    return {
      id: `panel-${Date.now()}`,
      type: 'panel',
      x: x - optimalWidth / 2, // Centré sur le clic
      y: y - optimalHeight / 2, // Centré sur le clic
      width: optimalWidth,
      height: optimalHeight,
      style: {
        backgroundColor: '#1a1a1a', // Fond noir par défaut pour les panels vides
        borderColor: '#000000',
        borderWidth: 2,
        borderRadius: 0
      }
    }
  }, [])

  // ✅ SUPPRIMÉ : Fonctions obsolètes remplacées par le système unifié

  // Fonction pour détecter les collisions entre panels
  const detectPanelCollision = useCallback((x: number, y: number, width: number, height: number): boolean => {
    return elements.some(element => {
      if (element.type !== 'panel') return false

      // Vérifier si les rectangles se chevauchent
      return !(
        x >= element.x + element.width ||  // À droite
        x + width <= element.x ||          // À gauche
        y >= element.y + element.height || // En bas
        y + height <= element.y            // En haut
      )
    })
  }, [elements])

  // Fonctions de dessin des différentes formes de bulles
  const drawOvalBubble = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const radiusX = element.width / 2
    const radiusY = element.height / 2

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }, [])

  const drawRectangularBubble = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    const radius = 15
    ctx.beginPath()
    ctx.roundRect(element.x, element.y, element.width, element.height, radius)
    ctx.fill()
    ctx.stroke()
  }, [])

  const drawCloudBubble = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    // Dessiner une forme de nuage avec plusieurs cercles
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const baseRadius = Math.min(element.width, element.height) / 6

    ctx.beginPath()
    // Cercle central
    ctx.arc(centerX, centerY, baseRadius * 1.5, 0, 2 * Math.PI)
    // Cercles autour
    ctx.arc(centerX - baseRadius, centerY - baseRadius * 0.5, baseRadius, 0, 2 * Math.PI)
    ctx.arc(centerX + baseRadius, centerY - baseRadius * 0.5, baseRadius, 0, 2 * Math.PI)
    ctx.arc(centerX - baseRadius * 0.5, centerY + baseRadius, baseRadius * 0.8, 0, 2 * Math.PI)
    ctx.arc(centerX + baseRadius * 0.5, centerY + baseRadius, baseRadius * 0.8, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }, [])

  const drawThoughtBubble = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    // Bulle principale ovale
    const centerX = element.x + element.width / 2
    const centerY = element.y + element.height / 2
    const radiusX = element.width / 2
    const radiusY = element.height / 2

    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    // Petites bulles de pensée
    const smallRadius1 = radiusX * 0.15
    const smallRadius2 = radiusX * 0.1
    const tailX = element.x + element.width * 0.2
    const tailY = element.y + element.height + 10

    ctx.beginPath()
    ctx.arc(tailX, tailY, smallRadius1, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(tailX - 15, tailY + 15, smallRadius2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.stroke()
  }, [])

  // Fonction pour calculer les coordonnées correctes du canvas (pour les éléments canvas)
  const getCanvasCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    // Calculer le ratio entre la taille réelle du canvas et sa taille d'affichage CSS
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Appliquer le ratio aux coordonnées du clic
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    return { x, y }
  }, [])

  // ✅ FONCTION CORRIGÉE : Coordonnées canvas pour les couches HTML avec conversion zoom
  const getHTMLLayerCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    // ✅ COORDONNÉES DOM BRUTES : Position relative au canvas DOM
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top

    // ✅ CONVERSION ZOOM SEULEMENT : Convertir écran → canvas pour le zoom
    // Le pan est géré par CSS transform, mais le zoom nécessite une conversion
    // Formule chirurgicale : diviser par scale seulement (pas de soustraction pan)
    const canvasX = rawX / canvasScale
    const canvasY = rawY / canvasScale

    console.log('🎯 getHTMLLayerCoordinates: Conversion zoom écran → canvas', {
      clientCoords: { x: event.clientX, y: event.clientY },
      canvasRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      rawCoords: { x: rawX, y: rawY },
      zoomConversion: { scale: canvasScale, canvasX, canvasY },
      note: 'Conversion zoom seulement - CSS transform gère le pan'
    })

    return { x: canvasX, y: canvasY }
  }, [canvasScale])

  // ✅ FONCTION CORRIGÉE : Convertir coordonnées canvas vers coordonnées DOM pour les éléments HTML
  const getDOMCoordinates = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    // Pour les bulles TipTap, on veut les coordonnées relatives au conteneur canvas
    // pas les coordonnées absolues dans la page
    const rect = canvas.getBoundingClientRect()

    // ✅ CORRECTION CRITIQUE : Coordonnées relatives au conteneur canvas
    // Les bulles TipTap sont positionnées avec position: absolute dans leur layer
    // qui est lui-même positionné relativement au conteneur canvas
    const relativeX = event.clientX - rect.left
    const relativeY = event.clientY - rect.top

    console.log('🔧 getDOMCoordinates: Conversion Canvas → DOM (relative)', {
      clientCoords: { x: event.clientX, y: event.clientY },
      canvasRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      relativeCoords: { x: relativeX, y: relativeY },
      scale: canvasScale,
      pan: { x: canvasTransform.x, y: canvasTransform.y }
    })

    return { x: relativeX, y: relativeY }
  }, [canvasScale, canvasTransform.x, canvasTransform.y])

  // ✅ NOUVEAU : Calculer et notifier la transformation du canvas (pan + zoom)
  useEffect(() => {
    const transform = {
      x: canvasTransform.x,
      y: canvasTransform.y,
      scale: canvasScale
    }

    // Notifier le gestionnaire unifié pour synchronisation parfaite
    transformManager.updateTransform(transform, 'SimpleCanvasEditor')

    // Notifier aussi le callback externe si présent
    if (onCanvasTransformChange) {
      onCanvasTransformChange(transform)
    }

    console.log('🔧 SimpleCanvasEditor: Transformation envoyée au gestionnaire unifié:', transform)
  }, [onCanvasTransformChange, canvasTransform.x, canvasTransform.y, canvasScale])

  // Fonction pour calculer les handles de redimensionnement (panels seulement)
  const calculateResizeHandles = useCallback((element: CanvasElement): ResizeHandle[] => {
    const handleSize = 14 // Augmenté pour une meilleure ergonomie

    return [
      { id: 'tl', position: 'top-left', x: element.x - handleSize/2, y: element.y - handleSize/2, size: handleSize },
      { id: 'tr', position: 'top-right', x: element.x + element.width - handleSize/2, y: element.y - handleSize/2, size: handleSize },
      { id: 'bl', position: 'bottom-left', x: element.x - handleSize/2, y: element.y + element.height - handleSize/2, size: handleSize },
      { id: 'br', position: 'bottom-right', x: element.x + element.width - handleSize/2, y: element.y + element.height - handleSize/2, size: handleSize },
      { id: 'tc', position: 'top-center', x: element.x + element.width/2 - handleSize/2, y: element.y - handleSize/2, size: handleSize },
      { id: 'bc', position: 'bottom-center', x: element.x + element.width/2 - handleSize/2, y: element.y + element.height - handleSize/2, size: handleSize },
      { id: 'ml', position: 'middle-left', x: element.x - handleSize/2, y: element.y + element.height/2 - handleSize/2, size: handleSize },
      { id: 'mr', position: 'middle-right', x: element.x + element.width - handleSize/2, y: element.y + element.height/2 - handleSize/2, size: handleSize }
    ]
  }, [])

  // Fonction pour vérifier si un point est dans un élément
  const isPointInElement = useCallback((x: number, y: number, element: CanvasElement): boolean => {
    return x >= element.x && x <= element.x + element.width &&
           y >= element.y && y <= element.y + element.height
  }, [])

  // Fonction pour vérifier si un point est dans un handle
  const isPointInHandle = useCallback((x: number, y: number, handle: ResizeHandle): boolean => {
    // Zone de hit detection plus large pour faciliter la sélection
    const hitPadding = 4
    return x >= handle.x - hitPadding && x <= handle.x + handle.size + hitPadding &&
           y >= handle.y - hitPadding && y <= handle.y + handle.size + hitPadding
  }, [])

  // ✅ SUPPRIMÉ : Détection des bulles TipTap dans findElementAtPosition
  // Les bulles TipTap utilisent maintenant leur propre système d'événements DOM
  const findElementAtPosition = useCallback((x: number, y: number): CanvasElement | null => {
    // Vérifier seulement les éléments canvas (panels, etc.)
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (isPointInElement(x, y, element)) {
        return element
      }
    }
    return null
  }, [elements, isPointInElement])

  // Fonction pour trouver le handle sous le curseur
  const findHandleAtPosition = useCallback((x: number, y: number): ResizeHandle | null => {
    for (const handle of resizeHandles) {
      if (isPointInHandle(x, y, handle)) {
        return handle
      }
    }
    return null
  }, [resizeHandles, isPointInHandle])

  // Fonction pour trouver un panel sous une position donnée (pour le drop d'images)
  const findPanelAtPosition = useCallback((x: number, y: number): CanvasElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (element.type === 'panel' && isPointInElement(x, y, element)) {
        return element
      }
    }
    return null
  }, [elements, isPointInElement])

  // ✅ ARCHITECTURE UNIFIÉE : Intégrer l'image directement dans le panel
  const addImageToPanel = useCallback((panelId: string, imageUrl: string) => {
    console.log('🎯 addImageToPanel UNIFIÉ appelé:', { panelId, imageUrl })

    // Trouver le panel dans les éléments locaux
    const panel = elements.find(el => el.id === panelId && el.type === 'panel')
    if (!panel) {
      console.error('❌ Panel non trouvé:', panelId)
      return
    }

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      console.log('✅ Image chargée avec succès:', imageUrl, 'Dimensions:', img.width, 'x', img.height)

      // ✅ ARCHITECTURE UNIFIÉE : Mettre à jour le panel avec l'image intégrée
      const updatedPanel = {
        ...panel,
        // Ajouter l'image directement dans le panel local
        imageUrl,
        imageElement: img,
        hasImage: true,
        style: {
          ...panel.style,
          backgroundColor: 'transparent' // Masquer le fond pour voir l'image
        }
      }

      // Mettre à jour le panel local
      setElements(prev => prev.map(element =>
        element.id === panelId ? updatedPanel : element
      ))

      // ✅ SYNCHRONISER AVEC CANVASCONTEXT ET STATEMANAGER (architecture unifiée)
      try {
        const assemblyPanel = convertToAssemblyElement(updatedPanel) as any

        // ✅ INTÉGRER L'IMAGE DANS LE PANELELEMENT
        const unifiedPanel = {
          ...assemblyPanel,
          imageData: {
            src: imageUrl,
            originalWidth: img.width,
            originalHeight: img.height,
            alt: 'Image manga',
            scaleFactor: 0.95, // 95% pour bordures noires manga
            offsetX: 0,
            offsetY: 0,
            maintainAspectRatio: true
          },
          panelStyle: {
            ...assemblyPanel.panelStyle,
            fillAlpha: 0.05 // Très transparent pour voir l'image
          }
        }

        // Synchroniser avec CanvasContext et StateManager
        updateElement(panelId, unifiedPanel)
        console.log('✅ Panel unifié avec image synchronisé:', panelId)

      } catch (error) {
        console.error('❌ Erreur de synchronisation panel unifié:', error)
      }
    }
    img.onerror = (error) => {
      console.error('❌ Erreur lors du chargement de l\'image:', imageUrl, error)
    }
    img.src = imageUrl
  }, [elements, updateElement, convertToAssemblyElement])

  // ✅ CORRECTION : Handles de redimensionnement SEULEMENT pour les panels
  // Les éléments TipTap (text, bubble) utilisent leurs overlays spécialisés
  useEffect(() => {
    if (selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId)
      if (selectedElement && selectedElement.type === 'panel') {
        setResizeHandles(calculateResizeHandles(selectedElement))
      } else {
        setResizeHandles([])
      }
    } else {
      setResizeHandles([])
    }
  }, [selectedElementId, elements, calculateResizeHandles])

  // ✅ SUPPRIMÉ : Canvas feedback pour bulles - remplacé par système DOM

  // Fonction pour dessiner les handles de redimensionnement améliorés
  const drawResizeHandles = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save()
    resizeHandles.forEach(handle => {
      // Ombre plus prononcée pour un effet professionnel
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
      ctx.fillRect(handle.x + 2, handle.y + 2, handle.size, handle.size)

      // Handle principal avec dégradé visuel
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = '#007bff'
      ctx.lineWidth = 3
      ctx.fillRect(handle.x, handle.y, handle.size, handle.size)
      ctx.strokeRect(handle.x, handle.y, handle.size, handle.size)

      // Bordure intérieure pour l'effet 3D
      ctx.strokeStyle = '#0056b3'
      ctx.lineWidth = 1
      ctx.strokeRect(handle.x + 2, handle.y + 2, handle.size - 4, handle.size - 4)

      // Point central plus visible
      ctx.fillStyle = '#007bff'
      const centerSize = 4
      ctx.fillRect(
        handle.x + handle.size/2 - centerSize/2,
        handle.y + handle.size/2 - centerSize/2,
        centerSize,
        centerSize
      )
    })
    ctx.restore()
  }, [resizeHandles])

  // Fonction pour dessiner la prévisualisation améliorée pendant la création
  const drawCreationPreview = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!creationState.isCreating) return

    const x = Math.min(creationState.startX, creationState.currentX)
    const y = Math.min(creationState.startY, creationState.currentY)
    const width = Math.abs(creationState.currentX - creationState.startX)
    const height = Math.abs(creationState.currentY - creationState.startY)

    ctx.save()

    if (creationState.elementType === 'panel') {
      // Détecter la collision
      const hasCollision = detectPanelCollision(x, y, width, height)

      if (hasCollision) {
        // Feedback de collision - fond rouge semi-transparent
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'
        ctx.fillRect(x, y, width, height)

        // Cadre rouge pour indiquer l'erreur
        ctx.strokeStyle = '#ef4444'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, width, height)

        // Message d'erreur
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        // Fond pour le texte
        const text = 'Impossible de créer un panel sur un panel existant'
        const textMetrics = ctx.measureText(text)
        const textWidth = textMetrics.width + 20
        const textHeight = 30
        const textX = x + width / 2
        const textY = y + height / 2

        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)'
        ctx.fillRect(textX - textWidth/2, textY - textHeight/2, textWidth, textHeight)

        ctx.fillStyle = '#ffffff'
        ctx.fillText(text, textX, textY)
      } else {
        // Prévisualisation normale - fond semi-transparent noir
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        ctx.fillRect(x, y, width, height)

        // Cadre noir continu (pas de pointillés)
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 3
        ctx.strokeRect(x, y, width, height)

        // Bordure bleue pour indiquer la création en cours
        ctx.strokeStyle = '#007bff'
        ctx.lineWidth = 2
        ctx.strokeRect(x - 1, y - 1, width + 2, height + 2)
      }
    }

    ctx.restore()
  }, [creationState, detectPanelCollision])

  // Fonction pour dessiner le feedback visuel de drag-and-drop
  const drawDragFeedback = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!isDragOverPanel) return

    const panel = elements.find(el => el.id === isDragOverPanel)
    if (!panel) return

    ctx.save()

    // Couleur selon l'état du panel
    const isOccupied = panel.hasImage
    const borderColor = isOccupied ? '#ef4444' : '#22c55e' // Rouge si occupé, vert si vide
    const bgColor = isOccupied ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'

    // Dessiner le fond de feedback
    ctx.fillStyle = bgColor
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height)

    // Dessiner la bordure de feedback
    ctx.strokeStyle = borderColor
    ctx.lineWidth = 3
    ctx.setLineDash([8, 8])
    ctx.strokeRect(panel.x, panel.y, panel.width, panel.height)

    // Dessiner le texte de feedback
    const text = isOccupied ? 'Remplacer l\'image existante...' : 'Ajouter une image...'
    ctx.fillStyle = borderColor
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Fond semi-transparent pour le texte
    const textMetrics = ctx.measureText(text)
    const textWidth = textMetrics.width + 20
    const textHeight = 30
    const textX = panel.x + panel.width / 2
    const textY = panel.y + panel.height / 2

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(textX - textWidth/2, textY - textHeight/2, textWidth, textHeight)

    ctx.fillStyle = borderColor
    ctx.fillText(text, textX, textY)

    ctx.setLineDash([])
    ctx.restore()
  }, [isDragOverPanel, elements])

  // Fonction pour dessiner un élément sur le canvas
  const drawElement = useCallback((ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    const isSelected = element.id === selectedElementId

    ctx.save()
    
    if (element.type === 'panel') {
      // Dessiner un panel (rectangle)
      ctx.fillStyle = element.style?.backgroundColor || '#1a1a1a'
      ctx.strokeStyle = element.style?.borderColor || '#000000'
      ctx.lineWidth = element.style?.borderWidth || 2

      // Dessiner le fond seulement si pas d'image
      if (!element.hasImage) {
        ctx.fillRect(element.x, element.y, element.width, element.height)
      }

      // Dessiner l'image si elle existe
      if (element.hasImage && element.imageElement) {
        // Épaisseur du cadre comics/manga (espace laissé autour de l'image)
        const frameThickness = 8

        // D'ABORD : Dessiner le fond noir du panel (qui formera le cadre)
        ctx.fillStyle = '#000000'
        ctx.fillRect(element.x, element.y, element.width, element.height)

        // ENSUITE : Dessiner l'image étirée AVEC une marge pour créer le cadre naturellement
        const imageX = element.x + frameThickness
        const imageY = element.y + frameThickness
        const imageWidth = element.width - (frameThickness * 2)
        const imageHeight = element.height - (frameThickness * 2)

        // S'assurer qu'il y a assez d'espace pour l'image
        if (imageWidth > 0 && imageHeight > 0) {
          // L'image s'étire dans l'espace disponible (avec marge pour le cadre)
          ctx.drawImage(
            element.imageElement,
            imageX,        // Position X avec marge
            imageY,        // Position Y avec marge
            imageWidth,    // Largeur avec marge (étire l'image)
            imageHeight    // Hauteur avec marge (étire l'image)
          )
        }
      }

      // Dessiner la bordure
      ctx.strokeRect(element.x, element.y, element.width, element.height)
    } else if (element.type === 'bubble') {
      // Dessiner une bulle de dialogue avec formes avancées
      ctx.fillStyle = element.style?.backgroundColor || '#ffffff'
      ctx.strokeStyle = element.style?.borderColor || '#000000'
      ctx.lineWidth = element.style?.borderWidth || 2

      const shape = element.bubbleShape || 'oval'

      // Dessiner selon la forme
      switch (shape) {
        case 'oval':
          drawOvalBubble(ctx, element)
          break
        case 'rectangular':
          drawRectangularBubble(ctx, element)
          break
        case 'cloud':
          drawCloudBubble(ctx, element)
          break
        case 'thought':
          drawThoughtBubble(ctx, element)
          break
        default:
          drawOvalBubble(ctx, element)
      }

      // Le texte est géré par Canvas Editor, pas besoin de le dessiner ici
      // sauf si l'éditeur n'est pas initialisé
      if (!element.canvasEditor && element.content) {
        const centerX = element.x + element.width / 2
        const centerY = element.y + element.height / 2
        ctx.fillStyle = '#000000'
        ctx.font = `${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(element.content, centerX, centerY)
      }
    }
    // ✅ SUPPRIMÉ : Rendu canvas des éléments "text"
    // Les textes libres sont gérés par TipTapFreeTextLayer (HTML/TipTap)
    // Le rendu canvas créait une duplication visuelle avec cadre bleu identique aux panels
    // ✅ SUPPRIMÉ : Support des images séparées (architecture unifiée panel-image)
    
    // ✅ CORRECTION : Indicateur de sélection SEULEMENT pour les panels
    // Les éléments TipTap (text, bubble) utilisent leurs overlays spécialisés
    if (isSelected && element.type === 'panel') {
      ctx.strokeStyle = '#007bff'
      ctx.lineWidth = 3
      ctx.strokeRect(element.x - 5, element.y - 5, element.width + 10, element.height + 10)
    }
    
    ctx.restore()
  }, [selectedElementId])

  // Fonction pour redessiner le canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Effacer le canvas
    ctx.clearRect(0, 0, width, height)
    
    // Dessiner le fond
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)

    // Dessiner une grille visible (conditionnel)
    if (gridVisible) {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)' // Noir avec 40% d'opacité pour une bonne visibilité
      ctx.lineWidth = 1.5 // Légèrement plus épais pour plus de contraste
      const gridSize = 20

      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      }

      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
    }
    
    // Dessiner tous les éléments
    elements.forEach(element => drawElement(ctx, element))

    // Dessiner le feedback de drag-and-drop
    if (isDragOverPanel) {
      drawDragFeedback(ctx)
    }

    // Dessiner l'élément en cours de création
    if (creationState.isCreating) {
      drawCreationPreview(ctx)
    }

    // ✅ CORRECTION : Dessiner les handles SEULEMENT pour les panels sélectionnés
    // Les éléments TipTap utilisent leurs overlays spécialisés
    if (selectedElementId && resizeHandles.length > 0) {
      const selectedElement = elements.find(el => el.id === selectedElementId)
      if (selectedElement && selectedElement.type === 'panel') {
        drawResizeHandles(ctx)
      }
    }
  }, [elements, width, height, gridVisible, drawElement, creationState, selectedElementId, resizeHandles, drawCreationPreview, drawResizeHandles, isDragOverPanel, drawDragFeedback])

  // Redessiner quand les éléments changent
  useEffect(() => {
    redrawCanvas()
  }, [redrawCanvas])

  // ✅ HELPER : Vérifier si l'élément sélectionné est une bulle TipTap
  const isSelectedElementBubble = useCallback(() => {
    return selectedElementId && selectedElementId.startsWith('bubble_')
  }, [selectedElementId])

  // ✅ HELPER : Vérifier si l'élément sélectionné est un texte libre TipTap
  const isSelectedElementText = useCallback(() => {
    return selectedElementId && selectedElementId.startsWith('text_')
  }, [selectedElementId])

  // ✅ GESTION DES MODES DES BULLES TIPTAP
  const [bubbleMode, setBubbleMode] = useState<'reading' | 'manipulating' | 'editing'>('reading')

  // ✅ GESTION DES MODES DES TEXTES LIBRES TIPTAP
  const [textMode, setTextMode] = useState<'reading' | 'manipulating' | 'editing'>('reading')

  // ✅ NOUVEAU : Système de désélection globale pour le mode édition
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (bubbleMode === 'editing' && selectedElementId) {
        const target = event.target as HTMLElement

        // Vérifier si le clic est à l'extérieur de la bulle en cours d'édition
        const bubbleElement = document.querySelector(`[data-bubble-id="${selectedElementId}"]`)

        if (bubbleElement && !bubbleElement.contains(target)) {
          console.log('🎯 SimpleCanvasEditor: Clic extérieur détecté, sortie du mode édition')
          setBubbleMode('reading')
          setSelectedElementId(null)

          // Dispatcher l'événement pour la bulle
          const modeChangeEvent = new CustomEvent('bubbleModeChange', {
            detail: { bubbleId: selectedElementId, newMode: 'reading' }
          })
          window.dispatchEvent(modeChangeEvent)
        }
      }
    }

    if (bubbleMode === 'editing') {
      document.addEventListener('click', handleGlobalClick, true) // Capture phase
      return () => document.removeEventListener('click', handleGlobalClick, true)
    }
  }, [bubbleMode, selectedElementId])

  const handleBubbleDoubleClick = useCallback((bubbleId: string) => {
    console.log('🎯 SimpleCanvasEditor: Double-click sur bulle:', bubbleId)
    setBubbleMode('editing')

    // Dispatcher l'événement de changement de mode
    const modeChangeEvent = new CustomEvent('bubbleModeChange', {
      detail: { bubbleId, newMode: 'editing' }
    })
    window.dispatchEvent(modeChangeEvent)
  }, [])

  const handleBubbleModeChange = useCallback((bubbleId: string, newMode: 'reading' | 'manipulating' | 'editing') => {
    console.log('🎯 SimpleCanvasEditor: Mode change:', bubbleId, newMode)
    setBubbleMode(newMode)

    if (newMode === 'reading') {
      // Désélectionner la bulle quand on sort du mode édition
      setSelectedElementId(null)
    }
  }, [])

  // ✅ MANIPULATION DES BULLES TIPTAP VIA DOM
  const [bubbleDragState, setBubbleDragState] = useState<{ bubbleId: string, startLeft: number, startTop: number } | null>(null)

  const handleBubbleDragStart = useCallback((bubbleId: string, startX: number, startY: number) => {
    // ✅ CORRECTION : Lire les données depuis CanvasContext au lieu du DOM
    const bubbleElement = canvasElements.find(el => el.id === bubbleId && el.type === 'dialogue') as DialogueElement | undefined
    if (bubbleElement) {
      const currentLeft = bubbleElement.transform.x
      const currentTop = bubbleElement.transform.y

      setBubbleDragState({ bubbleId, startLeft: currentLeft, startTop: currentTop })
      console.log('🎯 Bubble drag start state:', { bubbleId, startLeft: currentLeft, startTop: currentTop })
    }
  }, [canvasElements])

  const handleBubbleDrag = useCallback((bubbleId: string, deltaX: number, deltaY: number) => {
    if (!bubbleDragState || bubbleDragState.bubbleId !== bubbleId) return

    const newLeft = bubbleDragState.startLeft + deltaX
    const newTop = bubbleDragState.startTop + deltaY

    // ✅ CORRECTION : Mettre à jour CanvasContext au lieu du DOM
    const bubbleUpdateEvent = new CustomEvent('updateTipTapBubbleTransform', {
      detail: {
        bubbleId,
        transform: {
          x: newLeft,
          y: newTop
        }
      }
    })
    window.dispatchEvent(bubbleUpdateEvent)

    console.log('🎯 Bubble drag applied:', bubbleId, { deltaX, deltaY, newLeft, newTop })
  }, [bubbleDragState])

  const handleBubbleDragEnd = useCallback((bubbleId: string) => {
    setBubbleDragState(null)
    console.log('🎯 Bubble drag end:', bubbleId)
  }, [])

  const [bubbleResizeState, setBubbleResizeState] = useState<{
    bubbleId: string,
    handle: string,
    startWidth: number,
    startHeight: number,
    startLeft: number,
    startTop: number
  } | null>(null)

  const handleBubbleResizeStart = useCallback((bubbleId: string, handle: string, startX: number, startY: number) => {
    // ✅ CORRECTION : Lire les données depuis CanvasContext au lieu du DOM
    const bubbleElement = canvasElements.find(el => el.id === bubbleId && el.type === 'dialogue') as DialogueElement | undefined
    if (bubbleElement) {
      const currentWidth = bubbleElement.transform.width
      const currentHeight = bubbleElement.transform.height
      const currentLeft = bubbleElement.transform.x
      const currentTop = bubbleElement.transform.y

      setBubbleResizeState({
        bubbleId,
        handle,
        startWidth: currentWidth,
        startHeight: currentHeight,
        startLeft: currentLeft,
        startTop: currentTop
      })
      console.log('🎯 Bubble resize start state:', { bubbleId, handle, startWidth: currentWidth, startHeight: currentHeight, startLeft: currentLeft, startTop: currentTop })
    }
  }, [canvasElements])

  const handleBubbleResize = useCallback((bubbleId: string, handle: string, deltaX: number, deltaY: number) => {
    if (!bubbleResizeState || bubbleResizeState.bubbleId !== bubbleId || bubbleResizeState.handle !== handle) return

    const bubbleElement = document.querySelector(`[data-bubble-id="${bubbleId}"]`) as HTMLElement
    if (bubbleElement && bubbleElement.parentElement) {
      const parent = bubbleElement.parentElement
      const { startWidth, startHeight, startLeft, startTop } = bubbleResizeState

      let newWidth = startWidth
      let newHeight = startHeight
      let newLeft = startLeft
      let newTop = startTop

      // ✅ LOGIQUE DE RESIZE SELON LE HANDLE (identique aux panels)
      switch (handle) {
        case 'tl': // top-left
          newWidth = Math.max(50, startWidth - deltaX)
          newHeight = Math.max(30, startHeight - deltaY)
          newLeft = startLeft + (startWidth - newWidth)
          newTop = startTop + (startHeight - newHeight)
          break
        case 'tr': // top-right
          newWidth = Math.max(50, startWidth + deltaX)
          newHeight = Math.max(30, startHeight - deltaY)
          newTop = startTop + (startHeight - newHeight)
          break
        case 'bl': // bottom-left
          newWidth = Math.max(50, startWidth - deltaX)
          newHeight = Math.max(30, startHeight + deltaY)
          newLeft = startLeft + (startWidth - newWidth)
          break
        case 'br': // bottom-right
          newWidth = Math.max(50, startWidth + deltaX)
          newHeight = Math.max(30, startHeight + deltaY)
          break
        case 'tc': // top-center
          newHeight = Math.max(30, startHeight - deltaY)
          newTop = startTop + (startHeight - newHeight)
          break
        case 'bc': // bottom-center
          newHeight = Math.max(30, startHeight + deltaY)
          break
        case 'ml': // middle-left
          newWidth = Math.max(50, startWidth - deltaX)
          newLeft = startLeft + (startWidth - newWidth)
          break
        case 'mr': // middle-right
          newWidth = Math.max(50, startWidth + deltaX)
          break
      }

      // ✅ CORRECTION : Supprimer les modifications DOM directes qui entrent en conflit avec React
      // Laisser React gérer le rendu via CanvasContext uniquement

      // ✅ NOUVEAU : Mettre à jour les données de la bulle TipTap
      const bubbleUpdateEvent = new CustomEvent('updateTipTapBubbleTransform', {
        detail: {
          bubbleId,
          transform: {
            x: newLeft,
            y: newTop,
            width: newWidth,
            height: newHeight
          }
        }
      })
      window.dispatchEvent(bubbleUpdateEvent)

      console.log('🎯 Bubble resize applied:', bubbleId, handle, {
        deltaX, deltaY,
        newWidth, newHeight,
        newLeft, newTop
      })
    }
  }, [bubbleResizeState])

  const handleBubbleResizeEnd = useCallback((bubbleId: string) => {
    setBubbleResizeState(null)
    console.log('🎯 Bubble resize end:', bubbleId)
  }, [])

  // ✅ NOUVEAU : Écouter les clics sur les bulles TipTap DOM
  useEffect(() => {
    const handleBubbleClick = (event: CustomEvent) => {
      const { bubbleId, clientX, clientY, element } = event.detail
      console.log('🎯 SimpleCanvasEditor: Bulle TipTap cliquée:', bubbleId)

      // Sélectionner la bulle avec le même système que les panels
      setSelectedElementId(bubbleId)
      setBubbleMode('manipulating')

      // ✅ ÉMETTRE L'ÉVÉNEMENT POUR TIPTAPBUBBLELAYER
      const elementSelectedEvent = new CustomEvent('elementSelected', {
        detail: { id: bubbleId, type: 'bubble' }
      })
      window.dispatchEvent(elementSelectedEvent)
      console.log('🎯 SimpleCanvasEditor: Événement elementSelected émis pour:', bubbleId)

      // Créer un CanvasElement virtuel pour la bulle
      const bubbleElement: CanvasElement = {
        id: bubbleId,
        type: 'bubble',
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight,
        bubbleType: 'speech'
      }

      onElementClick?.(bubbleElement)
      console.log('✅ SimpleCanvasEditor: Bulle sélectionnée:', bubbleId)
    }

    const handleBubbleModeChangeEvent = (event: CustomEvent) => {
      const { bubbleId, newMode } = event.detail
      handleBubbleModeChange(bubbleId, newMode)
    }

    const handleRegisterBubble = (event: CustomEvent) => {
      const { bubbleId, element, bounds } = event.detail
      console.log('📝 SimpleCanvasEditor: Enregistrement bulle TipTap:', bubbleId)
      setTipTapBubbles(prev => new Map(prev.set(bubbleId, { element, bounds })))
    }

    const handleUnregisterBubble = (event: CustomEvent) => {
      const { bubbleId } = event.detail
      console.log('🗑️ SimpleCanvasEditor: Désenregistrement bulle TipTap:', bubbleId)
      setTipTapBubbles(prev => {
        const newMap = new Map(prev)
        newMap.delete(bubbleId)
        return newMap
      })
    }

    window.addEventListener('bubbleClicked', handleBubbleClick as EventListener)
    window.addEventListener('registerTipTapBubble', handleRegisterBubble as EventListener)
    window.addEventListener('unregisterTipTapBubble', handleUnregisterBubble as EventListener)
    window.addEventListener('bubbleModeChangeFromBubble', handleBubbleModeChangeEvent as EventListener)

    return () => {
      window.removeEventListener('bubbleClicked', handleBubbleClick as EventListener)
      window.removeEventListener('registerTipTapBubble', handleRegisterBubble as EventListener)
      window.removeEventListener('unregisterTipTapBubble', handleUnregisterBubble as EventListener)
      window.removeEventListener('bubbleModeChangeFromBubble', handleBubbleModeChangeEvent as EventListener)
    }
  }, [onElementClick])

  // ✅ MANIPULATION DES TEXTES LIBRES TIPTAP VIA DOM
  const [textDragState, setTextDragState] = useState<{ textId: string, startLeft: number, startTop: number } | null>(null)

  const handleTextDragStart = useCallback((textId: string, startX: number, startY: number) => {
    const textElement = document.querySelector(`[data-text-id="${textId}"]`) as HTMLElement
    if (textElement) {
      const currentLeft = parseInt(textElement.style.left || '0', 10)
      const currentTop = parseInt(textElement.style.top || '0', 10)

      setTextDragState({ textId, startLeft: currentLeft, startTop: currentTop })
      console.log('🎯 Text drag start state:', { textId, startLeft: currentLeft, startTop: currentTop })
    }
  }, [])

  const handleTextDrag = useCallback((textId: string, deltaX: number, deltaY: number) => {
    if (!textDragState || textDragState.textId !== textId) return

    const textElement = document.querySelector(`[data-text-id="${textId}"]`) as HTMLElement
    if (textElement) {
      const newLeft = textDragState.startLeft + deltaX
      const newTop = textDragState.startTop + deltaY

      // ✅ MISE À JOUR DIRECTE DU STYLE DOM (comme les bulles)
      textElement.style.left = `${newLeft}px`
      textElement.style.top = `${newTop}px`

      console.log('🎯 Text drag applied:', textId, { deltaX, deltaY, newLeft, newTop })
    }
  }, [textDragState])

  const handleTextDragEnd = useCallback((textId: string) => {
    setTextDragState(null)
    setTextMode('reading')
    console.log('🎯 Text drag end:', textId)
  }, [])

  const [textResizeState, setTextResizeState] = useState<{
    textId: string,
    handle: string,
    startWidth: number,
    startHeight: number,
    startLeft: number,
    startTop: number
  } | null>(null)

  const handleTextResizeStart = useCallback((textId: string, handle: string, startX: number, startY: number) => {
    console.log('🎯 SimpleCanvasEditor: handleTextResizeStart appelé:', { textId, handle, startX, startY })

    // ✅ RÉCUPÉRER LES PROPRIÉTÉS TEXTUELLES ACTUELLES DEPUIS LE CONTEXTE CANVAS
    const textElement = canvasElements.find(el => el.id === textId && el.type === 'text') as TextElement | undefined
    if (textElement) {
      setTextResizeState({
        textId,
        handle,
        startWidth: textElement.textStyle.maxWidth,
        startHeight: textElement.textStyle.fontSize,
        startLeft: textElement.transform.x,
        startTop: textElement.transform.y
      })
      console.log('🎯 Text resize start - propriétés textuelles:', {
        textId,
        handle,
        startMaxWidth: textElement.textStyle.maxWidth,
        startFontSize: textElement.textStyle.fontSize
      })
    } else {
      console.error('🎯 SimpleCanvasEditor: TextElement non trouvé pour:', textId, 'dans', canvasElements.length, 'éléments')
    }
  }, [canvasElements])

  const handleTextResize = useCallback((textId: string, handle: string, deltaX: number, deltaY: number) => {
    console.log('🎯 SimpleCanvasEditor: handleTextResize appelé:', { textId, handle, deltaX, deltaY })

    if (!textResizeState || textResizeState.textId !== textId || textResizeState.handle !== handle) {
      console.warn('🎯 SimpleCanvasEditor: État de resize invalide:', { textResizeState, textId, handle })
      return
    }

    const { startWidth: startMaxWidth, startHeight: startFontSize } = textResizeState

    // ✅ CALCUL DES NOUVELLES PROPRIÉTÉS TEXTUELLES
    let newMaxWidth = startMaxWidth
    let newFontSize = startFontSize

    // Facteurs de sensibilité pour le redimensionnement
    const widthSensitivity = 1.0  // 1px de delta = 1px de largeur
    const fontSensitivity = 0.2   // 5px de delta = 1px de police

    // ✅ LOGIQUE DE RESIZE SELON LE HANDLE
    switch (handle) {
      case 'tl': // top-left: largeur (inverse) + police (inverse)
        newMaxWidth = Math.max(50, startMaxWidth - deltaX * widthSensitivity)
        newFontSize = Math.max(12, startFontSize - deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'tr': // top-right: largeur + police (inverse)
        newMaxWidth = Math.max(50, startMaxWidth + deltaX * widthSensitivity)
        newFontSize = Math.max(12, startFontSize - deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'bl': // bottom-left: largeur (inverse) + police
        newMaxWidth = Math.max(50, startMaxWidth - deltaX * widthSensitivity)
        newFontSize = Math.max(12, startFontSize + deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'br': // bottom-right: largeur + police
        newMaxWidth = Math.max(50, startMaxWidth + deltaX * widthSensitivity)
        newFontSize = Math.max(12, startFontSize + deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'tc': // top-center: police seulement (inverse)
        newFontSize = Math.max(12, startFontSize - deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'bc': // bottom-center: police seulement
        newFontSize = Math.max(12, startFontSize + deltaY * fontSensitivity) // ✅ SUPPRIMÉ Math.min(72)
        break
      case 'ml': // middle-left: largeur seulement (inverse)
        newMaxWidth = Math.max(50, startMaxWidth - deltaX * widthSensitivity)
        break
      case 'mr': // middle-right: largeur seulement
        newMaxWidth = Math.max(50, startMaxWidth + deltaX * widthSensitivity)
        break
    }

    // ✅ METTRE À JOUR L'ÉLÉMENT DANS LE CONTEXTE CANVAS EN PREMIER
    const currentElement = canvasElements.find(el => el.id === textId && el.type === 'text') as TextElement | undefined
    if (currentElement) {
      updateElement(textId, {
        textStyle: {
          ...currentElement.textStyle,
          fontSize: Math.round(newFontSize),
          maxWidth: Math.round(newMaxWidth)
        }
      })

      console.log('🎯 Text resize applied - Contexte mis à jour:', textId, {
        fontSize: Math.round(newFontSize),
        maxWidth: Math.round(newMaxWidth)
      })
    }

    // ✅ SUPPRIMÉ : L'événement personnalisé qui créait des conflits

    console.log('🎯 Text resize applied - propriétés textuelles:', textId, handle, {
      deltaX, deltaY,
      newMaxWidth: Math.round(newMaxWidth),
      newFontSize: Math.round(newFontSize)
    })
  }, [textResizeState, canvasElements, updateElement])

  const handleTextResizeEnd = useCallback((textId: string) => {
    setTextResizeState(null)
    setTextMode('reading')
    console.log('🎯 Text resize end:', textId)
  }, [])

  const handleTextDoubleClick = useCallback((textId: string) => {
    console.log('🎯 SimpleCanvasEditor: Double-click sur texte:', textId)
    setTextMode('editing')
    setSelectedElementId(textId)

    // Dispatcher l'événement de changement de mode
    const modeChangeEvent = new CustomEvent('textModeChange', {
      detail: { textId, newMode: 'editing' }
    })
    window.dispatchEvent(modeChangeEvent)
  }, [])

  // ✅ ÉCOUTER LES CLICS SUR LES TEXTES LIBRES TIPTAP DOM
  useEffect(() => {
    const handleTextClick = (event: CustomEvent) => {
      const { textId, clientX, clientY, element } = event.detail
      console.log('🎯 SimpleCanvasEditor: Texte libre TipTap cliqué:', textId)

      // Sélectionner le texte avec le même système que les panels
      setSelectedElementId(textId)
      setTextMode('manipulating')

      // ✅ ÉMETTRE L'ÉVÉNEMENT POUR TIPTAPFREETEXTLAYER
      const elementSelectedEvent = new CustomEvent('elementSelected', {
        detail: { id: textId, type: 'text' }
      })
      window.dispatchEvent(elementSelectedEvent)
      console.log('🎯 SimpleCanvasEditor: Événement elementSelected émis pour:', textId)

      // Créer un CanvasElement virtuel pour le texte
      const textElement: CanvasElement = {
        id: textId,
        type: 'text',
        x: element.offsetLeft,
        y: element.offsetTop,
        width: element.offsetWidth,
        height: element.offsetHeight
      }

      onElementClick?.(textElement)
      console.log('✅ SimpleCanvasEditor: Texte libre sélectionné:', textId)
    }

    const handleTextModeChangeEvent = (event: CustomEvent) => {
      const { textId, newMode } = event.detail
      handleTextModeChange(textId, newMode)
    }

    const handleRegisterText = (event: CustomEvent) => {
      const { textId, element, bounds } = event.detail
      console.log('📝 SimpleCanvasEditor: Enregistrement texte libre TipTap:', textId)
      // Ajouter à une map similaire aux bulles si nécessaire
    }

    const handleUnregisterText = (event: CustomEvent) => {
      const { textId } = event.detail
      console.log('🗑️ SimpleCanvasEditor: Désenregistrement texte libre TipTap:', textId)
    }

    window.addEventListener('textClicked', handleTextClick as EventListener)
    window.addEventListener('registerTipTapText', handleRegisterText as EventListener)
    window.addEventListener('unregisterTipTapText', handleUnregisterText as EventListener)
    window.addEventListener('textModeChangeFromText', handleTextModeChangeEvent as EventListener)

    return () => {
      window.removeEventListener('textClicked', handleTextClick as EventListener)
      window.removeEventListener('registerTipTapText', handleRegisterText as EventListener)
      window.removeEventListener('unregisterTipTapText', handleUnregisterText as EventListener)
      window.removeEventListener('textModeChangeFromText', handleTextModeChangeEvent as EventListener)
    }
  }, [onElementClick])

  const handleTextModeChange = useCallback((textId: string, newMode: 'reading' | 'manipulating' | 'editing') => {
    console.log('🎯 SimpleCanvasEditor: Text Mode change:', textId, newMode)
    setTextMode(newMode)

    if (newMode === 'reading') {
      // Désélectionner le texte quand on sort du mode édition
      setSelectedElementId(null)
    }
  }, [])

  // ✨ GESTIONNAIRE DE ZOOM AVEC MOLETTE
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'hand') return

    event.preventDefault()

    const delta = event.deltaY > 0 ? -1 : 1
    const zoomFactor = 1.1

    // ✅ NOUVEAU : Les fonctions zoomIn/zoomOut déclenchent déjà la désélection automatique
    if (delta > 0) {
      zoomIn()
    } else {
      zoomOut()
    }
  }, [activeTool, zoomIn, zoomOut])

  // Gestionnaire de mousedown
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ✅ CORRECTION CRITIQUE : Utiliser des fonctions de coordonnées différentes selon le type d'élément
    const canvasCoords = getCanvasCoordinates(event) // Pour les éléments canvas (panels)
    const htmlLayerCoords = getHTMLLayerCoordinates(event) // Pour les couches HTML (textes, bulles)

    console.log('🖱️ SimpleCanvasEditor mouseDown:', {
      canvasCoords,
      htmlLayerCoords,
      tipTapBubblesCount: tipTapBubbles.size
    })

    // ✅ PRIORITÉ ABSOLUE : Création de bulles quand l'outil bulle est actif
    if (bubbleCreationMode && bubbleTypeToCreate) {
      // ✅ CORRECTION FINALE : Utiliser getHTMLLayerCoordinates() pour éviter la double transformation
      console.log('🎯 PRIORITÉ BULLE: Création bulle TipTap (priorité absolue sur tout):', {
        htmlLayerCoords,
        type: bubbleTypeToCreate,
        zoomLevel,
        canvasScale
      })

      // Créer l'événement personnalisé avec les coordonnées HTML layer (sans double transformation)
      const bubbleCreationEvent = new CustomEvent('createTipTapBubble', {
        detail: {
          x: htmlLayerCoords.x, // ✅ CORRIGÉ : Coordonnées HTML layer sans double transformation
          y: htmlLayerCoords.y, // ✅ CORRIGÉ : Coordonnées HTML layer sans double transformation
          bubbleType: bubbleTypeToCreate
        }
      })

      // Dispatcher l'événement pour que TipTapBubbleLayer le capture
      window.dispatchEvent(bubbleCreationEvent)

      cancelBubbleCreation()
      return // ✅ ARRÊTER ICI - Pas de sélection d'éléments, pas d'autres actions
    }

    // ✅ PRIORITÉ ABSOLUE : Création de texte quand l'outil texte est actif
    if (activeTool === 'text') {
      // ✅ CORRECTION FINALE : Utiliser getHTMLLayerCoordinates() pour éviter la double transformation
      console.log('🎯 PRIORITÉ TEXTE: Création texte TipTap (priorité absolue sur tout):', {
        htmlLayerCoords,
        zoomLevel,
        canvasScale
      })

      // Créer l'événement personnalisé avec les coordonnées HTML layer (sans double transformation)
      const textCreationEvent = new CustomEvent('createTipTapFreeText', {
        detail: {
          x: htmlLayerCoords.x, // ✅ CORRIGÉ : Coordonnées HTML layer sans double transformation
          y: htmlLayerCoords.y  // ✅ CORRIGÉ : Coordonnées HTML layer sans double transformation
        }
      })

      // Dispatcher l'événement pour que le système TipTap le capture
      window.dispatchEvent(textCreationEvent)
      setActiveTool('select')
      return // ✅ ARRÊTER ICI - Pas de sélection d'éléments, pas d'autres actions
    }

    // ✨ GESTION DE L'OUTIL MAIN (PAN) - AUCUNE SÉLECTION POSSIBLE
    if (activeTool === 'hand') {
      console.log('🖐️ Outil main actif - Pan seulement, aucune sélection')
      setPanState({
        isPanning: true,
        startX: event.clientX,
        startY: event.clientY,
        startTransformX: canvasTransform.x,
        startTransformY: canvasTransform.y
      })
      return // Sortir immédiatement, pas de sélection
    }

    // ✅ CORRECTION CRITIQUE : Définir x et y pour les éléments canvas (panels)
    const { x, y } = canvasCoords

    // ✅ CORRECTION : Vérifier les handles SEULEMENT pour les panels
    // Les éléments TipTap utilisent leurs overlays spécialisés
    const handle = findHandleAtPosition(x, y)
    if (handle && selectedElementId) {
      const selectedElement = elements.find(el => el.id === selectedElementId)
      if (selectedElement && selectedElement.type === 'panel') {
        setManipulationState({
          isDragging: false,
          isResizing: true,
          draggedElementId: selectedElementId,
          resizeHandle: handle,
          startMouseX: x,
          startMouseY: y,
          startElementX: selectedElement.x,
          startElementY: selectedElement.y,
          startElementWidth: selectedElement.width,
          startElementHeight: selectedElement.height
        })
        return
      }
    }

    // Vérifier si on clique sur un élément
    const clickedElement = findElementAtPosition(x, y)
    if (clickedElement) {
      setSelectedElementId(clickedElement.id)
      onElementClick?.(clickedElement)

      // Commencer le drag
      setManipulationState({
        isDragging: true,
        isResizing: false,
        draggedElementId: clickedElement.id,
        resizeHandle: null,
        startMouseX: x,
        startMouseY: y,
        startElementX: clickedElement.x,
        startElementY: clickedElement.y,
        startElementWidth: clickedElement.width,
        startElementHeight: clickedElement.height
      })
      return
    }

    // Clic sur canvas vide - commencer la création ou désélectionner
    setSelectedElementId(null)
    setBubbleMode('reading')
    setTextMode('reading')

    // ✅ ÉMETTRE ÉVÉNEMENT DE DÉSÉLECTION GLOBALE
    const globalDeselectEvent = new CustomEvent('globalDeselect', {
      detail: { source: 'canvas-click' }
    })
    window.dispatchEvent(globalDeselectEvent)

    if (activeTool === 'panel') {
      // ✅ CORRECTION : Utiliser canvasCoords pour les panels (système Konva)
      // Commencer le mode création par drag
      setCreationState({
        isCreating: true,
        startX: canvasCoords.x,
        startY: canvasCoords.y,
        currentX: canvasCoords.x,
        currentY: canvasCoords.y,
        elementType: 'panel'
      })
    } else {
      onCanvasClick?.(canvasCoords.x, canvasCoords.y)
    }
  }, [
    getCanvasCoordinates,
    getHTMLLayerCoordinates,
    findHandleAtPosition,
    selectedElementId,
    elements,
    findElementAtPosition,
    onElementClick,
    activeTool,
    bubbleCreationMode,
    bubbleTypeToCreate,
    cancelBubbleCreation,
    onCanvasClick,
    creationState,
    createOptimalPanel,
    setActiveTool,
    panState,
    canvasTransform,
    setPanState
  ])

  // Gestionnaire de mousemove
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(event)

    // ✨ GESTION DU PAN AVEC L'OUTIL MAIN
    if (panState.isPanning && activeTool === 'hand') {
      const deltaX = event.clientX - panState.startX
      const deltaY = event.clientY - panState.startY

      setCanvasTransform({
        ...canvasTransform,
        x: panState.startTransformX + deltaX,
        y: panState.startTransformY + deltaY
      })
      return
    }

    // ✅ NOUVEAU : Mise à jour du curseur avec priorité pour les outils de création
    const handle = findHandleAtPosition(x, y)

    // ✅ PRIORITÉ : Ne pas changer le curseur si les outils bulle ou texte sont actifs
    // Le hook useConsistentCursor gère déjà le curseur crosshair
    const isCreationTool = activeTool === 'text' || activeTool === 'bubble' || bubbleCreationMode

    if (isCreationTool) {
      // Laisser le hook useConsistentCursor gérer le curseur
      console.log('🖱️ SimpleCanvasEditor: Curseur géré par useConsistentCursor pour outil:', activeTool)
      return
    }

    if (activeTool === 'hand') {
      canvas.style.cursor = panState.isPanning ? 'grabbing' : 'grab'
    } else if (handle) {
      const cursors = {
        'top-left': 'nw-resize',
        'top-right': 'ne-resize',
        'bottom-left': 'sw-resize',
        'bottom-right': 'se-resize',
        'top-center': 'n-resize',
        'bottom-center': 's-resize',
        'middle-left': 'w-resize',
        'middle-right': 'e-resize'
      }
      canvas.style.cursor = cursors[handle.position] || 'default'
    } else if (findElementAtPosition(x, y)) {
      canvas.style.cursor = 'move'
    } else {
      canvas.style.cursor = activeTool === 'select' ? 'default' : 'crosshair'
    }

    // Gestion du redimensionnement
    if (manipulationState.isResizing && manipulationState.resizeHandle && manipulationState.draggedElementId) {
      const deltaX = x - manipulationState.startMouseX
      const deltaY = y - manipulationState.startMouseY

      const element = elements.find(el => el.id === manipulationState.draggedElementId)
      if (element) {
        const newElement = { ...element }

        switch (manipulationState.resizeHandle.position) {
          case 'top-left':
            newElement.x = manipulationState.startElementX + deltaX
            newElement.y = manipulationState.startElementY + deltaY
            newElement.width = manipulationState.startElementWidth - deltaX
            newElement.height = manipulationState.startElementHeight - deltaY
            break
          case 'top-right':
            newElement.y = manipulationState.startElementY + deltaY
            newElement.width = manipulationState.startElementWidth + deltaX
            newElement.height = manipulationState.startElementHeight - deltaY
            break
          case 'bottom-left':
            newElement.x = manipulationState.startElementX + deltaX
            newElement.width = manipulationState.startElementWidth - deltaX
            newElement.height = manipulationState.startElementHeight + deltaY
            break
          case 'bottom-right':
            newElement.width = manipulationState.startElementWidth + deltaX
            newElement.height = manipulationState.startElementHeight + deltaY
            break
          case 'top-center':
            newElement.y = manipulationState.startElementY + deltaY
            newElement.height = manipulationState.startElementHeight - deltaY
            break
          case 'bottom-center':
            newElement.height = manipulationState.startElementHeight + deltaY
            break
          case 'middle-left':
            newElement.x = manipulationState.startElementX + deltaX
            newElement.width = manipulationState.startElementWidth - deltaX
            break
          case 'middle-right':
            newElement.width = manipulationState.startElementWidth + deltaX
            break
        }

        // Contraintes minimales
        newElement.width = Math.max(20, newElement.width)
        newElement.height = Math.max(20, newElement.height)

        setElements(prev => prev.map(el =>
          el.id === manipulationState.draggedElementId ? newElement : el
        ))
      }
    }

    // Gestion du drag
    if (manipulationState.isDragging && manipulationState.draggedElementId) {
      const deltaX = x - manipulationState.startMouseX
      const deltaY = y - manipulationState.startMouseY

      setElements(prev => prev.map(el =>
        el.id === manipulationState.draggedElementId
          ? {
              ...el,
              x: manipulationState.startElementX + deltaX,
              y: manipulationState.startElementY + deltaY
            }
          : el
      ))
    }

    // Gestion de la création
    if (creationState.isCreating) {
      setCreationState(prev => ({
        ...prev,
        currentX: x,
        currentY: y
      }))
    }
  }, [
    getCanvasCoordinates,
    findHandleAtPosition,
    findElementAtPosition,
    activeTool,
    manipulationState,
    elements,
    creationState,
    panState,
    canvasTransform,
    setCanvasTransform
  ])

  // Gestionnaire de mouseup
  const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    // ✨ ARRÊTER LE PAN
    if (panState.isPanning) {
      setPanState({
        isPanning: false,
        startX: 0,
        startY: 0,
        startTransformX: 0,
        startTransformY: 0
      })
      return
    }

    const { x, y } = getCanvasCoordinates(event)

    // Finaliser la création
    if (creationState.isCreating && creationState.elementType === 'panel') {
      const width = Math.abs(creationState.currentX - creationState.startX)
      const height = Math.abs(creationState.currentY - creationState.startY)
      const x = Math.min(creationState.startX, creationState.currentX)
      const y = Math.min(creationState.startY, creationState.currentY)

      // Si le mouvement est très petit (< 10px), c'est un clic simple -> créer un panel optimal
      if (width < 10 && height < 10) {
        const newPanel = createOptimalPanel(creationState.startX, creationState.startY)

        // Vérifier la collision pour le panel optimal
        const hasCollision = detectPanelCollision(newPanel.x, newPanel.y, newPanel.width, newPanel.height)

        if (!hasCollision) {
          // ✅ SYNCHRONISATION COMPLÈTE : Ajouter au state local, CanvasContext ET StateManager
          setElements(prev => [...prev, newPanel])
          setSelectedElementId(newPanel.id)
          setActiveTool('select')

          // Synchroniser avec CanvasContext pour SettingsPanel
          try {
            const assemblyElement = convertToAssemblyElement(newPanel)
            addElementToCanvas(assemblyElement)
            console.log('✅ Panel synchronisé avec CanvasContext:', newPanel.id)

            // ✅ CRITIQUE : Ajouter aussi au StateManager pour l'isolation des pages
            addElementToStateManager(assemblyElement)
            console.log('✅ Panel synchronisé avec StateManager:', newPanel.id)
          } catch (error) {
            console.error('❌ Erreur de synchronisation:', error)
          }

          // ✅ NOUVEAU : Synchroniser avec le système de sélection global (comme les textes/bulles)
          // Déclencher onElementClick pour synchroniser avec PolotnoAssemblyApp et useAssemblyStore
          setTimeout(() => {
            const virtualElement = {
              id: newPanel.id,
              type: 'panel',
              x: newPanel.x,
              y: newPanel.y,
              width: newPanel.width,
              height: newPanel.height
            }

            onElementClick?.(virtualElement)
            console.log('🎯 SimpleCanvasEditor: Sélection automatique panel synchronisée avec le système global:', newPanel.id)
          }, 50) // Petit délai pour que l'élément soit ajouté au contexte
        } else {
          // Afficher un message d'erreur temporaire
          setCollisionError('Impossible de créer un panel sur un panel existant')
          setTimeout(() => setCollisionError(null), 3000)
        }
      }
      // Sinon, c'est un drag -> créer un panel avec la taille définie
      else if (width > 10 && height > 10) {
        // Vérifier la collision avant de créer
        const hasCollision = detectPanelCollision(x, y, width, height)

        if (!hasCollision) {
          const newPanel: CanvasElement = {
            id: `panel-${Date.now()}`,
            type: 'panel',
            x,
            y,
            width,
            height,
            style: {
              backgroundColor: '#1a1a1a', // Fond noir par défaut pour les panels vides
              borderColor: '#000000',
              borderWidth: 2,
              borderRadius: 0
            }
          }

          // ✅ SYNCHRONISATION COMPLÈTE : Ajouter au state local, CanvasContext ET StateManager
          setElements(prev => [...prev, newPanel])
          setSelectedElementId(newPanel.id)
          setActiveTool('select')

          // Synchroniser avec CanvasContext pour SettingsPanel
          try {
            const assemblyElement = convertToAssemblyElement(newPanel)
            addElementToCanvas(assemblyElement)
            console.log('✅ Panel synchronisé avec CanvasContext:', newPanel.id)

            // ✅ CRITIQUE : Ajouter aussi au StateManager pour l'isolation des pages
            addElementToStateManager(assemblyElement)
            console.log('✅ Panel synchronisé avec StateManager:', newPanel.id)
          } catch (error) {
            console.error('❌ Erreur de synchronisation:', error)
          }

          // ✅ NOUVEAU : Synchroniser avec le système de sélection global (comme les textes/bulles)
          // Déclencher onElementClick pour synchroniser avec PolotnoAssemblyApp et useAssemblyStore
          setTimeout(() => {
            const virtualElement = {
              id: newPanel.id,
              type: 'panel',
              x: newPanel.x,
              y: newPanel.y,
              width: newPanel.width,
              height: newPanel.height
            }

            onElementClick?.(virtualElement)
            console.log('🎯 SimpleCanvasEditor: Sélection automatique panel synchronisée avec le système global:', newPanel.id)
          }, 50) // Petit délai pour que l'élément soit ajouté au contexte
        } else {
          // Afficher un message d'erreur temporaire
          setCollisionError('Impossible de créer un panel sur un panel existant')
          setTimeout(() => setCollisionError(null), 3000)
        }
      }

      setCreationState({
        isCreating: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        elementType: null
      })
    }

    // ✅ CRITIQUE : Synchroniser les manipulations avec CanvasContext/StateManager
    if ((manipulationState.isDragging || manipulationState.isResizing) && manipulationState.draggedElementId) {
      const manipulatedElement = elements.find(el => el.id === manipulationState.draggedElementId)
      if (manipulatedElement) {
        console.log('💾 Synchronisation manipulation:', manipulationState.draggedElementId, {
          isDragging: manipulationState.isDragging,
          isResizing: manipulationState.isResizing,
          newPosition: { x: manipulatedElement.x, y: manipulatedElement.y },
          newSize: { width: manipulatedElement.width, height: manipulatedElement.height }
        })

        try {
          // Convertir en AssemblyElement et synchroniser
          const assemblyElement = convertToAssemblyElement(manipulatedElement)
          updateElement(manipulationState.draggedElementId, assemblyElement)
          console.log('✅ Manipulation synchronisée avec CanvasContext/StateManager:', manipulationState.draggedElementId)
        } catch (error) {
          console.error('❌ Erreur de synchronisation manipulation:', error)
        }
      }
    }

    // Arrêter la manipulation
    setManipulationState({
      isDragging: false,
      isResizing: false,
      draggedElementId: null,
      resizeHandle: null,
      startMouseX: 0,
      startMouseY: 0,
      startElementX: 0,
      startElementY: 0,
      startElementWidth: 0,
      startElementHeight: 0
    })
  }, [getCanvasCoordinates, creationState, setActiveTool, createOptimalPanel, detectPanelCollision, setCollisionError, panState, setPanState, convertToAssemblyElement, addElementToCanvas, manipulationState, elements, updateElement])

  // Gestionnaire de double-clic
  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(event)

    const clickedElement = findElementAtPosition(x, y)
    if (clickedElement && clickedElement.type === 'bubble') {
      // ✅ SYSTÈME UNIFIÉ : Le double-clic sera géré par KonvaSpeechBubbleUnified
      onBubbleDoubleClick?.(clickedElement, { x, y })
    }
  }, [getCanvasCoordinates, findElementAtPosition, onBubbleDoubleClick])

  // Gestionnaire de clic droit
  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const { x, y } = getCanvasCoordinates(event)

    // Vérifier si on clique sur une bulle
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (element.type === 'bubble' &&
          x >= element.x && x <= element.x + element.width &&
          y >= element.y && y <= element.y + element.height) {
        onBubbleRightClick?.(element, { x, y })
        break
      }
    }
  }, [getCanvasCoordinates, elements, onBubbleRightClick])

  // Gestionnaires de drag-and-drop d'images
  const handleDragOver = useCallback((event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // Trouver le panel sous le curseur
    const panel = findPanelAtPosition(x, y)
    setIsDragOverPanel(panel?.id || null)
  }, [findPanelAtPosition])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLCanvasElement>) => {
    // Vérifier si on quitte vraiment le canvas
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOverPanel(null)
    }
  }, [])

  const handleDrop = useCallback((event: React.DragEvent<HTMLCanvasElement>) => {
    event.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (event.clientX - rect.left) * scaleX
    const y = (event.clientY - rect.top) * scaleY

    // Trouver le panel sous le curseur
    const panel = findPanelAtPosition(x, y)

    if (panel) {
      // Récupérer les données d'image depuis le dataTransfer
      let imageUrl = null

      // Essayer d'abord le format JSON (depuis la galerie)
      try {
        const jsonData = event.dataTransfer.getData('application/json')
        if (jsonData) {
          const dragData = JSON.parse(jsonData)
          if (dragData.type === 'image' && dragData.imageUrl) {
            imageUrl = dragData.imageUrl
            console.log('🎯 Image reçue depuis galerie:', dragData.metadata?.name, 'URL:', imageUrl)
          }
        }
      } catch (e) {
        console.log('Pas de données JSON valides')
      }

      // Fallback vers les formats standards
      if (!imageUrl) {
        imageUrl = event.dataTransfer.getData('text/uri-list') ||
                  event.dataTransfer.getData('text/plain')
      }

      if (imageUrl) {
        console.log('🎯 Ajout de l\'image au panel:', panel.id, 'URL:', imageUrl)
        addImageToPanel(panel.id, imageUrl)
      } else {
        // Gérer les fichiers uploadés
        const files = Array.from(event.dataTransfer.files)
        const imageFile = files.find(file => file.type.startsWith('image/'))

        if (imageFile) {
          console.log('🎯 Fichier image uploadé:', imageFile.name)
          const reader = new FileReader()
          reader.onload = (e) => {
            if (e.target?.result) {
              addImageToPanel(panel.id, e.target.result as string)
            }
          }
          reader.readAsDataURL(imageFile)
        } else {
          console.log('❌ Aucune image trouvée dans le drop')
        }
      }
    }

    setIsDragOverPanel(null)
  }, [findPanelAtPosition, addImageToPanel])

  // ✅ NOUVEAU : Écouter les événements de désélection forcée depuis l'outil main
  useEffect(() => {
    const handleForceDeselectAll = (event: CustomEvent) => {
      console.log('🖐️ SimpleCanvasEditor: Désélection forcée reçue:', event.detail)

      // ✅ CORRECTION : Désélectionner seulement les panels (les éléments TipTap gèrent leur propre désélection)
      setSelectedElementId(null)
      setResizeHandles([]) // Handles seulement pour les panels maintenant

      // Réinitialiser les états de manipulation
      setManipulationState({
        isDragging: false,
        isResizing: false,
        draggedElementId: null,
        resizeHandle: null,
        startMouseX: 0,
        startMouseY: 0,
        startElementX: 0,
        startElementY: 0,
        startElementWidth: 0,
        startElementHeight: 0
      })

      // Réinitialiser les états de création
      setCreationState({
        isCreating: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        elementType: null
      })

      console.log('✅ SimpleCanvasEditor: Désélection forcée appliquée')
    }

    window.addEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)

    return () => {
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
    }
  }, [])

  // Gestionnaire de touches clavier
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Delete' && selectedElementId) {
      setElements(prev => prev.filter(el => el.id !== selectedElementId))
      setSelectedElementId(null)

      // ✅ NOUVEAU : Émettre événement de désélection globale après suppression
      const globalDeselectEvent = new CustomEvent('globalDeselect', {
        detail: { source: 'delete-key' }
      })
      window.dispatchEvent(globalDeselectEvent)
    } else if (event.key === 'Escape') {
      if (creationState.isCreating) {
        setCreationState({
          isCreating: false,
          startX: 0,
          startY: 0,
          currentX: 0,
          currentY: 0,
          elementType: null
        })
      }
      if (bubbleCreationMode) {
        cancelBubbleCreation()
      }
      setSelectedElementId(null)

      // ✅ NOUVEAU : Émettre événement de désélection globale pour ESC
      const globalDeselectEvent = new CustomEvent('globalDeselect', {
        detail: { source: 'escape-key' }
      })
      window.dispatchEvent(globalDeselectEvent)
    }
  }, [selectedElementId, creationState, bubbleCreationMode, cancelBubbleCreation])

  // Ajouter/supprimer les gestionnaires d'événements clavier
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ✅ NETTOYAGE TERMINÉ : Plus besoin d'éditeurs externes

  return (
    <div className={`w-full h-full canvas-interface no-scrollbar ${className}`}>
      <div className="w-full h-full flex flex-col no-scrollbar">
        <div className="flex-1 overflow-hidden relative no-scrollbar">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onWheel={handleWheel}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border border-gray-300"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasScale})`,
              transformOrigin: 'center',
              transition: panState.isPanning ? 'none' : 'transform 0.2s ease'
            }}
          />
          
          {/* Overlay pour le mode création de bulle */}
          {bubbleCreationMode && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 pointer-events-auto">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  <span className="font-medium">
                    Cliquez pour placer votre bulle {bubbleTypeToCreate}
                  </span>
                  <button
                    onClick={cancelBubbleCreation}
                    className="ml-4 text-white/80 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Message d'erreur de collision */}
          {collisionError && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="font-medium">{collisionError}</span>
              </div>
            </div>
          )}

          {/* Informations de debug en mode développement */}
          {process.env.NODE_ENV === 'development' && (
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs space-y-1">
              <div>Éléments: {elements.length}</div>
              <div>Sélectionné: {selectedElementId || 'Aucun'}</div>
              <div>Outil: {activeTool}</div>
              <div>Création: {creationState.isCreating ? 'Oui' : 'Non'}</div>
              <div>Drag: {manipulationState.isDragging ? 'Oui' : 'Non'}</div>
              <div>Resize: {manipulationState.isResizing ? 'Oui' : 'Non'}</div>
              <div>Handles: {resizeHandles.length}</div>
              {manipulationState.resizeHandle && (
                <div>Handle actif: {manipulationState.resizeHandle.position}</div>
              )}
              <div className="text-xs text-gray-300 mt-2">
                Panel: Clic = optimal, Drag = custom
              </div>
            </div>
          )}

          {/* ✅ CORRIGÉ : DOM Selection Overlay pour les bulles TipTap (SEULEMENT en mode manipulating) */}
          {bubbleMode === 'manipulating' && (
            <BubbleSelectionOverlay
              selectedBubbleId={isSelectedElementBubble() ? selectedElementId : null}
              onDragStart={handleBubbleDragStart}
              onDrag={handleBubbleDrag}
              onDragEnd={handleBubbleDragEnd}
              onResizeStart={handleBubbleResizeStart}
              onResize={handleBubbleResize}
              onResizeEnd={handleBubbleResizeEnd}
              onDoubleClick={handleBubbleDoubleClick}
            />
          )}

          {/* ✅ CORRIGÉ : DOM Selection Overlay pour les textes libres TipTap (SEULEMENT en mode manipulating) */}
          {textMode === 'manipulating' && (
            <TextSelectionOverlay
              selectedTextId={isSelectedElementText() ? selectedElementId : null}
              onDragStart={handleTextDragStart}
              onDrag={handleTextDrag}
              onDragEnd={handleTextDragEnd}
              onResizeStart={handleTextResizeStart}
              onResize={handleTextResize}
              onResizeEnd={handleTextResizeEnd}
              onDoubleClick={handleTextDoubleClick}
            />
          )}
        </div>
      </div>
    </div>
  )
}

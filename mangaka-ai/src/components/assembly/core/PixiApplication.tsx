'use client'

import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react'
import { Application, Container, Graphics, FederatedPointerEvent, Text, TextStyle, Sprite } from 'pixi.js'
import { useCanvasContext, generateElementId } from '../context/CanvasContext'
import { AssemblyElement, PanelElement, DialogueElement, TextElement, SpriteElement, ImageElement } from '../types/assembly.types'
import { BubbleManipulationManager, HandleType } from './BubbleManipulationManager'
import { PanelTool } from '../tools/PanelTool'
import { BubbleTool } from '../tools/BubbleTool'
import { SelectTool } from '../tools/SelectTool'
import { NativeTextEditor } from './NativeTextEditor'
import { applyCenteringUniversal, createOptimalTextStyle } from '../utils/TextCenteringUtils'
// import { panelMaskingService } from '../services/PanelMaskingService'
// import { useDragDrop } from '../hooks/useDragDrop'

// Configuration par défaut pour compatibilité
const DEFAULT_PIXI_CONFIG = {
  width: 1200,
  height: 1600,
  backgroundColor: 0xF8F8F8,
  resolution: 1,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
}

interface PixiApplicationProps {
  width?: number
  height?: number
  className?: string
  onElementClick?: (element: AssemblyElement | null) => void
  onCanvasClick?: (x: number, y: number) => void
  onBubbleDoubleClick?: (element: DialogueElement, position: { x: number, y: number }) => void
  onBubbleRightClick?: (element: DialogueElement, position: { x: number, y: number }) => void
  canvasTransform?: {
    x: number
    y: number
    scale: number
  }
}

export default function PixiApplication({
  width = DEFAULT_PIXI_CONFIG.width,
  height = DEFAULT_PIXI_CONFIG.height,
  className = '',
  onElementClick,
  onCanvasClick,
  onBubbleDoubleClick,
  onBubbleRightClick,
  canvasTransform = { x: 0, y: 0, scale: 1 }
}: PixiApplicationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const appRef = useRef<Application | null>(null)
  const stageContainerRef = useRef<Container | null>(null)
  const gridGraphicsRef = useRef<Graphics | null>(null)
  const selectionContainerRef = useRef<Container | null>(null)

  // Utiliser le nouveau contexte React optimisé
  const canvas = useCanvasContext()

  // Extraire les valeurs du contexte pour faciliter l'utilisation
  const {
    pixiApp,
    initializePixiApp,
    elements,
    selectedElementIds,
    activeTool,
    setActiveTool,
    showGrid,
    gridSize,
    zoom,
    layers,
    addElement,
    selectElement,
    updateElement,
    clearSelection,
    panelContentService,
    toggleBubbleTypeModal,
    setBubbleCreationPosition,
    setBubbleTypeAndCreate,
    startBubblePlacement,
    placeBubbleAtPosition,
    cancelBubblePlacement
  } = canvas

  // Monitoring optimisé pour le développement
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 PixiApplication render - activeTool:', activeTool)
  }

  // 🔧 CORRECTION : Calculer selectedElements à partir de selectedElementIds et elements
  const selectedElements = useMemo(() => {
    const result = selectedElementIds
      .map(id => elements.find(el => el.id === id))
      .filter(Boolean) as AssemblyElement[]

    console.log('🔍 selectedElements recalculé:', {
      selectedElementIds,
      elementsCount: elements.length,
      selectedElementsCount: result.length,
      selectedElements: result.map(el => el.id)
    })

    return result
  }, [selectedElementIds, elements])

  // État pour les outils
  const [panelTool] = useState(() => new PanelTool()) // Pas de callback automatique

  // Mettre à jour les éléments dans le PanelTool pour la détection de collision
  useEffect(() => {
    panelTool.updateElements(elements)
  }, [elements, panelTool])
  const [bubbleTool] = useState(() => new BubbleTool((bubble) => addElement(bubble)))
  const [selectTool] = useState(() => new SelectTool(
    (elementId) => {
      console.log('🎯 PixiApp onElementSelect callback appelé:', { elementId })
      if (elementId) {
        console.log('🎯 PixiApp: Sélection d\'élément via SelectTool:', elementId)
        selectElement(elementId)
      } else {
        // 🎯 DÉSÉLECTION FORCÉE - Toujours respecter la volonté de l'utilisateur
        console.log('🧹 PixiApp: Désélection FORCÉE via SelectTool')
        clearSelection()
        // Forcer la mise à jour du rendu de sélection immédiatement
        renderSelection()
      }
    },
    (elementId, updates) => updateElement(elementId, updates),
    panelContentService // Passer le service d'associations panel-image
  ))
  const [isCreating, setIsCreating] = useState(false)



  // Mettre à jour la référence du stage dans le SelectTool quand le stageContainer change
  useEffect(() => {
    if (stageContainerRef.current) {
      selectTool.setStageContainer(stageContainerRef.current)
      console.log('✅ SelectTool: stageContainer référence mise à jour')
    }
  }, [selectTool, stageContainerRef.current])

  // Configurer la référence du canvas pour SelectTool (pour changer le curseur)
  useEffect(() => {
    if (canvasRef.current) {
      selectTool.setCanvasElement(canvasRef.current)
      console.log('✅ SelectTool: canvas référence mise à jour')
    }
  }, [selectTool, canvasRef.current])

  // 🎯 SYSTÈME DE SÉLECTION AUTOMATIQUE SUPPRIMÉ
  // La sélection automatique est maintenant gérée directement dans handlePanelTool
  // Cela évite tous les problèmes de timing et de réactivité

  // Nettoyer la sélection lors du changement d'outil (sauf quand on revient en mode select)
  useEffect(() => {
    if (activeTool !== 'select') {
      console.log('🧹 Changement d\'outil détecté, nettoyage de la sélection')
      selectTool.clearSelection()
    }
    // Note: Quand on revient en mode 'select', on ne nettoie PAS la sélection
    // car cela peut être dû à la création d'un élément qui doit rester sélectionné
  }, [activeTool, selectTool])

  // Gestion de la touche Escape pour désélectionner
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && activeTool === 'select') {
        console.log('🧹 Touche Escape pressée, nettoyage de la sélection')
        selectTool.clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, selectTool])

  // Initialiser l'application PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const initPixiApp = async () => {
      try {
        // Créer l'application PixiJS
        const app = new Application()

        await app.init({
          canvas: canvasRef.current!,
          width,
          height,
          backgroundColor: DEFAULT_PIXI_CONFIG.backgroundColor,
          resolution: DEFAULT_PIXI_CONFIG.resolution,
          antialias: DEFAULT_PIXI_CONFIG.antialias,
          powerPreference: DEFAULT_PIXI_CONFIG.powerPreference as any,
          preserveDrawingBuffer: DEFAULT_PIXI_CONFIG.preserveDrawingBuffer
        })

        appRef.current = app
        initializePixiApp(app)

        // Créer les conteneurs de couches
        setupLayerContainers(app)

        // Sauvegarder la référence AVANT de configurer les événements
        appRef.current = app

        // Configurer les événements
        setupEventHandlers(app)

        // Configurer l'animation des handles de sélection
        const cleanupAnimation = setupSelectionAnimation(app)

        console.log('✅ PixiJS Application initialisée avec succès')
        console.log('🎯 Stage interactif:', app.stage.eventMode)
        console.log('🎯 Hit area:', app.stage.hitArea)
        console.log('🎯 App ref:', !!appRef.current)

        // Retourner la fonction de nettoyage pour le démontage
        return () => {
          cleanupAnimation()
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de PixiJS:', error)
      }
    }

    initPixiApp()

    // Cleanup
    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: true })
        appRef.current = null
      }
    }
  }, [width, height, initializePixiApp])



  // Configurer les conteneurs de couches
  const setupLayerContainers = useCallback((app: Application) => {
    // Créer le conteneur principal du stage
    const stageContainer = new Container()
    stageContainer.label = 'stageContainer'
    stageContainer.sortableChildren = true
    app.stage.addChild(stageContainer)
    stageContainerRef.current = stageContainer

    // Créer les conteneurs pour chaque couche
    const layerOrder = ['background', 'characters', 'panels', 'dialogue', 'ui']
    layerOrder.forEach((layerName, index) => {
      const layerContainer = new Container()
      layerContainer.label = `${layerName}Layer`
      layerContainer.zIndex = index * 10
      stageContainer.addChild(layerContainer)
    })

    // Créer la grille
    const gridGraphics = new Graphics()
    gridGraphics.label = 'grid'
    gridGraphics.zIndex = -1
    stageContainer.addChild(gridGraphics)
    gridGraphicsRef.current = gridGraphics

    // Créer le conteneur de sélection (au-dessus de tout)
    const selectionContainer = new Container()
    selectionContainer.label = 'selection'
    selectionContainer.zIndex = 1000
    stageContainer.addChild(selectionContainer)
    selectionContainerRef.current = selectionContainer

    // Dessiner la grille initiale
    drawGrid(gridGraphics)
  }, [])

  // Références pour accéder aux valeurs actuelles depuis les event listeners
  const activeToolRef = useRef(activeTool)
  const elementsRef = useRef(elements)
  const selectedElementIdsRef = useRef(selectedElementIds)

  // ✅ Référence pour stocker la position de création de bulle
  const bubbleCreationPositionRef = useRef<{ x: number, y: number } | null>(null)

  activeToolRef.current = activeTool
  elementsRef.current = elements
  selectedElementIdsRef.current = selectedElementIds

  /**
   * Ajuste les coordonnées pour tenir compte des transformations CSS du canvas
   */
  const adjustCoordinatesForCanvasTransform = useCallback((x: number, y: number) => {
    // Les transformations CSS sont appliquées dans CanvasArea.tsx :
    // transform: translate(x, y) scale(scale)
    //
    // Les coordonnées d'événements PixiJS sont déjà en coordonnées locales du stage,
    // mais elles ne tiennent pas compte du zoom CSS appliqué au conteneur.
    //
    // Nous devons ajuster ces coordonnées pour compenser le zoom CSS.

    console.log('🔄 Conversion coordonnées:', {
      input: { x, y },
      canvasTransform,
      cssScale: canvasTransform.scale
    })

    // Ajuster pour le zoom CSS uniquement (translate est géré par PixiJS)
    const adjustedX = x / canvasTransform.scale
    const adjustedY = y / canvasTransform.scale

    console.log('🔄 Coordonnées ajustées:', {
      original: { x, y },
      adjusted: { x: adjustedX, y: adjustedY },
      scaleFactor: canvasTransform.scale
    })

    return { x: adjustedX, y: adjustedY }
  }, [canvasTransform])

  // Refs pour éviter les stale closures
  const bubblePlacementModeRef = useRef(canvas.ui.bubblePlacementMode)
  const bubbleTypeToPlaceRef = useRef(canvas.ui.bubbleTypeToPlace)

  // Mettre à jour les refs quand l'état change
  useEffect(() => {
    bubblePlacementModeRef.current = canvas.ui.bubblePlacementMode
    bubbleTypeToPlaceRef.current = canvas.ui.bubbleTypeToPlace
  }, [canvas.ui.bubblePlacementMode, canvas.ui.bubbleTypeToPlace])

  // Gestionnaire unifié des interactions selon l'outil actif
  const handleCanvasInteraction = useCallback((x: number, y: number, type: 'down' | 'move' | 'up') => {
    // Lire l'outil actuel depuis la ref pour éviter les stale closures
    const currentTool = activeToolRef.current
    console.log('🎯 handleCanvasInteraction - Outil actuel:', currentTool, 'Type:', type)

    const app = appRef.current
    if (!app) {
      console.log('❌ Pas d\'app PixiJS')
      return
    }

    // ✅ PRIORITÉ : Mode placement de bulle - utiliser les refs pour éviter stale closure
    const currentBubblePlacementMode = bubblePlacementModeRef.current
    const currentBubbleTypeToPlace = bubbleTypeToPlaceRef.current

    console.log('🔍 Vérification mode placement:', {
      bubblePlacementMode: currentBubblePlacementMode,
      bubbleTypeToPlace: currentBubbleTypeToPlace,
      type: type,
      shouldPlace: currentBubblePlacementMode && currentBubbleTypeToPlace && type === 'down'
    })

    if (currentBubblePlacementMode && currentBubbleTypeToPlace && type === 'down') {
      console.log('💬 Mode placement bulle actif - placement direct')
      placeBubbleAtPosition(x, y, currentBubbleTypeToPlace)
      return
    }

    switch (currentTool) {
      case 'panel':
        console.log('🔧 Utilisation outil Panel')
        handlePanelTool(x, y, type, app)
        break
      case 'dialogue':
        console.log('💬 Utilisation outil Bulle')
        handleBubbleTool(x, y, type, app)
        break
      case 'select':
      default:
        console.log('👆 Outil de sélection')
        handleSelectTool(x, y, type)
        if (type === 'down') {
          onCanvasClick?.(x, y)
        }
        break
    }
  }, [onCanvasClick, placeBubbleAtPosition])

  // Gestionnaire pour la mise à jour du curseur (survol)
  const handleCursorUpdate = useCallback((x: number, y: number) => {
    const currentTool = activeToolRef.current

    // Seulement pour l'outil de sélection
    if (currentTool === 'select') {
      const currentElements = elementsRef.current
      selectTool.handlePointerMove(x, y, currentElements)
    }
  }, [selectTool])

  // Configuration de l'animation des handles de sélection
  const setupSelectionAnimation = useCallback((app: Application) => {
    console.log('🎨 Configuration de l\'animation des handles de sélection')

    // Ticker pour animer les handles de sélection
    const animateSelection = () => {
      if (selectionContainerRef.current && selectedElements.length > 0) {
        const time = Date.now() * 0.003

        selectionContainerRef.current.children.forEach((selectionContainer: any) => {
          if (selectionContainer.label?.startsWith('selection-')) {
            // Animer chaque handle dans ce conteneur de sélection
            selectionContainer.children.forEach((child: any) => {
              if (child.label?.startsWith('handle-')) {
                const handleIndex = parseInt(child.label.split('-')[1])
                const animationOffset = handleIndex * 0.2
                const pulseScale = 1 + Math.sin(time + animationOffset) * 0.03
                child.scale.set(pulseScale)
              }
            })
          }
        })
      }
    }

    // Ajouter le ticker d'animation
    app.ticker.add(animateSelection)

    // Retourner la fonction de nettoyage
    return () => {
      app.ticker.remove(animateSelection)
    }
  }, [selectedElements])

  // Variables pour optimiser les événements de souris
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const isPointerDownRef = useRef(false)

  // ✅ GESTIONNAIRE DE MOUVEMENT POUR MANIPULATION DES BULLES
  const handleGlobalPointerMove = useCallback((globalX: number, globalY: number) => {
    if (bubbleManipulationManagerRef.current?.isManipulating()) {
      bubbleManipulationManagerRef.current.updateManipulation(globalX, globalY)
    }
  }, [])

  // ✅ GESTIONNAIRE DE FIN DE MANIPULATION
  const handleGlobalPointerUp = useCallback(() => {
    if (bubbleManipulationManagerRef.current?.isManipulating()) {
      bubbleManipulationManagerRef.current.endManipulation()
    }
  }, [])

  // Configurer les gestionnaires d'événements
  const setupEventHandlers = useCallback((app: Application) => {
    console.log('🔧 Configuration des gestionnaires d\'événements')
    const stage = app.stage

    // Nettoyer les anciens event listeners
    stage.removeAllListeners()

    // Rendre le stage interactif
    stage.eventMode = 'static'
    stage.hitArea = app.screen

    // Gestionnaire de clic sur le canvas
    stage.on('pointerdown', (event: FederatedPointerEvent) => {
      const globalPos = event.global
      const localPos = stage.toLocal(globalPos)

      // Ajuster les coordonnées pour les transformations CSS
      const adjustedPos = adjustCoordinatesForCanvasTransform(localPos.x, localPos.y)

      // Marquer que le pointeur est enfoncé
      isPointerDownRef.current = true
      lastMousePosRef.current = { x: adjustedPos.x, y: adjustedPos.y }

      console.log('👇 PointerDown DÉTAILLÉ:', {
        globalPos: { x: globalPos.x, y: globalPos.y },
        localPos: { x: localPos.x, y: localPos.y },
        adjustedPos,
        canvasTransform,
        stageScale: stageContainerRef.current?.scale || 'N/A'
      })

      handleCanvasInteraction(adjustedPos.x, adjustedPos.y, 'down')
    })

    stage.on('pointermove', (event: FederatedPointerEvent) => {
      const globalPos = event.global
      const localPos = stage.toLocal(globalPos)
      const adjustedPos = adjustCoordinatesForCanvasTransform(localPos.x, localPos.y)

      // ✅ PRIORITÉ : Gestion du redimensionnement et déplacement de queue
      handleGlobalPointerMove(globalPos.x, globalPos.y)

      // Vérifier si la position a vraiment changé (éviter les micro-mouvements)
      const deltaX = Math.abs(adjustedPos.x - lastMousePosRef.current.x)
      const deltaY = Math.abs(adjustedPos.y - lastMousePosRef.current.y)
      const hasMovedSignificantly = deltaX > 2 || deltaY > 2

      // Traiter le mouvement si on a vraiment bougé
      if (hasMovedSignificantly) {
        lastMousePosRef.current = { x: adjustedPos.x, y: adjustedPos.y }

        // Si le pointeur est enfoncé, traiter comme une action de drag/resize
        if (isPointerDownRef.current) {
          handleCanvasInteraction(adjustedPos.x, adjustedPos.y, 'move')
        } else {
          // Sinon, traiter seulement pour le curseur (survol)
          handleCursorUpdate(adjustedPos.x, adjustedPos.y)
        }
      }
    })

    stage.on('pointerup', (event: FederatedPointerEvent) => {
      const globalPos = event.global
      const localPos = stage.toLocal(globalPos)

      // ✅ PRIORITÉ : Terminer le redimensionnement et déplacement de queue
      handleGlobalPointerUp()

      // Ajuster les coordonnées pour les transformations CSS
      const adjustedPos = adjustCoordinatesForCanvasTransform(localPos.x, localPos.y)

      // Marquer que le pointeur n'est plus enfoncé
      isPointerDownRef.current = false

      console.log('👆 PointerUp DÉTAILLÉ:', {
        globalPos: { x: globalPos.x, y: globalPos.y },
        localPos: { x: localPos.x, y: localPos.y },
        adjustedPos,
        canvasTransform
      })

      handleCanvasInteraction(adjustedPos.x, adjustedPos.y, 'up')
    })

    // Gestionnaire pour la sortie du curseur du canvas
    stage.on('pointerleave', () => {
      console.log('🚪 Curseur sorti du canvas')
      // Marquer que le pointeur n'est plus enfoncé
      isPointerDownRef.current = false

      // Réinitialiser le curseur pour l'outil de sélection
      const currentTool = activeToolRef.current
      if (currentTool === 'select') {
        selectTool.handlePointerLeave()
      }
    })
  }, [handleCanvasInteraction, handleCursorUpdate, selectTool, handleGlobalPointerMove, handleGlobalPointerUp])

  // Gestionnaire pour l'outil Panel
  const handlePanelTool = useCallback((x: number, y: number, type: 'down' | 'move' | 'up', app: Application) => {
    console.log('🔧 Panel tool:', { x, y, type, isCreating, panelToolActive: panelTool.isActive })

    switch (type) {
      case 'down':
        console.log('🔧 Panel: Début création')
        setIsCreating(true)
        panelTool.startCreation(x, y, app.stage)
        console.log('🔧 Panel: Après startCreation, isActive =', panelTool.isActive)
        break
      case 'move':
        // Vérifier si l'outil est en cours de création directement
        if (panelTool.isActive) {
          console.log('🔧 Panel: Mise à jour création')
          panelTool.updateCreation(x, y)
        } else {
          console.log('🔧 Panel: Move ignoré, pas actif')
        }
        break
      case 'up':
        // Vérifier si l'outil est en cours de création directement
        if (panelTool.isActive) {
          console.log('🔧 Panel: Fin création')
          const panel = panelTool.finishCreation(app.stage)
          setIsCreating(false)
          if (panel) {
            console.log('✅ Panel créé:', panel)
            // Ajouter le panel au contexte d'abord
            addElement(panel)

            // 🎯 SÉLECTION AUTOMATIQUE DIRECTE - Pas de useEffect, pas de réactivité
            console.log('🎯 Sélection automatique directe du panel:', panel.id)

            // Revenir en mode sélection ET sélectionner immédiatement
            setActiveTool('select')
            selectElement(panel.id)
            console.log('✅ Panel sélectionné automatiquement:', panel.id)
          }
        } else {
          console.log('🔧 Panel: Up ignoré, pas actif')
        }
        break
    }
  }, [panelTool, isCreating])

  // ✅ WORKFLOW MANGAKA : Création instantanée sans interruption
  const handleBubbleTool = useCallback((x: number, y: number, type: 'down' | 'move' | 'up', app: Application) => {
    console.log('🎨 MANGAKA WORKFLOW - Bubble tool:', { x, y, type })

    if (type === 'down') {
      console.log('🎨 MANGAKA: Création bulle instantanée - PAS DE MODAL !')

      // ✅ CRÉATION IMMÉDIATE - Le mangaka ne doit jamais être interrompu !
      const bubble: AssemblyElement = {
        id: generateElementId(),
        type: 'dialogue',
        layerType: 'dialogue',
        text: '', // ✅ Texte vide pour édition immédiate
        transform: {
          x,
          y,
          rotation: 0,
          alpha: 1,
          zIndex: 200,
          width: 120, // ✅ Taille par défaut optimale pour manga
          height: 60
        },
        bubbleStyle: {
          type: 'speech', // ✅ Type par défaut - le plus utilisé en manga
          backgroundColor: 0xffffff,
          outlineColor: 0x000000,
          textColor: 0x000000,
          dashedOutline: false,
          tailPosition: 'bottom-left',
          fontSize: 14,
          fontFamily: 'Arial',
          textAlign: 'center',

          // ✅ Configuration optimisée pour mangaka
          tailPositionPercent: 0.2,  // Queue proche du bord pour pointer vers personnage
          tailOffset: 0,
          tailAngle: 90,
          borderWidth: 2,           // Bordure nette mais pas trop épaisse
          borderRadius: 8,          // Coins légèrement arrondis
          hasGradient: false,

          // ✅ NOUVELLES PROPRIÉTÉS 360° - INITIALISATION PAR DÉFAUT
          tailAbsoluteX: x + 30,    // Position initiale de la queue (30px à droite)
          tailAbsoluteY: y + 80,    // Position initiale de la queue (en bas)
          tailLength: 30,           // Longueur initiale de la queue
          tailAngleDegrees: 225,    // Angle initial (bas-gauche)
          tailAttachmentSide: 'bottom' as const
        },
        properties: {
          name: 'Dialogue',
          locked: false,
          visible: true,
          blendMode: 'normal'
        }
      }

      // ✅ Ajouter immédiatement et sélectionner pour édition
      addElement(bubble)
      selectElement(bubble.id)

      console.log('🎯 MANGAKA: Bulle créée et sélectionnée pour édition immédiate')
      // TODO: Activer l'édition de texte immédiatement (prochaine étape)
    }
  }, [addElement, selectElement])

  // ✅ GESTIONNAIRE AVANCÉ POUR L'OUTIL DE SÉLECTION
  const handleSelectTool = useCallback((x: number, y: number, type: 'down' | 'move' | 'up') => {
    const currentElements = elementsRef.current
    const currentSelectedIds = selectedElementIdsRef.current

    if (type === 'down') {
      // Vérifier si on clique sur une bulle pour double-clic
      const clickedElement = currentElements.find(el => {
        const bounds = {
          left: el.transform.x,
          top: el.transform.y,
          right: el.transform.x + el.transform.width,
          bottom: el.transform.y + el.transform.height
        }
        return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom
      })

      // ✅ GESTION DOUBLE-CLIC POUR ÉDITION
      if (clickedElement && clickedElement.type === 'dialogue') {
        const now = Date.now()
        const lastClick = lastClickTimeRef.current
        const timeDiff = now - lastClick

        console.log('🔍 Clic sur bulle:', {
          elementId: clickedElement.id,
          timeDiff,
          lastClickedElement: lastClickedElementRef.current,
          isDoubleClick: timeDiff < 400 && lastClickedElementRef.current === clickedElement.id,
          startTextEditingRefExists: !!startTextEditingRef.current,
          editingElementId
        })

        if (timeDiff < 400 && lastClickedElementRef.current === clickedElement.id) {
          // Double-clic détecté !
          console.log('🎨 DOUBLE-CLIC détecté sur bulle:', clickedElement.id)

          // ✅ FORCER LA SÉLECTION DE L'ÉLÉMENT AVANT L'ÉDITION
          selectElement(clickedElement.id)

          // Déclencher l'édition de texte
          try {
            if (startTextEditingRef.current) {
              startTextEditingRef.current(clickedElement as DialogueElement)
              console.log('✅ Édition de texte démarrée avec succès')
            } else {
              console.error('❌ startTextEditingRef.current est null')
            }
          } catch (error) {
            console.error('❌ Erreur lors du démarrage de l\'édition:', error)
          }

          if (onBubbleDoubleClick) {
            onBubbleDoubleClick(clickedElement as DialogueElement, { x, y })
          }
          return
        }

        lastClickTimeRef.current = now
        lastClickedElementRef.current = clickedElement.id
      }
    }

    switch (type) {
      case 'down':
        selectTool.handlePointerDown(x, y, currentElements)
        break
      case 'move':
        selectTool.handlePointerMove(x, y, currentElements)
        break
      case 'up':
        selectTool.handlePointerUp()
        break
    }
  }, [selectTool, onBubbleDoubleClick])

  // ✅ REFS POUR GESTION DOUBLE-CLIC
  const lastClickTimeRef = useRef(0)
  const lastClickedElementRef = useRef<string | null>(null)

  // ✅ ÉTAT POUR L'ÉDITION DE TEXTE
  const [editingElementId, setEditingElementId] = useState<string | null>(null)

  // ✅ STOCKAGE DES CONTAINERS PIXI POUR INTÉGRATION
  const pixiContainersRef = useRef<Map<string, Container>>(new Map())

  // ✅ FONCTIONS D'ÉDITION DE TEXTE (DÉPLACÉES ICI POUR ÉVITER L'ERREUR D'INITIALISATION)
  const startTextEditingRef = useRef<((element: DialogueElement) => void) | null>(null)

  const startTextEditing = useCallback((element: DialogueElement) => {
    if (element.type !== 'dialogue') return

    // ✅ EMPÊCHER LES ÉDITEURS MULTIPLES
    if (editingElementId) {
      console.log('🚫 Édition déjà en cours pour:', editingElementId, '- Ignoré pour:', element.id)
      return
    }

    console.log('🔤 DÉBUT ÉDITION 100% NATIVE PIXI - Élément:', element.id, 'État:', {
      editingElementId,
      pixiContainersCount: pixiContainersRef.current.size,
      hasContainer: pixiContainersRef.current.has(element.id)
    })

    // ✅ SOLUTION 100% NATIVE : Aucun élément HTML
    const pixiContainer = pixiContainersRef.current.get(element.id)
    if (!pixiContainer) {
      console.error('❌ Container PixiJS non trouvé pour:', element.id, 'Containers disponibles:', Array.from(pixiContainersRef.current.keys()))
      return
    }

    const textElement = pixiContainer.getChildByName('bubbleText') as Text
    if (!textElement) {
      console.error('❌ Élément texte non trouvé dans le container:', element.id, 'Enfants disponibles:', pixiContainer.children.map(child => child.name || 'unnamed'))
      return
    }

    // ✅ MARQUER IMMÉDIATEMENT COMME EN ÉDITION
    setEditingElementId(element.id)

    // ✅ CRÉER UN ÉDITEUR DE TEXTE 100% NATIF PIXI
    const editor = new NativeTextEditor(element, textElement, (newText: string) => {
      updateElement(element.id, { text: newText })
      setEditingElementId(null)
    })

    // Ajouter l'éditeur au container
    pixiContainer.addChild(editor as any)

    // Cacher le texte original
    textElement.visible = false

    // Activer l'édition
    editor.startEditing()

    console.log('✅ Éditeur natif PixiJS créé et activé')
  }, [updateElement, editingElementId])

  // Assigner la référence
  startTextEditingRef.current = startTextEditing

  const handleTextChange = useCallback((newText: string) => {
    if (!editingElementId) return

    console.log('🔤 Texte modifié:', newText)

    // Mettre à jour immédiatement dans le contexte
    updateElement(editingElementId, { text: newText })
  }, [editingElementId, updateElement])

  const finishTextEditing = useCallback(() => {
    console.log('🔤 Fin édition texte')
    setEditingElementId(null)
  }, [])

  // ✅ FONCTION POUR CALCULER LA POSITION DE LA QUEUE
  const calculateTailPosition = useCallback((element: DialogueElement) => {
    const { width, height } = element.transform
    const tailPercent = element.bubbleStyle.tailPositionPercent || 0.25

    // Position selon tailPosition
    switch (element.bubbleStyle.tailPosition) {
      case 'bottom-left':
        return { x: element.transform.x + width * tailPercent, y: element.transform.y + height }
      case 'bottom-right':
        return { x: element.transform.x + width * (1 - tailPercent), y: element.transform.y + height }
      case 'top-left':
        return { x: element.transform.x + width * tailPercent, y: element.transform.y }
      case 'top-right':
        return { x: element.transform.x + width * (1 - tailPercent), y: element.transform.y }
      default:
        return { x: element.transform.x + width * tailPercent, y: element.transform.y + height }
    }
  }, [])

  // ✅ GESTIONNAIRE DE MANIPULATION DES BULLES
  const bubbleManipulationManagerRef = useRef<BubbleManipulationManager | null>(null)

  // Initialiser le gestionnaire si pas encore fait
  if (!bubbleManipulationManagerRef.current) {
    bubbleManipulationManagerRef.current = new BubbleManipulationManager((elementId: string, updates: Partial<AssemblyElement>) => {
      updateElement(elementId, updates)
    })
  }

  // ✅ DÉMARRER LA MANIPULATION D'UNE BULLE
  const startBubbleManipulation = useCallback((element: DialogueElement, handleType: HandleType, globalX: number, globalY: number) => {
    bubbleManipulationManagerRef.current?.startManipulation(element, handleType, globalX, globalY)
  }, [])





  // Dessiner la grille
  const drawGrid = useCallback((graphics: Graphics) => {
    if (!graphics) {
      console.warn('⚠️ Graphics object is null, skipping grid drawing')
      return
    }

    graphics.clear()

    if (!showGrid) return

    graphics.setStrokeStyle({ width: 1, color: 0x374151, alpha: 0.3 })

    // Lignes verticales
    for (let x = 0; x <= width; x += gridSize) {
      graphics.moveTo(x, 0)
      graphics.lineTo(x, height)
    }

    // Lignes horizontales
    for (let y = 0; y <= height; y += gridSize) {
      graphics.moveTo(0, y)
      graphics.lineTo(width, y)
    }
  }, [showGrid, gridSize, width, height])

  // Mettre à jour la grille quand les paramètres changent
  useEffect(() => {
    if (gridGraphicsRef.current) {
      drawGrid(gridGraphicsRef.current)
    } else {
      console.warn('⚠️ gridGraphicsRef.current is null, skipping grid update')
    }
  }, [showGrid, gridSize, drawGrid])

  // ⚠️ ZOOM DÉSACTIVÉ : Le zoom est géré par CSS dans CanvasArea.tsx
  // Supprimer le zoom PixiJS pour éviter les conflits de coordonnées
  // useEffect(() => {
  //   if (stageContainerRef.current) {
  //     const scale = zoom / 100
  //     stageContainerRef.current.scale.set(scale)
  //   }
  // }, [zoom])

  console.log('🔍 Zoom PixiJS désactivé, utilisation du zoom CSS uniquement')

  // Mettre à jour la visibilité des couches
  useEffect(() => {
    if (!stageContainerRef.current) return

    Object.entries(layers).forEach(([layerName, layerState]) => {
      const layerContainer = stageContainerRef.current!.getChildByName(`${layerName}Layer`) as Container
      if (layerContainer) {
        layerContainer.visible = layerState.visible
        layerContainer.alpha = layerState.opacity
      }
    })
  }, [layers])

  // Rendu des éléments
  useEffect(() => {
    if (!stageContainerRef.current) return

    console.log('🔄 useEffect rendu déclenché:', {
      elementsCount: elements.length,
      selectedElementIdsCount: selectedElementIds.length,
      selectedElementIds: selectedElementIds
    })

    // ⚠️ NE PAS nettoyer tous les éléments - laisser renderElements() gérer le nettoyage intelligent
    // Rendre les nouveaux éléments
    renderElements()

    // Rendre la sélection
    renderSelection()
  }, [elements, selectedElementIds])

  // Fonction de rendu des éléments
  const renderElements = useCallback(() => {
    if (!stageContainerRef.current) return

    // Logs supprimés pour optimisation

    // Rendre chaque élément selon son type
    elements.forEach(element => {
      const layerContainer = stageContainerRef.current!.getChildByName(`${element.layerType}Layer`) as Container
      if (!layerContainer) return

      // Vérifier si l'élément existe déjà
      let pixiElement = layerContainer.getChildByName(element.id)

      if (!pixiElement) {
        // Créer le nouvel élément selon son type
        if (element.type === 'dialogue') {
          pixiElement = createDialogueElement(element, (dialogueElement, position) => {
            // ✅ CALLBACK POUR DOUBLE-CLIC
            startTextEditing(dialogueElement)
          })
        } else {
          pixiElement = createPixiElement(element)
        }

        if (pixiElement) {
          pixiElement.name = element.id
          layerContainer.addChild(pixiElement)

          // ✅ STOCKER LA RÉFÉRENCE POUR LES BULLES
          if (element.type === 'dialogue') {
            pixiContainersRef.current.set(element.id, pixiElement as Container)
          }
        }
      } else {
        // Mettre à jour l'élément existant
        updatePixiElement(pixiElement, element)
      }
    })

    // Supprimer les éléments qui n'existent plus
    const layerOrder = ['background', 'characters', 'panels', 'dialogue', 'ui']
    layerOrder.forEach(layerName => {
      const layerContainer = stageContainerRef.current!.getChildByName(`${layerName}Layer`) as Container
      if (layerContainer) {
        const childrenToRemove: any[] = []
        layerContainer.children.forEach(child => {
          if (!elements.find(el => el.id === child.name)) {
            childrenToRemove.push(child)
          }
        })
        childrenToRemove.forEach(child => {
          layerContainer.removeChild(child)
          child.destroy()
        })
      }
    })
  }, [elements])

  // Fonction de rendu de la sélection
  const renderSelection = useCallback(() => {
    if (!selectionContainerRef.current) {
      console.warn('⚠️ selectionContainerRef.current is null, cannot render selection')
      return
    }

    // Debug : état avant nettoyage
    const childrenCountBefore = selectionContainerRef.current.children.length
    console.log('🎨 renderSelection appelée:', {
      selectedElementsCount: selectedElements.length,
      selectionContainerChildren: childrenCountBefore,
      selectedElementIds: selectedElements.map(el => el.id)
    })

    // Nettoyer la sélection précédente
    selectionContainerRef.current.removeChildren()

    // Debug : vérifier que le nettoyage a fonctionné
    const childrenCountAfter = selectionContainerRef.current.children.length
    console.log('🧹 Nettoyage sélection:', {
      childrenBefore: childrenCountBefore,
      childrenAfter: childrenCountAfter,
      cleanupSuccessful: childrenCountAfter === 0
    })

    // Vérification supplémentaire : forcer le nettoyage si nécessaire
    if (childrenCountAfter > 0) {
      console.warn('⚠️ Nettoyage incomplet, force removeChildren()')
      try {
        // Méthode alternative de nettoyage
        while (selectionContainerRef.current.children.length > 0) {
          selectionContainerRef.current.removeChildAt(0)
        }
        console.log('✅ Nettoyage forcé réussi')
      } catch (error) {
        console.error('❌ Erreur lors du nettoyage forcé:', error)
      }
    }

    // Si aucun élément sélectionné, ne rien afficher
    if (selectedElements.length === 0) {
      console.log('🎨 Sélection nettoyée - aucun élément sélectionné')
      return
    }

    // Dessiner les indicateurs pour chaque élément sélectionné
    selectedElements.forEach((element: AssemblyElement) => {
      const selectionContainer = new Container()
      selectionContainer.label = `selection-${element.id}`

      // 1. Contour de sélection principal
      const borderGraphics = new Graphics()
      borderGraphics.rect(
        element.transform.x - 2,
        element.transform.y - 2,
        element.transform.width + 4,
        element.transform.height + 4
      )
      // ✅ BORDURE SPÉCIALE POUR ÉDITION
      const isBeingEdited = editingElementId === element.id

      if (isBeingEdited) {
        borderGraphics.stroke({
          width: 3,
          color: 0x10b981, // Vert pour édition
          alpha: 1
        })

        // Effet de glow pour l'édition
        const glowGraphics = new Graphics()
        glowGraphics.rect(
          element.transform.x - 6,
          element.transform.y - 6,
          element.transform.width + 12,
          element.transform.height + 12
        )
        glowGraphics.stroke({
          width: 2,
          color: 0x10b981,
          alpha: 0.3
        })
        selectionContainer.addChild(glowGraphics)
      } else {
        borderGraphics.stroke({
          width: 2,
          color: 0x3b82f6, // Bleu professionnel
          alpha: 0.9
        })
      }

      // 2. Ombre portée pour plus de visibilité
      const shadowGraphics = new Graphics()
      shadowGraphics.rect(
        element.transform.x - 1,
        element.transform.y - 1,
        element.transform.width + 2,
        element.transform.height + 2
      )
      shadowGraphics.stroke({
        width: 4,
        color: 0x000000,
        alpha: 0.2
      })

      // ✅ HANDLES DE REDIMENSIONNEMENT AVEC NOUVEAU GESTIONNAIRE
      const handleSize = 12
      const handleBorderSize = 2
      const handles = [
        // Coins (ordre important pour HandleType enum)
        { x: element.transform.x - handleSize/2, y: element.transform.y - handleSize/2, handleType: HandleType.CORNER_NW },
        { x: element.transform.x + element.transform.width - handleSize/2, y: element.transform.y - handleSize/2, handleType: HandleType.CORNER_NE },
        { x: element.transform.x - handleSize/2, y: element.transform.y + element.transform.height - handleSize/2, handleType: HandleType.CORNER_SW },
        { x: element.transform.x + element.transform.width - handleSize/2, y: element.transform.y + element.transform.height - handleSize/2, handleType: HandleType.CORNER_SE },
        // Bords
        { x: element.transform.x + element.transform.width/2 - handleSize/2, y: element.transform.y - handleSize/2, handleType: HandleType.EDGE_N },
        { x: element.transform.x + element.transform.width/2 - handleSize/2, y: element.transform.y + element.transform.height - handleSize/2, handleType: HandleType.EDGE_S },
        { x: element.transform.x - handleSize/2, y: element.transform.y + element.transform.height/2 - handleSize/2, handleType: HandleType.EDGE_W },
        { x: element.transform.x + element.transform.width - handleSize/2, y: element.transform.y + element.transform.height/2 - handleSize/2, handleType: HandleType.EDGE_E },
      ]

      handles.forEach((handle, index) => {
        const handleContainer = new Container()
        handleContainer.label = `handle-${index}`

        const handleGraphics = new Graphics()

        // Ombre du handle
        handleGraphics.rect(handle.x + 1, handle.y + 1, handleSize, handleSize)
        handleGraphics.fill({ color: 0x000000, alpha: 0.3 })

        // Handle principal avec style différencié
        handleGraphics.rect(handle.x, handle.y, handleSize, handleSize)

        // Couleur selon le type (coins vs bords)
        const isCorner = handle.handleType <= HandleType.CORNER_SE
        handleGraphics.fill(isCorner ? 0xffffff : 0x3b82f6)

        // Bordure du handle
        handleGraphics.stroke({
          width: handleBorderSize,
          color: 0x3b82f6,
          alpha: 1
        })

        // ✅ RENDRE LES HANDLES INTERACTIFS AVEC NOUVEAU GESTIONNAIRE
        handleGraphics.eventMode = 'static'
        handleGraphics.cursor = BubbleManipulationManager.getHandleCursor(handle.handleType)

        handleGraphics.on('pointerdown', (e) => {
          e.stopPropagation()
          console.log('🔧 Handle cliqué:', HandleType[handle.handleType], 'pour élément:', element.id)

          if (element.type === 'dialogue') {
            startBubbleManipulation(element as DialogueElement, handle.handleType, e.global.x, e.global.y)
          }
        })

        handleContainer.addChild(handleGraphics)
        selectionContainer.addChild(handleContainer)
      })

      // ✅ HANDLE SPÉCIAL POUR LA QUEUE DES BULLES (TOUJOURS COLLÉ AU BOUT)
      if (element.type === 'dialogue') {
        const dialogueElement = element as DialogueElement
        const tailPos = BubbleManipulationManager.calculateTailPosition(dialogueElement)

        console.log('🎯 Position handle calculée:', {
          elementId: element.id,
          tailPos,
          bubbleTransform: element.transform,
          tailAngle: dialogueElement.bubbleStyle.tailAngleDegrees,
          tailLength: dialogueElement.bubbleStyle.tailLength
        })

        // ✅ HANDLE PARFAITEMENT COLLÉ AU BOUT DE LA QUEUE
        const tailHandle = new Graphics()

        // Ombre du handle de queue
        tailHandle.circle(tailPos.x + 1, tailPos.y + 1, 8)
        tailHandle.fill({ color: 0x000000, alpha: 0.3 })

        // Handle principal de queue - EXACTEMENT au bout de la queue
        tailHandle.circle(tailPos.x, tailPos.y, 8)
        tailHandle.fill(0xff6b35)
        tailHandle.stroke({ width: 2, color: 0xffffff })

        // ✅ DEBUG VISUEL TEMPORAIRE : Point rouge pour vérifier l'alignement
        if (process.env.NODE_ENV === 'development') {
          const debugPoint = new Graphics()
          debugPoint.circle(tailPos.x, tailPos.y, 2)
          debugPoint.fill(0xff0000) // Rouge pour debug
          selectionContainer.addChild(debugPoint)
        }

        tailHandle.eventMode = 'static'
        tailHandle.cursor = BubbleManipulationManager.getHandleCursor(HandleType.TAIL)

        tailHandle.on('pointerdown', (e) => {
          e.stopPropagation()
          console.log('🎯 Handle queue 360° cliqué pour élément:', element.id, 'position:', tailPos)
          startBubbleManipulation(dialogueElement, HandleType.TAIL, e.global.x, e.global.y)
        })

        selectionContainer.addChild(tailHandle)
      }

      // Ajouter les éléments dans l'ordre : ombre, bordure, handles
      selectionContainer.addChild(shadowGraphics)
      selectionContainer.addChild(borderGraphics)

      selectionContainerRef.current!.addChild(selectionContainer)
    })

    console.log('🎨 Sélection rendue:', selectedElements.length, 'éléments')
  }, [selectedElements, editingElementId, startBubbleManipulation])

  // Redimensionner l'application
  useEffect(() => {
    if (appRef.current) {
      appRef.current.renderer.resize(width, height)
    }
  }, [width, height])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: '100%',
          height: '100%',
          cursor: getCursorForTool(activeTool, canvas.ui.bubblePlacementMode)
        }}
        onMouseDown={() => {
          // Log supprimé pour optimisation
        }}
      />

      {/* ✅ ÉDITION DIRECTE DANS LE TEXTE PIXI - PAS D'OVERLAY SÉPARÉ */}

      {/* Overlay pour les informations de debug (développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-2 left-2 bg-black/50 text-white text-xs p-2 rounded pointer-events-auto">
          <div>Éléments: {elements.length}</div>
          <div>Sélectionnés: {selectedElementIds.length}</div>
          <div>Outil: {activeTool}</div>
          <div>Zoom: {zoom}%</div>
          <div>App: {appRef.current ? '✅' : '❌'}</div>
          {editingElementId && <div className="text-green-400">✏️ Édition: {editingElementId}</div>}

          {/* ✅ BOUTONS DE TEST POUR ÉDITION */}
          {selectedElementIds.length > 0 && (
            <div className="mt-2 space-y-1">
              <button
                onClick={() => {
                  const selectedElement = elements.find(el => el.id === selectedElementIds[0])
                  if (selectedElement && selectedElement.type === 'dialogue') {
                    console.log('🧪 Test édition forcée')
                    startTextEditing(selectedElement as DialogueElement)
                  }
                }}
                className="block w-full px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                🔤 Test Édition
              </button>

              <button
                onClick={() => {
                  const selectedElement = elements.find(el => el.id === selectedElementIds[0])
                  if (selectedElement && selectedElement.type === 'dialogue') {
                    console.log('🧪 Test double-clic simulé')
                    // Simuler un double-clic
                    lastClickTimeRef.current = Date.now() - 200
                    lastClickedElementRef.current = selectedElement.id

                    // Déclencher la logique de double-clic
                    selectElement(selectedElement.id)
                    if (startTextEditingRef.current) {
                      startTextEditingRef.current(selectedElement as DialogueElement)
                    }
                  }
                }}
                className="block w-full px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                🎯 Simuler Double-Clic
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Utilitaire pour obtenir le curseur selon l'outil actif et le mode
function getCursorForTool(tool: string, bubblePlacementMode: boolean = false): string {
  // Mode placement de bulle prioritaire
  if (bubblePlacementMode) {
    return 'crosshair'
  }

  switch (tool) {
    case 'select':
      return 'default'
    case 'move':
      return 'move'
    case 'panel':
    case 'dialogue':
    case 'text':
      return 'crosshair'
    case 'image':
      return 'copy'
    default:
      return 'default'
  }
}



// Fonction pour créer un élément PixiJS selon son type
function createPixiElement(element: AssemblyElement): Container | null {
  switch (element.type) {
    case 'panel':
      return createPanelElement(element)
    case 'dialogue':
      return createDialogueElement(element)
    case 'text':
      return createTextElement(element)
    case 'sprite':
      return createSpriteElement(element)
    case 'image':
      return createImageElement(element)
    default:
      return null
  }
}

// Créer un panel/case avec système de masquage avancé
function createPanelElement(element: AssemblyElement): Container {
  if (element.type !== 'panel') throw new Error('Invalid element type')

  const panelElement = element as PanelElement
  const container = new Container()

  // 🎭 SYSTÈME DE MASQUAGE AVANCÉ POUR LES IMAGES
  // Pour l'instant, désactiver les associations aléatoires pour éviter la confusion visuelle
  const hasAssociations = false // Désactivé temporairement

  const graphics = new Graphics()

  // Dessiner le panel selon son style
  graphics.rect(0, 0, panelElement.transform.width, panelElement.transform.height)

  if (hasAssociations) {
    // 🪟 EFFET FENÊTRE : Panel avec associations
    console.log('🎭 Panel avec associations - Effet fenêtre activé:', panelElement.id)

    // Remplissage très transparent pour laisser voir les images
    if (panelElement.panelStyle.fillColor !== null) {
      graphics.fill({
        color: panelElement.panelStyle.fillColor,
        alpha: 0.02 // Quasi-transparent
      })
    }

    // Bordure plus épaisse et colorée pour indiquer l'association
    graphics.stroke({
      width: Math.max(panelElement.panelStyle.borderWidth, 3),
      color: 0x3b82f6 // Bleu pour indiquer l'association
    })

    // Ajouter un effet de brillance sur les bords
    const glowGraphics = new Graphics()
    glowGraphics.rect(-2, -2, panelElement.transform.width + 4, panelElement.transform.height + 4)
    glowGraphics.stroke({
      width: 1,
      color: 0x60a5fa,
      alpha: 0.5
    })
    container.addChild(glowGraphics)

  } else {
    // 📦 PANEL NORMAL : Sans associations
    if (panelElement.panelStyle.fillColor !== null) {
      graphics.fill({
        color: panelElement.panelStyle.fillColor,
        alpha: panelElement.panelStyle.fillAlpha
      })
    }

    // Bordure normale
    graphics.stroke({
      width: panelElement.panelStyle.borderWidth,
      color: panelElement.panelStyle.borderColor
    })
  }

  container.addChild(graphics)
  updateElementTransform(container, panelElement.transform)

  console.log('🎨 Panel créé:', {
    id: panelElement.id,
    hasAssociations,
    effect: hasAssociations ? 'fenêtre' : 'normal',
    fillAlpha: hasAssociations ? 0.02 : panelElement.panelStyle.fillAlpha
  })

  return container
}

// Créer une bulle de dialogue
function createDialogueElement(element: AssemblyElement, onBubbleDoubleClick?: (element: DialogueElement, position: { x: number, y: number }) => void): Container {
  if (element.type !== 'dialogue') throw new Error('Invalid element type')

  const dialogueElement = element as DialogueElement
  const container = new Container()
  const graphics = new Graphics()

  console.log('💬 Création bulle de dialogue:', {
    id: dialogueElement.id,
    type: dialogueElement.bubbleStyle.type,
    text: dialogueElement.text,
    size: { width: dialogueElement.transform.width, height: dialogueElement.transform.height }
  })

  // ✅ AMÉLIORATION : Support de tous les types de bulles
  const { width, height } = dialogueElement.transform
  const style = dialogueElement.bubbleStyle

  // ✅ NOUVEAU SYSTÈME AVANCÉ AVEC CONFIGURATION CSS-LIKE
  const config = createAdvancedBubbleConfig(dialogueElement)

  switch (style.type) {
    case 'speech':
      // ✅ Bulle de dialogue avec système avancé
      drawAdvancedSpeechBubble(graphics, config)
      break

    case 'thought':
      // ✅ Bulle de pensée avec ellipse moderne
      drawAdvancedThoughtBubble(graphics, config)
      break

    case 'shout':
      // ✅ Bulle de cri avec forme en étoile dynamique
      drawAdvancedShoutBubble(graphics, config)
      break

    case 'whisper':
      // ✅ Bulle de chuchotement avec bordures pointillées
      drawAdvancedWhisperBubble(graphics, config)
      break

    case 'explosion':
      // ✅ Bulle d'explosion avec forme contrôlée
      drawAdvancedExplosionBubble(graphics, config)
      break

    default:
      // Fallback vers speech
      drawAdvancedSpeechBubble(graphics, config)
  }

  // ✅ AJOUTER LE TEXTE PIXI POUR L'AFFICHAGE NORMAL
  // ✅ STYLE DE TEXTE AVEC WRAPPING INTELLIGENT
  const wrapWidth = calculateOptimalWrapWidth(width, height)
  const textStyle = new TextStyle({
    fontSize: style.fontSize,
    fontFamily: style.fontFamily,
    fill: style.textColor,
    align: style.textAlign,
    wordWrap: true,
    wordWrapWidth: wrapWidth,
    breakWords: true // Permet de couper les mots très longs
  })

  // ✅ GESTION UNIFIÉE DU TEXTE - Afficher placeholder seulement si vraiment vide
  const displayText = (dialogueElement.text && dialogueElement.text.trim() !== '')
    ? dialogueElement.text
    : 'Nouveau texte...'

  const text = new Text({
    text: displayText,
    style: textStyle
  })

  // ✅ CENTRAGE AUTOMATIQUE AVEC ANCHOR - COHÉRENT AVEC L'ÉDITEUR
  text.anchor.set(0.5, 0.5)
  text.x = width / 2
  text.y = height / 2
  text.name = 'bubbleText'

  // ✅ ZONE CLIQUABLE POUR DOUBLE-CLIC
  const clickArea = new Graphics()
  clickArea.rect(0, 0, width, height)
  clickArea.fill({ color: 0x000000, alpha: 0 }) // Invisible mais cliquable
  clickArea.name = 'clickArea'
  clickArea.eventMode = 'static'
  clickArea.cursor = 'text'

  // ✅ GESTION DES CLICS POUR DÉTECTER LE DOUBLE-CLIC
  clickArea.on('pointertap', (event) => {
    console.log('🖱️ Clic sur bulle détecté:', dialogueElement.id)

    // ✅ NE PAS STOPPER LA PROPAGATION - Laisser le système principal gérer le double-clic
    // event.stopPropagation() // SUPPRIMÉ pour permettre la détection du double-clic

    // ✅ CALLBACK OPTIONNEL POUR DOUBLE-CLIC (si fourni)
    if (onBubbleDoubleClick) {
      const now = Date.now()
      const lastClick = (clickArea as any).lastClickTime || 0
      const timeDiff = now - lastClick

      if (timeDiff < 400) {
        console.log('🎨 Double-clic détecté dans createDialogueElement:', dialogueElement.id)
        onBubbleDoubleClick(dialogueElement, { x: event.global.x, y: event.global.y })
      }

      (clickArea as any).lastClickTime = now
    }
  })

  container.addChild(graphics)
  container.addChild(text)
  container.addChild(clickArea)
  updateElementTransform(container, dialogueElement.transform)

  return container
}

// ✅ FONCTIONS HELPER POUR LES DIFFÉRENTS TYPES DE BULLES

// ✅ SYSTÈME DE CONFIGURATION AVANCÉ INSPIRÉ DES TECHNIQUES CSS MODERNES
interface BubbleConfig {
  // Variables principales (inspirées des articles CSS)
  width: number
  height: number

  // Variables de queue (--b, --h, --p, --x des articles)
  tailBase: number      // --b: largeur de base de la queue
  tailHeight: number    // --h: hauteur de la queue
  tailPosition: number  // --p: position (0-1, où 0.5 = centre)
  tailOffset: number    // --x: décalage pour orientation gauche/droite
  tailAngle: number     // --a: angle de la queue en degrés

  // Variables de style
  backgroundColor: number
  outlineColor: number
  borderWidth: number
  borderRadius: number

  // Variables de type
  bubbleType: string
  isDashed: boolean
  hasGradient: boolean

  // Variables de positionnement
  textPadding: number
}

// Créer une configuration de bulle basée sur les techniques CSS modernes avec support 360°
function createAdvancedBubbleConfig(element: DialogueElement): BubbleConfig {
  const { width, height } = element.transform
  const style = element.bubbleStyle

  // ✅ NOUVEAU SYSTÈME 360° : Calcul dynamique de la queue
  let tailBase = Math.min(width * 0.2, 30)
  let tailHeight = Math.min(height * 0.3, 20)
  const tailPosition = style.tailPositionPercent ?? 0.25
  let tailAngle = style.tailAngle ?? 90

  // ✅ SYSTÈME 360° : Utiliser les nouvelles propriétés si disponibles
  if (style.tailAbsoluteX !== undefined && style.tailAbsoluteY !== undefined && style.tailAngleDegrees !== undefined) {
    tailAngle = style.tailAngleDegrees
    tailHeight = style.tailLength ?? 30

    // ✅ ADAPTER LA BASE POUR TOUTES LES LONGUEURS (même très grandes)
    // Base proportionnelle mais avec limites visuelles raisonnables
    tailBase = Math.min(Math.max(tailHeight * 0.3, 8), 30) // Entre 8px et 30px

    console.log('🎯 Configuration bulle 360° (LONGUEUR ILLIMITÉE):', {
      tailAngle,
      tailHeight,
      tailBase,
      tailAbsoluteX: style.tailAbsoluteX,
      tailAbsoluteY: style.tailAbsoluteY,
      isLongTail: tailHeight > 100
    })
  }

  return {
    // Dimensions principales
    width,
    height,

    // Variables de queue (inspirées des articles CSS avec support 360°)
    tailBase,                                                // --b: base adaptative
    tailHeight,                                              // --h: hauteur adaptative
    tailPosition,                                            // --p: position configurable
    tailOffset: style.tailOffset ?? 0,                      // --x: décalage configurable
    tailAngle,                                               // --a: angle configurable

    // Variables de style avec support des nouvelles propriétés
    backgroundColor: style.backgroundColor,
    outlineColor: style.outlineColor,
    borderWidth: style.borderWidth ?? (
      style.type === 'shout' ? 4 :
      style.type === 'whisper' ? 1.5 : 3
    ),
    borderRadius: style.borderRadius ?? (
      style.type === 'thought' ? width / 2 :
      style.type === 'whisper' ? 18 : 12
    ),

    // Variables de type avec support avancé
    bubbleType: style.type,
    isDashed: style.type === 'whisper',
    hasGradient: style.hasGradient ?? false,

    // Variables de positionnement
    textPadding: 15
  }
}

// Queue moderne pour bulle de dialogue avec configuration avancée et système 360°
function drawAdvancedSpeechTail(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, tailBase, tailHeight, tailPosition, tailOffset } = config

  // ✅ NOUVEAU SYSTÈME 360° : Si l'angle est défini, utiliser le système dynamique
  if (config.tailAngle !== undefined && config.tailAngle !== 90) {
    drawDynamic360Tail(graphics, config)
    return
  }

  // ✅ SYSTÈME CLASSIQUE : Pour compatibilité avec les anciennes bulles
  const tailX = width * tailPosition + tailOffset
  const tailY = height

  // Utiliser min/max pour éviter le débordement (technique des articles)
  const leftPoint = Math.max(0, tailX - tailBase / 2)
  const rightPoint = Math.min(width, tailX + tailBase / 2)

  // Créer une queue avec des courbes plus douces (simulation de border-radius)
  graphics.moveTo(leftPoint, tailY)

  // Courbe gauche (simulation de border-radius)
  graphics.quadraticCurveTo(
    leftPoint - 2, tailY + 2,
    leftPoint, tailY + 4
  )

  // Ligne vers la pointe
  graphics.lineTo(tailX, tailY + tailHeight)

  // Ligne vers le côté droit
  graphics.lineTo(rightPoint, tailY + 4)

  // Courbe droite (simulation de border-radius)
  graphics.quadraticCurveTo(
    rightPoint + 2, tailY + 2,
    rightPoint, tailY
  )

  graphics.fill(config.backgroundColor)
  graphics.stroke({ width: config.borderWidth, color: config.outlineColor })
}

// ✅ NOUVELLE FONCTION : Queue dynamique 360° qui correspond exactement au handle
function drawDynamic360Tail(graphics: Graphics, config: BubbleConfig): void {
  // Cette fonction dessine la queue exactement là où le handle sera positionné
  // Pas de dessin ici - la queue sera dessinée par le système de rendu principal
  // Cette fonction existe pour la compatibilité avec l'architecture existante
}

// Queue moderne pour bulle de dialogue (version simple - gardée pour compatibilité)
function drawModernSpeechTail(graphics: Graphics, width: number, height: number, style: any): void {
  const config = {
    width, height,
    tailBase: 24, tailHeight: 18, tailPosition: 0.25, tailOffset: 0,
    backgroundColor: style.backgroundColor, outlineColor: style.outlineColor, borderWidth: 3
  } as BubbleConfig

  drawAdvancedSpeechTail(graphics, config)
}

// Queue pour bulle de dialogue (version simple - gardée pour compatibilité)
function drawSpeechTail(graphics: Graphics, width: number, height: number, color: number): void {
  const tailWidth = 20
  const tailHeight = 15
  const tailX = width * 0.2 // Position à 20% de la largeur
  const tailY = height

  graphics.moveTo(tailX, tailY)
  graphics.lineTo(tailX - tailWidth / 2, tailY + tailHeight)
  graphics.lineTo(tailX + tailWidth / 2, tailY)
  graphics.fill(0xffffff) // Même couleur que le fond
  graphics.stroke({ width: 2, color })
}

// Petites bulles pour bulle de pensée
function drawThoughtBubbles(graphics: Graphics, width: number, height: number, style: any): void {
  const bubbles = [
    { x: width * 0.2, y: height + 10, radius: 4 },
    { x: width * 0.1, y: height + 20, radius: 2 }
  ]

  bubbles.forEach(bubble => {
    graphics.circle(bubble.x, bubble.y, bubble.radius)
    graphics.fill(style.backgroundColor)
    graphics.stroke({ width: 1, color: style.outlineColor })
  })
}

// Bulle de cri (forme en étoile)
function drawShoutBubble(graphics: Graphics, width: number, height: number, style: any): void {
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = Math.min(width, height) / 2
  const innerRadius = outerRadius * 0.6
  const points = 8

  graphics.moveTo(centerX + outerRadius, centerY)

  for (let i = 1; i <= points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    graphics.lineTo(x, y)
  }

  graphics.fill(style.backgroundColor)
  graphics.stroke({ width: 3, color: style.outlineColor })
}

// Bordure pointillée pour chuchotement
function drawDashedBorder(graphics: Graphics, width: number, height: number, color: number): void {
  const dashLength = 5
  const gapLength = 3

  // Simulation de pointillés (PixiJS n'a pas de support natif)
  for (let x = 0; x < width; x += dashLength + gapLength) {
    graphics.rect(x, 0, Math.min(dashLength, width - x), 1)
    graphics.rect(x, height - 1, Math.min(dashLength, width - x), 1)
  }

  for (let y = 0; y < height; y += dashLength + gapLength) {
    graphics.rect(0, y, 1, Math.min(dashLength, height - y))
    graphics.rect(width - 1, y, 1, Math.min(dashLength, height - y))
  }

  graphics.fill(color)
}

// Bulle d'explosion (forme irrégulière)
function drawExplosionBubble(graphics: Graphics, width: number, height: number, style: any): void {
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) / 2
  const points = 12

  graphics.moveTo(centerX + baseRadius, centerY)

  for (let i = 1; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    const variation = (Math.random() - 0.5) * 15 // Variation aléatoire
    const radius = baseRadius + variation
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    graphics.lineTo(x, y)
  }

  graphics.fill(style.backgroundColor)
  graphics.stroke({ width: 3, color: style.outlineColor })
}

// ✅ NOUVELLES FONCTIONS MODERNES INSPIRÉES DES TECHNIQUES CSS

// Petites bulles modernes pour bulle de pensée
function drawModernThoughtBubbles(graphics: Graphics, width: number, height: number, style: any): void {
  const bubbles = [
    { x: width * 0.15, y: height + 12, radius: 5 },
    { x: width * 0.08, y: height + 24, radius: 3 },
    { x: width * 0.03, y: height + 32, radius: 1.5 }
  ]

  bubbles.forEach(bubble => {
    graphics.circle(bubble.x, bubble.y, bubble.radius)
    graphics.fill(style.backgroundColor)
    graphics.stroke({ width: 1.5, color: style.outlineColor })
  })
}

// Bulle de cri moderne (forme en étoile plus dynamique)
function drawModernShoutBubble(graphics: Graphics, width: number, height: number, style: any): void {
  const centerX = width / 2
  const centerY = height / 2
  const outerRadius = Math.min(width, height) / 2 - 4
  const innerRadius = outerRadius * 0.65
  const points = 10 // Plus de points pour un effet plus dynamique

  graphics.moveTo(centerX + outerRadius, centerY)

  for (let i = 1; i <= points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    graphics.lineTo(x, y)
  }

  graphics.fill(style.backgroundColor)
  graphics.stroke({ width: 4, color: style.outlineColor })
}

// Bordure pointillée moderne pour chuchotement
function drawModernDashedBorder(graphics: Graphics, width: number, height: number, color: number): void {
  const dashLength = 8
  const gapLength = 4
  const cornerRadius = 18

  // Simulation de pointillés avec coins arrondis
  // Haut
  for (let x = cornerRadius; x < width - cornerRadius; x += dashLength + gapLength) {
    graphics.roundRect(x, 0, Math.min(dashLength, width - cornerRadius - x), 2, 1)
  }

  // Bas
  for (let x = cornerRadius; x < width - cornerRadius; x += dashLength + gapLength) {
    graphics.roundRect(x, height - 2, Math.min(dashLength, width - cornerRadius - x), 2, 1)
  }

  // Gauche
  for (let y = cornerRadius; y < height - cornerRadius; y += dashLength + gapLength) {
    graphics.roundRect(0, y, 2, Math.min(dashLength, height - cornerRadius - y), 1)
  }

  // Droite
  for (let y = cornerRadius; y < height - cornerRadius; y += dashLength + gapLength) {
    graphics.roundRect(width - 2, y, 2, Math.min(dashLength, height - cornerRadius - y), 1)
  }

  graphics.fill(color)
}

// Bulle d'explosion moderne (forme plus dynamique et variée)
function drawModernExplosionBubble(graphics: Graphics, width: number, height: number, style: any): void {
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) / 2 - 3
  const points = 16 // Plus de points pour plus de détails

  graphics.moveTo(centerX + baseRadius, centerY)

  for (let i = 1; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    // Variation plus contrôlée et prévisible
    const variation = Math.sin(angle * 3) * 8 + Math.cos(angle * 5) * 4
    const radius = baseRadius + variation
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    graphics.lineTo(x, y)
  }

  graphics.fill(style.backgroundColor)
  graphics.stroke({ width: 4, color: style.outlineColor })
}

// ✅ NOUVELLES FONCTIONS AVANCÉES INSPIRÉES DES TECHNIQUES CSS MODERNES

// ✅ BULLE MANGA STYLE : Queue parfaitement intégrée sans séparation visuelle
function drawAdvancedSpeechBubble(graphics: Graphics, config: BubbleConfig): void {
  // ✅ RENDU UNIFIÉ : Bulle + queue comme une seule forme
  drawUnifiedMangaBubble(graphics, config)
}

// ✅ NOUVELLE FONCTION : Bulle unifiée style manga professionnel
function drawUnifiedMangaBubble(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, borderRadius, backgroundColor, outlineColor, borderWidth } = config

  // ✅ SYSTÈME 360° : Si queue dynamique, dessiner forme unifiée
  if (config.tailAngle !== undefined && config.tailAngle !== 90) {
    drawSeamlessMangaBubbleWithTail(graphics, config)
  } else {
    // Fallback : bulle classique
    graphics.roundRect(0, 0, width, height, borderRadius)
    graphics.fill(backgroundColor)
    graphics.stroke({ width: borderWidth, color: outlineColor })
    drawAdvancedSpeechTail(graphics, config)
  }
}

// ✅ FONCTION PRINCIPALE : Bulle manga avec queue parfaitement intégrée
function drawSeamlessMangaBubbleWithTail(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, borderRadius, backgroundColor, outlineColor, borderWidth } = config

  // Calculs de base
  const centerX = width / 2
  const centerY = height / 2
  const angleRad = config.tailAngle * Math.PI / 180
  const dx = Math.cos(angleRad)
  const dy = Math.sin(angleRad)

  // ✅ CALCUL DU POINT D'INTÉGRATION (où la queue se connecte)
  const integrationPoint = calculateSeamlessIntegrationPoint(config)

  // ✅ POINT FINAL DE LA QUEUE
  const tailEndX = integrationPoint.x + dx * config.tailHeight
  const tailEndY = integrationPoint.y + dy * config.tailHeight

  // ✅ DESSINER LA FORME UNIFIÉE SANS SÉPARATION
  drawUnifiedBubbleShape(graphics, config, integrationPoint, { x: tailEndX, y: tailEndY })
}

// ✅ CALCUL DU POINT D'INTÉGRATION PARFAIT
function calculateSeamlessIntegrationPoint(config: BubbleConfig): { x: number, y: number } {
  const { width, height } = config
  const centerX = width / 2
  const centerY = height / 2
  const angleRad = config.tailAngle * Math.PI / 180
  const dx = Math.cos(angleRad)
  const dy = Math.sin(angleRad)

  // ✅ INTERSECTION AVEC LE RECTANGLE (en tenant compte du border-radius)
  let t = Infinity
  const halfWidth = width / 2 - config.borderRadius * 0.3 // Ajustement pour coins arrondis
  const halfHeight = height / 2 - config.borderRadius * 0.3

  if (dx > 0) t = Math.min(t, halfWidth / dx)
  if (dx < 0) t = Math.min(t, -halfWidth / dx)
  if (dy > 0) t = Math.min(t, halfHeight / dy)
  if (dy < 0) t = Math.min(t, -halfHeight / dy)

  return {
    x: centerX + dx * t,
    y: centerY + dy * t
  }
}

// ✅ DESSINER LA FORME UNIFIÉE SANS SÉPARATION
function drawUnifiedBubbleShape(graphics: Graphics, config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): void {
  const { width, height, borderRadius, backgroundColor, outlineColor, borderWidth } = config

  // ✅ CRÉER UN PATH UNIFIÉ QUI INCLUT BULLE + QUEUE
  const path = createUnifiedBubblePath(config, integrationPoint, tailEnd)

  // ✅ DESSINER LA FORME COMPLÈTE D'UN COUP
  graphics.poly(path)
  graphics.fill(backgroundColor)
  graphics.stroke({ width: borderWidth, color: outlineColor })

  console.log('🎨 Bulle manga unifiée dessinée:', {
    integrationPoint,
    tailEnd,
    pathPoints: path.length / 2
  })
}

// ✅ FONCTION HELPER : Calcul intelligent de la largeur de wrapping (identique à NativeTextEditor)
function calculateOptimalWrapWidth(bubbleWidth: number, bubbleHeight: number): number {
  const minPadding = 15 // Marge minimale de 15px
  const maxPadding = 25 // Marge maximale de 25px

  // Calculer la largeur disponible en tenant compte des marges
  let availableWidth = bubbleWidth - (minPadding * 2)

  // Pour les bulles très larges, utiliser une marge plus importante
  if (bubbleWidth > 300) {
    availableWidth = bubbleWidth - (maxPadding * 2)
  }

  // S'assurer qu'on a au moins 100px de largeur pour le texte
  availableWidth = Math.max(100, availableWidth)

  return availableWidth
}

// ✅ FONCTION UNIFIÉE : Queue 360° qui utilise EXACTEMENT les mêmes calculs que le handle
function drawDynamic360BubbleTail(graphics: Graphics, config: BubbleConfig): void {
  // Si pas de système 360°, utiliser l'ancien système
  if (config.tailAngle === undefined || config.tailAngle === 90) {
    drawAdvancedSpeechTail(graphics, config)
    return
  }

  // ✅ UTILISER LES MÊMES CALCULS QUE BubbleManipulationManager.calculateTailAttachmentPoint
  const centerX = config.width / 2
  const centerY = config.height / 2
  const angleRad = config.tailAngle * Math.PI / 180
  const dx = Math.cos(angleRad)
  const dy = Math.sin(angleRad)

  // Calcul d'intersection IDENTIQUE à BubbleManipulationManager
  let t = Infinity
  const halfWidth = config.width / 2
  const halfHeight = config.height / 2

  if (dx > 0) t = Math.min(t, halfWidth / dx)
  if (dx < 0) t = Math.min(t, -halfWidth / dx)
  if (dy > 0) t = Math.min(t, halfHeight / dy)
  if (dy < 0) t = Math.min(t, -halfHeight / dy)

  const attachX = centerX + dx * t
  const attachY = centerY + dy * t

  // ✅ POINT FINAL IDENTIQUE au calcul du handle (LONGUEUR ILLIMITÉE)
  const tailEndX = attachX + dx * config.tailHeight
  const tailEndY = attachY + dy * config.tailHeight

  // ✅ ADAPTATION POUR QUEUES TRÈS LONGUES
  const isLongTail = config.tailHeight > 100
  const strokeWidth = isLongTail ? Math.min(config.borderWidth + 1, 4) : config.borderWidth

  // Dessiner la queue triangulaire vers ce point EXACT
  const perpAngle = angleRad + Math.PI / 2
  const baseHalf = config.tailBase / 2

  const base1X = attachX + Math.cos(perpAngle) * baseHalf
  const base1Y = attachY + Math.sin(perpAngle) * baseHalf
  const base2X = attachX - Math.cos(perpAngle) * baseHalf
  const base2Y = attachY - Math.sin(perpAngle) * baseHalf

  // Triangle pointant vers le point EXACT où sera le handle
  graphics.moveTo(base1X, base1Y)
  graphics.lineTo(tailEndX, tailEndY) // ← MÊME POINT que le handle
  graphics.lineTo(base2X, base2Y)
  graphics.lineTo(base1X, base1Y)

  graphics.fill(config.backgroundColor)
  graphics.stroke({ width: strokeWidth, color: config.outlineColor })

  console.log('🎯 Queue ILLIMITÉE dessinée:', {
    tailEndX,
    tailEndY,
    angle: config.tailAngle,
    length: config.tailHeight,
    isLongTail,
    strokeWidth
  })
}

// ✅ CRÉER UN PATH UNIFIÉ POUR BULLE + QUEUE SANS SÉPARATION
function createUnifiedBubblePath(config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): number[] {
  const { width, height, borderRadius } = config
  const path: number[] = []

  // ✅ DÉTERMINER LE CÔTÉ D'INTÉGRATION
  const side = determineIntegrationSide(integrationPoint, width, height)

  // ✅ CRÉER LE CONTOUR DE LA BULLE AVEC INTÉGRATION DE QUEUE
  switch (side) {
    case 'bottom':
      createBottomIntegratedPath(path, config, integrationPoint, tailEnd)
      break
    case 'top':
      createTopIntegratedPath(path, config, integrationPoint, tailEnd)
      break
    case 'left':
      createLeftIntegratedPath(path, config, integrationPoint, tailEnd)
      break
    case 'right':
      createRightIntegratedPath(path, config, integrationPoint, tailEnd)
      break
  }

  return path
}

// ✅ DÉTERMINER LE CÔTÉ D'INTÉGRATION
function determineIntegrationSide(point: { x: number, y: number }, width: number, height: number): 'top' | 'bottom' | 'left' | 'right' {
  const centerX = width / 2
  const centerY = height / 2

  const distToTop = Math.abs(point.y - 0)
  const distToBottom = Math.abs(point.y - height)
  const distToLeft = Math.abs(point.x - 0)
  const distToRight = Math.abs(point.x - width)

  const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight)

  if (minDist === distToTop) return 'top'
  if (minDist === distToBottom) return 'bottom'
  if (minDist === distToLeft) return 'left'
  return 'right'
}

// ✅ PATH INTÉGRÉ POUR CÔTÉ BAS
function createBottomIntegratedPath(path: number[], config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): void {
  const { width, height, borderRadius } = config
  const tailWidth = config.tailBase

  // Commencer en haut à gauche
  path.push(borderRadius, 0)

  // Côté haut
  path.push(width - borderRadius, 0)
  path.push(width, borderRadius)

  // Côté droit
  path.push(width, height - borderRadius)
  path.push(width - borderRadius, height)

  // ✅ CÔTÉ BAS AVEC INTÉGRATION DE QUEUE
  // Aller jusqu'au point d'intégration droit
  const rightIntegrationX = integrationPoint.x + tailWidth / 2
  path.push(rightIntegrationX, height)

  // ✅ QUEUE INTÉGRÉE SANS SÉPARATION
  path.push(tailEnd.x, tailEnd.y) // Pointe de la queue

  // Retour au point d'intégration gauche
  const leftIntegrationX = integrationPoint.x - tailWidth / 2
  path.push(leftIntegrationX, height)

  // Continuer le côté bas
  path.push(borderRadius, height)
  path.push(0, height - borderRadius)

  // Côté gauche
  path.push(0, borderRadius)
  path.push(borderRadius, 0) // Retour au début
}

// ✅ PATH INTÉGRÉ POUR CÔTÉ HAUT
function createTopIntegratedPath(path: number[], config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): void {
  const { width, height, borderRadius } = config
  const tailWidth = config.tailBase

  // Commencer en bas à gauche
  path.push(0, height - borderRadius)
  path.push(borderRadius, height)

  // Côté bas
  path.push(width - borderRadius, height)
  path.push(width, height - borderRadius)

  // Côté droit
  path.push(width, borderRadius)
  path.push(width - borderRadius, 0)

  // ✅ CÔTÉ HAUT AVEC INTÉGRATION DE QUEUE
  const rightIntegrationX = integrationPoint.x + tailWidth / 2
  path.push(rightIntegrationX, 0)

  // Queue intégrée
  path.push(tailEnd.x, tailEnd.y)

  const leftIntegrationX = integrationPoint.x - tailWidth / 2
  path.push(leftIntegrationX, 0)

  // Continuer le côté haut
  path.push(borderRadius, 0)
  path.push(0, borderRadius)

  // Côté gauche
  path.push(0, height - borderRadius) // Retour au début
}

// ✅ PATH INTÉGRÉ POUR CÔTÉ GAUCHE
function createLeftIntegratedPath(path: number[], config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): void {
  const { width, height, borderRadius } = config
  const tailWidth = config.tailBase

  // Commencer en haut à droite
  path.push(width - borderRadius, 0)
  path.push(width, borderRadius)

  // Côté droit
  path.push(width, height - borderRadius)
  path.push(width - borderRadius, height)

  // Côté bas
  path.push(borderRadius, height)
  path.push(0, height - borderRadius)

  // ✅ CÔTÉ GAUCHE AVEC INTÉGRATION DE QUEUE
  const bottomIntegrationY = integrationPoint.y + tailWidth / 2
  path.push(0, bottomIntegrationY)

  // Queue intégrée
  path.push(tailEnd.x, tailEnd.y)

  const topIntegrationY = integrationPoint.y - tailWidth / 2
  path.push(0, topIntegrationY)

  // Continuer le côté gauche
  path.push(0, borderRadius)
  path.push(borderRadius, 0)

  // Côté haut
  path.push(width - borderRadius, 0) // Retour au début
}

// ✅ PATH INTÉGRÉ POUR CÔTÉ DROIT
function createRightIntegratedPath(path: number[], config: BubbleConfig, integrationPoint: { x: number, y: number }, tailEnd: { x: number, y: number }): void {
  const { width, height, borderRadius } = config
  const tailWidth = config.tailBase

  // Commencer en haut à gauche
  path.push(borderRadius, 0)
  path.push(0, borderRadius)

  // Côté gauche
  path.push(0, height - borderRadius)
  path.push(borderRadius, height)

  // Côté bas
  path.push(width - borderRadius, height)
  path.push(width, height - borderRadius)

  // ✅ CÔTÉ DROIT AVEC INTÉGRATION DE QUEUE
  const bottomIntegrationY = integrationPoint.y + tailWidth / 2
  path.push(width, bottomIntegrationY)

  // Queue intégrée
  path.push(tailEnd.x, tailEnd.y)

  const topIntegrationY = integrationPoint.y - tailWidth / 2
  path.push(width, topIntegrationY)

  // Continuer le côté droit
  path.push(width, borderRadius)
  path.push(width - borderRadius, 0)

  // Côté haut
  path.push(borderRadius, 0) // Retour au début
}

// Bulle de pensée avancée avec ellipse et bulles (intégration seamless)
function drawAdvancedThoughtBubble(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, backgroundColor, outlineColor, borderWidth } = config

  // ✅ SYSTÈME UNIFIÉ POUR BULLES DE PENSÉE AUSSI
  if (config.tailAngle !== undefined && config.tailAngle !== 90) {
    // Ellipse avec queue intégrée
    drawSeamlessThoughtBubbleWithTail(graphics, config)
  } else {
    // Ellipse classique
    graphics.ellipse(width / 2, height / 2, width / 2 - 2, height / 2 - 2)
    graphics.fill(backgroundColor)
    graphics.stroke({ width: borderWidth, color: outlineColor })
    drawAdvancedThoughtBubbles(graphics, config)
  }
}

// ✅ BULLE DE PENSÉE AVEC QUEUE INTÉGRÉE
function drawSeamlessThoughtBubbleWithTail(graphics: Graphics, config: BubbleConfig): void {
  // Pour les bulles de pensée, utiliser des petites bulles au lieu d'une queue triangulaire
  const { width, height, backgroundColor, outlineColor, borderWidth } = config

  // Ellipse principale
  graphics.ellipse(width / 2, height / 2, width / 2 - 2, height / 2 - 2)
  graphics.fill(backgroundColor)
  graphics.stroke({ width: borderWidth, color: outlineColor })

  // ✅ PETITES BULLES INTÉGRÉES VERS LE POINT FINAL
  drawSeamlessThoughtBubbles(graphics, config)
}

// ✅ PETITES BULLES DE PENSÉE INTÉGRÉES
function drawSeamlessThoughtBubbles(graphics: Graphics, config: BubbleConfig): void {
  const centerX = config.width / 2
  const centerY = config.height / 2
  const angleRad = config.tailAngle * Math.PI / 180
  const dx = Math.cos(angleRad)
  const dy = Math.sin(angleRad)

  // Point de départ sur le bord de l'ellipse
  const startX = centerX + dx * (config.width / 2 - 5)
  const startY = centerY + dy * (config.height / 2 - 5)

  // Créer une série de bulles vers le point final
  const numBubbles = Math.min(5, Math.floor(config.tailHeight / 15))

  for (let i = 0; i < numBubbles; i++) {
    const progress = (i + 1) / numBubbles
    const bubbleX = startX + dx * config.tailHeight * progress
    const bubbleY = startY + dy * config.tailHeight * progress
    const bubbleRadius = Math.max(2, 8 - i * 1.5) // Bulles qui diminuent

    graphics.circle(bubbleX, bubbleY, bubbleRadius)
    graphics.fill(config.backgroundColor)
    graphics.stroke({ width: 1, color: config.outlineColor })
  }
}

// Bulle de cri avancée avec forme en étoile contrôlée (intégration seamless)
function drawAdvancedShoutBubble(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, backgroundColor, outlineColor, borderWidth } = config

  // ✅ SYSTÈME UNIFIÉ POUR BULLES DE CRI
  if (config.tailAngle !== undefined && config.tailAngle !== 90) {
    drawUnifiedMangaBubble(graphics, config) // Utiliser le système unifié
  } else {
    // Forme en étoile classique
    const centerX = width / 2
    const centerY = height / 2
    const outerRadius = Math.min(width, height) / 2 - 4
    const innerRadius = outerRadius * 0.65
    const points = 10

    graphics.moveTo(centerX + outerRadius, centerY)

    for (let i = 1; i <= points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / points
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      graphics.lineTo(x, y)
    }

    graphics.fill(backgroundColor)
    graphics.stroke({ width: borderWidth, color: outlineColor })
  }
}

// Bulle de chuchotement avancée avec bordures pointillées (intégration seamless)
function drawAdvancedWhisperBubble(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, borderRadius, backgroundColor, outlineColor } = config

  // ✅ SYSTÈME UNIFIÉ POUR BULLES DE CHUCHOTEMENT
  if (config.tailAngle !== undefined && config.tailAngle !== 90) {
    drawUnifiedMangaBubble(graphics, config) // Utiliser le système unifié

    // ✅ AJOUTER L'EFFET POINTILLÉ APRÈS
    drawAdvancedDashedBorder(graphics, config)
  } else {
    // Style classique
    graphics.roundRect(0, 0, width, height, borderRadius)
    graphics.fill({ color: backgroundColor, alpha: 0.9 })
    drawAdvancedDashedBorder(graphics, config)
  }
}

// Bulle d'explosion avancée avec forme contrôlée
function drawAdvancedExplosionBubble(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, backgroundColor, outlineColor, borderWidth } = config
  const centerX = width / 2
  const centerY = height / 2
  const baseRadius = Math.min(width, height) / 2 - 3
  const points = 16

  graphics.moveTo(centerX + baseRadius, centerY)

  for (let i = 1; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    // Variation contrôlée basée sur la configuration
    const variation = Math.sin(angle * 3) * (config.tailBase * 0.3) + Math.cos(angle * 5) * (config.tailHeight * 0.2)
    const radius = baseRadius + variation
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    graphics.lineTo(x, y)
  }

  graphics.fill(backgroundColor)
  graphics.stroke({ width: borderWidth, color: outlineColor })
}

// Petites bulles de pensée avancées
function drawAdvancedThoughtBubbles(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, backgroundColor, outlineColor, tailPosition, tailHeight } = config

  // Position basée sur la configuration
  const baseX = width * tailPosition
  const bubbles = [
    { x: baseX, y: height + tailHeight * 0.6, radius: 5 },
    { x: baseX - width * 0.05, y: height + tailHeight * 1.2, radius: 3 },
    { x: baseX - width * 0.08, y: height + tailHeight * 1.6, radius: 1.5 }
  ]

  bubbles.forEach(bubble => {
    graphics.circle(bubble.x, bubble.y, bubble.radius)
    graphics.fill(backgroundColor)
    graphics.stroke({ width: 1.5, color: outlineColor })
  })
}

// Bordure pointillée avancée avec configuration
function drawAdvancedDashedBorder(graphics: Graphics, config: BubbleConfig): void {
  const { width, height, borderRadius, outlineColor } = config
  const dashLength = 8
  const gapLength = 4

  // Simulation de pointillés avec coins arrondis
  // Haut
  for (let x = borderRadius; x < width - borderRadius; x += dashLength + gapLength) {
    graphics.roundRect(x, 0, Math.min(dashLength, width - borderRadius - x), 2, 1)
  }

  // Bas
  for (let x = borderRadius; x < width - borderRadius; x += dashLength + gapLength) {
    graphics.roundRect(x, height - 2, Math.min(dashLength, width - borderRadius - x), 2, 1)
  }

  // Gauche
  for (let y = borderRadius; y < height - borderRadius; y += dashLength + gapLength) {
    graphics.roundRect(0, y, 2, Math.min(dashLength, height - borderRadius - y), 1)
  }

  // Droite
  for (let y = borderRadius; y < height - borderRadius; y += dashLength + gapLength) {
    graphics.roundRect(width - 2, y, 2, Math.min(dashLength, height - borderRadius - y), 1)
  }

  graphics.fill(outlineColor)
}

// Créer un élément de texte
function createTextElement(element: AssemblyElement): Container {
  if (element.type !== 'text') throw new Error('Invalid element type')

  const textElement = element as TextElement
  const container = new Container()

  const textStyle = new TextStyle({
    fontSize: textElement.textStyle.fontSize,
    fontFamily: textElement.textStyle.fontFamily,
    fill: textElement.textStyle.color,
    align: textElement.textStyle.align,
    fontWeight: textElement.textStyle.fontWeight,
    fontStyle: textElement.textStyle.fontStyle
  })

  const text = new Text({
    text: textElement.text,
    style: textStyle
  })

  container.addChild(text)
  updateElementTransform(container, textElement.transform)

  return container
}

// Créer un sprite (placeholder pour l'instant)
function createSpriteElement(element: AssemblyElement): Container {
  if (element.type !== 'sprite') throw new Error('Invalid element type')

  const spriteElement = element as SpriteElement
  const container = new Container()
  const graphics = new Graphics()

  // Placeholder pour le sprite
  graphics.rect(0, 0, spriteElement.transform.width, spriteElement.transform.height)
  graphics.fill(0x374151)
  graphics.stroke({ width: 2, color: 0x9ca3af })

  container.addChild(graphics)
  updateElementTransform(container, spriteElement.transform)

  return container
}

// Créer un élément image avec gestion asynchrone
function createImageElement(element: AssemblyElement): Container {
  if (element.type !== 'image') throw new Error('Invalid element type')

  const imageElement = element as ImageElement
  const container = new Container()

  console.log('🖼️ Création élément image:', {
    id: imageElement.id,
    src: imageElement.imageData.src,
    size: {
      width: imageElement.transform.width,
      height: imageElement.transform.height
    }
  })

  // Créer un placeholder pendant le chargement
  const placeholder = new Graphics()
  placeholder.rect(0, 0, imageElement.transform.width, imageElement.transform.height)
  placeholder.fill({ color: 0xf3f4f6, alpha: 0.8 })
  placeholder.stroke({ width: 2, color: 0xd1d5db })

  // Ajouter un texte "Chargement..."
  const loadingText = new Text({
    text: 'Chargement...',
    style: new TextStyle({
      fontSize: 14,
      fontFamily: 'Arial',
      fill: 0x6b7280,
      align: 'center'
    })
  })
  loadingText.x = imageElement.transform.width / 2 - loadingText.width / 2
  loadingText.y = imageElement.transform.height / 2 - loadingText.height / 2

  container.addChild(placeholder)
  container.addChild(loadingText)

  // Charger l'image de manière asynchrone
  const loadImage = async () => {
    try {
      console.log('🔄 Chargement asynchrone de l\'image:', imageElement.imageData.src)

      // Créer une image HTML pour précharger
      const img = new Image()
      img.crossOrigin = 'anonymous'

      // Promesse pour attendre le chargement
      const imageLoadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Impossible de charger l\'image'))
      })

      // Démarrer le chargement
      img.src = imageElement.imageData.src

      // Attendre que l'image soit chargée
      await imageLoadPromise

      // Créer le sprite avec l'image préchargée
      const sprite = Sprite.from(img)

      // Ajuster la taille du sprite
      sprite.width = imageElement.transform.width
      sprite.height = imageElement.transform.height

      // Remplacer le placeholder par l'image
      container.removeChild(placeholder)
      container.removeChild(loadingText)
      container.addChild(sprite)

      console.log('✅ Image chargée avec succès:', {
        id: imageElement.id,
        spriteSize: { width: sprite.width, height: sprite.height },
        originalSize: { width: img.naturalWidth, height: img.naturalHeight }
      })

    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'image:', error)

      // Afficher un placeholder d'erreur
      placeholder.clear()
      placeholder.rect(0, 0, imageElement.transform.width, imageElement.transform.height)
      placeholder.fill({ color: 0xfef2f2, alpha: 0.8 })
      placeholder.stroke({ width: 2, color: 0xfca5a5 })

      loadingText.text = 'Erreur de chargement'
      loadingText.style.fill = 0xdc2626
      loadingText.x = imageElement.transform.width / 2 - loadingText.width / 2
    }
  }

  // Lancer le chargement
  loadImage()

  // Appliquer les transformations
  updateElementTransform(container, imageElement.transform)

  return container
}

// Mettre à jour un élément PixiJS existant
function updatePixiElement(pixiElement: any, element: AssemblyElement): void {
  updateElementTransform(pixiElement, element.transform)

  // Mettre à jour les propriétés spécifiques selon le type
  if (element.type === 'panel') {
    // Pour les panels, redessiner la géométrie si les dimensions ont changé
    const panelElement = element as PanelElement
    const graphics = pixiElement.children.find((child: any) => child instanceof Graphics)
    if (graphics) {
      graphics.clear()
      graphics.rect(0, 0, panelElement.transform.width, panelElement.transform.height)

      if (panelElement.panelStyle.fillColor !== null) {
        graphics.fill({
          color: panelElement.panelStyle.fillColor,
          alpha: panelElement.panelStyle.fillAlpha
        })
      }

      graphics.stroke({
        width: panelElement.panelStyle.borderWidth,
        color: panelElement.panelStyle.borderColor
      })
    }
  } else if (element.type === 'text') {
    const textChild = pixiElement.children.find((child: any) => child instanceof Text)
    if (textChild && 'text' in element) {
      textChild.text = element.text
    }
  } else if (element.type === 'dialogue') {
    // ✅ POUR LES BULLES DE DIALOGUE - REDESSINER COMPLÈTEMENT
    const dialogueElement = element as DialogueElement
    const graphics = pixiElement.children.find((child: any) => child instanceof Graphics)
    if (graphics) {
      // Effacer et redessiner la bulle avec les nouvelles dimensions
      graphics.clear()

      // Utiliser la fonction de création de bulle existante
      const bubbleConfig = createAdvancedBubbleConfig(dialogueElement)

      switch (dialogueElement.bubbleStyle.type) {
        case 'speech':
          drawAdvancedSpeechBubble(graphics, bubbleConfig)
          break
        case 'thought':
          drawAdvancedThoughtBubble(graphics, bubbleConfig)
          break
        case 'shout':
          drawAdvancedShoutBubble(graphics, bubbleConfig)
          break
        case 'whisper':
          drawAdvancedWhisperBubble(graphics, bubbleConfig)
          break
        case 'explosion':
          drawAdvancedExplosionBubble(graphics, bubbleConfig)
          break
        default:
          drawAdvancedSpeechBubble(graphics, bubbleConfig)
      }

      console.log('💬 Bulle redimensionnée:', {
        id: dialogueElement.id,
        newSize: { width: dialogueElement.transform.width, height: dialogueElement.transform.height },
        type: dialogueElement.bubbleStyle.type
      })
    }

    // ✅ RECENTRER LE TEXTE AUTOMATIQUEMENT LORS DU REDIMENSIONNEMENT
    const textChild = pixiElement.children.find((child: any) => child instanceof Text && child.name === 'bubbleText')
    if (textChild) {
      // Mettre à jour le contenu du texte
      const displayText = (dialogueElement.text && dialogueElement.text.trim() !== '')
        ? dialogueElement.text
        : 'Nouveau texte...'
      textChild.text = displayText

      // ✅ METTRE À JOUR LE STYLE AVEC WRAPPING INTELLIGENT
      const style = dialogueElement.bubbleStyle
      const wrapWidth = calculateOptimalWrapWidth(dialogueElement.transform.width, dialogueElement.transform.height)
      textChild.style = new TextStyle({
        fontSize: style.fontSize,
        fontFamily: style.fontFamily,
        fill: style.textColor,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: wrapWidth,
        breakWords: true // Permet de couper les mots très longs
      })

      // ✅ RECENTRAGE AUTOMATIQUE EN TEMPS RÉEL
      textChild.anchor.set(0.5, 0.5)
      textChild.x = dialogueElement.transform.width / 2
      textChild.y = dialogueElement.transform.height / 2

      console.log('🎯 Texte recentré automatiquement:', {
        elementId: dialogueElement.id,
        bubbleSize: { width: dialogueElement.transform.width, height: dialogueElement.transform.height },
        textPosition: { x: textChild.x, y: textChild.y },
        newText: displayText
      })
    }
  } else if (element.type === 'image') {
    // Pour les images, mettre à jour SEULEMENT la taille et position
    const imageElement = element as ImageElement
    const sprite = pixiElement.children.find((child: any) => child instanceof Sprite)
    if (sprite) {
      // Mettre à jour SEULEMENT la taille si elle a changé
      if (sprite.width !== imageElement.transform.width || sprite.height !== imageElement.transform.height) {
        sprite.width = imageElement.transform.width
        sprite.height = imageElement.transform.height
        console.log('🖼️ Taille image mise à jour:', {
          id: imageElement.id,
          newSize: { width: sprite.width, height: sprite.height }
        })
      }

      // ❌ NE PAS recréer la texture - cela cause la disparition de l'image
      // La texture est créée une seule fois lors de createImageElement
      // et ne doit jamais être recréée lors des mises à jour
    }
  }
}

// Appliquer les transformations à un élément PixiJS
function updateElementTransform(pixiElement: any, transform: any): void {
  // Debug uniquement si les valeurs semblent problématiques
  if (isNaN(transform.x) || isNaN(transform.y) || transform.x < -10000 || transform.y < -10000) {
    console.error('🚨 updateElementTransform - Valeurs suspectes:', {
      elementName: pixiElement.name || pixiElement.label,
      transform: {
        x: transform.x,
        y: transform.y,
        width: transform.width,
        height: transform.height
      }
    })
  }

  pixiElement.x = transform.x
  pixiElement.y = transform.y
  pixiElement.rotation = transform.rotation
  pixiElement.alpha = transform.alpha
  pixiElement.zIndex = transform.zIndex

  if ('width' in transform && 'height' in transform) {
    // Pour les éléments avec taille fixe, on peut ajuster l'échelle si nécessaire
    // Ceci sera amélioré dans les prochaines versions
  }
}

// Hook personnalisé pour utiliser l'application PixiJS
export function usePixiApp() {
  const { pixiApp } = useCanvasContext()
  return pixiApp
}

'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, ReactNode } from 'react'
import { Application } from 'pixi.js'
import { AssemblyElement, LayerType, PageState, PixiConfig, BubbleType } from '../types/assembly.types'

// Service fonctionnel pour voir les vrais changements
class SimplePanelContentService {
  public associations: Map<string, any> = new Map()
  private listeners: Array<() => void> = []

  // Ajouter un listener pour les changements
  addListener(callback: () => void) {
    this.listeners.push(callback)
  }

  // Notifier les changements
  private notifyChange() {
    this.listeners.forEach(callback => callback())
  }

  // Calculer l'intersection entre une image et un panel
  private calculateIntersection(imageElement: any, panelElement: any): number {
    const imgBounds = imageElement.transform
    const panelBounds = panelElement.transform

    const left = Math.max(panelBounds.x, imgBounds.x)
    const top = Math.max(panelBounds.y, imgBounds.y)
    const right = Math.min(panelBounds.x + panelBounds.width, imgBounds.x + imgBounds.width)
    const bottom = Math.min(panelBounds.y + panelBounds.height, imgBounds.y + imgBounds.height)

    if (left >= right || top >= bottom) return 0

    const intersectionArea = (right - left) * (bottom - top)
    const imageArea = imgBounds.width * imgBounds.height
    return (intersectionArea / imageArea) * 100
  }

  detectImagesUnderPanel(panelId: string, elements: AssemblyElement[]): any[] {
    const panel = elements.find(el => el.id === panelId && el.type === 'panel')
    if (!panel) return []

    const images = elements.filter(el => el.type === 'image')
    const intersections = []

    for (const image of images) {
      const coverage = this.calculateIntersection(image, panel)
      if (coverage > 0) {
        intersections.push({
          imageId: image.id,
          panelId: panelId,
          coveragePercentage: coverage,
          isSignificant: coverage > 10 // Seuil de 10%
        })
      }
    }

    console.log('🔍 Intersections détectées:', intersections)
    return intersections
  }

  createAutomaticAssociation(panelId: string, imageIds: string[]): void {
    if (imageIds.length > 0) {
      this.associations.set(panelId, {
        panelId,
        imageIds,
        associationType: 'automatic',
        maskEnabled: true,
        createdAt: Date.now()
      })
      console.log('✅ Association automatique créée:', panelId, imageIds)
      this.notifyChange()
    }
  }

  addImageToPanel(panelId: string, imageId: string): void {
    const existing = this.associations.get(panelId)
    if (existing) {
      if (!existing.imageIds.includes(imageId)) {
        existing.imageIds.push(imageId)
      }
    } else {
      this.associations.set(panelId, {
        panelId,
        imageIds: [imageId],
        associationType: 'manual',
        maskEnabled: true,
        createdAt: Date.now()
      })
    }
    console.log('➕ Image ajoutée au panel:', panelId, imageId)
    this.notifyChange()
  }

  removeImageFromPanel(panelId: string, imageId: string): void {
    const existing = this.associations.get(panelId)
    if (existing) {
      existing.imageIds = existing.imageIds.filter(id => id !== imageId)
      if (existing.imageIds.length === 0) {
        this.associations.delete(panelId)
      }
    }
    console.log('➖ Image supprimée du panel:', panelId, imageId)
    this.notifyChange()
  }

  getImagesForPanel(panelId: string): string[] {
    const association = this.associations.get(panelId)
    return association ? association.imageIds : []
  }

  getAllAssociations(): any[] {
    return Array.from(this.associations.values())
  }

  removeAssociation(panelId: string): void {
    this.associations.delete(panelId)
    console.log('🗑️ Association supprimée:', panelId)
    this.notifyChange()
  }

  cleanup(elementIds: string[]): void {
    // Supprimer les associations pour les éléments qui n'existent plus
    for (const [panelId] of this.associations) {
      if (!elementIds.includes(panelId)) {
        this.associations.delete(panelId)
      }
    }
    this.notifyChange()
  }

  toggleMasking(panelId: string, enabled: boolean): void {
    const association = this.associations.get(panelId)
    if (association) {
      association.maskEnabled = enabled
      console.log('🎭 Masquage modifié:', panelId, enabled)
      this.notifyChange()
    }
  }

  // Vérifier si un panel a des associations
  hasAssociations(panelId: string): boolean {
    return this.associations.has(panelId)
  }
}

const panelContentService = new SimplePanelContentService()

// Configuration par défaut optimisée pour les performances
export const OPTIMIZED_PIXI_CONFIG: PixiConfig = {
  width: 1200,
  height: 1600,
  backgroundColor: 0xF8F8F8,
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
}

// Interface pour l'état du canvas optimisé
interface CanvasState {
  // Application PixiJS
  pixiApp: Application | null
  
  // État des pages
  currentPageId: string | null
  pages: Map<string, PageState>
  
  // Éléments de la page courante
  elements: AssemblyElement[]
  selectedElementIds: string[]
  
  // Outils et interface
  activeTool: 'select' | 'move' | 'panel' | 'dialogue' | 'text' | 'image'
  showGrid: boolean
  gridSize: number
  zoom: number
  
  // Couches optimisées
  layers: Record<LayerType, {
    visible: boolean
    locked: boolean
    opacity: number
  }>
  
  // Historique optimisé
  history: {
    past: AssemblyElement[][]
    present: AssemblyElement[]
    future: AssemblyElement[][]
  }
  
  // Interface utilisateur
  ui: {
    toolbarVisible: boolean
    propertiesPanelVisible: boolean
    layersPanelVisible: boolean
    imageLibraryVisible: boolean
    bubbleTypeModalVisible: boolean
    bubblePlacementMode: boolean
    bubbleTypeToPlace: BubbleType | null
  }
  
  // État de sauvegarde
  saveState: {
    isDirty: boolean
    isLoading: boolean
    lastSaved: Date | null
    autoSaveEnabled: boolean
  }
}

// Interface pour les actions du canvas
interface CanvasActions {
  // Initialisation
  initializePixiApp: (app: Application) => void

  // Gestion des éléments
  addElement: (element: AssemblyElement) => void
  updateElement: (id: string, updates: Partial<AssemblyElement>) => void
  removeElement: (id: string) => void
  removeElements: (ids: string[]) => void

  // Sélection
  selectElement: (id: string | null) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void

  // Outils
  setActiveTool: (tool: CanvasState['activeTool']) => void
  setZoom: (zoom: number) => void
  setGridSize: (size: number) => void
  toggleGrid: () => void

  // Services
  panelContentService: SimplePanelContentService
  
  // Couches
  toggleLayerVisibility: (layer: LayerType) => void
  toggleLayerLock: (layer: LayerType) => void
  setLayerOpacity: (layer: LayerType, opacity: number) => void
  
  // Historique
  undo: () => void
  redo: () => void
  pushToHistory: () => void
  
  // Interface
  toggleToolbar: () => void
  togglePropertiesPanel: () => void
  toggleLayersPanel: () => void
  toggleImageLibrary: () => void
  toggleBubbleTypeModal: () => void
  closeBubbleTypeModal: () => void
  setBubbleCreationPosition: (x: number, y: number) => void
  setBubbleTypeAndCreate: (type: BubbleType) => void
  startBubblePlacement: (type: BubbleType) => void
  placeBubbleAtPosition: (x: number, y: number, bubbleType?: BubbleType) => void
  cancelBubblePlacement: () => void
  
  // Sauvegarde
  markDirty: () => void
  markClean: () => void
  setSaveLoading: (loading: boolean) => void
  setLastSaved: (date: Date) => void
}

// Type combiné pour le contexte
type CanvasContextType = CanvasState & CanvasActions

// Couches initiales optimisées
const initialLayers: CanvasState['layers'] = {
  background: { visible: true, locked: false, opacity: 1 },
  panels: { visible: true, locked: false, opacity: 1 },
  characters: { visible: true, locked: false, opacity: 1 },
  dialogue: { visible: true, locked: false, opacity: 1 },
  ui: { visible: true, locked: false, opacity: 1 }
}

// État initial optimisé
const initialState: CanvasState = {
  pixiApp: null,
  currentPageId: null,
  pages: new Map(),
  elements: [],
  selectedElementIds: [],
  activeTool: 'select',
  showGrid: true,
  gridSize: 20,
  zoom: 100,
  layers: initialLayers,
  history: {
    past: [],
    present: [],
    future: []
  },
  ui: {
    toolbarVisible: true,
    propertiesPanelVisible: true,
    layersPanelVisible: false,
    imageLibraryVisible: false,
    bubbleTypeModalVisible: false,
    bubblePlacementMode: false,
    bubbleTypeToPlace: null
  },
  saveState: {
    isDirty: false,
    isLoading: false,
    lastSaved: null,
    autoSaveEnabled: true
  }
}

// Création du contexte
const CanvasContext = createContext<CanvasContextType | null>(null)

// Hook pour utiliser le contexte (version robuste)
export const useCanvasContext = () => {
  const context = useContext(CanvasContext)
  if (!context) {
    // En mode développement, afficher un warning au lieu de lancer une erreur
    if (process.env.NODE_ENV === 'development') {
      console.warn('useCanvasContext must be used within a CanvasProvider')
    }
    // Retourner un contexte par défaut pour éviter les crashes
    return {
      ...initialState,
      // Actions vides pour éviter les erreurs
      initializePixiApp: () => {},
      addElement: () => {},
      updateElement: () => {},
      removeElement: () => {},
      removeElements: () => {},
      selectElement: () => {},
      selectElements: () => {},
      clearSelection: () => {},
      setActiveTool: () => {},
      setZoom: () => {},
      setGridSize: () => {},
      toggleGrid: () => {},
      toggleLayerVisibility: () => {},
      toggleLayerLock: () => {},
      setLayerOpacity: () => {},
      undo: () => {},
      redo: () => {},
      pushToHistory: () => {},
      toggleToolbar: () => {},
      togglePropertiesPanel: () => {},
      toggleLayersPanel: () => {},
      toggleImageLibrary: () => {},
      markDirty: () => {},
      markClean: () => {},
      setSaveLoading: () => {},
      setLastSaved: () => {}
    } as CanvasContextType
  }
  return context
}

// Générateurs d'ID optimisés (compatibles SSR)
let elementCounter = 0
let pageCounter = 0

export const generateElementId = () => {
  elementCounter++
  return `element_${elementCounter}_${typeof window !== 'undefined' ? Date.now() : 'ssr'}`
}

export const generatePageId = () => {
  pageCounter++
  return `page_${pageCounter}_${typeof window !== 'undefined' ? Date.now() : 'ssr'}`
}

// Provider du contexte avec optimisations de performance
interface CanvasProviderProps {
  children: ReactNode
}

export const CanvasProvider: React.FC<CanvasProviderProps> = ({ children }) => {
  // État principal avec useState pour garantir la réactivité
  const [state, setState] = useState<CanvasState>(initialState)

  // Actions optimisées avec useCallback (définies séparément pour éviter les erreurs de hooks)
  const initializePixiApp = useCallback((app: Application) => {
    setState(prev => ({ ...prev, pixiApp: app }))
  }, [])

  const addElement = useCallback((element: AssemblyElement) => {
    console.log('🎯 CanvasContext addElement appelé:', element)
    setState(prev => {
      const newElements = [...prev.elements, element]
      console.log('🎯 CanvasContext éléments avant:', prev.elements.length)
      console.log('🎯 CanvasContext éléments après:', newElements.length)
      return {
        ...prev,
        elements: newElements,
        saveState: { ...prev.saveState, isDirty: true },
        history: {
          past: [...prev.history.past, prev.history.present],
          present: newElements,
          future: []
        }
      }
    })
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<AssemblyElement>) => {
    setState(prev => {
      const newElements = prev.elements.map(el =>
        el.id === id ? { ...el, ...updates } : el
      )
      return {
        ...prev,
        elements: newElements,
        saveState: { ...prev.saveState, isDirty: true }
      }
    })
  }, [])

  const removeElement = useCallback((id: string) => {
    setState(prev => {
      const newElements = prev.elements.filter(el => el.id !== id)
      const newSelectedIds = prev.selectedElementIds.filter(selectedId => selectedId !== id)
      return {
        ...prev,
        elements: newElements,
        selectedElementIds: newSelectedIds,
        saveState: { ...prev.saveState, isDirty: true }
      }
    })
  }, [])

  const removeElements = useCallback((ids: string[]) => {
    setState(prev => {
      const newElements = prev.elements.filter(el => !ids.includes(el.id))
      const newSelectedIds = prev.selectedElementIds.filter(selectedId => !ids.includes(selectedId))
      return {
        ...prev,
        elements: newElements,
        selectedElementIds: newSelectedIds,
        saveState: { ...prev.saveState, isDirty: true }
      }
    })
  }, [])

  // Sélection
  const selectElement = useCallback((id: string | null) => {
    console.log('🎯 CanvasContext selectElement appelé:', {
      id,
      currentSelectedElementIds: state.selectedElementIds,
      willBecome: id ? [id] : []
    })
    setState(prev => {
      const newState = { ...prev, selectedElementIds: id ? [id] : [] }
      console.log('🎯 CanvasContext setState selectElement:', {
        before: prev.selectedElementIds,
        after: newState.selectedElementIds
      })
      return newState
    })
  }, [state.selectedElementIds])

  const selectElements = useCallback((ids: string[]) => {
    setState(prev => ({ ...prev, selectedElementIds: ids }))
  }, [])

  const clearSelection = useCallback(() => {
    console.log('🧹 CanvasContext clearSelection appelé:', {
      currentSelectedElementIds: state.selectedElementIds
    })
    // Éviter les appels inutiles si déjà vide
    if (state.selectedElementIds.length === 0) {
      console.log('🧹 CanvasContext clearSelection ignoré: déjà vide')
      return
    }
    setState(prev => {
      const newState = { ...prev, selectedElementIds: [] }
      console.log('🧹 CanvasContext setState clearSelection:', {
        before: prev.selectedElementIds,
        after: newState.selectedElementIds
      })
      return newState
    })
  }, [state.selectedElementIds])

  // Outils
  const setActiveTool = useCallback((tool: CanvasState['activeTool']) => {
    console.log('🎯 CanvasContext setActiveTool appelé:', tool)
    setState(prev => {
      console.log('🎯 CanvasContext activeTool avant:', prev.activeTool)
      const newState = { ...prev, activeTool: tool }
      console.log('🎯 CanvasContext activeTool après:', newState.activeTool)
      return newState
    })
  }, [])

  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({ ...prev, zoom }))
  }, [])

  const setGridSize = useCallback((size: number) => {
    setState(prev => ({ ...prev, gridSize: size }))
  }, [])

  const toggleGrid = useCallback(() => {
    setState(prev => ({ ...prev, showGrid: !prev.showGrid }))
  }, [])

  // Actions simplifiées pour les autres fonctionnalités
  const toggleLayerVisibility = useCallback((layer: LayerType) => {
    setState(prev => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layer]: { ...prev.layers[layer], visible: !prev.layers[layer].visible }
      }
    }))
  }, [])

  const toggleLayerLock = useCallback((layer: LayerType) => {
    setState(prev => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layer]: { ...prev.layers[layer], locked: !prev.layers[layer].locked }
      }
    }))
  }, [])

  const setLayerOpacity = useCallback((layer: LayerType, opacity: number) => {
    setState(prev => ({
      ...prev,
      layers: {
        ...prev.layers,
        [layer]: { ...prev.layers[layer], opacity }
      }
    }))
  }, [])

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.history.past.length === 0) return prev

      const previous = prev.history.past[prev.history.past.length - 1]
      const newPast = prev.history.past.slice(0, -1)

      return {
        ...prev,
        elements: previous,
        history: {
          past: newPast,
          present: previous,
          future: [prev.history.present, ...prev.history.future]
        }
      }
    })
  }, [])

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.history.future.length === 0) return prev

      const next = prev.history.future[0]
      const newFuture = prev.history.future.slice(1)

      return {
        ...prev,
        elements: next,
        history: {
          past: [...prev.history.past, prev.history.present],
          present: next,
          future: newFuture
        }
      }
    })
  }, [])

  const pushToHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      history: {
        past: [...prev.history.past, prev.history.present].slice(-50),
        present: [...prev.elements],
        future: []
      }
    }))
  }, [])

  const toggleToolbar = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, toolbarVisible: !prev.ui.toolbarVisible }
    }))
  }, [])

  const togglePropertiesPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, propertiesPanelVisible: !prev.ui.propertiesPanelVisible }
    }))
  }, [])

  const toggleLayersPanel = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, layersPanelVisible: !prev.ui.layersPanelVisible }
    }))
  }, [])

  const toggleImageLibrary = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, imageLibraryVisible: !prev.ui.imageLibraryVisible }
    }))
  }, [])

  // ✅ NOUVELLES ACTIONS POUR LA MODAL DE BULLE
  const toggleBubbleTypeModal = useCallback(() => {
    setState(prev => {
      const newVisible = !prev.ui.bubbleTypeModalVisible
      console.log('🎯 toggleBubbleTypeModal:', prev.ui.bubbleTypeModalVisible, '→', newVisible)
      return {
        ...prev,
        ui: { ...prev.ui, bubbleTypeModalVisible: newVisible }
      }
    })
  }, [])

  const closeBubbleTypeModal = useCallback(() => {
    console.log('🎯 closeBubbleTypeModal: fermeture directe')
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, bubbleTypeModalVisible: false }
    }))
  }, [])

  // État temporaire pour stocker les données de création de bulle
  const bubbleCreationData = useRef<{ x: number, y: number, type?: BubbleType } | null>(null)

  const setBubbleCreationPosition = useCallback((x: number, y: number) => {
    bubbleCreationData.current = { x, y }
  }, [])

  const setBubbleTypeAndCreate = useCallback((type: BubbleType) => {
    const data = bubbleCreationData.current
    if (!data) {
      console.error('❌ Aucune position de création stockée')
      return
    }

    console.log('💬 Création bulle avec type:', type, 'à position:', { x: data.x, y: data.y })

    // Créer la bulle avec le type sélectionné
    const bubble: AssemblyElement = {
      id: generateElementId(),
      type: 'dialogue',
      layerType: 'dialogue',
      text: 'Nouveau texte...',
      transform: {
        x: data.x,
        y: data.y,
        rotation: 0,
        alpha: 1,
        zIndex: 200,
        width: 150,
        height: 80
      },
      bubbleStyle: {
        type: type,
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        textColor: 0x000000,
        dashedOutline: type === 'whisper',
        tailPosition: 'bottom-left',
        fontSize: 14,
        fontFamily: 'Arial',
        textAlign: 'center',

        // ✅ NOUVELLES PROPRIÉTÉS AVANCÉES AVEC VALEURS OPTIMISÉES
        tailPositionPercent: 0.25,     // Position à 25% (inspiré des articles CSS)
        tailOffset: 0,                 // Pas de décalage par défaut
        tailAngle: type === 'shout' ? 60 : 90,  // Angle adapté au type
        borderWidth: type === 'shout' ? 4 :
                     type === 'whisper' ? 2 : 3,
        borderRadius: type === 'thought' ? 50 :
                      type === 'whisper' ? 18 : 12,
        hasGradient: false,            // Gradients désactivés pour l'instant
        shadowEnabled: false           // Ombres désactivées pour l'instant
      },
      properties: {
        name: `Bulle ${type}`,
        locked: false,
        visible: true,
        blendMode: 'normal'
      }
    }

    // Ajouter la bulle
    addElement(bubble)

    // Fermer la modal et nettoyer
    setState(prev => ({
      ...prev,
      ui: { ...prev.ui, bubbleTypeModalVisible: false }
    }))
    bubbleCreationData.current = null
  }, [addElement])

  // ✅ NOUVELLES ACTIONS POUR LE WORKFLOW UX AMÉLIORÉ
  const startBubblePlacement = useCallback((type: BubbleType) => {
    console.log('🎯 Démarrage mode placement bulle:', type)

    // ✅ CORRECTION : Utiliser une approche en deux étapes pour garantir la mise à jour
    setState(prev => {
      const newState = {
        ...prev,
        ui: {
          ...prev.ui,
          bubbleTypeModalVisible: false,
          bubblePlacementMode: true,
          bubbleTypeToPlace: type
        }
      }
      console.log('🎯 Nouvel état UI après startBubblePlacement:', newState.ui)

      // Forcer un re-rendu avec un délai minimal
      setTimeout(() => {
        console.log('🎯 Vérification état après timeout:', newState.ui)
      }, 10)

      return newState
    })
  }, [])

  const placeBubbleAtPosition = useCallback((x: number, y: number, bubbleType?: BubbleType) => {
    console.log('💬 placeBubbleAtPosition appelé:', { x, y, bubbleType })
    console.log('💬 État actuel:', {
      bubblePlacementMode: state.ui.bubblePlacementMode,
      bubbleTypeToPlace: state.ui.bubbleTypeToPlace
    })

    // Utiliser le type passé en paramètre ou celui de l'état
    const typeToUse = bubbleType || state.ui.bubbleTypeToPlace
    if (!typeToUse) {
      console.error('❌ Aucun type de bulle à placer')
      console.error('❌ État UI complet:', state.ui)
      return
    }

    console.log('💬 Placement bulle:', typeToUse, 'à position:', { x, y })

    // Créer la bulle
    const bubble: AssemblyElement = {
      id: generateElementId(),
      type: 'dialogue',
      layerType: 'dialogue',
      text: 'Nouveau texte...',
      transform: {
        x,
        y,
        rotation: 0,
        alpha: 1,
        zIndex: 200,
        width: 150,
        height: 80
      },
      bubbleStyle: {
        type: typeToUse,
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        textColor: 0x000000,
        dashedOutline: typeToUse === 'whisper',
        tailPosition: 'bottom-left',
        fontSize: 14,
        fontFamily: 'Arial',
        textAlign: 'center'
      },
      properties: {
        name: `Bulle ${typeToUse}`,
        locked: false,
        visible: true,
        blendMode: 'normal'
      }
    }

    // Ajouter la bulle
    addElement(bubble)

    // Sélectionner automatiquement la bulle créée
    selectElement(bubble.id)

    // Sortir du mode placement et passer au SelectTool
    setState(prev => ({
      ...prev,
      activeTool: 'select',
      ui: {
        ...prev.ui,
        bubblePlacementMode: false,
        bubbleTypeToPlace: null
      }
    }))
  }, [state.ui.bubbleTypeToPlace, addElement, selectElement])

  const cancelBubblePlacement = useCallback(() => {
    console.log('❌ Annulation placement bulle')
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        bubblePlacementMode: false,
        bubbleTypeToPlace: null
      }
    }))
  }, [])

  const markDirty = useCallback(() => {
    setState(prev => ({
      ...prev,
      saveState: { ...prev.saveState, isDirty: true }
    }))
  }, [])

  const markClean = useCallback(() => {
    setState(prev => ({
      ...prev,
      saveState: { ...prev.saveState, isDirty: false }
    }))
  }, [])

  const setSaveLoading = useCallback((loading: boolean) => {
    setState(prev => ({
      ...prev,
      saveState: { ...prev.saveState, isLoading: loading }
    }))
  }, [])

  const setLastSaved = useCallback((date: Date) => {
    setState(prev => ({
      ...prev,
      saveState: { ...prev.saveState, lastSaved: date, isDirty: false }
    }))
  }, [])

  // Valeur du contexte optimisée
  const contextValue = useMemo<CanvasContextType>(() => ({
    ...state,
    initializePixiApp,
    addElement,
    updateElement,
    removeElement,
    removeElements,
    selectElement,
    selectElements,
    clearSelection,
    setActiveTool,
    setZoom,
    setGridSize,
    toggleGrid,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    undo,
    redo,
    pushToHistory,
    toggleToolbar,
    togglePropertiesPanel,
    toggleLayersPanel,
    toggleImageLibrary,
    toggleBubbleTypeModal,
    closeBubbleTypeModal,
    setBubbleCreationPosition,
    setBubbleTypeAndCreate,
    startBubblePlacement,
    placeBubbleAtPosition,
    cancelBubblePlacement,
    markDirty,
    markClean,
    setSaveLoading,
    setLastSaved,
    panelContentService
  }), [
    state,
    initializePixiApp,
    addElement,
    updateElement,
    removeElement,
    removeElements,
    selectElement,
    selectElements,
    clearSelection,
    setActiveTool,
    setZoom,
    setGridSize,
    toggleGrid,
    toggleLayerVisibility,
    toggleLayerLock,
    setLayerOpacity,
    undo,
    redo,
    pushToHistory,
    toggleToolbar,
    togglePropertiesPanel,
    toggleLayersPanel,
    toggleImageLibrary,
    toggleBubbleTypeModal,
    closeBubbleTypeModal,
    setBubbleCreationPosition,
    setBubbleTypeAndCreate,
    startBubblePlacement,
    placeBubbleAtPosition,
    cancelBubblePlacement,
    markDirty,
    markClean,
    setSaveLoading,
    setLastSaved
  ])

  return (
    <CanvasContext.Provider value={contextValue}>
      {children}
    </CanvasContext.Provider>
  )
}

'use client'

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import {
  PolotnoContextType,
  PolotnoContextState,
  PolotnoTool,
  BubbleType,
  DEFAULT_BUBBLE_STYLES,
  DEFAULT_PANEL_STYLE,
  DEFAULT_CANVAS_CONFIG
} from '../types/polotno.types'

// Niveaux de zoom autorisés (en pourcentage)
const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400]

// Actions pour le reducer
type PolotnoAction =
  | { type: 'INITIALIZE_STORE'; payload: any }
  | { type: 'SET_ACTIVE_TOOL'; payload: PolotnoTool }
  | { type: 'SET_SELECTED_ELEMENTS'; payload: string[] }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'START_BUBBLE_CREATION'; payload: BubbleType }
  | { type: 'CANCEL_BUBBLE_CREATION' }
  | { type: 'TOGGLE_GRID' }
  | { type: 'ZOOM_IN' }
  | { type: 'ZOOM_OUT' }
  | { type: 'SET_ZOOM_LEVEL'; payload: number }
  | { type: 'RESET_ZOOM' }
  | { type: 'MARK_DIRTY' }
  | { type: 'MARK_CLEAN' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }

// État initial
const initialState: PolotnoContextState = {
  store: null,
  activeTool: 'select',
  selectedElementIds: [],
  canvasWidth: DEFAULT_CANVAS_CONFIG.width,
  canvasHeight: DEFAULT_CANVAS_CONFIG.height,
  zoom: 100,
  bubbleCreationMode: false,
  bubbleTypeToCreate: null,
  gridVisible: false,
  zoomLevel: 100,
  isDirty: false,
  isLoading: false,
  lastSaved: null
}

// Reducer
function polotnoReducer(state: PolotnoContextState, action: PolotnoAction): PolotnoContextState {
  switch (action.type) {
    case 'INITIALIZE_STORE':
      return { ...state, store: action.payload }
    
    case 'SET_ACTIVE_TOOL':
      return { 
        ...state, 
        activeTool: action.payload,
        bubbleCreationMode: false,
        bubbleTypeToCreate: null
      }
    
    case 'SET_SELECTED_ELEMENTS':
      return { ...state, selectedElementIds: action.payload }
    
    case 'SET_ZOOM':
      return { ...state, zoom: action.payload }
    
    case 'START_BUBBLE_CREATION':
      return {
        ...state,
        bubbleCreationMode: true,
        bubbleTypeToCreate: action.payload,
        activeTool: 'bubble'
      }
    
    case 'CANCEL_BUBBLE_CREATION':
      return {
        ...state,
        bubbleCreationMode: false,
        bubbleTypeToCreate: null,
        activeTool: 'select'
      }

    case 'TOGGLE_GRID':
      return { ...state, gridVisible: !state.gridVisible }

    case 'ZOOM_IN':
      const currentIndexIn = ZOOM_LEVELS.indexOf(state.zoomLevel)
      const nextIndexIn = Math.min(currentIndexIn + 1, ZOOM_LEVELS.length - 1)
      return { ...state, zoomLevel: ZOOM_LEVELS[nextIndexIn], zoom: ZOOM_LEVELS[nextIndexIn] }

    case 'ZOOM_OUT':
      const currentIndexOut = ZOOM_LEVELS.indexOf(state.zoomLevel)
      const nextIndexOut = Math.max(currentIndexOut - 1, 0)
      return { ...state, zoomLevel: ZOOM_LEVELS[nextIndexOut], zoom: ZOOM_LEVELS[nextIndexOut] }

    case 'SET_ZOOM_LEVEL':
      const validLevel = ZOOM_LEVELS.includes(action.payload) ? action.payload : 100
      return { ...state, zoomLevel: validLevel, zoom: validLevel }

    case 'RESET_ZOOM':
      return { ...state, zoomLevel: 100, zoom: 100 }

    case 'MARK_DIRTY':
      return { ...state, isDirty: true }
    
    case 'MARK_CLEAN':
      return { ...state, isDirty: false }
    
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload, isDirty: false }
    
    default:
      return state
  }
}

// Création du contexte
const PolotnoContext = createContext<PolotnoContextType | null>(null)

// Hook pour utiliser le contexte
export const usePolotnoContext = (): PolotnoContextType => {
  const context = useContext(PolotnoContext)
  if (!context) {
    throw new Error('usePolotnoContext must be used within a PolotnoProvider')
  }
  return context
}

// Provider component
interface PolotnoProviderProps {
  children: React.ReactNode
}

export const PolotnoProvider: React.FC<PolotnoProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(polotnoReducer, initialState)

  // Actions
  const initializeStore = useCallback((store: any) => {
    dispatch({ type: 'INITIALIZE_STORE', payload: store })
    
    // Configuration initiale du store
    store.setSize(state.canvasWidth, state.canvasHeight)
    
    // Écouter les changements pour marquer comme dirty
    store.on('change', () => {
      dispatch({ type: 'MARK_DIRTY' })
    })
  }, [state.canvasWidth, state.canvasHeight])



  const setActiveTool = useCallback((tool: PolotnoTool) => {
    dispatch({ type: 'SET_ACTIVE_TOOL', payload: tool })
  }, [])

  const addPanel = useCallback((x: number, y: number, width = 200, height = 150) => {
    console.log('🎯 PolotnoContext addPanel appelé:', { x, y, width, height })
    // Cette fonction est maintenant gérée directement par SimpleCanvasEditor
    // Nous gardons la signature pour la compatibilité
  }, [])

  const addBubble = useCallback((x: number, y: number, bubbleType: BubbleType, text = 'Votre texte ici') => {
    console.log('🎯 PolotnoContext addBubble appelé:', { x, y, bubbleType, text })
    // Cette fonction est maintenant gérée directement par SimpleCanvasEditor
    // Nous gardons la signature pour la compatibilité
  }, [])

  const addImage = useCallback((x: number, y: number, imageUrl: string) => {
    console.log('🎯 PolotnoContext addImage appelé:', { x, y, imageUrl })
    // Cette fonction est maintenant gérée directement par SimpleCanvasEditor
    // Nous gardons la signature pour la compatibilité
  }, [])

  const deleteSelectedElements = useCallback(() => {
    if (!state.store) return

    const selectedElements = state.store.selectedElements
    selectedElements.forEach(element => {
      element.remove()
    })
    
    if (selectedElements.length > 0) {
      toast.success(`${selectedElements.length} élément(s) supprimé(s)`)
    }
  }, [state.store])

  const selectElement = useCallback((elementId: string) => {
    if (!state.store) return
    
    const element = state.store.getElementById(elementId)
    if (element) {
      state.store.selectElements([element])
    }
  }, [state.store])

  const selectElements = useCallback((elementIds: string[]) => {
    if (!state.store) return
    
    const elements = elementIds.map(id => state.store!.getElementById(id)).filter(Boolean)
    state.store.selectElements(elements)
  }, [state.store])

  const clearSelection = useCallback(() => {
    if (!state.store) return
    state.store.selectElements([])
  }, [state.store])

  const setZoom = useCallback((zoom: number) => {
    dispatch({ type: 'SET_ZOOM', payload: zoom })
    // TODO: Implémenter le zoom avec Polotno
  }, [])

  const resetView = useCallback(() => {
    setZoom(100)
    // TODO: Implémenter le reset de vue avec Polotno
  }, [setZoom])

  const startBubbleCreation = useCallback((bubbleType: BubbleType) => {
    dispatch({ type: 'START_BUBBLE_CREATION', payload: bubbleType })
  }, [])

  const cancelBubbleCreation = useCallback(() => {
    dispatch({ type: 'CANCEL_BUBBLE_CREATION' })
  }, [])

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' })
  }, [])

  const zoomIn = useCallback(() => {
    dispatch({ type: 'ZOOM_IN' })
  }, [])

  const zoomOut = useCallback(() => {
    dispatch({ type: 'ZOOM_OUT' })
  }, [])

  const setZoomLevel = useCallback((level: number) => {
    dispatch({ type: 'SET_ZOOM_LEVEL', payload: level })
  }, [])

  const resetZoom = useCallback(() => {
    dispatch({ type: 'RESET_ZOOM' })
  }, [])

  const saveProject = useCallback(async () => {
    if (!state.store) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const projectData = state.store.toJSON()
      // TODO: Implémenter la sauvegarde vers Supabase
      console.log('Sauvegarde du projet:', projectData)
      
      dispatch({ type: 'SET_LAST_SAVED', payload: new Date() })
      toast.success('Projet sauvegardé')
    } catch (error) {
      console.error('Erreur de sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.store])

  const loadProject = useCallback(async (projectData: any) => {
    if (!state.store) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      state.store.loadJSON(projectData)
      dispatch({ type: 'MARK_CLEAN' })
      toast.success('Projet chargé')
    } catch (error) {
      console.error('Erreur de chargement:', error)
      toast.error('Erreur lors du chargement')
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [state.store])

  const exportAsImage = useCallback(async (): Promise<string> => {
    if (!state.store) throw new Error('Store non initialisé')

    // TODO: Implémenter l'export avec Polotno
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }, [state.store])

  const exportAsPDF = useCallback(async (): Promise<Blob> => {
    // TODO: Implémenter l'export PDF avec jsPDF
    throw new Error('Export PDF non implémenté')
  }, [])

  const markDirty = useCallback(() => {
    dispatch({ type: 'MARK_DIRTY' })
  }, [])

  const markClean = useCallback(() => {
    dispatch({ type: 'MARK_CLEAN' })
  }, [])

  // Valeur du contexte
  const contextValue = useMemo<PolotnoContextType>(() => ({
    ...state,
    initializeStore,
    setActiveTool,
    addPanel,
    addBubble,
    addImage,
    deleteSelectedElements,
    selectElement,
    selectElements,
    clearSelection,
    setZoom,
    resetView,
    startBubbleCreation,
    cancelBubbleCreation,
    toggleGrid,
    zoomIn,
    zoomOut,
    setZoom: setZoomLevel,
    resetZoom,
    saveProject,
    loadProject,
    exportAsImage,
    exportAsPDF,
    markDirty,
    markClean
  }), [
    state,
    initializeStore,
    setActiveTool,
    addPanel,
    addBubble,
    addImage,
    deleteSelectedElements,
    selectElement,
    selectElements,
    clearSelection,
    setZoom,
    resetView,
    startBubbleCreation,
    cancelBubbleCreation,
    toggleGrid,
    zoomIn,
    zoomOut,
    setZoomLevel,
    resetZoom,
    saveProject,
    loadProject,
    exportAsImage,
    exportAsPDF,
    markDirty,
    markClean
  ])

  return (
    <PolotnoContext.Provider value={contextValue}>
      {children}
    </PolotnoContext.Provider>
  )
}

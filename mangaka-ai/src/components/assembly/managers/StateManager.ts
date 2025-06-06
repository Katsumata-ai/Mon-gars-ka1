// Gestionnaire d'état global pour l'assemblage PixiJS avec Zustand
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { Application } from 'pixi.js'
import {
  AssemblyStore,
  AssemblyElement,
  LayerType,
  PageState,
  PixiConfig
} from '../types/assembly.types'

// Configuration par défaut pour PixiJS
export const DEFAULT_PIXI_CONFIG: PixiConfig = {
  width: 1200,
  height: 1600,
  backgroundColor: 0xF8F8F8,
  resolution: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
  antialias: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false
}

// État initial des couches
const initialLayers = {
  background: { visible: true, locked: false, opacity: 1 },
  characters: { visible: true, locked: false, opacity: 1 },
  panels: { visible: true, locked: false, opacity: 1 },
  dialogue: { visible: true, locked: false, opacity: 1 },
  ui: { visible: true, locked: false, opacity: 1 }
}

// Store Zustand pour l'assemblage
export const useAssemblyStore = create<AssemblyStore>()(
  immer((set, get) => ({
    // État initial
    pixiApp: null,
    currentPageId: null,
    pages: {},
    elements: [],
    selectedElementIds: [],
    
    // Outils et interface
    activeTool: 'select',
    showGrid: true,
    gridSize: 20,
    zoom: 100,
    
    // Couches
    layers: initialLayers,
    
    // Historique
    history: {
      past: [],
      present: [],
      future: []
    },
    
    // Interface utilisateur
    ui: {
      toolbarVisible: true,
      propertiesPanelVisible: true,
      layersPanelVisible: false,
      imageLibraryVisible: false
    },
    
    // Sauvegarde
    saveState: {
      isDirty: false,
      isLoading: false,
      lastSaved: null,
      autoSaveEnabled: true
    },

    // Actions - Initialisation
    initializePixiApp: (app: Application) => {
      set((state) => {
        state.pixiApp = app
      })
    },

    setCurrentPage: (pageId: string) => {
      set((state) => {
        console.log('🏪 StateManager setCurrentPage appelé:', {
          pageId,
          currentElementsCount: state.elements.length,
          pageExists: !!state.pages[pageId]
        })

        state.currentPageId = pageId
        // Charger les éléments de la page si elle existe
        const page = state.pages[pageId]
        if (page) {
          console.log('🏪 Page trouvée, chargement des éléments:', page.content.stage.children.length)
          state.elements = page.content.stage.children
        } else {
          console.log('🏪 Page non trouvée, PRÉSERVATION des éléments existants:', state.elements.length)
          // ⚠️ NE PAS vider les éléments si la page n'existe pas encore
          // Cela permet de préserver les éléments créés avant la première sauvegarde
          // state.elements = [] // ← SUPPRIMÉ : Cause la perte des éléments !
        }
      })
    },

    // Actions - Gestion des éléments
    addElement: (element: AssemblyElement) => {
      console.log('🏪 StateManager addElement appelé:', element.id, element.type)
      set((state) => {
        state.elements.push(element)
        console.log('🏪 StateManager elements après ajout:', state.elements.length, state.elements.map(el => el.id))
        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
      })
    },

    updateElement: (id: string, updates: Partial<AssemblyElement>) => {
      set((state) => {
        const index = state.elements.findIndex(el => el.id === id)
        if (index !== -1) {
          state.elements[index] = { ...state.elements[index], ...updates } as AssemblyElement
          state.saveState.isDirty = true
        }
      })
    },

    deleteElement: (id: string) => {
      set((state) => {
        state.elements = state.elements.filter(el => el.id !== id)
        state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id)
        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
      })
    },

    deleteElements: (ids: string[]) => {
      set((state) => {
        state.elements = state.elements.filter(el => !ids.includes(el.id))
        state.selectedElementIds = state.selectedElementIds.filter(selectedId => !ids.includes(selectedId))
        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
      })
    },

    // Actions - Sélection
    selectElement: (id: string) => {
      console.log('🏪 StateManager selectElement appelé:', { id, currentSelected: get().selectedElementIds })
      set((state) => ({
        ...state,
        selectedElementIds: [id]
      }))
      console.log('🏪 StateManager selectedElementIds après:', get().selectedElementIds)
    },

    selectElements: (ids: string[]) => {
      set((state) => ({
        ...state,
        selectedElementIds: ids
      }))
    },

    clearSelection: () => {
      set((state) => ({
        ...state,
        selectedElementIds: []
      }))
    },

    // Actions - Outils
    setActiveTool: (tool) => {
      console.log('🏪 Store setActiveTool appelé:', tool)
      const currentState = get()
      console.log('🏪 Store activeTool avant:', currentState.activeTool)
      set((state) => ({
        ...state,
        activeTool: tool,
        // Désélectionner lors du changement d'outil
        selectedElementIds: tool !== 'select' ? [] : state.selectedElementIds
      }))
      console.log('🏪 Store activeTool après:', get().activeTool)
    },

    setZoom: (zoom: number) => {
      set((state) => {
        state.zoom = Math.max(25, Math.min(400, zoom))
      })
    },

    toggleGrid: () => {
      set((state) => {
        state.showGrid = !state.showGrid
      })
    },

    // Actions - Couches
    toggleLayerVisibility: (layer: LayerType) => {
      set((state) => {
        state.layers[layer].visible = !state.layers[layer].visible
      })
    },

    toggleLayerLock: (layer: LayerType) => {
      set((state) => {
        state.layers[layer].locked = !state.layers[layer].locked
      })
    },

    setLayerOpacity: (layer: LayerType, opacity: number) => {
      set((state) => {
        state.layers[layer].opacity = Math.max(0, Math.min(1, opacity))
      })
    },

    // Actions - Historique
    undo: () => {
      set((state) => {
        if (state.history.past.length > 0) {
          const previous = state.history.past.pop()!
          state.history.future.unshift(state.history.present)
          state.history.present = previous
          state.elements = [...previous]
          state.saveState.isDirty = true
        }
      })
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length > 0) {
          const next = state.history.future.shift()!
          state.history.past.push(state.history.present)
          state.history.present = next
          state.elements = [...next]
          state.saveState.isDirty = true
        }
      })
    },

    pushToHistory: () => {
      set((state) => {
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
        // Limiter l'historique à 50 étapes
        if (state.history.past.length > 50) {
          state.history.past.shift()
        }
      })
    },

    // Actions - Interface
    toggleToolbar: () => {
      set((state) => {
        state.ui.toolbarVisible = !state.ui.toolbarVisible
      })
    },

    togglePropertiesPanel: () => {
      set((state) => {
        state.ui.propertiesPanelVisible = !state.ui.propertiesPanelVisible
      })
    },

    toggleLayersPanel: () => {
      set((state) => {
        state.ui.layersPanelVisible = !state.ui.layersPanelVisible
      })
    },

    toggleImageLibrary: () => {
      set((state) => {
        state.ui.imageLibraryVisible = !state.ui.imageLibraryVisible
      })
    },

    // Actions - Sauvegarde
    markDirty: () => {
      set((state) => {
        state.saveState.isDirty = true
      })
    },

    markClean: () => {
      set((state) => {
        state.saveState.isDirty = false
      })
    },

    setSaveLoading: (loading: boolean) => {
      set((state) => {
        state.saveState.isLoading = loading
      })
    },

    setLastSaved: (date: Date) => {
      set((state) => {
        state.saveState.lastSaved = date
        state.saveState.isDirty = false
      })
    }
  }))
)

// Sélecteurs utilitaires
export const useSelectedElements = () => {
  const { elements, selectedElementIds } = useAssemblyStore()
  return elements.filter(el => selectedElementIds.includes(el.id))
}

export const useElementsByLayer = (layer: LayerType) => {
  const { elements } = useAssemblyStore()
  return elements.filter(el => el.layerType === layer)
}

export const useCanUndo = () => {
  const { history } = useAssemblyStore()
  return history.past.length > 0
}

export const useCanRedo = () => {
  const { history } = useAssemblyStore()
  return history.future.length > 0
}

// Utilitaires pour la génération d'IDs
export const generateElementId = () => {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const generatePageId = () => {
  return `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

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
import { ExportManager } from '../../../services/ExportManager'
import type { ExportOptions } from '../../../types/export.types'

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
    zoom: 25, // Zoom par défaut à 25%

    // État du canvas pour persistance
    canvasState: {
      position: { x: 0, y: 0 },
      zoom: 25,
      currentPageId: null,
      showGrid: true,
      gridSize: 20,
      activeTool: 'select',
      lastActiveTab: 'assembly',
      timestamp: Date.now()
    },

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

        // ✅ DIAGNOSTIC : Logs détaillés avant changement de page
        console.log('🔍 DIAGNOSTIC - État avant changement:', {
          currentPageId: state.currentPageId,
          elementsCount: state.elements.length,
          pagesInStore: Object.keys(state.pages).length,
          pageIds: Object.keys(state.pages),
          targetPageId: pageId
        })

        // Sauvegarder l'état de la page courante avant de changer
        if (state.currentPageId && state.elements.length > 0) {
          const currentPage = state.pages[state.currentPageId]
          if (currentPage) {
            console.log('💾 DIAGNOSTIC - Sauvegarde page courante:', {
              pageId: state.currentPageId,
              elementsToSave: state.elements.length
            })
            currentPage.content.stage.children = [...state.elements]
            currentPage.state.lastModified = new Date().toISOString()
          }
        }

        state.currentPageId = pageId
        state.canvasState.currentPageId = pageId
        state.canvasState.timestamp = Date.now()

        // Charger les éléments de la page si elle existe
        const page = state.pages[pageId]
        if (page) {
          console.log('🏪 Page trouvée, chargement des éléments:', page.content.stage.children.length)
          console.log('🔍 DIAGNOSTIC - Détails de la page:', {
            pageId: page.pageId,
            pageNumber: page.pageNumber,
            title: page.metadata.name,
            elementsCount: page.content.stage.children.length,
            elements: page.content.stage.children.map(el => ({ id: el.id, type: el.type }))
          })
          state.elements = [...page.content.stage.children]
        } else {
          console.log('🏪 Page non trouvée, VIDAGE des éléments pour isolation des pages')
          console.log('🔍 DIAGNOSTIC - Pages disponibles:', Object.keys(state.pages))
          // ✅ CORRECTION : Vider les éléments pour assurer l'isolation des pages
          // Chaque page doit avoir ses propres éléments isolés
          state.elements = []
        }

        console.log('🔍 DIAGNOSTIC - État après changement:', {
          currentPageId: state.currentPageId,
          elementsCount: state.elements.length
        })
      })
    },

    // Charger les pages depuis la DB
    loadPagesFromDB: async (pagesFromDB: any[]) => {
      set((state) => {

        // ✅ CORRECTION : Fonction locale pour nettoyer HTML (pas de this dans Zustand)
        const cleanHTMLFromText = (text: string): string => {
          if (typeof text !== 'string') return text

          // Si c'est du HTML, extraire le texte sans les balises
          if (text.includes('<') && text.includes('>')) {
            try {
              // Créer un élément temporaire pour extraire le texte
              const tempDiv = document.createElement('div')
              tempDiv.innerHTML = text
              return tempDiv.textContent || tempDiv.innerText || ''
            } catch (error) {
              console.warn('Erreur nettoyage HTML:', error)
              // Fallback : supprimer les balises avec regex
              return text.replace(/<[^>]*>/g, '')
            }
          }

          return text
        }

        pagesFromDB.forEach(pageData => {
          // ✅ MIGRATION AUTOMATIQUE : Nettoyer les balises HTML des éléments texte
          const cleanedChildren = (pageData.content?.stage?.children || []).map((el: any) => {
            if ((el.type === 'dialogue' || el.type === 'text') && el.text) {
              const cleanedText = cleanHTMLFromText(el.text)
              if (cleanedText !== el.text) {
                console.log(`🧹 Migration HTML pour ${el.id}:`, {
                  avant: el.text,
                  après: cleanedText
                })
              }
              return {
                ...el,
                text: cleanedText
              }
            }
            return el
          })

          const pageState: PageState = {
            pageId: pageData.id,
            projectId: pageData.project_id,
            pageNumber: pageData.page_number,
            metadata: {
              name: pageData.title,
              width: 1200,
              height: 1600,
              format: 'A4',
              createdAt: pageData.created_at,
              updatedAt: pageData.updated_at,
              version: '1.0',
              pixiVersion: '8.0.0'
            },
            content: {
              stage: {
                width: 1200,
                height: 1600,
                backgroundColor: 0xF8F8F8,
                children: cleanedChildren
              }
            },
            state: {
              isDirty: false,
              lastSaved: pageData.updated_at,
              lastModified: pageData.updated_at,
              autoSaveEnabled: true,
              version: 1
            }
          }

          state.pages[pageData.id] = pageState
          console.log('📥 Page chargée dans StateManager:', pageData.id, pageData.title)
        })

        console.log('✅ Toutes les pages chargées dans StateManager, total:', Object.keys(state.pages).length)
      })
    },

    // Fonction de diagnostic pour vérifier la synchronisation
    diagnoseSyncIssues: () => {
      const state = get()
      // Diagnostic silencieux pour éviter les logs en production
    },

    // ✅ NOUVEAU : Forcer la synchronisation avec Supabase
    forceSyncWithSupabase: async (projectId: string) => {
      try {
        console.log('🔄 FORCE SYNC - Début synchronisation forcée avec Supabase')

        // 1. Sauvegarder la page courante si nécessaire
        const state = get()
        if (state.currentPageId && state.elements.length > 0) {
          console.log('💾 FORCE SYNC - Sauvegarde page courante avant sync')
          await get().autoSave()
        }

        // 2. Recharger toutes les pages depuis Supabase
        const response = await fetch(`/api/projects/${projectId}/pages`)
        if (!response.ok) {
          throw new Error('Erreur lors du rechargement des pages')
        }

        const { pages: pagesFromDB } = await response.json()
        console.log('📥 FORCE SYNC - Pages récupérées:', pagesFromDB.length)

        // 3. Recharger complètement le StateManager
        get().loadPagesFromDB(pagesFromDB)

        // 4. Recharger la page courante
        if (state.currentPageId) {
          console.log('🔄 FORCE SYNC - Rechargement page courante:', state.currentPageId)
          get().setCurrentPage(state.currentPageId)
        }

        console.log('✅ FORCE SYNC - Synchronisation terminée')
      } catch (error) {
        console.error('❌ FORCE SYNC - Erreur:', error)
        throw error
      }
    },

    // Nouvelle action : Ajouter une page
    addPage: async (projectId: string, title?: string) => {
      const state = get()

      try {
        console.log('🏪 StateManager addPage: Début création page pour projet:', projectId)

        // ✅ CORRECTION : Ne pas calculer le page_number côté client
        // Laisser l'API déterminer le bon numéro de page via get_next_page_number()

        // Appeler l'API pour créer la page
        const response = await fetch(`/api/projects/${projectId}/pages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title || `Page ${Object.keys(state.pages).length + 1}`
          })
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la création de la page')
        }

        const { page } = await response.json()

        set((state) => {
          // Créer la nouvelle page dans le store
          const newPageState: PageState = {
            pageId: page.id,
            projectId: projectId,
            pageNumber: page.page_number,
            metadata: {
              name: page.title,
              width: 1200,
              height: 1600,
              format: 'A4',
              createdAt: page.created_at,
              updatedAt: page.updated_at,
              version: '1.0',
              pixiVersion: '8.0.0'
            },
            content: {
              stage: {
                width: 1200,
                height: 1600,
                backgroundColor: 0xF8F8F8,
                children: []
              }
            },
            state: {
              isDirty: false,
              lastSaved: page.created_at,
              lastModified: page.created_at,
              autoSaveEnabled: true,
              version: 1
            }
          }

          state.pages[page.id] = newPageState
          state.saveState.isDirty = true

          // ✅ AUTO-SÉLECTION : Sélectionner automatiquement la nouvelle page créée
          state.currentPageId = page.id
          state.canvasState.currentPageId = page.id
          state.canvasState.timestamp = Date.now()

          // Vider les éléments pour la nouvelle page vide
          state.elements = []

          console.log('✅ Page créée et auto-sélectionnée:', page.id)
        })

        return page.id
      } catch (error) {
        console.error('Erreur ajout page:', error)
        throw error
      }
    },

    // Nouvelle action : Supprimer une page avec renumérotation intelligente
    deletePage: async (projectId: string, pageId: string) => {
      const state = get()

      try {
        // Vérifier qu'il reste au moins une page
        const pageCount = Object.keys(state.pages).length
        if (pageCount <= 1) {
          throw new Error('Impossible de supprimer la dernière page')
        }

        console.log('🗑️ StateManager: Suppression page', pageId, 'du projet', projectId)

        // Appeler l'API pour supprimer la page avec renumérotation automatique
        const response = await fetch(`/api/projects/${projectId}/pages/${pageId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la suppression de la page')
        }

        const { deletedPageNumber, newPagesCount } = await response.json()
        console.log('✅ Page supprimée côté serveur:', deletedPageNumber, 'Nouvelles pages:', newPagesCount)

        // ✅ CORRECTION : Recharger toutes les pages depuis le serveur pour avoir la numérotation correcte
        const pagesResponse = await fetch(`/api/projects/${projectId}/pages`)
        if (pagesResponse.ok) {
          const { pages: updatedPages } = await pagesResponse.json()
          // Recharger les pages avec la numérotation corrigée
          set((state) => {
            // Vider les pages existantes
            state.pages = {}
            // Recharger avec la nouvelle numérotation
            updatedPages.forEach((pageData: any) => {
              const pageState = {
                pageId: pageData.id,
                projectId: pageData.project_id,
                pageNumber: pageData.page_number,
                metadata: {
                  name: pageData.title,
                  width: 1200,
                  height: 1600,
                  format: 'A4',
                  createdAt: pageData.created_at,
                  updatedAt: pageData.updated_at,
                  version: '1.0',
                  pixiVersion: '8.0.0'
                },
                content: {
                  stage: {
                    width: 1200,
                    height: 1600,
                    backgroundColor: 0xF8F8F8,
                    children: pageData.content?.stage?.children || []
                  }
                },
                state: {
                  isDirty: false,
                  lastSaved: pageData.updated_at,
                  lastModified: pageData.updated_at,
                  autoSaveEnabled: true,
                  version: 1
                }
              }
              state.pages[pageData.id] = pageState
            })
          })
        }

        set((state) => {
          // Si c'était la page courante, sélectionner une autre page
          if (state.currentPageId === pageId) {
            const remainingPages = Object.keys(state.pages)
            if (remainingPages.length > 0) {
              // Sélectionner la première page disponible
              const firstPageId = remainingPages[0]
              state.currentPageId = firstPageId
              state.canvasState.currentPageId = firstPageId

              // Charger les éléments de la nouvelle page courante
              const newCurrentPage = state.pages[firstPageId]
              if (newCurrentPage) {
                state.elements = [...newCurrentPage.content.stage.children]
                console.log('📄 Nouvelle page courante sélectionnée:', firstPageId)
              }
            }
          }

          state.saveState.isDirty = true
          state.canvasState.timestamp = Date.now()
        })

        console.log('✅ StateManager: Suppression terminée, pages restantes:', Object.keys(get().pages).length)
        return deletedPageNumber
      } catch (error) {
        console.error('❌ Erreur suppression page StateManager:', error)
        throw error
      }
    },

    // Nouvelle action : Dupliquer une page
    duplicatePage: async (projectId: string, sourcePageId: string) => {
      const state = get()

      try {
        // Appeler l'API pour dupliquer la page
        const response = await fetch(`/api/projects/${projectId}/pages/duplicate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourcePageId })
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la duplication de la page')
        }

        const { page } = await response.json()

        set((state) => {
          // Récupérer la page source pour copier son contenu
          const sourcePage = state.pages[sourcePageId]

          // Créer la nouvelle page dans le store
          const newPageState: PageState = {
            pageId: page.id,
            projectId: projectId,
            pageNumber: page.page_number,
            metadata: {
              name: page.title,
              width: sourcePage?.metadata.width || 1200,
              height: sourcePage?.metadata.height || 1600,
              format: sourcePage?.metadata.format || 'A4',
              createdAt: page.created_at,
              updatedAt: page.updated_at,
              version: '1.0',
              pixiVersion: '8.0.0'
            },
            content: {
              stage: {
                width: sourcePage?.content.stage.width || 1200,
                height: sourcePage?.content.stage.height || 1600,
                backgroundColor: sourcePage?.content.stage.backgroundColor || 0xF8F8F8,
                children: sourcePage ? [...sourcePage.content.stage.children] : []
              }
            },
            state: {
              isDirty: false,
              lastSaved: page.created_at,
              lastModified: page.created_at,
              autoSaveEnabled: true,
              version: 1
            }
          }

          state.pages[page.id] = newPageState
          state.saveState.isDirty = true
          state.canvasState.timestamp = Date.now()
        })

        return page.id
      } catch (error) {
        console.error('Erreur duplication page:', error)
        throw error
      }
    },

    // Nouvelle action : Réorganiser les pages
    reorderPages: async (projectId: string, pageOrders: Array<{ pageId: string; newPageNumber: number }>) => {
      try {
        // Appeler l'API pour réorganiser les pages
        const response = await fetch(`/api/projects/${projectId}/pages/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageOrders })
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la réorganisation des pages')
        }

        set((state) => {
          // Mettre à jour les numéros de page dans le store
          pageOrders.forEach(({ pageId, newPageNumber }) => {
            const page = state.pages[pageId]
            if (page) {
              page.pageNumber = newPageNumber
              page.state.lastModified = new Date().toISOString()
            }
          })

          state.saveState.isDirty = true
          state.canvasState.timestamp = Date.now()
        })

        return true
      } catch (error) {
        console.error('Erreur réorganisation pages:', error)
        throw error
      }
    },

    // Nouvelle action : Sauvegarder l'état du canvas
    saveCanvasState: (canvasState: Partial<{
      position: { x: number; y: number }
      zoom: number
      currentPageId: string | null
      showGrid: boolean
      gridSize: number
      activeTool: string
      lastActiveTab: string
      timestamp: number
    }>) => {
      set((state) => {
        state.canvasState = {
          ...state.canvasState,
          ...canvasState,
          timestamp: Date.now()
        }

        // Sauvegarder dans localStorage pour persistance
        if (typeof localStorage !== 'undefined') {
          try {
            const projectId = state.pages[state.currentPageId || '']?.projectId
            if (projectId) {
              localStorage.setItem(
                `mangaka_assembly_state_${projectId}`,
                JSON.stringify(state.canvasState)
              )
            }
          } catch (error) {
            console.warn('Erreur sauvegarde localStorage:', error)
          }
        }
      })
    },

    // Nouvelle action : Restaurer l'état du canvas
    restoreCanvasState: (projectId: string) => {
      if (typeof localStorage === 'undefined') return null

      try {
        const savedState = localStorage.getItem(`mangaka_assembly_state_${projectId}`)
        if (savedState) {
          const canvasState = JSON.parse(savedState)

          set((state) => {
            state.canvasState = {
              ...state.canvasState,
              ...canvasState
            }

            // Restaurer les propriétés dans l'état principal
            state.zoom = canvasState.zoom || 25
            state.showGrid = canvasState.showGrid ?? true
            state.gridSize = canvasState.gridSize || 20
            state.activeTool = canvasState.activeTool || 'select'

            // Restaurer la page courante si elle existe
            if (canvasState.currentPageId && state.pages[canvasState.currentPageId]) {
              state.currentPageId = canvasState.currentPageId
              const page = state.pages[canvasState.currentPageId]
              if (page) {
                state.elements = [...page.content.stage.children]
              }
            }
          })

          return canvasState
        }
      } catch (error) {
        // Erreur restauration localStorage silencieuse
      }

      return null
    },

    // Actions - Gestion des éléments
    addElement: (element: AssemblyElement) => {
      set((state) => {
        state.elements.push(element)

        // ✅ CRITIQUE : Sauvegarder automatiquement dans la page courante
        if (state.currentPageId && state.pages[state.currentPageId]) {
          state.pages[state.currentPageId].content.stage.children = [...state.elements]
          state.pages[state.currentPageId].state.lastModified = new Date().toISOString()
          state.pages[state.currentPageId].state.isDirty = true
          console.log('💾 Élément sauvegardé dans la page courante:', state.currentPageId, element.id)

          // ✅ NOUVEAU : Déclencher sauvegarde automatique en base après 2 secondes
          setTimeout(async () => {
            try {
              const store = get()
              await store.autoSaveToDatabase()
              console.log('✅ Sauvegarde automatique déclenchée après ajout élément')
            } catch (error) {
              console.error('❌ Erreur sauvegarde auto après ajout:', error)
            }
          }, 2000)
        }

        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
      })

      // ✅ NOUVEAU : Sauvegarde automatique désactivée temporairement pour éviter les erreurs TypeScript
    },

    updateElement: (id: string, updates: Partial<AssemblyElement>) => {
      set((state) => {
        const index = state.elements.findIndex(el => el.id === id)
        if (index !== -1) {
          state.elements[index] = { ...state.elements[index], ...updates } as AssemblyElement

          // ✅ CRITIQUE : Sauvegarder automatiquement dans la page courante
          if (state.currentPageId && state.pages[state.currentPageId]) {
            state.pages[state.currentPageId].content.stage.children = [...state.elements]
            state.pages[state.currentPageId].state.lastModified = new Date().toISOString()
            state.pages[state.currentPageId].state.isDirty = true
            console.log('💾 Élément mis à jour dans la page courante:', state.currentPageId, id)

            // ✅ CORRECTION CRITIQUE : Déclencher sauvegarde automatique en base après modification aussi
            setTimeout(async () => {
              try {
                const store = get()
                await store.autoSaveToDatabase()
                console.log('✅ Sauvegarde automatique déclenchée après modification élément')
              } catch (error) {
                console.error('❌ Erreur sauvegarde auto après modification:', error)
              }
            }, 2000)
          }

          state.saveState.isDirty = true
        }
      })

      // ✅ NOUVEAU : Sauvegarde automatique désactivée temporairement
    },

    deleteElement: (id: string) => {
      set((state) => {
        state.elements = state.elements.filter(el => el.id !== id)
        state.selectedElementIds = state.selectedElementIds.filter(selectedId => selectedId !== id)

        // ✅ CRITIQUE : Sauvegarder automatiquement dans la page courante
        if (state.currentPageId && state.pages[state.currentPageId]) {
          state.pages[state.currentPageId].content.stage.children = [...state.elements]
          state.pages[state.currentPageId].state.lastModified = new Date().toISOString()
          state.pages[state.currentPageId].state.isDirty = true
          console.log('💾 Élément supprimé de la page courante:', state.currentPageId, id)
        }

        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = [...state.elements]
        state.history.future = []
      })

      // ✅ NOUVEAU : Sauvegarde automatique désactivée temporairement
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

    // ✅ NOUVEAU : Vider tous les éléments (pour l'isolation des pages)
    clearElements: () => {
      set((state) => {
        console.log('🧹 StateManager clearElements: Vidage de tous les éléments')
        state.elements = []
        state.selectedElementIds = []
        state.saveState.isDirty = true
        // Ajouter à l'historique
        state.history.past.push([...state.history.present])
        state.history.present = []
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
    },

    // ✅ NOUVELLE ACTION : Sauvegarde automatique en base de données
    autoSaveToDatabase: async () => {
      const state = get()

      // Vérifier qu'on a une page courante et des éléments
      if (!state.currentPageId || !state.pages[state.currentPageId]) {
        return
      }

      const currentPage = state.pages[state.currentPageId]

      try {
        console.log('💾 Sauvegarde automatique en cours...', {
          pageId: state.currentPageId,
          elementsCount: state.elements.length,
          projectId: currentPage.projectId
        })

        // Préparer le contenu à sauvegarder
        const content = {
          stage: {
            width: 1200,
            height: 1600,
            backgroundColor: 0xF8F8F8,
            children: [...state.elements]
          }
        }

        // Sauvegarder en base de données via l'API
        const response = await fetch('/api/supabase/save-page', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pageId: state.currentPageId,
            projectId: currentPage.projectId,
            content,
            status: 'draft'
          })
        })

        if (response.ok) {
          console.log('✅ Sauvegarde automatique réussie:', state.currentPageId)

          // Marquer la page comme sauvegardée
          set((state) => {
            if (state.currentPageId && state.pages[state.currentPageId]) {
              state.pages[state.currentPageId].state.isDirty = false
              state.pages[state.currentPageId].state.lastSaved = new Date().toISOString()
            }
          })
        } else {
          console.error('❌ Erreur sauvegarde automatique:', response.status)
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique:', error)
      }
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

// Actions d'export
export const useExportActions = () => {
  const store = useAssemblyStore()

  return {
    exportPages: async (options: ExportOptions) => {
      const exportManager = new ExportManager()
      return await exportManager.exportPages(options)
    },

    exportCurrentPage: async (format: 'png' | 'pdf') => {
      const state = store.getState()
      if (!state.currentPageId) {
        throw new Error('Aucune page sélectionnée')
      }

      const currentPage = state.pages[state.currentPageId]
      if (!currentPage) {
        throw new Error('Page courante introuvable')
      }

      const exportManager = new ExportManager()
      return await exportManager.exportPages({
        projectId: currentPage.projectId,
        format,
        pageIds: [state.currentPageId],
        quality: 0.9,
        resolution: 2
      })
    }
  }
}

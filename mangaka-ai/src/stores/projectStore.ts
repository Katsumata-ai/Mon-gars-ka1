// stores/projectStore.ts - Store Zustand principal avec persistance
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { toast } from 'react-hot-toast'
import type {
  ProjectState,
  ScriptData,
  CharacterData,
  BackgroundData,
  DecorData,
  SceneData,
  AssemblyData,
  ProjectExportData
} from './types'

// État initial par défaut
const createInitialState = () => ({
  projectId: '',
  userId: '',
  scriptData: {
    content: '',
    title: 'Script Sans Titre',
    stats: { pages: 0, panels: 0, chapters: 0, words: 0, characters: 0, dialogues: 0 },
    fileTree: [],
    lastModified: new Date()
  },
  charactersData: [],
  backgroundsData: [],
  decorsData: [],
  scenesData: [],
  assemblyData: {
    pages: [],
    currentPage: 1,
    totalPages: 0,
    lastModified: new Date()
  },
  hasUnsavedChanges: false,
  lastSavedToDb: null,
  lastSavedToLocal: null,
  isLoading: false,
  isSaving: false,
  error: null
})

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      ...createInitialState(),

      // Actions de mise à jour
      updateScriptData: (data: Partial<ScriptData>) => set((state) => {
        state.scriptData = {
          ...state.scriptData,
          ...data,
          lastModified: new Date()
        }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      updateCharactersData: (data: CharacterData[]) => set((state) => {
        state.charactersData = data.map(char => ({
          ...char,
          lastModified: new Date()
        }))
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      updateBackgroundsData: (data: BackgroundData[]) => set((state) => {
        state.backgroundsData = data.map(bg => ({
          ...bg,
          lastModified: new Date()
        }))
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      updateDecorsData: (data: DecorData[]) => set((state) => {
        state.decorsData = data.map(decor => ({
          ...decor,
          lastModified: new Date()
        }))
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      updateScenesData: (data: SceneData[]) => set((state) => {
        state.scenesData = data.map(scene => ({
          ...scene,
          lastModified: new Date()
        }))
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      updateAssemblyData: (data: Partial<AssemblyData>) => set((state) => {
        state.assemblyData = {
          ...state.assemblyData,
          ...data,
          lastModified: new Date()
        }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),

      // Nouvelle action : Sauvegarder l'état canvas assemblage
      saveAssemblyCanvasState: (canvasState: AssemblyData['canvasState']) => set((state) => {
        state.assemblyData = {
          ...state.assemblyData,
          canvasState: {
            ...state.assemblyData.canvasState,
            ...canvasState,
            timestamp: Date.now()
          },
          lastModified: new Date()
        }
        state.lastSavedToLocal = new Date()

        // Sauvegarder immédiatement dans localStorage pour persistance
        if (typeof localStorage !== 'undefined' && state.projectId) {
          try {
            localStorage.setItem(
              `mangaka_assembly_canvas_${state.projectId}`,
              JSON.stringify(state.assemblyData.canvasState)
            )
          } catch (error) {
            console.warn('Erreur sauvegarde canvas localStorage:', error)
          }
        }
      }),

      // Nouvelle action : Restaurer l'état canvas assemblage
      restoreAssemblyCanvasState: () => {
        const state = get()
        if (typeof localStorage === 'undefined' || !state.projectId) return null

        try {
          const savedCanvasState = localStorage.getItem(`mangaka_assembly_canvas_${state.projectId}`)
          if (savedCanvasState) {
            const canvasState = JSON.parse(savedCanvasState)

            set((state) => {
              state.assemblyData = {
                ...state.assemblyData,
                canvasState
              }
            })

            return canvasState
          }
        } catch (error) {
          console.warn('Erreur restauration canvas localStorage:', error)
        }

        return null
      },

      // Sauvegarde base de données
      saveToDatabase: async () => {
        const state = get()
        if (!state.projectId || !state.userId) {
          throw new Error('Project ID ou User ID manquant')
        }

        set((draft) => {
          draft.isSaving = true
          draft.error = null
        })

        try {
          // Inclure l'état canvas actuel dans les données d'assemblage
          const assemblyDataWithCanvas = {
            ...state.assemblyData,
            canvasState: state.assemblyData.canvasState || {
              position: { x: 0, y: 0 },
              zoom: 25,
              currentPageId: null,
              showGrid: true,
              gridSize: 20,
              activeTool: 'select',
              lastActiveTab: 'assembly',
              timestamp: Date.now()
            }
          }

          const response = await fetch(`/api/projects/${state.projectId}/save-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scriptData: state.scriptData,
              charactersData: state.charactersData,
              backgroundsData: state.backgroundsData,
              decorsData: state.decorsData,
              scenesData: state.scenesData,
              assemblyData: assemblyDataWithCanvas
            })
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.message || 'Erreur sauvegarde')
          }

          set((draft) => {
            draft.hasUnsavedChanges = false
            draft.lastSavedToDb = new Date()
            draft.isSaving = false
          })

          toast.success('Sauvegarde réussie !', {
            icon: '✅',
            duration: 2000
          })

        } catch (error) {
          set((draft) => {
            draft.error = error instanceof Error ? error.message : 'Erreur inconnue'
            draft.isSaving = false
          })

          toast.error('Erreur lors de la sauvegarde', {
            icon: '❌',
            duration: 4000
          })

          throw error
        }
      },

      // Chargement depuis base de données
      loadFromDatabase: async () => {
        const state = get()
        if (!state.projectId || !state.userId) {
          console.warn('Project ID ou User ID manquant - chargement ignoré')
          return
        }

        set((draft) => {
          draft.isLoading = true
          draft.error = null
        })

        try {
          const response = await fetch(`/api/projects/${state.projectId}/load-all`)
          if (!response.ok) {
            // Si l'API n'est pas disponible, on continue avec les données par défaut
            console.warn('API non disponible, utilisation des données par défaut')
            set((draft) => {
              draft.isLoading = false
            })
            return
          }

          const result = await response.json()

          if (result.success && result.data) {
            set((draft) => {
              if (result.data.script) {
                draft.scriptData = {
                  ...result.data.script,
                  lastModified: new Date(result.data.script.lastModified)
                }
              }
              if (result.data.characters) {
                draft.charactersData = result.data.characters.characters || []
              }
              if (result.data.backgrounds) {
                draft.backgroundsData = result.data.backgrounds.backgrounds || []
              }
              if (result.data.decors) {
                draft.decorsData = result.data.decors.decors || []
              }
              if (result.data.scenes) {
                draft.scenesData = result.data.scenes.scenes || []
              }
              if (result.data.assembly) {
                draft.assemblyData = {
                  ...result.data.assembly,
                  lastModified: new Date(result.data.assembly.lastModified)
                }
              }
              draft.hasUnsavedChanges = false
              draft.lastSavedToDb = new Date(result.updatedAt)
              draft.isLoading = false
            })
          }

        } catch (error) {
          console.warn('Erreur chargement DB, utilisation des données par défaut:', error)
          set((draft) => {
            draft.isLoading = false
            // Ne pas définir d'erreur pour permettre le fonctionnement en mode dégradé
          })
        }
      },

      // Utilitaires
      markAsModified: () => set((state) => {
        state.hasUnsavedChanges = true
      }),

      resetUnsavedChanges: () => set((state) => {
        state.hasUnsavedChanges = false
      }),

      getLastModified: () => {
        const state = get()
        const dates = [
          state.scriptData.lastModified,
          state.assemblyData.lastModified,
          ...state.charactersData.map(c => c.lastModified),
          ...state.backgroundsData.map(b => b.lastModified),
          ...state.decorsData.map(d => d.lastModified),
          ...state.scenesData.map(s => s.lastModified)
        ]
        return new Date(Math.max(...dates.map(d => d.getTime())))
      },

      hasDataChanged: (section?: string) => {
        const state = get()
        if (!section) return state.hasUnsavedChanges

        const lastSaved = state.lastSavedToDb
        if (!lastSaved) return true

        switch (section) {
          case 'script': return state.scriptData.lastModified > lastSaved
          case 'characters': return state.charactersData.some(c => c.lastModified > lastSaved)
          case 'backgrounds': return state.backgroundsData.some(b => b.lastModified > lastSaved)
          case 'decors': return state.decorsData.some(d => d.lastModified > lastSaved)
          case 'scenes': return state.scenesData.some(s => s.lastModified > lastSaved)
          case 'assembly': return state.assemblyData.lastModified > lastSaved
          default: return false
        }
      },

      exportAllData: (): ProjectExportData => {
        const state = get()
        return {
          projectId: state.projectId,
          scriptData: state.scriptData,
          charactersData: state.charactersData,
          backgroundsData: state.backgroundsData,
          decorsData: state.decorsData,
          scenesData: state.scenesData,
          assemblyData: state.assemblyData,
          exportDate: new Date().toISOString()
        }
      },

      initializeProject: (projectId: string, userId: string, projectName?: string) => set((state) => {
        state.projectId = projectId
        state.userId = userId

        // Mettre à jour le titre du script avec le nom du projet
        if (projectName && state.scriptData.title === 'Script Sans Titre') {
          state.scriptData.title = `Script du projet "${projectName}"`
        }
      })
    })),
    {
      name: 'mangaka-project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectId: state.projectId,
        userId: state.userId,
        scriptData: state.scriptData,
        charactersData: state.charactersData,
        backgroundsData: state.backgroundsData,
        decorsData: state.decorsData,
        scenesData: state.scenesData,
        assemblyData: state.assemblyData,
        lastSavedToDb: state.lastSavedToDb,
        lastSavedToLocal: state.lastSavedToLocal
      }),
      version: 1,
      migrate: (persistedState: unknown, version: number) => {
        // Migration logic pour versions futures
        if (version === 0) {
          // Migration depuis version 0 vers 1
          return {
            ...(persistedState && typeof persistedState === 'object' ? persistedState : {}),
            ...createInitialState()
          }
        }
        return persistedState as ProjectState
      }
    }
  )
)

// Hook simplifié pour utilisation dans les composants
export const useProjectData = () => {
  const store = useProjectStore()
  return {
    // Données
    scriptData: store.scriptData,
    charactersData: store.charactersData,
    backgroundsData: store.backgroundsData,
    decorsData: store.decorsData,
    scenesData: store.scenesData,
    assemblyData: store.assemblyData,

    // État
    hasUnsavedChanges: store.hasUnsavedChanges,
    isSaving: store.isSaving,
    isLoading: store.isLoading,
    lastSavedToDb: store.lastSavedToDb,
    error: store.error,

    // Actions
    updateScriptData: store.updateScriptData,
    updateCharactersData: store.updateCharactersData,
    updateBackgroundsData: store.updateBackgroundsData,
    updateDecorsData: store.updateDecorsData,
    updateScenesData: store.updateScenesData,
    updateAssemblyData: store.updateAssemblyData,
    saveToDatabase: store.saveToDatabase,
    loadFromDatabase: store.loadFromDatabase,
    initializeProject: store.initializeProject
  }
}

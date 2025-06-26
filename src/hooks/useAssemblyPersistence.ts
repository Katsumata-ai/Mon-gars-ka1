// Hook pour la persistance de l'état assemblage entre les menus
'use client'

import { useEffect, useCallback } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAssemblyStore } from '@/components/assembly/managers/StateManager'

interface UseAssemblyPersistenceProps {
  projectId: string
  isAssemblyActive: boolean
}

export function useAssemblyPersistence({ 
  projectId, 
  isAssemblyActive 
}: UseAssemblyPersistenceProps) {
  const { 
    saveAssemblyCanvasState, 
    restoreAssemblyCanvasState,
    assemblyData 
  } = useProjectStore()
  
  const {
    canvasState,
    saveCanvasState,
    restoreCanvasState,
    zoom,
    showGrid,
    gridSize,
    activeTool,
    currentPageId
  } = useAssemblyStore()

  // Sauvegarder l'état canvas quand on quitte l'assemblage
  const saveCurrentState = useCallback(() => {
    if (!projectId) return

    const currentCanvasState = {
      position: canvasState.position,
      zoom,
      currentPageId,
      showGrid,
      gridSize,
      activeTool,
      lastActiveTab: 'assembly',
      timestamp: Date.now()
    }

    // Sauvegarder dans le ProjectStore global
    saveAssemblyCanvasState(currentCanvasState)
    
    // Sauvegarder dans le StateManager local
    saveCanvasState(currentCanvasState)
    
    console.log('🔄 État assemblage sauvegardé:', currentCanvasState)
  }, [
    projectId,
    canvasState.position,
    zoom,
    currentPageId,
    showGrid,
    gridSize,
    activeTool,
    saveAssemblyCanvasState,
    saveCanvasState
  ])

  // Restaurer l'état canvas quand on revient à l'assemblage
  const restoreState = useCallback(() => {
    if (!projectId) return

    // Essayer de restaurer depuis le ProjectStore
    const restoredState = restoreAssemblyCanvasState()
    
    if (restoredState) {
      // Appliquer l'état restauré au StateManager
      restoreCanvasState(projectId)
      console.log('🔄 État assemblage restauré:', restoredState)
      return restoredState
    }

    console.log('🔄 Aucun état assemblage à restaurer')
    return null
  }, [projectId, restoreAssemblyCanvasState, restoreCanvasState])

  // Effet pour gérer la persistance lors des changements d'onglet
  useEffect(() => {
    if (isAssemblyActive) {
      // Restaurer l'état quand on arrive sur l'assemblage
      restoreState()
    } else {
      // Sauvegarder l'état quand on quitte l'assemblage
      saveCurrentState()
    }
  }, [isAssemblyActive, restoreState, saveCurrentState])

  // Effet pour sauvegarder automatiquement les changements
  useEffect(() => {
    if (!isAssemblyActive || !projectId) return

    const autoSaveInterval = setInterval(async () => {
      // ✅ CORRECTION CRITIQUE : Sauvegarder en base de données ET localStorage
      saveCurrentState() // localStorage pour backup

      // Sauvegarder en base de données via StateManager
      try {
        const { autoSaveToDatabase } = useAssemblyStore.getState()
        await autoSaveToDatabase()

      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique en base:', error)
      }
    }, 30000) // Sauvegarde automatique toutes les 30 secondes

    return () => clearInterval(autoSaveInterval)
  }, [isAssemblyActive, projectId, saveCurrentState])

  // Sauvegarder avant le déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAssemblyActive) {
        saveCurrentState()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isAssemblyActive, saveCurrentState])

  return {
    // État actuel
    canvasState: assemblyData.canvasState,
    
    // Actions manuelles
    saveState: saveCurrentState,
    restoreState,
    
    // Métadonnées
    hasPersistedState: !!assemblyData.canvasState,
    lastSaved: assemblyData.canvasState?.timestamp
  }
}

// Hook simplifié pour les composants assemblage
export function useAssemblyCanvasState(projectId: string) {
  const { saveAssemblyCanvasState, assemblyData } = useProjectStore()
  const { canvasState, saveCanvasState } = useAssemblyStore()

  const updateCanvasState = useCallback((updates: Partial<typeof canvasState>) => {
    const newState = { ...canvasState, ...updates, timestamp: Date.now() }
    
    // Mettre à jour les deux stores
    saveCanvasState(newState)
    saveAssemblyCanvasState(newState)
  }, [canvasState, saveCanvasState, saveAssemblyCanvasState])

  return {
    canvasState: assemblyData.canvasState || canvasState,
    updateCanvasState,
    isStatePersisted: !!assemblyData.canvasState
  }
}

// Hook pour synchroniser CanvasContext avec StateManager lors des changements de page
'use client'

import { useEffect } from 'react'
import { useAssemblyStore } from '@/components/assembly/managers/StateManager'
import { useCanvasContext } from '@/components/assembly/context/CanvasContext'

/**
 * Hook critique pour synchroniser les éléments entre StateManager et CanvasContext
 * Résout le problème d'isolation des pages où les éléments restent visibles sur toutes les pages
 */
export function useCanvasStateSync() {
  const {
    currentPageId,
    elements: stateManagerElements,
    addElement: addElementToStateManager,
    clearElements: clearStateManagerElements
  } = useAssemblyStore()
  
  const { 
    elements: canvasElements, 
    addElement: addElementToCanvas,
    removeElements: removeElementsFromCanvas
  } = useCanvasContext()

  // ✅ SYNCHRONISATION CRITIQUE : Synchroniser CanvasContext avec StateManager lors des changements de page
  useEffect(() => {
    if (!currentPageId) return

    console.log('🔄 useCanvasStateSync: Changement de page détecté:', currentPageId)
    console.log('🔄 StateManager éléments:', stateManagerElements.length)
    console.log('🔄 CanvasContext éléments avant sync:', canvasElements.length)

    // ✅ CORRECTION : Synchroniser seulement si les éléments sont différents
    const stateManagerIds = stateManagerElements.map(el => el.id).sort()
    const canvasIds = canvasElements.map(el => el.id).sort()
    const areElementsDifferent = JSON.stringify(stateManagerIds) !== JSON.stringify(canvasIds)

    if (areElementsDifferent) {
      console.log('🔄 Éléments différents détectés, synchronisation nécessaire')

      // Vider complètement CanvasContext
      if (canvasElements.length > 0) {
        const elementIdsToRemove = canvasElements.map(el => el.id)
        removeElementsFromCanvas(elementIdsToRemove)
        console.log('🧹 CanvasContext vidé pour isolation des pages:', elementIdsToRemove)
      }

      // Charger les éléments de la page courante depuis StateManager vers CanvasContext
      if (stateManagerElements.length > 0) {
        console.log('📥 Chargement des éléments de la page courante dans CanvasContext:', stateManagerElements.length)

        stateManagerElements.forEach(element => {
          addElementToCanvas(element)
          console.log('📥 Élément chargé dans CanvasContext:', element.id, element.type)
        })
      }

      console.log('✅ Synchronisation page terminée - CanvasContext éléments:', stateManagerElements.length)
    } else {
      console.log('✅ Éléments déjà synchronisés, pas de changement nécessaire')
    }
  }, [currentPageId, stateManagerElements])

  // ❌ SUPPRIMÉ : Synchronisation inverse qui causait le problème d'isolation
  // La synchronisation CanvasContext → StateManager est maintenant gérée par SimpleCanvasEditor
  // pour éviter que les éléments d'une page apparaissent sur toutes les autres pages

  return {
    isSync: canvasElements.length === stateManagerElements.length,
    canvasElementsCount: canvasElements.length,
    stateManagerElementsCount: stateManagerElements.length,
    currentPageId
  }
}

/**
 * Hook simplifié pour vérifier l'état de synchronisation
 */
export function useCanvasSyncStatus() {
  const { elements: stateManagerElements, currentPageId } = useAssemblyStore()
  const { elements: canvasElements } = useCanvasContext()

  const isSync = canvasElements.length === stateManagerElements.length
  const hasElements = canvasElements.length > 0 || stateManagerElements.length > 0

  return {
    isSync,
    hasElements,
    canvasElementsCount: canvasElements.length,
    stateManagerElementsCount: stateManagerElements.length,
    currentPageId,
    syncStatus: isSync ? 'synchronized' : 'out-of-sync'
  }
}

/**
 * Hook pour forcer la synchronisation manuelle
 */
export function useForceSyncCanvas() {
  const {
    elements: stateManagerElements,
    clearElements: clearStateManagerElements
  } = useAssemblyStore()
  
  const { 
    elements: canvasElements, 
    removeElements: removeElementsFromCanvas,
    addElement: addElementToCanvas
  } = useCanvasContext()

  const forceSyncFromStateManager = () => {

    
    // Vider CanvasContext
    if (canvasElements.length > 0) {
      const elementIdsToRemove = canvasElements.map(el => el.id)
      removeElementsFromCanvas(elementIdsToRemove)
    }

    // Charger depuis StateManager
    stateManagerElements.forEach(element => {
      addElementToCanvas(element)
    })


  }

  const forceSyncFromCanvas = () => {

    
    // Vider StateManager
    clearStateManagerElements()

    // Charger depuis CanvasContext
    canvasElements.forEach(element => {
      // addElementToStateManager(element) // TODO: Implémenter si nécessaire
    })


  }

  return {
    forceSyncFromStateManager,
    forceSyncFromCanvas
  }
}

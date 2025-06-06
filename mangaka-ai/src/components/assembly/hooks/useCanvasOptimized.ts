// Hooks optimisés pour le canvas avec React useState
import { useMemo, useCallback } from 'react'
import { useCanvasContext } from '../context/CanvasContext'
import { AssemblyElement, LayerType } from '../types/assembly.types'

// Hook pour les éléments sélectionnés (optimisé)
export const useSelectedElements = () => {
  const { elements, selectedElementIds } = useCanvasContext()
  
  return useMemo(() => 
    elements.filter(el => selectedElementIds.includes(el.id)),
    [elements, selectedElementIds]
  )
}

// Hook pour les éléments par couche (optimisé)
export const useElementsByLayer = (layer: LayerType) => {
  const { elements } = useCanvasContext()
  
  return useMemo(() => 
    elements.filter(el => el.layerType === layer),
    [elements, layer]
  )
}

// Hook pour vérifier si on peut annuler/refaire
export const useCanUndo = () => {
  const { history } = useCanvasContext()
  return history.past.length > 0
}

export const useCanRedo = () => {
  const { history } = useCanvasContext()
  return history.future.length > 0
}

// Hook pour les statistiques de performance
export const useCanvasStats = () => {
  const { elements, selectedElementIds, history } = useCanvasContext()
  
  return useMemo(() => ({
    totalElements: elements.length,
    selectedCount: selectedElementIds.length,
    historySize: history.past.length + history.future.length,
    elementsByType: elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }), [elements, selectedElementIds, history])
}

// Hook pour les actions d'éléments optimisées
export const useElementActions = () => {
  const { addElement, updateElement, removeElement, removeElements, selectElement, selectElements, clearSelection } = useCanvasContext()

  const addElementCallback = useCallback((element: AssemblyElement) => {
    addElement(element)
  }, [addElement])

  const updateElementCallback = useCallback((id: string, updates: Partial<AssemblyElement>) => {
    updateElement(id, updates)
  }, [updateElement])

  const removeElementCallback = useCallback((id: string) => {
    removeElement(id)
  }, [removeElement])

  const removeElementsCallback = useCallback((ids: string[]) => {
    removeElements(ids)
  }, [removeElements])

  const selectElementCallback = useCallback((id: string) => {
    selectElement(id)
  }, [selectElement])

  const selectElementsCallback = useCallback((ids: string[]) => {
    selectElements(ids)
  }, [selectElements])

  const clearSelectionCallback = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  return useMemo(() => ({
    addElement: addElementCallback,
    updateElement: updateElementCallback,
    removeElement: removeElementCallback,
    removeElements: removeElementsCallback,
    selectElement: selectElementCallback,
    selectElements: selectElementsCallback,
    clearSelection: clearSelectionCallback
  }), [addElementCallback, updateElementCallback, removeElementCallback, removeElementsCallback, selectElementCallback, selectElementsCallback, clearSelectionCallback])
}

// Hook pour les actions d'outils optimisées
export const useToolActions = () => {
  const { setActiveTool, setZoom, setGridSize, toggleGrid, activeTool, zoom, gridSize, showGrid } = useCanvasContext()

  const setActiveToolCallback = useCallback((tool: typeof activeTool) => {
    setActiveTool(tool)
  }, [setActiveTool])

  const setZoomCallback = useCallback((newZoom: number) => {
    setZoom(Math.max(10, Math.min(500, newZoom))) // Limiter entre 10% et 500%
  }, [setZoom])

  const setGridSizeCallback = useCallback((size: number) => {
    setGridSize(Math.max(5, Math.min(100, size))) // Limiter entre 5 et 100
  }, [setGridSize])

  const toggleGridCallback = useCallback(() => {
    toggleGrid()
  }, [toggleGrid])

  return useMemo(() => ({
    activeTool,
    zoom,
    gridSize,
    showGrid,
    setActiveTool: setActiveToolCallback,
    setZoom: setZoomCallback,
    setGridSize: setGridSizeCallback,
    toggleGrid: toggleGridCallback
  }), [activeTool, zoom, gridSize, showGrid, setActiveToolCallback, setZoomCallback, setGridSizeCallback, toggleGridCallback])
}

// Hook pour les actions de couches optimisées
export const useLayerActions = () => {
  const { layers, toggleLayerVisibility, toggleLayerLock, setLayerOpacity } = useCanvasContext()

  const toggleLayerVisibilityCallback = useCallback((layer: LayerType) => {
    toggleLayerVisibility(layer)
  }, [toggleLayerVisibility])

  const toggleLayerLockCallback = useCallback((layer: LayerType) => {
    toggleLayerLock(layer)
  }, [toggleLayerLock])

  const setLayerOpacityCallback = useCallback((layer: LayerType, opacity: number) => {
    setLayerOpacity(layer, Math.max(0, Math.min(1, opacity))) // Limiter entre 0 et 1
  }, [setLayerOpacity])

  return useMemo(() => ({
    layers,
    toggleLayerVisibility: toggleLayerVisibilityCallback,
    toggleLayerLock: toggleLayerLockCallback,
    setLayerOpacity: setLayerOpacityCallback
  }), [layers, toggleLayerVisibilityCallback, toggleLayerLockCallback, setLayerOpacityCallback])
}

// Hook pour l'historique optimisé
export const useHistoryActions = () => {
  const { undo, redo, pushToHistory } = useCanvasContext()
  const canUndo = useCanUndo()
  const canRedo = useCanRedo()

  const undoCallback = useCallback(() => {
    if (canUndo) undo()
  }, [canUndo, undo])

  const redoCallback = useCallback(() => {
    if (canRedo) redo()
  }, [canRedo, redo])

  const pushToHistoryCallback = useCallback(() => {
    pushToHistory()
  }, [pushToHistory])

  return useMemo(() => ({
    canUndo,
    canRedo,
    undo: undoCallback,
    redo: redoCallback,
    pushToHistory: pushToHistoryCallback
  }), [canUndo, canRedo, undoCallback, redoCallback, pushToHistoryCallback])
}

// Hook pour l'interface utilisateur optimisée
export const useUIActions = () => {
  const {
    ui,
    toggleToolbar,
    togglePropertiesPanel,
    toggleLayersPanel,
    toggleImageLibrary
  } = useCanvasContext()

  const toggleToolbarCallback = useCallback(() => {
    toggleToolbar()
  }, [toggleToolbar])

  const togglePropertiesPanelCallback = useCallback(() => {
    togglePropertiesPanel()
  }, [togglePropertiesPanel])

  const toggleLayersPanelCallback = useCallback(() => {
    toggleLayersPanel()
  }, [toggleLayersPanel])

  const toggleImageLibraryCallback = useCallback(() => {
    toggleImageLibrary()
  }, [toggleImageLibrary])

  return useMemo(() => ({
    ui,
    toggleToolbar: toggleToolbarCallback,
    togglePropertiesPanel: togglePropertiesPanelCallback,
    toggleLayersPanel: toggleLayersPanelCallback,
    toggleImageLibrary: toggleImageLibraryCallback
  }), [ui, toggleToolbarCallback, togglePropertiesPanelCallback, toggleLayersPanelCallback, toggleImageLibraryCallback])
}

// Hook pour la sauvegarde optimisée
export const useSaveActions = () => {
  const {
    saveState,
    markDirty,
    markClean,
    setSaveLoading,
    setLastSaved
  } = useCanvasContext()

  const markDirtyCallback = useCallback(() => {
    markDirty()
  }, [markDirty])

  const markCleanCallback = useCallback(() => {
    markClean()
  }, [markClean])

  const setSaveLoadingCallback = useCallback((loading: boolean) => {
    setSaveLoading(loading)
  }, [setSaveLoading])

  const setLastSavedCallback = useCallback((date: Date) => {
    setLastSaved(date)
  }, [setLastSaved])

  return useMemo(() => ({
    saveState,
    markDirty: markDirtyCallback,
    markClean: markCleanCallback,
    setSaveLoading: setSaveLoadingCallback,
    setLastSaved: setLastSavedCallback
  }), [saveState, markDirtyCallback, markCleanCallback, setSaveLoadingCallback, setLastSavedCallback])
}

// Hook pour l'application PixiJS
export const usePixiApp = () => {
  const { pixiApp, initializePixiApp } = useCanvasContext()

  const initializePixiAppCallback = useCallback((app: any) => {
    initializePixiApp(app)
  }, [initializePixiApp])

  return useMemo(() => ({
    pixiApp,
    initializePixiApp: initializePixiAppCallback
  }), [pixiApp, initializePixiAppCallback])
}

// Hook principal simplifié pour éviter les problèmes de hooks
export const useCanvas = () => {
  const context = useCanvasContext()

  // Calculer les éléments sélectionnés directement
  const selectedElements = useMemo(() =>
    context.elements.filter(el => context.selectedElementIds.includes(el.id)),
    [context.elements, context.selectedElementIds]
  )

  // Actions d'éléments simplifiées
  const elementActions = useMemo(() => ({
    addElement: context.addElement,
    updateElement: context.updateElement,
    removeElement: context.removeElement,
    removeElements: context.removeElements,
    selectElement: context.selectElement,
    selectElements: context.selectElements,
    clearSelection: context.clearSelection
  }), [context])

  // Actions d'outils simplifiées
  const toolActions = useMemo(() => ({
    setActiveTool: context.setActiveTool,
    setZoom: context.setZoom,
    setGridSize: context.setGridSize,
    toggleGrid: context.toggleGrid
  }), [context])

  // Actions de sauvegarde simplifiées
  const saveActions = useMemo(() => ({
    markDirty: context.markDirty,
    markClean: context.markClean,
    setSaveLoading: context.setSaveLoading,
    setLastSaved: context.setLastSaved
  }), [context])

  // Actions d'historique simplifiées
  const historyActions = useMemo(() => ({
    undo: context.undo,
    redo: context.redo,
    pushToHistory: context.pushToHistory,
    canUndo: context.history.past.length > 0,
    canRedo: context.history.future.length > 0
  }), [context])

  return useMemo(() => ({
    // État de base
    ...context,

    // Données dérivées
    selectedElements,

    // Actions groupées
    elements: elementActions,
    tools: toolActions,
    save: saveActions,
    history: historyActions
  }), [context, selectedElements, elementActions, toolActions, saveActions, historyActions])
}

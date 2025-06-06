// Exports principaux pour le système d'assemblage PixiJS MANGAKA-AI

// Composants principaux optimisés
export { default as PixiApplication } from './core/PixiApplication'
export { default as ToolBar } from './ui/ToolBar'
export { default as ImageLibrary } from './ui/ImageLibrary'
export { default as PixiPagesSidebar } from './ui/PixiPagesSidebar'
export { default as PixiAssemblyApp } from './PixiAssemblyAppOptimized'
export { default as PixiAssemblyAppOptimized } from './PixiAssemblyAppOptimized'

// Layout Dashtoon
export {
  DashtoonLayout,
  VerticalToolbar,
  CanvasArea,
  RightPanel
} from './layout'

// Outils de création
export {
  PanelTool,
  usePanelTool,
  BubbleTool,
  useBubbleTool
} from './tools'

// Objets interactifs
export { ResizableSprite, createResizableSprite } from './objects/ResizableSprite'
export { DialogueBubble, createDialogueBubble } from './objects/DialogueBubble'
export { MangaPanel, createMangaPanel } from './objects/MangaPanel'

// Système de gestion d'état optimisé (React)
export {
  CanvasProvider,
  useCanvasContext,
  generateElementId,
  generatePageId,
  OPTIMIZED_PIXI_CONFIG
} from './context/CanvasContext'

// Hooks optimisés
export {
  useCanvas,
  useSelectedElements,
  useElementsByLayer,
  useCanUndo,
  useCanRedo,
  useElementActions,
  useToolActions,
  useLayerActions,
  useHistoryActions,
  useUIActions,
  useSaveActions,
  usePixiApp
} from './hooks/useCanvasOptimized'

// Système de performance
export {
  PerformanceMonitor,
  performanceMonitor,
  usePerformanceMonitor
} from './performance/PerformanceMonitor'

export {
  MemoryManager,
  memoryManager,
  useMemoryManager
} from './performance/MemoryManager'

// Gestionnaire d'état legacy (Zustand) - À supprimer progressivement
export {
  useAssemblyStore,
  DEFAULT_PIXI_CONFIG
} from './managers/StateManager'

// Gestionnaire de sauvegarde
export {
  DeferredSaveManager,
  saveManager,
  useSaveManager
} from './managers/SaveManager'

// Gestionnaire de textures
export {
  TextureManager,
  textureManager,
  useTextureManager
} from './managers/TextureManager'

// Utilitaires de performance
export {
  PerformanceTest,
  runAllPerformanceTests
} from './utils/PerformanceTest'

// Types
export type {
  AssemblyElement,
  SpriteElement,
  DialogueElement,
  PanelElement,
  TextElement,
  ElementType,
  LayerType,
  BubbleType,
  PanelShape,
  ElementTransform,
  ElementProperties,
  ElementMetadata,
  PageState,
  AssemblyState,
  AssemblyActions,
  AssemblyStore,
  PixiConfig,
  ExportOptions,
  PageTemplate,
  ResizeHandle,
  DragEvent,
  SerializedState
} from './types/assembly.types'

// Hooks utilitaires
export { useToolBarShortcuts } from './ui/ToolBar'

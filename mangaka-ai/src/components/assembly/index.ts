// Exports principaux pour le système d'assemblage PixiJS MANGAKA-AI

// Composants principaux optimisés
export { default as PixiApplication } from './core/PixiApplication'
// Composants UI PixiJS supprimés - utilisation des composants Polotno
// PixiAssemblyApp supprimé - utilisation de PolotnoAssemblyApp

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
  TipTapBubbleTool,
  useTipTapBubbleTool
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

// Système de performance PixiJS supprimé - Polotno gère ses propres performances

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

// Utilitaires de performance PixiJS supprimés

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

// Hooks utilitaires PixiJS supprimés

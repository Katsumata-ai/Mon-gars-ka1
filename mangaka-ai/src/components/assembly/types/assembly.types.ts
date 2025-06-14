// Types pour le système d'assemblage PixiJS MANGAKA-AI
import { Application, Container, Sprite, Graphics, Text } from 'pixi.js'

// Types d'éléments supportés
export type ElementType = 'sprite' | 'panel' | 'dialogue' | 'background' | 'text' | 'image'

// Types de couches (layers)
export type LayerType = 'background' | 'characters' | 'panels' | 'dialogue' | 'ui'

// Types de bulles de dialogue
export type BubbleType = 'speech' | 'thought' | 'shout' | 'whisper' | 'explosion'

// Types de panels
export type PanelShape = 'rectangle' | 'circle' | 'polygon' | 'irregular'

// Interface pour les transformations d'éléments
export interface ElementTransform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  alpha: number
  zIndex: number
}

// Interface pour les propriétés d'éléments
export interface ElementProperties {
  name: string
  locked: boolean
  visible: boolean
  blendMode?: string
  filters?: any[]
}

// Interface pour les métadonnées d'éléments
export interface ElementMetadata {
  sourceType?: 'character' | 'decor' | 'scene' | 'manual'
  sourceId?: string
  addedAt: string
  lastModified?: string
}

// Interface pour les éléments Sprite
export interface SpriteElement {
  type: 'sprite'
  id: string
  layerType: LayerType
  texture: {
    url: string
    originalWidth: number
    originalHeight: number
  }
  transform: ElementTransform
  properties: ElementProperties
  metadata: ElementMetadata
}

// Enhanced queue configuration interface
export interface QueueConfiguration {
  // Core positioning (360° system)
  angle: number // 0-360 degrees, 0 = right, 90 = down, 180 = left, 270 = up
  length: number // Distance from bubble edge to queue tip
  thickness: number // Queue thickness/width

  // Visual styling
  style: 'triangle' | 'curved' | 'jagged' | 'thin' // Queue shape style
  seamlessConnection: boolean // Whether queue connects seamlessly to bubble border

  // Interactive manipulation
  isManipulating: boolean // Whether queue is currently being manipulated
  showHandles: boolean // Whether to show manipulation handles
  snapToCardinal: boolean // Whether to snap to 0°, 90°, 180°, 270°

  // Advanced properties
  curvature?: number // For curved queues (0-1, 0 = straight, 1 = maximum curve)
  tapering?: number // Queue tapering factor (0-1, 0 = no taper, 1 = maximum taper)
}

// Interface pour les bulles de dialogue
export interface DialogueElement {
  type: 'dialogue'
  id: string
  layerType: 'dialogue'
  text: string
  transform: Omit<ElementTransform, 'scaleX' | 'scaleY'>
  dialogueStyle: {
    type: BubbleType
    backgroundColor: number
    outlineColor: number
    outlineWidth: number
    textColor: number
    fontSize: number
    fontFamily: string
    textAlign: 'left' | 'center' | 'right'
    dashedOutline: boolean
    // ✅ LEGACY SUPPORT - Keep for backward compatibility
    tailPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    tailLength?: number
    tailAngleDegrees?: number
    tailAttachmentSide?: 'top' | 'bottom' | 'left' | 'right'
    // ✅ NEW ENHANCED QUEUE SYSTEM
    queue: QueueConfiguration
  }
  properties: ElementProperties
}

// Interface pour les panels/cases
export interface PanelElement {
  type: 'panel'
  id: string
  layerType: 'panels'
  transform: Omit<ElementTransform, 'scaleX' | 'scaleY'>
  panelStyle: {
    shape: PanelShape
    borderWidth: number
    borderColor: number
    borderStyle: 'solid' | 'dashed' | 'dotted'
    cornerRadius?: number
    fillColor?: number | null
    fillAlpha: number
  }
  properties: ElementProperties
}

// Interface pour les éléments de texte libre
export interface TextElement {
  type: 'text'
  id: string
  layerType: LayerType
  text: string
  transform: Omit<ElementTransform, 'scaleX' | 'scaleY'>
  textStyle: {
    fontSize: number
    fontFamily: string
    fontWeight: string
    textColor: string
    textAlign: 'left' | 'center' | 'right'
    lineHeight: number
    letterSpacing: string
    textShadow: string
    backgroundColor: string
    borderColor: string
    borderWidth: number
    maxWidth: number // Largeur maximale pour le retour à la ligne
  }
  properties: ElementProperties
}

// Interface pour les éléments d'image
export interface ImageElement {
  type: 'image'
  id: string
  layerType: LayerType
  transform: Omit<ElementTransform, 'scaleX' | 'scaleY'>
  imageData: {
    src: string
    originalWidth: number
    originalHeight: number
    alt?: string
  }
  properties: ElementProperties
  metadata: ElementMetadata & {
    parentPanelId?: string // ID du panel parent si l'image est liée à un panel
    isUnifiedWithPanel?: boolean // 🆕 Marque si l'image est unifiée avec son panel parent
  }
}

// Union type pour tous les éléments
export type AssemblyElement = SpriteElement | DialogueElement | PanelElement | TextElement | ImageElement

// Interface pour l'état d'une page
export interface PageState {
  pageId: string
  projectId: string
  pageNumber: number
  metadata: {
    name: string
    width: number
    height: number
    format: string
    createdAt: string
    updatedAt: string
    version: string
    pixiVersion: string
  }
  content: {
    stage: {
      width: number
      height: number
      backgroundColor: number
      children: AssemblyElement[]
    }
  }
  state: {
    isDirty: boolean
    lastSaved: string
    lastModified: string
    autoSaveEnabled: boolean
    version: number
  }
}

// Interface pour l'état global de l'assemblage
export interface AssemblyState {
  // Application PixiJS
  pixiApp: Application | null
  
  // État des pages
  currentPageId: string | null
  pages: Record<string, PageState>
  
  // Éléments de la page courante
  elements: AssemblyElement[]
  selectedElementIds: string[]
  
  // Outils et interface
  activeTool: 'select' | 'move' | 'panel' | 'dialogue' | 'text' | 'image'
  showGrid: boolean
  gridSize: number
  zoom: number
  
  // Couches
  layers: {
    [K in LayerType]: {
      visible: boolean
      locked: boolean
      opacity: number
    }
  }
  
  // Historique undo/redo
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
  }
  
  // Sauvegarde
  saveState: {
    isDirty: boolean
    isLoading: boolean
    lastSaved: Date | null
    autoSaveEnabled: boolean
  }
}

// Interface pour les actions du store
export interface AssemblyActions {
  // Initialisation
  initializePixiApp: (app: Application) => void
  setCurrentPage: (pageId: string) => void
  
  // Gestion des éléments
  addElement: (element: AssemblyElement) => void
  updateElement: (id: string, updates: Partial<AssemblyElement>) => void
  deleteElement: (id: string) => void
  deleteElements: (ids: string[]) => void
  
  // Sélection
  selectElement: (id: string) => void
  selectElements: (ids: string[]) => void
  clearSelection: () => void
  
  // Outils
  setActiveTool: (tool: AssemblyState['activeTool']) => void
  setZoom: (zoom: number) => void
  toggleGrid: () => void
  
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
  
  // Sauvegarde
  markDirty: () => void
  markClean: () => void
  setSaveLoading: (loading: boolean) => void
  setLastSaved: (date: Date) => void
}

// Type pour le store complet
export type AssemblyStore = AssemblyState & AssemblyActions

// Interface pour les options de configuration PixiJS
export interface PixiConfig {
  width: number
  height: number
  backgroundColor: number
  resolution: number
  antialias: boolean
  powerPreference: 'default' | 'high-performance' | 'low-power'
  preserveDrawingBuffer: boolean
}

// Interface pour les options d'export
export interface ExportOptions {
  format: 'png' | 'pdf'
  quality: 'web' | 'print' | 'high'
  pages: 'current' | 'all' | number[]
  resolution: number
}

// Interface pour les templates de pages
export interface PageTemplate {
  id: string
  name: string
  description: string
  thumbnail: string
  elements: AssemblyElement[]
  metadata: {
    width: number
    height: number
    format: string
  }
}

// Interface pour les handles de redimensionnement
export interface ResizeHandle {
  id: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 
            'top-center' | 'bottom-center' | 'middle-left' | 'middle-right'
  cursor: string
  x: number
  y: number
}

// Interface pour les événements de drag
export interface DragEvent {
  elementId: string
  startPosition: { x: number; y: number }
  currentPosition: { x: number; y: number }
  deltaX: number
  deltaY: number
}

// Interface pour la sérialisation
export interface SerializedState {
  pageId: string
  projectId: string
  content: any
  metadata: {
    version: string
    pixiVersion: string
    timestamp: number
  }
}

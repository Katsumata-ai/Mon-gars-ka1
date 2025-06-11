// Types pour le système Polotno Studio - MANGAKA-AI
// Note: Types Polotno chargés dynamiquement pour éviter les erreurs SSR

// Types d'outils Polotno adaptés pour Dashtoon
export type PolotnoTool = 'select' | 'text' | 'rectangle' | 'circle' | 'image' | 'panel' | 'bubble'

// Types de bulles de dialogue pour Polotno
export type BubbleType = 'speech' | 'thought' | 'shout' | 'whisper' | 'explosion'

// Interface pour les éléments de panel
export interface PanelElement {
  id: string
  type: 'rect' | 'circle' | 'polygon'
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  rotation: number
  borderRadius?: number
}

// Interface pour les éléments de bulle de dialogue
export interface BubbleElement {
  id: string
  type: 'text'
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
  fontFamily: string
  fontWeight: string
  fill: string
  align: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
  bubbleType: BubbleType
  bubbleStyle: {
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    tailVisible: boolean
    tailPosition: 'bottom-left' | 'bottom-center' | 'bottom-right'
  }
}

// Interface pour l'état du contexte Polotno
export interface PolotnoContextState {
  // Store Polotno principal
  store: any | null
  
  // État de l'interface
  activeTool: PolotnoTool
  selectedElementIds: string[]
  
  // Configuration du canvas
  canvasWidth: number
  canvasHeight: number
  zoom: number
  
  // État des bulles
  bubbleCreationMode: boolean
  bubbleTypeToCreate: BubbleType | null
  
  // État de sauvegarde
  isDirty: boolean
  isLoading: boolean
  lastSaved: Date | null
}

// Interface pour les actions du contexte Polotno
export interface PolotnoContextActions {
  // Initialisation
  initializeStore: (store: any) => void
  
  // Gestion des outils
  setActiveTool: (tool: PolotnoTool) => void
  
  // Gestion des éléments
  addPanel: (x: number, y: number, width?: number, height?: number) => void
  addBubble: (x: number, y: number, bubbleType: BubbleType, text?: string) => void
  addImage: (x: number, y: number, imageUrl: string) => void
  deleteSelectedElements: () => void
  
  // Gestion de la sélection
  selectElement: (elementId: string) => void
  selectElements: (elementIds: string[]) => void
  clearSelection: () => void
  
  // Gestion du canvas
  setZoom: (zoom: number) => void
  resetView: () => void
  
  // Gestion des bulles
  startBubbleCreation: (bubbleType: BubbleType) => void
  cancelBubbleCreation: () => void
  
  // Sauvegarde
  saveProject: () => Promise<void>
  loadProject: (projectData: any) => Promise<void>
  exportAsImage: () => Promise<string>
  exportAsPDF: () => Promise<Blob>
  
  // Utilitaires
  markDirty: () => void
  markClean: () => void
}

// Type combiné pour le contexte complet
export type PolotnoContextType = PolotnoContextState & PolotnoContextActions

// Interface pour les props du composant principal
export interface PolotnoAssemblyAppProps {
  projectId: string
  currentPage?: number
  className?: string
}

// Configuration par défaut pour les bulles
export const DEFAULT_BUBBLE_STYLES: Record<BubbleType, Partial<BubbleElement['bubbleStyle']>> = {
  speech: {
    backgroundColor: '#ffffff',
    borderColor: '#000000',
    borderWidth: 2,
    borderRadius: 20,
    tailVisible: true,
    tailPosition: 'bottom-left'
  },
  thought: {
    backgroundColor: '#f0f8ff',
    borderColor: '#4169e1',
    borderWidth: 1,
    borderRadius: 30,
    tailVisible: true,
    tailPosition: 'bottom-center'
  },
  shout: {
    backgroundColor: '#fff5ee',
    borderColor: '#ff4500',
    borderWidth: 3,
    borderRadius: 10,
    tailVisible: true,
    tailPosition: 'bottom-right'
  },
  whisper: {
    backgroundColor: '#f5f5f5',
    borderColor: '#696969',
    borderWidth: 1,
    borderRadius: 15,
    tailVisible: true,
    tailPosition: 'bottom-left'
  },
  explosion: {
    backgroundColor: '#ffffe0',
    borderColor: '#ffd700',
    borderWidth: 4,
    borderRadius: 5,
    tailVisible: false,
    tailPosition: 'bottom-center'
  }
}

// Configuration par défaut pour les panels
export const DEFAULT_PANEL_STYLE = {
  fill: '#ffffff',
  stroke: '#000000',
  strokeWidth: 2,
  opacity: 1,
  borderRadius: 0
}

// Configuration du canvas par défaut
export const DEFAULT_CANVAS_CONFIG = {
  width: 1200,
  height: 1600,
  backgroundColor: '#ffffff'
}

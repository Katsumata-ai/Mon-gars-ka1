// Types et interfaces pour le système d'export mangaka-ai
// Adapté pour SimpleCanvasEditor + couches HTML

export interface ExportOptions {
  projectId: string
  format: 'png' | 'pdf'
  quality: number // 0.1 à 1.0
  resolution: number // 1x, 2x, 3x, 4x
  pageIds?: string[] // Si non spécifié, toutes les pages
  onProgress?: (progress: ExportProgress) => void
}

export interface ExportProgress {
  step: 'fetching' | 'rendering' | 'composing' | 'exporting'
  current: number
  total: number
  message: string
  pageId?: string
}

export interface PageData {
  id: string
  number: number
  title: string
  content: {
    stage: {
      children: AssemblyElement[]
    }
  }
  lastModified: Date
}

export interface ExportPageData extends PageData {
  elements: {
    panels: PanelElement[]
    bubbles: DialogueElement[]
    texts: TextElement[]
  }
}

// Configuration pour le rendu haute résolution
export interface RenderConfig {
  width: number
  height: number
  scale: number
  quality: number
  backgroundColor: string
}

// Résultat d'un rendu d'élément
export interface ElementRenderResult {
  success: boolean
  error?: string
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}

// Configuration pour le chargement d'images
export interface ImageLoadConfig {
  crossOrigin: boolean
  timeout: number
  retryCount: number
  fallbackToProxy: boolean
}

// Métadonnées d'export
export interface ExportMetadata {
  projectId: string
  exportDate: Date
  format: string
  resolution: number
  pageCount: number
  totalElements: number
  exportDuration: number
}

// Erreurs d'export spécialisées
export class ExportError extends Error {
  constructor(
    message: string,
    public code: 'FETCH_ERROR' | 'RENDER_ERROR' | 'EXPORT_ERROR' | 'IMAGE_LOAD_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'ExportError'
  }
}

// Import des types existants
import type { 
  AssemblyElement, 
  PanelElement, 
  DialogueElement, 
  TextElement 
} from '@/components/assembly/types/assembly.types'

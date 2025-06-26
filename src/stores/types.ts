// stores/types.ts - Types pour le système de persistance
export interface ScriptStats {
  pages: number
  panels: number
  chapters: number
  words: number
  characters: number
  dialogues: number
}

export interface FileTreeNode {
  id: string
  name?: string
  title?: string
  type: 'file' | 'folder' | 'page' | 'chapter' | 'panel' | 'dialogue' | 'description'
  children?: FileTreeNode[]
  content?: string
  expanded?: boolean
  lineNumber?: number
}

export interface ScriptData {
  content: string
  title: string
  stats: ScriptStats
  fileTree: FileTreeNode[]
  lastModified: Date
}

export interface CharacterData {
  id: string
  name: string
  description: string
  avatar?: string
  traits: string[]
  relationships: Record<string, string>
  lastModified: Date
}

export interface BackgroundData {
  id: string
  name: string
  description: string
  image?: string
  type: 'interior' | 'exterior' | 'abstract'
  lastModified: Date
}

export interface DecorData {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  category: string
  mood: string
  timeOfDay: string
  created_at: string
  lastModified: Date
  metadata?: {
    environment?: string
    lighting?: string
    atmosphere?: string
    [key: string]: unknown
  }
}

export interface SceneData {
  id: string
  title: string
  description: string
  characters: string[]
  background: string
  panels: PanelData[]
  lastModified: Date
}

export interface PanelData {
  id: string
  type: 'dialogue' | 'action' | 'narration'
  content: string
  characters: string[]
  background?: string
  effects?: string[]
}

export interface PageData {
  id: string
  number: number
  panels: PanelData[]
  layout: 'single' | 'double' | 'splash'
  lastModified: Date
}

export interface AssemblyData {
  pages: PageData[]
  currentPage: number
  totalPages: number
  lastModified: Date
  // Nouvel état canvas pour persistance entre menus
  canvasState?: {
    position: { x: number; y: number }
    zoom: number
    currentPageId: string | null
    showGrid: boolean
    gridSize: number
    activeTool: string
    lastActiveTab: string
    timestamp: number
  }
}

export interface ProjectExportData {
  projectId: string
  scriptData: ScriptData
  charactersData: CharacterData[]
  backgroundsData: BackgroundData[]
  decorsData: DecorData[]
  scenesData: SceneData[]
  assemblyData: AssemblyData
  exportDate: string
}

export interface ProjectState {
  // Identifiants
  projectId: string
  userId: string

  // Données métier
  scriptData: ScriptData
  charactersData: CharacterData[]
  backgroundsData: BackgroundData[]
  decorsData: DecorData[]
  scenesData: SceneData[]
  assemblyData: AssemblyData

  // Métadonnées persistance
  hasUnsavedChanges: boolean
  lastSavedToDb: Date | null
  lastSavedToLocal: Date | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Actions de mise à jour
  updateScriptData: (data: Partial<ScriptData>) => void
  updateCharactersData: (data: CharacterData[]) => void
  updateBackgroundsData: (data: BackgroundData[]) => void
  updateDecorsData: (data: DecorData[]) => void
  updateScenesData: (data: SceneData[]) => void
  updateAssemblyData: (data: Partial<AssemblyData>) => void

  // Actions persistance
  saveToDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
  markAsModified: () => void
  resetUnsavedChanges: () => void

  // Utilitaires
  getLastModified: () => Date
  hasDataChanged: (section?: string) => boolean
  exportAllData: () => ProjectExportData
  initializeProject: (projectId: string, userId: string, projectName?: string) => void
}

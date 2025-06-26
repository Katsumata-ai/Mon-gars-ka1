'use client'

import { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react'
import {
  FileText,
  Users,
  Mountain,
  Camera,
  Layout,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Save,
  Palette,
  Wand2,
  Image as ImageIcon,
  Type,
  Layers,

  Grid,
  BookOpen,
  Sparkles,
  Download,
  Upload,
  Settings,
  Zap,
  LogOut,
  MessageCircle
} from 'lucide-react'

// Import de la fonction cn pour combiner les classes CSS
import { cn } from '@/lib/utils'

// Import des nouveaux composants
import MangaButton from '@/components/ui/MangaButton'
import AssetSidebar from '@/components/editor/AssetSidebar'

import ScriptEditorPanel from '@/components/editor/ScriptEditorPanel'
import CachedMangaCharacterStudio from '@/components/character/CachedMangaCharacterStudio'
import CachedMangaDecorStudio from '@/components/decor/CachedMangaDecorStudio'
import SceneComposerPanel from '@/components/editor/SceneComposerPanel'
import PolotnoAssemblyApp from '@/components/assembly/PolotnoAssemblyApp'
import { GlobalLimitsIndicator } from '@/components/credits/GlobalLimitsIndicator'

// Import des composants mobile
import MobileHamburgerMenu from '@/components/mobile/MobileHamburgerMenu'
import MobileDrawer from '@/components/mobile/MobileDrawer'

// Import du système de persistance
import SaveButton from '@/components/save/SaveButton'
import { useProjectStore } from '@/stores/projectStore'

// Import du correcteur d'accessibilité
import AccessibilityFixer from '@/components/ui/AccessibilityFixer'

// Import du composant d'avertissement mobile
import MobileWarning from '@/components/mobile/MobileWarning'

interface ModernUnifiedEditorProps {
  projectId: string
  projectName: string
}

type EditorTab = 'script' | 'characters' | 'backgrounds' | 'scenes' | 'assembly'

// Types pour le cache des données
interface Character {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  traits: string[]
  style: string
  created_at: string
  metadata?: any
}

interface Decor {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  traits: string[]
  style: string
  created_at: string
  metadata?: any
}

interface Scene {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  characters: string[]
  decors: string[]
  camera_plan: string
  lighting: string
  ambiance: string
  details: string
  created_at: string
  metadata?: {
    [key: string]: unknown
  }
}

interface DataCache {
  characters: Character[]
  decors: Decor[]
  scenes: Scene[]
  charactersLoaded: boolean
  decorsLoaded: boolean
  scenesLoaded: boolean
  charactersLoading: boolean
  decorsLoading: boolean
  scenesLoading: boolean
}

interface DataCacheContextType {
  cache: DataCache
  loadCharacters: () => Promise<void>
  loadDecors: () => Promise<void>
  loadScenes: () => Promise<void>
  addCharacter: (character: Character) => void
  addDecor: (decor: Decor) => void
  addScene: (scene: Scene) => void
  removeCharacter: (id: string) => void
  removeDecor: (id: string) => void
  removeScene: (id: string) => void
}

// Contexte pour le cache des données
const DataCacheContext = createContext<DataCacheContextType | null>(null)

// Hook pour utiliser le cache
export const useDataCache = () => {
  const context = useContext(DataCacheContext)
  if (!context) {
    throw new Error('useDataCache must be used within a DataCacheProvider')
  }
  return context
}

const editorTabs = [
  {
    id: 'script',
    name: 'Script',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Write your story',
    gradient: 'from-blue-500/20 to-blue-600/20'
  },
  {
    id: 'characters',
    name: 'Characters',
    icon: Users,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
    description: 'Create your characters',
    gradient: 'from-primary-500/20 to-primary-600/20'
  },
  {
    id: 'backgrounds',
    name: 'Backgrounds',
    icon: Mountain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Design your environments',
    gradient: 'from-purple-500/20 to-purple-600/20'
  },
  {
    id: 'scenes',
    name: 'Scenes',
    icon: Camera,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Compose your scenes',
    gradient: 'from-orange-500/20 to-orange-600/20'
  },
  {
    id: 'assembly',
    name: 'Assembly',
    icon: Layout,
    color: 'text-accent-400',
    bgColor: 'bg-accent-500/10',
    description: 'Assemble your pages',
    gradient: 'from-accent-500/20 to-accent-600/20'
  }
] as const

// Provider de cache des données
function DataCacheProvider({ children, projectId }: { children: React.ReactNode, projectId: string }) {
  const [cache, setCache] = useState<DataCache>({
    characters: [],
    decors: [],
    scenes: [],
    charactersLoaded: false,
    decorsLoaded: false,
    scenesLoaded: false,
    charactersLoading: false,
    decorsLoading: false,
    scenesLoading: false
  })

  const loadCharacters = useCallback(async () => {
    if (cache.charactersLoaded || cache.charactersLoading) return

    setCache(prev => ({ ...prev, charactersLoading: true }))
    try {
      const response = await fetch(`/api/projects/${projectId}/characters`, {
        headers: {
          'Cache-Control': 'max-age=300' // Cache 5 minutes
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCache(prev => ({
          ...prev,
          characters: data.characters || [],
          charactersLoaded: true,
          charactersLoading: false
        }))
      }
    } catch (error) {
      console.error('Error loading characters:', error)
      setCache(prev => ({ ...prev, charactersLoading: false }))
    }
  }, [cache.charactersLoaded, cache.charactersLoading, projectId])

  const loadDecors = useCallback(async () => {
    if (cache.decorsLoaded || cache.decorsLoading) return

    setCache(prev => ({ ...prev, decorsLoading: true }))
    try {
      const response = await fetch(`/api/projects/${projectId}/decors`, {
        headers: {
          'Cache-Control': 'max-age=300' // Cache 5 minutes
        }
      })
      if (response.ok) {
        const data = await response.json()
        setCache(prev => ({
          ...prev,
          decors: data.decors || [],
          decorsLoaded: true,
          decorsLoading: false
        }))
      }
    } catch (error) {
      console.error('Error loading backgrounds:', error)
      setCache(prev => ({ ...prev, decorsLoading: false }))
    }
  }, [cache.decorsLoaded, cache.decorsLoading, projectId])

  const loadScenes = useCallback(async () => {
    if (cache.scenesLoaded || cache.scenesLoading) return

    setCache(prev => ({ ...prev, scenesLoading: true }))

    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`, {
        headers: {
          'Cache-Control': 'max-age=300' // Cache 5 minutes
        }
      })
      const data = await response.json()

      if (data.success) {
        // Transformer les données au format Scene
        const transformedScenes: Scene[] = (data.scenes || []).map((scene: any) => ({
          id: scene.id,
          name: scene.original_prompt?.slice(0, 40) || 'Unnamed scene',
          description: scene.original_prompt || '',
          prompt: scene.optimized_prompt || scene.original_prompt || '',
          image_url: scene.image_url,
          characters: scene.character_ids || [],
          decors: scene.decor_id ? [scene.decor_id] : [],
          camera_plan: scene.scene_settings?.cameraAngle || '',
          lighting: scene.scene_settings?.lighting || '',
          ambiance: scene.scene_settings?.mood || '',
          details: scene.scene_settings?.additionalDetails || '',
          created_at: scene.created_at,
          metadata: scene.metadata
        }))

        setCache(prev => ({
          ...prev,
          scenes: transformedScenes,
          scenesLoaded: true,
          scenesLoading: false
        }))
      }
    } catch (error) {
      console.error('Erreur chargement scènes:', error)
      setCache(prev => ({ ...prev, scenesLoading: false }))
    }
  }, [cache.scenesLoaded, cache.scenesLoading, projectId])

  const addCharacter = useCallback((character: Character) => {
    setCache(prev => ({
      ...prev,
      characters: [character, ...prev.characters]
    }))
  }, [])

  const addDecor = useCallback((decor: Decor) => {
    setCache(prev => ({
      ...prev,
      decors: [decor, ...prev.decors]
    }))
  }, [])

  const removeCharacter = useCallback((id: string) => {
    setCache(prev => ({
      ...prev,
      characters: prev.characters.filter(c => c.id !== id)
    }))
  }, [])

  const removeDecor = useCallback((id: string) => {
    setCache(prev => ({
      ...prev,
      decors: prev.decors.filter(d => d.id !== id)
    }))
  }, [])

  const addScene = useCallback((scene: Scene) => {
    setCache(prev => ({
      ...prev,
      scenes: [scene, ...prev.scenes]
    }))
  }, [])

  const removeScene = useCallback((id: string) => {
    setCache(prev => ({
      ...prev,
      scenes: prev.scenes.filter(s => s.id !== id)
    }))
  }, [])

  const contextValue = useMemo(() => ({
    cache,
    loadCharacters,
    loadDecors,
    loadScenes,
    addCharacter,
    addDecor,
    addScene,
    removeCharacter,
    removeDecor,
    removeScene
  }), [
    cache,
    loadCharacters,
    loadDecors,
    loadScenes,
    addCharacter,
    addDecor,
    addScene,
    removeCharacter,
    removeDecor,
    removeScene
  ])

  return (
    <DataCacheContext.Provider value={contextValue}>
      {children}
    </DataCacheContext.Provider>
  )
}

function ModernUnifiedEditorContent({ projectId, projectName }: ModernUnifiedEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('script')

  // Hook pour accéder au cache
  const { loadCharacters, loadDecors, loadScenes } = useDataCache()
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState([1, 2, 3])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [assetSidebarVisible, setAssetSidebarVisible] = useState(false)

  // États pour mobile
  const [mobileAssetDrawerOpen, setMobileAssetDrawerOpen] = useState(false)

  // Store de persistance global
  const { initializeProject, loadFromDatabase } = useProjectStore()

  // ✅ CORRECTION : Nettoyage lors des changements d'onglet pour éviter les doublons
  useEffect(() => {
    // Nettoyer les événements et états quand on quitte l'onglet assembly
    return () => {
      if (activeTab === 'assembly') {
        // Émettre un événement de nettoyage global
        window.dispatchEvent(new CustomEvent('assemblyTabUnmount'))
      }
    }
  }, [activeTab])

  // Préchargement intelligent des données selon l'onglet actif
  useEffect(() => {
    const preloadData = async () => {
      switch (activeTab) {
        case 'characters':
          await loadCharacters()
          break
        case 'backgrounds':
          await loadDecors()
          break
        case 'scenes':
          await loadScenes()
          // Précharger aussi les personnages et décors nécessaires pour les scènes
          await loadCharacters()
          await loadDecors()
          break
        default:
          break
      }
    }

    preloadData()
  }, [activeTab, loadCharacters, loadDecors, loadScenes])

  // Initialisation du projet au montage
  useEffect(() => {
    const initProject = async () => {
      try {
        // Initialiser le store avec les IDs du projet
        initializeProject(projectId, '00000000-0000-0000-0000-000000000001', projectName) // Mode démo pour l'instant

        // Charger les données existantes (en mode dégradé si API non disponible)
        await loadFromDatabase()
      } catch (error) {
        console.warn('Initialisation en mode dégradé:', error)
      }
    }

    if (projectId) {
      initProject()
    }
  }, [projectId, initializeProject, loadFromDatabase])

  // Fonction pour ajouter une page avec renumérotation automatique
  const addPage = () => {
    const newPages = [...pages, pages.length + 1]
    setPages(newPages)
  }

  // Fonction pour supprimer une page avec renumérotation automatique
  const deletePage = (pageNumber: number) => {
    if (pages.length <= 1) return // Empêcher la suppression de la dernière page

    const pageIndex = pages.indexOf(pageNumber)
    if (pageIndex === -1) return

    // Supprimer la page et renuméroter automatiquement
    const newPages = pages
      .filter(p => p !== pageNumber)
      .map((_, index) => index + 1)

    setPages(newPages)

    // Ajuster la page active si nécessaire
    if (currentPage === pageNumber) {
      // Si on supprime la page active, sélectionner la page précédente ou la première
      const newActivePage = pageIndex > 0 ? pageIndex : 1
      setCurrentPage(Math.min(newActivePage, newPages.length))
    } else if (currentPage > pageNumber) {
      // Si la page active est après la page supprimée, décrémenter
      setCurrentPage(currentPage - 1)
    }
  }

  // Fonction pour dupliquer une page avec renumérotation automatique
  const duplicatePage = (pageNumber: number) => {
    const pageIndex = pages.indexOf(pageNumber)
    if (pageIndex === -1) return

    // Insérer la nouvelle page après la page dupliquée
    const newPages = [
      ...pages.slice(0, pageIndex + 1),
      pageNumber + 1,
      ...pages.slice(pageIndex + 1)
    ].map((_, index) => index + 1) // Renuméroter automatiquement

    setPages(newPages)

    // Ajuster la page active si nécessaire
    if (currentPage > pageNumber) {
      setCurrentPage(currentPage + 1)
    }
  }

  // Fonction pour réorganiser les pages
  const reorderPages = (newOrder: number[]) => {
    setPages(newOrder)
  }

  const handleExit = () => {
    if (window.confirm('Êtes-vous sûr de vouloir quitter l\'éditeur ? Les modifications non sauvegardées seront perdues.')) {
      window.location.href = '/dashboard'
    }
  }

  const toggleAssetSidebar = () => {
    // Sur mobile, utiliser les drawers
    if (window.innerWidth < 768) {
      setMobileAssetDrawerOpen(!mobileAssetDrawerOpen)
    } else {
      // Sur desktop, comportement normal
      setAssetSidebarVisible(!assetSidebarVisible)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptEditorPanel projectId={projectId} />

      case 'characters':
        return <CachedMangaCharacterStudio projectId={projectId} />

      case 'backgrounds':
        return <CachedMangaDecorStudio projectId={projectId} />

      case 'scenes':
        return <SceneComposerPanel projectId={projectId} />

      case 'assembly':
        return <PolotnoAssemblyApp projectId={projectId} currentPage={currentPage} />

      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Sparkles className="w-16 h-16 text-dark-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Sélectionnez un outil</h3>
              <p className="text-dark-400">Choisissez un onglet pour commencer à créer</p>
            </div>
          </div>
        )
    }
  }

  return (
    <>
      {/* Avertissement mobile - s'affiche uniquement sur mobile */}
      <MobileWarning />

      {/* Correcteur automatique d'accessibilité */}
      <AccessibilityFixer />

      <div className="h-screen bg-dark-900 flex overflow-hidden" suppressHydrationWarning={true}>
      {/* Navbar Gauche - Desktop uniquement */}
      <div className="hidden md:flex w-64 bg-dark-800 border-r border-dark-700 flex-col flex-shrink-0" suppressHydrationWarning={true}>
        {/* Header Navbar - Design Élégant et Professionnel */}
        <div className="p-4 border-b border-dark-700 bg-gradient-to-r from-dark-800 to-dark-750" suppressHydrationWarning={true}>
          <div className="flex items-center space-x-3" suppressHydrationWarning={true}>
            {/* Logo/Icône avec effet moderne */}
            <div className="relative" suppressHydrationWarning={true}>
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg" suppressHydrationWarning={true}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-dark-800" suppressHydrationWarning={true}></div>
            </div>

            {/* Texte avec hiérarchie typographique moderne */}
            <div className="flex-1 min-w-0" suppressHydrationWarning={true}>
              <h1 className="text-base font-bold text-white truncate leading-tight tracking-wide">
                {projectName}
              </h1>
              <p className="text-xs text-primary-400 font-medium tracking-wider uppercase">
                Manga Studio
              </p>
            </div>
          </div>

          {/* Barre de progression subtile pour l'effet visuel */}
          <div className="mt-3 h-0.5 bg-dark-600 rounded-full overflow-hidden" suppressHydrationWarning={true}>
            <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" suppressHydrationWarning={true}></div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 p-3 overflow-y-hidden" suppressHydrationWarning={true}>
          <div className="space-y-2" suppressHydrationWarning={true}>
            {editorTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as EditorTab)}
                  className={cn(
                    'w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200',
                    activeTab === tab.id
                      ? `${tab.bgColor} ${tab.color} border border-current`
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left flex-1" suppressHydrationWarning={true}>
                    <div className="font-medium text-sm" suppressHydrationWarning={true}>{tab.name}</div>
                    <div className="text-xs opacity-75" suppressHydrationWarning={true}>{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Indicateur global des limites - Toujours visible */}
        <div className="p-3 border-t border-dark-700" suppressHydrationWarning={true}>
          <GlobalLimitsIndicator compact={true} />
        </div>

        {/* Footer Navbar */}
        <div className="p-3 border-t border-dark-700" suppressHydrationWarning={true}>
          <div className="text-xs text-dark-500 text-center" suppressHydrationWarning={true}>
            MANGAKA AI Beta
          </div>
        </div>
      </div>

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col overflow-hidden" suppressHydrationWarning={true}>
        {/* Header Amélioré avec design professionnel et ergonomique */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-600 px-3 md:px-6 py-3 flex-shrink-0 shadow-lg" suppressHydrationWarning={true}>
          <div className="flex items-center justify-between" suppressHydrationWarning={true}>
            {/* Section gauche - Menu mobile et titre uniquement */}
            <div className="flex items-center space-x-4" suppressHydrationWarning={true}>
              {/* Menu Hamburger Mobile */}
              <MobileHamburgerMenu
                projectName={projectName}
                onAssetsToggle={toggleAssetSidebar}
                assetsVisible={mobileAssetDrawerOpen}
              />

              <h2 className="text-xl font-bold text-white">
                {editorTabs.find(tab => tab.id === activeTab)?.name || 'Éditeur'}
              </h2>
              {activeTab === 'assembly' && (
                <span className="text-sm text-dark-400">Page {currentPage}</span>
              )}
            </div>

            {/* Section droite - Boutons ergonomiques et compacts */}
            <div className="flex items-center gap-3" suppressHydrationWarning={true}>

              {/* Bouton Contact - Desktop uniquement */}
              <div className="hidden md:block" suppressHydrationWarning={true}>
                <MangaButton
                  onClick={() => window.location.href = '/contact'}
                  size="sm"
                  variant="ghost"
                  icon={<MessageCircle className="w-4 h-4" />}
                  title="Nous contacter"
                >
                  Contact
                </MangaButton>
              </div>

              {/* Bouton Save Global Rouge - Desktop uniquement */}
              <div className="hidden md:block" suppressHydrationWarning={true}>
                <SaveButton
                  size="sm"
                  showTimestamp={true}
                  variant="full"
                />
              </div>

              {/* Bouton Exit - Desktop uniquement */}
              <div className="hidden md:block" suppressHydrationWarning={true}>
                <MangaButton
                  onClick={handleExit}
                  size="sm"
                  variant="ghost"
                  icon={<LogOut className="w-4 h-4" />}
                  title="Retourner au dashboard"
                >
                  Exit
                </MangaButton>
              </div>
            </div>
          </div>
        </div>

        {/* Zone de Contenu avec Sidebars */}
        <div className="flex-1 flex overflow-hidden" suppressHydrationWarning={true}>
          {/* Contenu Principal - Scrollable à l'intérieur */}
          <div className="flex-1 overflow-hidden" suppressHydrationWarning={true}>
            {renderTabContent()}
          </div>

          {/* Sidebars Droites - Desktop uniquement */}
          {assetSidebarVisible && activeTab !== 'assembly' && (
            <AssetSidebar
              projectId={projectId}
              isVisible={assetSidebarVisible}
              activeTab={activeTab}
              className="hidden md:flex"
            />
          )}
        </div>

        {/* Drawers Mobile */}
        {activeTab !== 'assembly' && (
          <MobileDrawer
            isOpen={mobileAssetDrawerOpen}
            onClose={() => setMobileAssetDrawerOpen(false)}
            title="Assets Générés"
            position="right"
          >
            <AssetSidebar
              projectId={projectId}
              isVisible={true}
              activeTab={activeTab}
              className="border-0"
            />
          </MobileDrawer>
        )}
      </div>
    </div>
    </>
  )
}

// [FR-UNTRANSLATED: Composant principal qui wrap le contenu avec le DataCacheProvider]
export default function ModernUnifiedEditor({ projectId, projectName }: ModernUnifiedEditorProps) {
  return (
    <DataCacheProvider projectId={projectId}>
      <ModernUnifiedEditorContent projectId={projectId} projectName={projectName} />
    </DataCacheProvider>
  )
}

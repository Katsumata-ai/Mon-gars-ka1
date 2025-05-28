'use client'

import { useState, useEffect } from 'react'
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
  Eye,
  EyeOff,
  Grid,
  BookOpen,
  Sparkles,
  Download,
  Upload,
  Settings,
  Zap
} from 'lucide-react'

// Import de la fonction cn pour combiner les classes CSS
import { cn } from '@/lib/utils'

// Import des nouveaux composants
import MangaButton from '@/components/ui/MangaButton'
import AssetSidebar from '@/components/editor/AssetSidebar'
import PagesSidebar from '@/components/editor/PagesSidebar'
import ScriptEditorPanel from '@/components/editor/ScriptEditorPanel'
import CharacterGeneratorPanel from '@/components/editor/CharacterGeneratorPanel'
import BackgroundGeneratorPanel from '@/components/editor/BackgroundGeneratorPanel'
import SceneComposerPanel from '@/components/editor/SceneComposerPanel'
import CanvasAssemblyPanel from '@/components/editor/CanvasAssemblyPanel'

interface ModernUnifiedEditorProps {
  projectId: string
  projectName: string
}

type EditorTab = 'script' | 'characters' | 'backgrounds' | 'scenes' | 'assembly'

const editorTabs = [
  {
    id: 'script',
    name: 'Script',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Écrivez votre histoire',
    gradient: 'from-blue-500/20 to-blue-600/20'
  },
  {
    id: 'characters',
    name: 'Personnages',
    icon: Users,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/10',
    description: 'Créez vos personnages',
    gradient: 'from-primary-500/20 to-primary-600/20'
  },
  {
    id: 'backgrounds',
    name: 'Décors',
    icon: Mountain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Concevez vos environnements',
    gradient: 'from-purple-500/20 to-purple-600/20'
  },
  {
    id: 'scenes',
    name: 'Scènes',
    icon: Camera,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'Composez vos scènes',
    gradient: 'from-orange-500/20 to-orange-600/20'
  },
  {
    id: 'assembly',
    name: 'Assemblage',
    icon: Layout,
    color: 'text-accent-400',
    bgColor: 'bg-accent-500/10',
    description: 'Assemblez vos pages',
    gradient: 'from-accent-500/20 to-accent-600/20'
  }
] as const

export default function ModernUnifiedEditor({ projectId, projectName }: ModernUnifiedEditorProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>('script')
  const [currentPage, setCurrentPage] = useState(1)
  const [pages, setPages] = useState([1, 2, 3])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [assetSidebarVisible, setAssetSidebarVisible] = useState(false)
  const [pagesSidebarVisible, setPagesSidebarVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const addPage = () => {
    const newPageNumber = Math.max(...pages) + 1
    setPages([...pages, newPageNumber])
  }

  const deletePage = (pageNumber: number) => {
    if (pages.length <= 1) return
    setPages(pages.filter(p => p !== pageNumber))
    if (currentPage === pageNumber) {
      setCurrentPage(pages[0] === pageNumber ? pages[1] : pages[0])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Logique de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastSaved(new Date())
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleAssetSidebar = () => {
    setAssetSidebarVisible(!assetSidebarVisible)
    // Fermer l'autre sidebar si ouverte
    if (!assetSidebarVisible && pagesSidebarVisible) {
      setPagesSidebarVisible(false)
    }
  }

  const togglePagesSidebar = () => {
    setPagesSidebarVisible(!pagesSidebarVisible)
    // Fermer l'autre sidebar si ouverte
    if (!pagesSidebarVisible && assetSidebarVisible) {
      setAssetSidebarVisible(false)
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'script':
        return <ScriptEditorPanel projectId={projectId} onSave={handleSave} />

      case 'characters':
        return <CharacterGeneratorPanel projectId={projectId} />

      case 'backgrounds':
        return <BackgroundGeneratorPanel projectId={projectId} />

      case 'scenes':
        return <SceneComposerPanel projectId={projectId} />

      case 'assembly':
        return <CanvasAssemblyPanel projectId={projectId} currentPage={currentPage} onSave={handleSave} />

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
    <div className="h-screen bg-dark-900 flex overflow-hidden">
      {/* Navbar Gauche - Taille Fixe */}
      <div className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0">
        {/* Header Navbar */}
        <div className="p-4 border-b border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white truncate">{projectName}</h1>
              <p className="text-xs text-dark-400">Studio Manga</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-2">
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
                  <div className="text-left flex-1">
                    <div className="font-medium text-sm">{tab.name}</div>
                    <div className="text-xs opacity-75">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Navbar */}
        <div className="p-3 border-t border-dark-700">
          <div className="text-xs text-dark-500 text-center">
            MANGAKA AI v2.0
          </div>
        </div>
      </div>

      {/* Zone Principale */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Fixe */}
        <div className="bg-dark-800 border-b border-dark-700 p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-xl font-bold text-white">
                {editorTabs.find(tab => tab.id === activeTab)?.name || 'Éditeur'}
              </h2>
              {activeTab === 'assembly' && (
                <span className="text-sm text-dark-400">Page {currentPage}</span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Toggle Pages Sidebar */}
              <MangaButton
                onClick={togglePagesSidebar}
                size="sm"
                variant={pagesSidebarVisible ? "primary" : "ghost"}
                icon={<FileText className="w-4 h-4" />}
              >
                Pages
              </MangaButton>

              {/* Toggle Asset Sidebar */}
              <MangaButton
                onClick={toggleAssetSidebar}
                size="sm"
                variant={assetSidebarVisible ? "primary" : "ghost"}
                icon={<Grid className="w-4 h-4" />}
              >
                Assets
              </MangaButton>

              {/* Save Button */}
              <MangaButton
                onClick={handleSave}
                loading={saving}
                size="sm"
                icon={<Save className="w-4 h-4" />}
              >
                Sauvegarder
              </MangaButton>
            </div>
          </div>
        </div>

        {/* Zone de Contenu avec Sidebars */}
        <div className="flex-1 flex overflow-hidden">
          {/* Contenu Principal - Scrollable à l'intérieur */}
          <div className="flex-1 overflow-hidden">
            {renderTabContent()}
          </div>

          {/* Sidebars Droites */}
          {pagesSidebarVisible && (
            <PagesSidebar
              isVisible={pagesSidebarVisible}
              currentPage={currentPage}
              pages={pages}
              onPageSelect={setCurrentPage}
              onAddPage={addPage}
              onDeletePage={deletePage}
              onDuplicatePage={(page) => {
                const newPageNumber = Math.max(...pages) + 1
                setPages([...pages, newPageNumber])
              }}
            />
          )}

          {assetSidebarVisible && (
            <AssetSidebar
              projectId={projectId}
              isVisible={assetSidebarVisible}
              activeTab={activeTab}
            />
          )}
        </div>


      </div>
    </div>
  )
}

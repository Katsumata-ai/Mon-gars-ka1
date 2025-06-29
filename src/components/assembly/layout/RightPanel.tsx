'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Image, Plus, Trash2, Layers, Eye, EyeOff, Link, Unlink, Settings } from 'lucide-react'
import { useCanvasContext } from '../context/CanvasContext'
import { useAssemblyStore } from '../managers/StateManager'
import SettingsPanel from '../ui/SettingsPanel'

interface RightPanelProps {
  projectId: string
  currentPage?: number
  onPageSelect?: (page: number) => void
  onAddPage?: () => void
  onDeletePage?: (page: number) => void
  className?: string
}

type PanelMode = 'pages' | 'images' | 'settings'

/**
 * Menu droit tri-fonction reproduisant l'interface Dashtoon
 * - Toggle between Pages, Images and Settings modes
 * - Mode Pages : Liste des pages avec navigation
 * - Mode Images : Galerie d'images par catégories
 * - Settings Mode: Selected element settings with deletion
 */
export default function RightPanel({
  projectId,
  currentPage = 1,
  onPageSelect,
  onAddPage,
  onDeletePage,
  className = ''
}: RightPanelProps) {
  const [activeMode, setActiveMode] = useState<PanelMode>('pages')
  const [loading, setLoading] = useState(false)

  // ✅ NOUVEAU : Utiliser les vraies données du StateManager
  const { pages: storePages, currentPageId } = useAssemblyStore()

  // ✅ CORRECTION : Convertir les pages avec une seule source de vérité (pageNumber de Supabase)
  const pages = Object.values(storePages).map(page => ({
    id: page.pageId,
    pageNumber: page.pageNumber, // ✅ SOURCE DE VÉRITÉ : Numéro de Supabase
    title: `Page ${page.pageNumber}`, // ✅ SYNCHRONISATION : Titre basé sur le numéro réel
    thumbnail: null,
    elementsCount: page.content.stage.children.length || 0
  })).sort((a, b) => a.pageNumber - b.pageNumber)

  // État pour les vraies images depuis la base de données
  const [imageCategories, setImageCategories] = useState([
    { name: 'Characters', images: [] },
    { name: 'Backgrounds', images: [] },
    { name: 'Scenes', images: [] }
  ])

  // Charger les images depuis la base de données
  useEffect(() => {
    const loadImages = async () => {
      if (!projectId) return

      setLoading(true)
      try {
        // Load characters
        const charactersResponse = await fetch(`/api/projects/${projectId}/characters`)
        const charactersData = await charactersResponse.json()

        // Load backgrounds
        const decorsResponse = await fetch(`/api/projects/${projectId}/decors`)
        const decorsData = await decorsResponse.json()

        // Load scenes
        const scenesResponse = await fetch(`/api/projects/${projectId}/scenes`)
        const scenesData = await scenesResponse.json()

        // Transform data for interface
        const newCategories = [
          {
            name: 'Characters',
            images: charactersData.success ? charactersData.characters.map((char: any) => ({
              id: char.id,
              url: char.image_url,
              name: char.name || 'Unnamed character',
              type: 'character'
            })) : []
          },
          {
            name: 'Backgrounds',
            images: decorsData.success ? decorsData.decors.map((decor: any) => ({
              id: decor.id,
              url: decor.image_url,
              name: decor.name || 'Unnamed background',
              type: 'decor'
            })) : []
          },
          {
            name: 'Scenes',
            images: scenesData.success ? scenesData.scenes.map((scene: any) => ({
              id: scene.id,
              url: scene.image_url,
              name: scene.metadata?.name || 'Unnamed scene',
              type: 'scene'
            })) : []
          }
        ]

        setImageCategories(newCategories)
      } catch (error) {
        console.error('Error loading images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [projectId])

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* Onglets simplifiés */}
      <div className="border-b border-gray-700 p-3">
        <div className="flex bg-gray-800 rounded-md p-1">
          <button
            onClick={() => setActiveMode('pages')}
            className={`
              flex-1 flex items-center justify-center py-2 px-3 rounded text-xs font-medium transition-colors
              ${activeMode === 'pages'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            <FileText size={14} className="mr-1" />
            Pages
          </button>

          <button
            onClick={() => setActiveMode('images')}
            className={`
              flex-1 flex items-center justify-center py-2 px-3 rounded text-xs font-medium transition-colors
              ${activeMode === 'images'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            <Image size={14} className="mr-1" />
            Images
          </button>

          <button
            onClick={() => setActiveMode('settings')}
            className={`
              flex-1 flex items-center justify-center py-2 px-3 rounded text-xs font-medium transition-colors
              ${activeMode === 'settings'
                ? 'bg-red-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }
            `}
          >
            <Settings size={14} className="mr-1" />
            Settings
          </button>
        </div>
      </div>

      {/* Contenu selon le mode actif */}
      <div className="flex-1 overflow-hidden">
        {activeMode === 'pages' ? (
          <PagesMode
            pages={pages}
            currentPageId={currentPageId}
            onPageSelect={onPageSelect}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage}
            projectId={projectId}
          />
        ) : activeMode === 'images' ? (
          <ImagesMode
            categories={imageCategories}
            loading={loading}
          />
        ) : (
          <SettingsPanel />
        )}
      </div>
    </div>
  )
}

// ✅ REFACTORED: Composant pour le mode Pages avec indicateur intelligent synchronisé Supabase
function PagesMode({
  pages,
  currentPageId,
  onPageSelect,
  onAddPage,
  onDeletePage,
  projectId
}: {
  pages: any[]
  currentPageId: string | null
  onPageSelect?: (page: number) => void
  onAddPage?: () => void
  onDeletePage?: (page: number) => void
  projectId: string
}) {
  const { addPage, deletePage, duplicatePage, setCurrentPage } = useAssemblyStore()

  // Gérer l'ajout de page via StateManager
  const handleAddPage = async () => {
    try {
      console.log('➕ Ajout de nouvelle page via StateManager')
      const newPageId = await addPage(projectId, `Page ${pages.length + 1}`)
      console.log('✅ Page créée avec ID:', newPageId)
      onAddPage?.()
    } catch (error) {
      console.error('❌ Erreur ajout page:', error)
    }
  }

  // Gérer la suppression de page via StateManager
  const handleDeletePage = async (pageId: string) => {
    if (pages.length <= 1) {
      console.warn('⚠️ Impossible de supprimer la dernière page')
      return
    }

    try {
      console.log('🗑️ Suppression de page via StateManager:', pageId)
      await deletePage(projectId, pageId)
      console.log('✅ Page supprimée')
      onDeletePage?.(parseInt(pageId))
    } catch (error) {
      console.error('❌ Erreur suppression page:', error)
    }
  }

  // Gérer la duplication de page via StateManager
  const handleDuplicatePage = async (pageId: string) => {
    try {
      console.log('📋 Duplication de page via StateManager:', pageId)
      const newPageId = await duplicatePage(projectId, pageId)
      console.log('✅ Page dupliquée avec ID:', newPageId)
    } catch (error) {
      console.error('❌ Erreur duplication page:', error)
    }
  }

  // Gérer le changement de page via StateManager
  const handlePageSelect = (pageId: string) => {
    console.log('🔄 Changement de page via StateManager:', pageId)
    setCurrentPage(pageId)
    onPageSelect?.(parseInt(pageId))
  }
  return (
    <div className="h-full flex flex-col">
      {/* Header minimal et professionnel */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-red-500" />
            <div>
              <h3 className="text-white font-medium text-sm">Project Pages</h3>
              <p className="text-xs text-gray-400">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={handleAddPage}
            className="w-8 h-8 rounded-md bg-red-600 hover:bg-red-700 flex items-center justify-center text-white transition-colors"
            title="Ajouter une nouvelle page"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Liste des pages simplifiée */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`
              group relative p-4 rounded-lg border cursor-pointer transition-colors
              ${currentPageId === page.id
                ? 'bg-gray-800 border-red-500'
                : 'bg-gray-900 border-gray-700 hover:border-gray-600 hover:bg-gray-800'
              }
            `}
            onClick={() => handlePageSelect(page.id)}
          >
            <div className="flex items-center space-x-4">
              {/* Miniature simplifiée */}
              <div className="w-14 h-18 bg-gray-800 rounded border border-gray-700 flex items-center justify-center flex-shrink-0">
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={page.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <FileText size={18} className="text-gray-500" />
                )}
              </div>

              {/* Informations de la page */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-white">
                      {page.title}
                    </h4>
                  </div>

                  {/* Indicateur de page active */}
                  {currentPageId === page.id && (
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton de suppression */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePage(page.id)
                }}
                className="w-7 h-7 rounded-md bg-gray-700 hover:bg-red-600 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                title="Supprimer la page"
                disabled={pages.length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant pour le mode Images
function ImagesMode({
  categories,
  loading = false
}: {
  categories: any[]
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Instructions d'utilisation */}
      <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-center text-blue-300 text-sm">
          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Drag and drop images into panels on the canvas</span>
        </div>
      </div>

      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.name}>
            {/* Titre de la catégorie */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-white font-medium">{category.name}</h4>
              <span className="text-gray-400 text-sm">
                {category.images.length} image{category.images.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Grille d'images */}
            {category.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {category.images.map((image) => (
                  <div
                    key={image.id}
                    className="
                      group relative aspect-square bg-dark-700 rounded-lg overflow-hidden
                      cursor-pointer hover:ring-2 hover:ring-red-500 transition-all
                    "
                    draggable
                    onDragStart={(e) => {
                      // Format compatible avec le système de drop du canvas
                      const dragData = {
                        type: 'image',
                        sourceId: image.id.toString(),
                        imageUrl: image.url,
                        metadata: {
                          originalWidth: 200, // Taille par défaut
                          originalHeight: 200,
                          name: image.name,
                          sourceType: image.type
                        }
                      }

                      e.dataTransfer.setData('application/json', JSON.stringify(dragData))
                      e.dataTransfer.effectAllowed = 'copy'

                      console.log('🎯 Drag démarré depuis galerie:', image.name)
                    }}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback en cas d'erreur de chargement
                        const target = e.target as HTMLImageElement
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDE1MCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik03NSA0NUw5MCA3NUg2MEw3NSA0NVoiIGZpbGw9IiM2QjcyODAiLz4KPHN2Zz4K'
                      }}
                    />

                    {/* Overlay avec nom */}
                    <div className="
                      absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100
                      flex items-end transition-opacity
                    ">
                      <div className="p-2 text-white text-xs font-medium">
                        {image.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No images in this category</p>
                <p className="text-sm mt-1">
                  Create {category.name.toLowerCase()} in the corresponding menus
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}



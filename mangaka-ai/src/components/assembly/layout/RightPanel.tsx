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
 * - Toggle entre mode Pages, Images et Paramètres
 * - Mode Pages : Liste des pages avec navigation
 * - Mode Images : Galerie d'images par catégories
 * - Mode Paramètres : Paramètres de l'élément sélectionné avec suppression
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
    { name: 'Personnages', images: [] },
    { name: 'Décors', images: [] },
    { name: 'Scènes', images: [] }
  ])

  // Charger les images depuis la base de données
  useEffect(() => {
    const loadImages = async () => {
      if (!projectId) return

      setLoading(true)
      try {
        // Charger les personnages
        const charactersResponse = await fetch(`/api/projects/${projectId}/characters`)
        const charactersData = await charactersResponse.json()

        // Charger les décors
        const decorsResponse = await fetch(`/api/projects/${projectId}/decors`)
        const decorsData = await decorsResponse.json()

        // Charger les scènes
        const scenesResponse = await fetch(`/api/projects/${projectId}/scenes`)
        const scenesData = await scenesResponse.json()

        // Transformer les données pour l'interface
        const newCategories = [
          {
            name: 'Personnages',
            images: charactersData.success ? charactersData.characters.map((char: any) => ({
              id: char.id,
              url: char.image_url,
              name: char.name || 'Personnage sans nom',
              type: 'character'
            })) : []
          },
          {
            name: 'Décors',
            images: decorsData.success ? decorsData.decors.map((decor: any) => ({
              id: decor.id,
              url: decor.image_url,
              name: decor.name || 'Décor sans nom',
              type: 'decor'
            })) : []
          },
          {
            name: 'Scènes',
            images: scenesData.success ? scenesData.scenes.map((scene: any) => ({
              id: scene.id,
              url: scene.image_url,
              name: scene.metadata?.name || 'Scène sans nom',
              type: 'scene'
            })) : []
          }
        ]

        setImageCategories(newCategories)
      } catch (error) {
        console.error('Erreur lors du chargement des images:', error)
      } finally {
        setLoading(false)
      }
    }

    loadImages()
  }, [projectId])

  return (
    <div className={`h-full flex flex-col bg-dark-800 ${className}`}>
      {/* Toggle principal Pages/Images/Paramètres */}
      <div className="border-b border-dark-700 p-4">
        <div className="flex bg-dark-700 rounded-lg p-1">
          <button
            onClick={() => setActiveMode('pages')}
            className={`
              flex-1 flex items-center justify-center py-1 px-2 rounded-md
              text-xs font-medium transition-all duration-200
              ${activeMode === 'pages'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }
            `}
          >
            <FileText size={14} className="mr-1" />
            Pages
          </button>

          <button
            onClick={() => setActiveMode('images')}
            className={`
              flex-1 flex items-center justify-center py-1 px-2 rounded-md
              text-xs font-medium transition-all duration-200
              ${activeMode === 'images'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }
            `}
          >
            <Image size={14} className="mr-1" />
            Images
          </button>

          <button
            onClick={() => setActiveMode('settings')}
            className={`
              flex-1 flex items-center justify-center py-1 px-2 rounded-md
              text-xs font-medium transition-all duration-200
              ${activeMode === 'settings'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-dark-600'
              }
            `}
          >
            <Settings size={14} className="mr-1" />
            Paramètres
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
      {/* ✅ REFACTORED: Header élégant avec branding mangaka-ai */}
      <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/8 to-orange-500/8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Pages du projet</h3>
              <p className="text-xs text-dark-400">{pages.length} page{pages.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={handleAddPage}
            className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300 group shadow-sm"
            title="Ajouter une nouvelle page"
          >
            <Plus size={16} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>

      {/* ✅ REFACTORED: Interface en colonne unique élégante */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`
              group relative p-4 rounded-xl border cursor-pointer transition-all duration-300 backdrop-blur-sm
              ${currentPageId === page.id
                ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/50 shadow-lg shadow-red-500/10 ring-1 ring-red-500/30'
                : 'bg-dark-700/60 border-dark-600/40 hover:border-red-500/40 hover:bg-dark-600/80 hover:shadow-md'
              }
            `}
            onClick={() => handlePageSelect(page.id)}
          >
            <div className="flex items-center space-x-4">
              {/* ✅ REFACTORED: Miniature élégante */}
              <div className="w-16 h-20 bg-gradient-to-br from-dark-600 to-dark-700 rounded-lg flex items-center justify-center overflow-hidden shadow-md flex-shrink-0">
                {page.thumbnail ? (
                  <img
                    src={page.thumbnail}
                    alt={page.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <FileText size={20} className="text-gray-500 group-hover:text-red-400 transition-colors duration-300" />
                )}
              </div>

              {/* ✅ REFACTORED: Informations de la page */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {/* ✅ SINGLE INTELLIGENT PAGE INDICATOR: Lecture seule, synchronisé Supabase */}
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-bold transition-all duration-300
                      ${currentPageId === page.id
                        ? 'bg-red-500 text-white shadow-md'
                        : 'bg-dark-600 text-dark-300 group-hover:bg-red-500/20 group-hover:text-red-300'
                      }
                    `}>
                      {page.pageNumber}
                    </div>
                    <h4 className="text-white font-semibold group-hover:text-red-100 transition-colors">
                      {page.title}
                    </h4>
                  </div>

                  {/* ✅ REFACTORED: Indicateur de page active */}
                  {currentPageId === page.id && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  )}
                </div>

                <div className="text-sm text-dark-400 group-hover:text-dark-300 transition-colors">
                  {page.elementsCount} élément{page.elementsCount !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            {/* ✅ REFACTORED: Actions élégantes */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeletePage(page.id)
                }}
                className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/30 transition-all duration-200 hover:scale-110 shadow-sm"
                title="Supprimer la page"
                disabled={pages.length <= 1}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* ✅ REFACTORED: Effet de survol élégant */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-orange-500/0 group-hover:from-red-500/5 group-hover:to-orange-500/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
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
          <p className="text-gray-400">Chargement des images...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
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
                <p>Aucune image dans cette catégorie</p>
                <p className="text-sm mt-1">
                  Créez des {category.name.toLowerCase()} dans les menus correspondants
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}



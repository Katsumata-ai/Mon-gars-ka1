'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Image, Plus, Trash2, Layers, Eye, EyeOff, Link, Unlink, Settings } from 'lucide-react'
import { useCanvasContext } from '../context/CanvasContext'
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

  // Données temporaires pour le développement
  const [pages] = useState([
    { id: 1, title: 'Page 1', thumbnail: null },
    { id: 2, title: 'Page 2', thumbnail: null },
    { id: 3, title: 'Page 3', thumbnail: null }
  ])

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
            currentPage={currentPage}
            onPageSelect={onPageSelect}
            onAddPage={onAddPage}
            onDeletePage={onDeletePage}
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

// Composant pour le mode Pages
function PagesMode({
  pages,
  currentPage,
  onPageSelect,
  onAddPage,
  onDeletePage
}: {
  pages: any[]
  currentPage: number
  onPageSelect?: (page: number) => void
  onAddPage?: () => void
  onDeletePage?: (page: number) => void
}) {
  return (
    <div className="h-full flex flex-col">
      {/* En-tête avec bouton d'ajout */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-medium">Pages du projet</h3>
          <button
            onClick={onAddPage}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Ajouter une page"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Liste des pages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {pages.map((page) => (
            <div
              key={page.id}
              className={`
                group relative p-3 rounded-lg border cursor-pointer
                transition-all duration-200 hover:bg-dark-700
                ${currentPage === page.id
                  ? 'border-red-500 bg-red-500/10'
                  : 'border-dark-600 hover:border-dark-500'
                }
              `}
              onClick={() => onPageSelect?.(page.id)}
            >
              {/* Miniature de la page */}
              <div className="aspect-[3/4] bg-dark-600 rounded mb-2 flex items-center justify-center">
                {page.thumbnail ? (
                  <img 
                    src={page.thumbnail} 
                    alt={page.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <FileText size={24} className="text-gray-500" />
                )}
              </div>

              {/* Titre de la page */}
              <div className="text-sm text-white font-medium text-center">
                {page.title}
              </div>

              {/* Bouton de suppression */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeletePage?.(page.id)
                }}
                className="
                  absolute top-2 right-2 p-1 rounded
                  text-gray-500 hover:text-red-400 hover:bg-dark-800
                  opacity-0 group-hover:opacity-100 transition-all
                "
                title="Supprimer la page"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
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



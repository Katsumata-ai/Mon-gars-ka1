'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  Star,
  Clock,
  Image as ImageIcon,
  X,
  Plus,
  Grid3X3,
  List
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'
import { useTextureManager } from '../managers/TextureManager'
import { useAssemblyStore } from '../managers/StateManager'

interface ImageMetadata {
  id: string
  url: string
  type: 'character' | 'decor' | 'scene'
  name: string
  width?: number
  height?: number
  lastUsed?: Date
}

interface ImageLibraryProps {
  projectId: string
  isVisible: boolean
  onClose: () => void
  onImageSelect: (image: ImageMetadata) => void
  className?: string
}

export default function ImageLibrary({
  projectId,
  isVisible,
  onClose,
  onImageSelect,
  className
}: ImageLibraryProps) {
  const [images, setImages] = useState<ImageMetadata[]>([])
  const [filteredImages, setFilteredImages] = useState<ImageMetadata[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<'all' | 'character' | 'decor' | 'scene'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  const textureManager = useTextureManager()
  const { addElement, generateElementId } = useAssemblyStore()

  // Charger les images au montage
  useEffect(() => {
    if (isVisible && images.length === 0) {
      loadImages()
    }
  }, [isVisible, projectId])

  // Filtrer les images selon la recherche et le type
  useEffect(() => {
    let filtered = images

    // Filtrer par type
    if (selectedType !== 'all') {
      filtered = filtered.filter(img => img.type === selectedType)
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(img =>
        img.name.toLowerCase().includes(query) ||
        img.type.toLowerCase().includes(query)
      )
    }

    setFilteredImages(filtered)
  }, [images, searchQuery, selectedType])

  // Charger les images depuis les galeries
  const loadImages = useCallback(async () => {
    setLoading(true)
    try {
      const loadedImages = await textureManager.loadImagesFromGalleries(projectId)
      setImages(loadedImages)
      
      // Précharger les textures populaires
      await textureManager.preloadPopularTextures(loadedImages, 5)
    } catch (error) {
      console.error('Erreur chargement images:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId, textureManager])

  // Gérer la sélection d'une image
  const handleImageSelect = useCallback(async (image: ImageMetadata) => {
    try {
      // Charger la texture
      const texture = await textureManager.loadTexture(image)
      
      if (texture) {
        // Créer un nouvel élément sprite
        const newSprite = {
          type: 'sprite' as const,
          id: generateElementId(),
          layerType: 'characters' as const,
          texture: {
            url: image.url,
            originalWidth: texture.width,
            originalHeight: texture.height
          },
          transform: {
            x: 100,
            y: 100,
            width: Math.min(texture.width, 200),
            height: Math.min(texture.height, 200),
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            zIndex: 10
          },
          properties: {
            name: image.name,
            locked: false,
            visible: true
          },
          metadata: {
            sourceType: image.type,
            sourceId: image.id,
            addedAt: new Date().toISOString()
          }
        }

        addElement(newSprite)
        onImageSelect(image)
        
        // Marquer comme récemment utilisé
        image.lastUsed = new Date()
      }
    } catch (error) {
      console.error('Erreur ajout image:', error)
    }
  }, [textureManager, addElement, generateElementId, onImageSelect])

  // Basculer les favoris
  const toggleFavorite = useCallback((imageId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(imageId)) {
        newFavorites.delete(imageId)
      } else {
        newFavorites.add(imageId)
      }
      return newFavorites
    })
  }, [])

  if (!isVisible) return null

  return (
    <div className={cn(
      'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
      className
    )}>
      <div className="bg-dark-800 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ImageIcon className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Bibliothèque d'Images</h2>
            <span className="text-sm text-dark-400">
              {filteredImages.length} image{filteredImages.length > 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Mode d'affichage */}
            <div className="flex bg-dark-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary-500 text-white'
                    : 'text-dark-400 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <MangaButton
              onClick={onClose}
              size="sm"
              variant="ghost"
              icon={<X className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="p-4 border-b border-dark-700 space-y-3">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher des images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Filtres par type */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <div className="flex space-x-1">
              {[
                { id: 'all', label: 'Tout' },
                { id: 'character', label: 'Personnages' },
                { id: 'decor', label: 'Décors' },
                { id: 'scene', label: 'Scènes' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-sm transition-colors',
                    selectedType === type.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600 hover:text-white'
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-dark-400">Chargement des images...</p>
              </div>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <ImageIcon className="w-16 h-16 text-dark-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune image trouvée</h3>
                <p className="text-dark-400">
                  {searchQuery ? 'Essayez un autre terme de recherche' : 'Créez des personnages, décors ou scènes pour les voir ici'}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'
                : 'space-y-2'
            )}>
              {filteredImages.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  viewMode={viewMode}
                  isFavorite={favorites.has(image.id)}
                  onSelect={() => handleImageSelect(image)}
                  onToggleFavorite={() => toggleFavorite(image.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Composant pour afficher une image
interface ImageCardProps {
  image: ImageMetadata
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}

function ImageCard({ image, viewMode, isFavorite, onSelect, onToggleFavorite }: ImageCardProps) {
  if (viewMode === 'list') {
    return (
      <div className="flex items-center space-x-3 p-3 bg-dark-700 rounded-lg hover:bg-dark-600 transition-colors">
        <img
          src={image.url}
          alt={image.name}
          className="w-12 h-12 object-cover rounded"
        />
        <div className="flex-1">
          <h4 className="text-white font-medium">{image.name}</h4>
          <p className="text-sm text-dark-400 capitalize">{image.type}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleFavorite}
            className={cn(
              'p-1 rounded transition-colors',
              isFavorite ? 'text-yellow-400' : 'text-dark-400 hover:text-yellow-400'
            )}
          >
            <Star className="w-4 h-4" />
          </button>
          <MangaButton
            onClick={onSelect}
            size="sm"
            icon={<Plus className="w-3 h-3" />}
          >
            Ajouter
          </MangaButton>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative bg-dark-700 rounded-lg overflow-hidden hover:bg-dark-600 transition-colors">
      <div className="aspect-square">
        <img
          src={image.url}
          alt={image.name}
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <MangaButton
          onClick={onSelect}
          size="sm"
          icon={<Plus className="w-4 h-4" />}
        >
          Ajouter
        </MangaButton>
      </div>

      {/* Favoris */}
      <button
        onClick={onToggleFavorite}
        className={cn(
          'absolute top-2 right-2 p-1 rounded transition-colors',
          isFavorite ? 'text-yellow-400' : 'text-white/70 hover:text-yellow-400'
        )}
      >
        <Star className="w-4 h-4" />
      </button>

      {/* Info */}
      <div className="p-2">
        <h4 className="text-sm font-medium text-white truncate">{image.name}</h4>
        <p className="text-xs text-dark-400 capitalize">{image.type}</p>
      </div>
    </div>
  )
}

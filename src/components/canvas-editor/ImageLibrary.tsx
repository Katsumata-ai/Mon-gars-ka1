'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import { Canvas, FabricImage } from 'fabric'

interface GeneratedImage {
  id: string
  original_prompt: string
  optimized_prompt: string
  image_url: string
  image_type: 'character' | 'background' | 'scene'
  created_at: string
}

interface ImageLibraryProps {
  canvas: Canvas | null
  onImageAdded?: (image: GeneratedImage) => void
}

const IMAGE_TYPE_FILTERS = [
  { value: 'all', label: 'Tous', icon: '🎨' },
  { value: 'character', label: 'Personnages', icon: '👤' },
  { value: 'background', label: 'Décors', icon: '🏞️' },
  { value: 'scene', label: 'Scènes', icon: '🎬' }
]

export default function ImageLibrary({ canvas, onImageAdded }: ImageLibraryProps) {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { user } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadImages()
    }
  }, [user, filter])

  const loadImages = async () => {
    try {
      setLoading(true)
      setError('')

      let query = supabase
        .from('generated_images')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('image_type', filter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setImages(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des images')
    } finally {
      setLoading(false)
    }
  }

  const filteredImages = images.filter(image => {
    if (!searchQuery) return true
    return image.original_prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
           image.optimized_prompt.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const addImageToCanvas = async (image: GeneratedImage) => {
    if (!canvas) return

    try {
      // Load image and add to canvas
      FabricImage.fromURL(image.image_url, {
        crossOrigin: 'anonymous'
      }).then((fabricImage) => {
        // Scale image to fit nicely in canvas
        const maxWidth = 300
        const maxHeight = 300
        const scaleX = maxWidth / (fabricImage.width || 1)
        const scaleY = maxHeight / (fabricImage.height || 1)
        const scale = Math.min(scaleX, scaleY)

        fabricImage.set({
          left: 50,
          top: 50,
          scaleX: scale,
          scaleY: scale,
          selectable: true,
          moveable: true,
        })

        canvas.add(fabricImage)
        canvas.setActiveObject(fabricImage)
        canvas.renderAll()

        onImageAdded?.(image)
      })
    } catch (err) {
      console.error('Error adding image to canvas:', err)
    }
  }

  const getTypeIcon = (type: string) => {
    const typeFilter = IMAGE_TYPE_FILTERS.find(f => f.value === type)
    return typeFilter?.icon || '🎨'
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-dark-400">Connectez-vous pour accéder à vos images</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-dark-700">
        <h3 className="text-lg font-bold mb-4 text-white">Bibliothèque d'Images</h3>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-1">
          {IMAGE_TYPE_FILTERS.map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-2 py-1 rounded text-xs border transition-all ${
                filter === filterOption.value
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-dark-600 hover:border-primary-500/50 text-dark-300'
              }`}
            >
              <span className="mr-1">{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error text-error text-sm">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-square bg-dark-700 rounded animate-pulse"></div>
            ))}
          </div>
        ) : filteredImages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-dark-400 text-sm mb-2">
              {searchQuery ? 'Aucune image trouvée' : 'Aucune image disponible'}
            </p>
            {!searchQuery && (
              <p className="text-dark-500 text-xs">
                Générez des images d'abord
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                onClick={() => addImageToCanvas(image)}
                className="relative aspect-[1136/785] rounded overflow-hidden cursor-pointer transition-all transform hover:scale-105 hover:ring-2 hover:ring-primary-500"
              >
                <img
                  src={image.image_url}
                  alt={image.original_prompt}
                  className="w-full h-full object-contain"
                />

                {/* Type Badge */}
                <div className="absolute top-1 left-1 bg-dark-900/80 rounded px-1 py-0.5 text-xs">
                  <span className="mr-1">{getTypeIcon(image.image_type)}</span>
                  {image.image_type}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-dark-900/0 hover:bg-dark-900/60 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="text-center p-2">
                    <p className="text-white text-xs font-medium mb-1">
                      {image.original_prompt.length > 30
                        ? image.original_prompt.substring(0, 30) + '...'
                        : image.original_prompt
                      }
                    </p>
                    <p className="text-dark-300 text-xs">
                      Cliquer pour ajouter
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

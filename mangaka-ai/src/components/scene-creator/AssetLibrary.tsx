'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'

interface GeneratedImage {
  id: string
  original_prompt: string
  optimized_prompt: string
  image_url: string
  image_type: 'character' | 'background' | 'scene'
  created_at: string
}

interface AssetLibraryProps {
  selectedAssets: GeneratedImage[]
  onAssetSelect: (asset: GeneratedImage) => void
  onAssetDeselect: (assetId: string) => void
  maxSelection?: number
}

const IMAGE_TYPE_FILTERS = [
  { value: 'all', label: 'Tous', icon: '🎨' },
  { value: 'character', label: 'Personnages', icon: '👤' },
  { value: 'background', label: 'Décors', icon: '🏞️' },
  { value: 'scene', label: 'Scènes', icon: '🎬' }
]

export default function AssetLibrary({ 
  selectedAssets, 
  onAssetSelect, 
  onAssetDeselect, 
  maxSelection = 5 
}: AssetLibraryProps) {
  const [assets, setAssets] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { user } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadAssets()
    }
  }, [user])

  const loadAssets = async () => {
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

      setAssets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadAssets()
    }
  }, [filter, user])

  const filteredAssets = assets.filter(asset => {
    if (!searchQuery) return true
    return asset.original_prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
           asset.optimized_prompt.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const isSelected = (assetId: string) => {
    return selectedAssets.some(asset => asset.id === assetId)
  }

  const handleAssetClick = (asset: GeneratedImage) => {
    if (isSelected(asset.id)) {
      onAssetDeselect(asset.id)
    } else if (selectedAssets.length < maxSelection) {
      onAssetSelect(asset)
    }
  }

  const getTypeIcon = (type: string) => {
    const typeFilter = IMAGE_TYPE_FILTERS.find(f => f.value === type)
    return typeFilter?.icon || '🎨'
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-dark-400">Connectez-vous pour accéder à votre bibliothèque d'assets</p>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-xl manga-border p-6">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-4">Bibliothèque d'Assets</h3>
        <p className="text-dark-200 mb-4">
          Sélectionnez jusqu'à {maxSelection} éléments pour créer une scène combinée
        </p>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Rechercher dans vos assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          {IMAGE_TYPE_FILTERS.map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value)}
              className={`px-4 py-2 rounded-lg border transition-all ${
                filter === filterOption.value
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-dark-600 hover:border-primary-500/50'
              }`}
            >
              <span className="mr-2">{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Selection Counter */}
        {selectedAssets.length > 0 && (
          <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg px-4 py-2 mb-4">
            <span className="text-primary-500 font-medium">
              {selectedAssets.length}/{maxSelection} assets sélectionnés
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-dark-700 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-dark-400 mb-4">
            {searchQuery ? 'Aucun asset trouvé pour cette recherche' : 'Aucun asset trouvé'}
          </p>
          {!searchQuery && (
            <p className="text-dark-500 text-sm">
              Générez des images d'abord pour les utiliser dans vos scènes
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredAssets.map((asset) => {
            const selected = isSelected(asset.id)
            const canSelect = selectedAssets.length < maxSelection || selected

            return (
              <div
                key={asset.id}
                onClick={() => canSelect && handleAssetClick(asset)}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all transform hover:scale-105 ${
                  selected
                    ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-dark-800'
                    : canSelect
                    ? 'hover:ring-2 hover:ring-primary-500/50'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <img
                  src={asset.image_url}
                  alt={asset.original_prompt}
                  className="w-full h-full object-cover"
                />
                
                {/* Type Badge */}
                <div className="absolute top-2 left-2 bg-dark-900/80 rounded-full px-2 py-1 text-xs">
                  <span className="mr-1">{getTypeIcon(asset.image_type)}</span>
                  {asset.image_type}
                </div>

                {/* Selection Indicator */}
                {selected && (
                  <div className="absolute top-2 right-2 bg-primary-500 rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-white text-sm">✓</span>
                  </div>
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-dark-900/0 hover:bg-dark-900/60 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
                  <div className="text-center p-2">
                    <p className="text-white text-sm font-medium mb-1">
                      {asset.original_prompt.length > 50 
                        ? asset.original_prompt.substring(0, 50) + '...'
                        : asset.original_prompt
                      }
                    </p>
                    <p className="text-dark-300 text-xs">
                      {new Date(asset.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

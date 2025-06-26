'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, 
  Mountain, 
  Camera, 
  Grid, 
  Search, 
  Filter,
  Download,
  Trash2,
  Eye,
  Plus,
  Sparkles
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'

interface GeneratedAsset {
  id: string
  original_prompt: string
  optimized_prompt: string
  image_url: string
  image_type: 'character' | 'background' | 'scene'
  created_at: string
  metadata?: any
}

interface AssetSidebarProps {
  projectId: string
  isVisible: boolean
  onAssetSelect?: (asset: GeneratedAsset) => void
  activeTab?: string
  className?: string
}

const ASSET_TYPES = [
  {
    value: 'all',
    label: 'All',
    icon: Grid,
    color: 'text-dark-300',
    count: 0
  },
  {
    value: 'character',
    label: 'Characters',
    icon: Users,
    color: 'text-primary-400',
    count: 0
  },
  {
    value: 'background',
    label: 'Backgrounds',
    icon: Mountain,
    color: 'text-purple-400',
    count: 0
  },
  {
    value: 'scene',
    label: 'Scenes',
    icon: Camera,
    color: 'text-orange-400',
    count: 0
  }
]

export default function AssetSidebar({ 
  projectId, 
  isVisible, 
  onAssetSelect, 
  activeTab,
  className 
}: AssetSidebarProps) {
  const [assets, setAssets] = useState<GeneratedAsset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<GeneratedAsset[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    loadAssets()
  }, [projectId])

  useEffect(() => {
    filterAssets()
  }, [assets, searchTerm, selectedFilter])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssets(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des assets:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAssets = () => {
    let filtered = assets

    // Filtre par type
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(asset => asset.image_type === selectedFilter)
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(asset => 
        asset.original_prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.optimized_prompt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredAssets(filtered)
  }

  const handleAssetClick = (asset: GeneratedAsset) => {
    setSelectedAsset(asset.id)
    onAssetSelect?.(asset)
  }

  const getAssetCounts = () => {
    return ASSET_TYPES.map(type => ({
      ...type,
      count: type.value === 'all' 
        ? assets.length 
        : assets.filter(asset => asset.image_type === type.value).length
    }))
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'w-80 bg-dark-800 border-l border-dark-700 flex flex-col h-full',
      className
    )}>
      {/* Header */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Assets Générés</h3>
          <MangaButton
            size="sm"
            variant="ghost"
            icon={<Sparkles className="w-4 h-4" />}
            onClick={loadAssets}
          />
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher un asset..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="space-y-1">
          {getAssetCounts().map((type) => {
            const Icon = type.icon
            return (
              <button
                key={type.value}
                onClick={() => setSelectedFilter(type.value)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm',
                  selectedFilter === type.value
                    ? 'bg-primary-500/20 text-primary-400'
                    : 'text-dark-300 hover:bg-dark-700'
                )}
              >
                <div className="flex items-center space-x-2">
                  <Icon className={cn('w-4 h-4', type.color)} />
                  <span>{type.label}</span>
                </div>
                <span className="text-xs bg-dark-600 px-2 py-1 rounded">
                  {type.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Assets Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-700 rounded-lg h-24 animate-pulse" />
            ))}
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <Grid className="w-12 h-12 text-dark-500 mx-auto mb-3" />
            <p className="text-dark-400 text-sm">
              {searchTerm || selectedFilter !== 'all' 
                ? 'Aucun asset trouvé' 
                : 'Aucun asset généré'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={cn(
                  'bg-dark-700 rounded-lg p-3 cursor-pointer transition-all hover:bg-dark-600',
                  selectedAsset === asset.id && 'ring-2 ring-primary-500 bg-primary-500/10'
                )}
              >
                <div className="flex space-x-3">
                  <img
                    src={asset.image_url}
                    alt={asset.original_prompt}
                    className="w-16 h-16 rounded-lg object-cover bg-dark-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {asset.original_prompt}
                    </p>
                    <p className="text-dark-400 text-xs mt-1">
                      {(() => {
                        const date = new Date(asset.created_at)
                        const day = date.getDate().toString().padStart(2, '0')
                        const month = (date.getMonth() + 1).toString().padStart(2, '0')
                        const year = date.getFullYear().toString().slice(-2)
                        return `${day}/${month}/${year}`
                      })()}
                    </p>
                    <div className="flex items-center mt-2">
                      <span className={cn(
                        'text-xs px-2 py-1 rounded',
                        asset.image_type === 'character' && 'bg-primary-500/20 text-primary-400',
                        asset.image_type === 'background' && 'bg-purple-500/20 text-purple-400',
                        asset.image_type === 'scene' && 'bg-orange-500/20 text-orange-400'
                      )}>
                        {asset.image_type === 'character' && 'Personnage'}
                        {asset.image_type === 'background' && 'Background'}
                        {asset.image_type === 'scene' && 'Scene'}
                      </span>
                    </div>
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

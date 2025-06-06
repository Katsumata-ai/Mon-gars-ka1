'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  Eye,
  Trash2,
  X,
  Expand
} from 'lucide-react'
import { cn } from '@/lib/utils'
import SceneDetailModal from './SceneDetailModal'

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

interface ImprovedSceneGalleryProps {
  scenes: Scene[]
  selectedScene?: string
  onSceneSelect?: (scene: Scene) => void
  onSceneDelete?: (scene: Scene) => void
  onSceneDownload?: (scene: Scene) => void
  onCopyPrompt?: (scene: Scene) => void
  className?: string
}

interface SceneCardProps {
  scene: Scene
  isSelected: boolean
  onSelect?: (scene: Scene) => void
  onExpand: () => void
  onDelete?: (scene: Scene) => void
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Plus récent' },
  { value: 'date-asc', label: 'Plus ancien' },
  { value: 'name-asc', label: 'Nom A-Z' },
  { value: 'name-desc', label: 'Nom Z-A' }
] as const

export default function ImprovedSceneGallery({
  scenes,
  selectedScene,
  onSceneSelect,
  onSceneDelete,
  onSceneDownload,
  onCopyPrompt,
  className
}: ImprovedSceneGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedSceneForModal, setSelectedSceneForModal] = useState<Scene | null>(null)

  // Debug: Log when scenes change
  console.log('🎬 ImprovedSceneGallery - Scenes reçues:', scenes.length, scenes.map(s => s.id))

  // Filter and sort scenes
  const filteredAndSortedScenes = useMemo(() => {
    console.log('🔄 Recalcul des scènes filtrées - Input:', scenes.length, 'scènes')

    const filtered = scenes.filter(scene => {
      // Search filter
      const matchesSearch = !searchQuery ||
        scene.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.characters.some(char => char.toLowerCase().includes(searchQuery.toLowerCase())) ||
        scene.decors.some(decor => decor.toLowerCase().includes(searchQuery.toLowerCase())) ||
        scene.camera_plan.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.lighting.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.ambiance.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })

    const sorted = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        default:
          return 0
      }
    })

    console.log('✅ Scènes filtrées et triées - Output:', sorted.length, 'scènes')
    return sorted
  }, [scenes, searchQuery, sortBy])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Compact Header */}
      <div className="p-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Mes Scènes</h2>
          <span className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded">{scenes.length}</span>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex space-x-2">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-dark-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white placeholder-dark-400 focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scene Grid */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar-vertical">
        {filteredAndSortedScenes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucune scène créée'}
            </h3>
            <p className="text-dark-400 text-sm">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre première scène'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAndSortedScenes.map((scene) => (
              <SceneCard
                key={scene.id}
                scene={scene}
                isSelected={selectedScene === scene.id}
                onSelect={onSceneSelect}
                onExpand={() => setSelectedSceneForModal(scene)}
                onDelete={onSceneDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scene Detail Modal */}
      {selectedSceneForModal && (
        <SceneDetailModal
          scene={selectedSceneForModal}
          onClose={() => setSelectedSceneForModal(null)}
          onDelete={onSceneDelete}
          onDownload={onSceneDownload}
        />
      )}
    </div>
  )
}

function SceneCard({
  scene,
  isSelected,
  onSelect,
  onExpand,
  onDelete
}: SceneCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className={cn(
        'group relative bg-dark-800 overflow-hidden border transition-all duration-200 cursor-pointer',
        isSelected
          ? 'border-primary-500 ring-2 ring-primary-500/20'
          : 'border-dark-600 hover:border-dark-500'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(scene)}
    >
      {/* Image avec proportions exactes 1136x785 (ratio 1.447) */}
      <div className="relative aspect-[1136/785] bg-dark-700">
        {scene.image_url && !imageError ? (
          <>
            <img
              src={scene.image_url}
              alt={scene.name}
              className={cn(
                'w-full h-full object-contain',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-dark-400 text-center">
              <div className="w-12 h-12 bg-dark-600 flex items-center justify-center mx-auto mb-2">
                <Eye className="w-6 h-6" />
              </div>
              <span className="text-xs">Image non disponible</span>
            </div>
          </div>
        )}

        {/* Hover Actions */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onExpand()
                }}
                className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                title="Voir les détails"
              >
                <Expand className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(scene)
                }}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Scene Info - Overlay Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2">
        <h4 className="font-medium text-white text-sm tracking-wide drop-shadow-lg truncate">
          {scene.name.length > 35 ? scene.name.slice(0, 35) + '...' : scene.name}
        </h4>
      </div>
    </div>
  )
}

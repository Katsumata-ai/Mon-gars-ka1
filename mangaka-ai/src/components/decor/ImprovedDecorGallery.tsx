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
import DecorDetailModal from './DecorDetailModal'

interface Decor {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  traits: string[]
  style: string
  created_at: string
  metadata?: {
    archetype?: string
    mood?: string
    pose?: string
    [key: string]: unknown
  }
}

interface ImprovedDecorGalleryProps {
  decors: Decor[]
  selectedDecor?: string
  onDecorSelect?: (decor: Decor) => void
  onDecorDelete?: (decor: Decor) => void
  onDecorDownload?: (decor: Decor) => void
  onCopyPrompt?: (decor: Decor) => void
  className?: string
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Plus récent' },
  { value: 'date-asc', label: 'Plus ancien' },
  { value: 'name-asc', label: 'Nom A-Z' },
  { value: 'name-desc', label: 'Nom Z-A' }
] as const

export default function ImprovedDecorGallery({
  decors,
  selectedDecor,
  onDecorSelect,
  onDecorDelete,
  onDecorDownload,
  onCopyPrompt,
  className
}: ImprovedDecorGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedDecorForModal, setSelectedDecorForModal] = useState<Decor | null>(null)

  // Filter and sort decors
  const filteredAndSortedDecors = useMemo(() => {
    const filtered = decors.filter(decor => {
      // Search filter
      const matchesSearch = !searchQuery ||
        decor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decor.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        decor.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase())) ||
        decor.style.toLowerCase().includes(searchQuery.toLowerCase())

      return matchesSearch
    })

    return filtered.sort((a, b) => {
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
  }, [decors, searchQuery, sortBy])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Compact Header */}
      <div className="p-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Mes Décors</h2>
          <span className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded">{decors.length}</span>
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

      {/* Decor Grid */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filteredAndSortedDecors.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucun décor créé'}
            </h3>
            <p className="text-dark-400 text-sm">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre premier décor'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAndSortedDecors.map((decor) => (
              <DecorCard
                key={decor.id}
                decor={decor}
                isSelected={selectedDecor === decor.id}
                onSelect={onDecorSelect}
                onExpand={() => setSelectedDecorForModal(decor)}
                onDelete={onDecorDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decor Detail Modal */}
      {selectedDecorForModal && (
        <DecorDetailModal
          decor={selectedDecorForModal}
          onClose={() => setSelectedDecorForModal(null)}
          onDelete={onDecorDelete}
          onDownload={onDecorDownload}
        />
      )}
    </div>
  )
}

function DecorCard({
  decor,
  isSelected,
  onSelect,
  onExpand,
  onDelete
}: DecorCardProps) {
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
      onClick={() => onSelect?.(decor)}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-dark-700">
        {decor.image_url && !imageError ? (
          <>
            <img
              src={decor.image_url}
              alt={decor.name}
              className={cn(
                'w-full h-full object-cover object-center',
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
                  onDelete?.(decor)
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

      {/* Decor Info - Overlay Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
        <h4 className="font-semibold text-white text-base tracking-wide drop-shadow-lg">
          {decor.name}
        </h4>
      </div>
    </div>
  )
}

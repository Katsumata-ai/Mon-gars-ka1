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
import CharacterDetailModal from './CharacterDetailModal'

interface Character {
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

// Interface pour les décors
interface Decor {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  category: string
  mood: string
  timeOfDay: string
  created_at: string
  metadata?: {
    environment?: string
    lighting?: string
    atmosphere?: string
    [key: string]: unknown
  }
}

interface ImprovedCharacterGalleryProps {
  characters: Character[]
  selectedCharacter?: string
  onCharacterSelect?: (character: Character) => void
  onCharacterDelete?: (character: Character) => void
  onCharacterDownload?: (character: Character) => void
  onCopyPrompt?: (character: Character) => void
  className?: string
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Plus récent' },
  { value: 'date-asc', label: 'Plus ancien' },
  { value: 'name-asc', label: 'Nom A-Z' },
  { value: 'name-desc', label: 'Nom Z-A' }
] as const

export default function ImprovedCharacterGallery({
  characters,
  selectedCharacter,
  onCharacterSelect,
  onCharacterDelete,
  onCharacterDownload,
  onCopyPrompt,
  className
}: ImprovedCharacterGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [selectedCharacterForModal, setSelectedCharacterForModal] = useState<Character | null>(null)

  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(() => {
    const filtered = characters.filter(character => {
      // Search filter
      const matchesSearch = !searchQuery ||
        character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()))

      return matchesSearch
    })

    // Sort characters
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
  }, [characters, searchQuery, sortBy])



  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Compact Header */}
      <div className="p-3 border-b border-dark-700">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-white">Mes Personnages</h2>
          <span className="text-xs text-dark-400 bg-dark-700 px-2 py-1 rounded">{characters.length}</span>
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

      {/* Character Grid */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {filteredAndSortedCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-dark-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              {searchQuery ? 'Aucun résultat' : 'Aucun personnage créé'}
            </h3>
            <p className="text-dark-400 text-sm">
              {searchQuery
                ? 'Essayez de modifier votre recherche'
                : 'Commencez par créer votre premier personnage'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAndSortedCharacters.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacter === character.id}
                onSelect={onCharacterSelect}
                onExpand={() => setSelectedCharacterForModal(character)}
                onDelete={onCharacterDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Character Detail Modal */}
      {selectedCharacterForModal && (
        <CharacterDetailModal
          character={selectedCharacterForModal}
          onClose={() => setSelectedCharacterForModal(null)}
          onDelete={onCharacterDelete}
          onDownload={onCharacterDownload}
        />
      )}
    </div>
  )
}

// Character Card Component
interface CharacterCardProps {
  character: Character
  isSelected: boolean
  onSelect?: (character: Character) => void
  onExpand: () => void
  onDelete?: (character: Character) => void
}

function CharacterCard({
  character,
  isSelected,
  onSelect,
  onExpand,
  onDelete
}: CharacterCardProps) {
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
      onClick={() => onSelect?.(character)}
    >
      {/* Image avec proportions exactes 1136x785 (ratio 1.447) */}
      <div className="relative aspect-[1136/785] bg-dark-700">
        {character.image_url && !imageError ? (
          <>
            <img
              src={character.image_url}
              alt={character.name}
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
                  onDelete?.(character)
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

      {/* Character Info - Overlay Style */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4">
        <h4 className="font-semibold text-white text-base tracking-wide drop-shadow-lg">
          {character.name}
        </h4>
      </div>
    </div>
  )
}

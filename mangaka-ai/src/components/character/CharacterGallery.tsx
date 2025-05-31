'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  SortAsc,
  SortDesc,
  Calendar,
  Eye,
  Trash2,
  X
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

interface CharacterGalleryProps {
  characters: Character[]
  selectedCharacter?: string
  onCharacterSelect?: (character: Character) => void
  onCharacterDelete?: (character: Character) => void
  onCharacterDownload?: (character: Character) => void
  onCopyPrompt?: (character: Character) => void
  className?: string
}

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'style'
type ViewMode = 'grid' | 'list'

const STYLE_OPTIONS = [
  { value: 'all', label: 'Tous les styles' },
  { value: 'shonen', label: 'Shōnen' },
  { value: 'shoujo', label: 'Shōjo' },
  { value: 'seinen', label: 'Seinen' },
  { value: 'josei', label: 'Josei' },
  { value: 'chibi', label: 'Chibi' },
  { value: 'realistic', label: 'Réaliste' }
]

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Plus récent', icon: Calendar },
  { value: 'date-asc', label: 'Plus ancien', icon: Calendar },
  { value: 'name-asc', label: 'Nom A-Z', icon: SortAsc },
  { value: 'name-desc', label: 'Nom Z-A', icon: SortDesc },
  { value: 'style', label: 'Par style', icon: Palette }
]

export default function CharacterGallery({
  characters,
  favorites = [],
  selectedCharacter,
  onCharacterSelect,
  onFavoriteToggle,
  onCharacterEdit,
  onCharacterDelete,
  onCharacterDownload,
  onCopyPrompt,
  className
}: CharacterGalleryProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('all')
  const [sortBy, setSortBy] = useState<SortOption>('date-desc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  // Filter and sort characters
  const filteredAndSortedCharacters = useMemo(() => {
    const filtered = characters.filter(character => {
      // Search filter
      const matchesSearch = !searchQuery ||
        character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        character.traits.some(trait => trait.toLowerCase().includes(searchQuery.toLowerCase()))

      // Style filter
      const matchesStyle = selectedStyle === 'all' || character.style === selectedStyle

      // Favorites filter
      const matchesFavorites = !showFavoritesOnly || favorites.includes(character.id)

      return matchesSearch && matchesStyle && matchesFavorites
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'style':
          return a.style.localeCompare(b.style)
        default:
          return 0
      }
    })

    return filtered
  }, [characters, searchQuery, selectedStyle, sortBy, showFavoritesOnly, favorites])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedStyle('all')
    setShowFavoritesOnly(false)
  }

  const hasActiveFilters = searchQuery || selectedStyle !== 'all' || showFavoritesOnly

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header with Search and Filters */}
      <div className="p-6 border-b border-dark-700 space-y-4">
        {/* Title and Stats */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Mes Personnages</h3>
            <p className="text-dark-400">
              {filteredAndSortedCharacters.length} personnage{filteredAndSortedCharacters.length !== 1 ? 's' : ''}
              {filteredAndSortedCharacters.length !== characters.length && (
                <span> sur {characters.length}</span>
              )}
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, description ou traits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg pl-10 pr-4 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Style Filter */}
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {STYLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Favorites Filter */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors',
                showFavoritesOnly
                  ? 'bg-yellow-500 text-white'
                  : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
              )}
            >
              <Star className={cn('w-4 h-4', showFavoritesOnly && 'fill-current')} />
              <span>Favoris</span>
            </button>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
            >
              Effacer les filtres
            </button>
          )}
        </div>
      </div>

      {/* Gallery Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredAndSortedCharacters.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-dark-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {hasActiveFilters ? 'Aucun résultat' : 'Aucun personnage créé'}
            </h3>
            <p className="text-dark-400 mb-6">
              {hasActiveFilters
                ? 'Essayez de modifier vos critères de recherche'
                : 'Commencez par créer votre premier personnage'
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          )}>
            {filteredAndSortedCharacters.map((character) => (
              <CharacterPreview
                key={character.id}
                character={character}
                isSelected={selectedCharacter === character.id}
                isFavorite={favorites.includes(character.id)}
                onSelect={onCharacterSelect}
                onFavorite={onFavoriteToggle}
                onEdit={onCharacterEdit}
                onDelete={onCharacterDelete}
                onDownload={onCharacterDownload}
                onCopyPrompt={onCopyPrompt}
                className={viewMode === 'list' ? 'flex-row' : ''}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

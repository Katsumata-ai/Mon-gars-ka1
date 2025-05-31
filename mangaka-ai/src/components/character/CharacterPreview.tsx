'use client'

import { useState } from 'react'
import {
  Eye,
  Download,
  Heart,
  Copy,
  Edit3,
  Trash2,
  Star,
  Tag,
  Calendar,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'

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

interface CharacterPreviewProps {
  character: Character
  isSelected?: boolean
  isFavorite?: boolean
  onSelect?: (character: Character) => void
  onFavorite?: (character: Character) => void
  onEdit?: (character: Character) => void
  onDelete?: (character: Character) => void
  onDownload?: (character: Character) => void
  onCopyPrompt?: (character: Character) => void
  className?: string
}

const STYLE_COLORS = {
  shonen: 'bg-blue-500',
  shoujo: 'bg-pink-500',
  seinen: 'bg-purple-500',
  josei: 'bg-rose-500',
  chibi: 'bg-yellow-500',
  realistic: 'bg-gray-500'
}

const STYLE_LABELS = {
  shonen: 'Shōnen',
  shoujo: 'Shōjo',
  seinen: 'Seinen',
  josei: 'Josei',
  chibi: 'Chibi',
  realistic: 'Réaliste'
}

export default function CharacterPreview({
  character,
  isSelected = false,
  isFavorite = false,
  onSelect,
  onFavorite,
  onEdit,
  onDelete,
  onDownload,
  onCopyPrompt,
  className
}: CharacterPreviewProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const styleColor = STYLE_COLORS[character.style as keyof typeof STYLE_COLORS] || 'bg-gray-500'
  const styleLabel = STYLE_LABELS[character.style as keyof typeof STYLE_LABELS] || character.style

  return (
    <div
      className={cn(
        'bg-dark-800 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group',
        'hover:bg-dark-700 hover:shadow-lg hover:shadow-primary-500/10',
        isSelected && 'ring-2 ring-primary-500 bg-dark-700',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(character)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-dark-700 overflow-hidden">
        {character.image_url && !imageError ? (
          <>
            <img
              src={character.image_url}
              alt={character.name}
              className={cn(
                'w-full h-full object-cover transition-all duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0',
                isHovered && 'scale-105'
              )}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-dark-500">
            <Eye className="w-12 h-12" />
          </div>
        )}

        {/* Overlay Actions */}
        {(isHovered || showActions) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onFavorite?.(character)
                }}
                className={cn(
                  'p-2 rounded-full transition-colors',
                  isFavorite
                    ? 'bg-red-500 text-white'
                    : 'bg-white/20 text-white hover:bg-white/30'
                )}
              >
                <Heart className={cn('w-4 h-4', isFavorite && 'fill-current')} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload?.(character)
                }}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyPrompt?.(character)
                }}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowActions(!showActions)
                }}
                className="p-2 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Favorite Badge */}
        {isFavorite && (
          <div className="absolute top-2 right-2">
            <Star className="w-5 h-5 text-yellow-400 fill-current" />
          </div>
        )}

        {/* Style Badge */}
        <div className="absolute top-2 left-2">
          <span className={cn(
            'px-2 py-1 rounded-full text-xs font-medium text-white',
            styleColor
          )}>
            {styleLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-white mb-1 line-clamp-1">
            {character.name}
          </h4>
          <p className="text-sm text-dark-300 line-clamp-2">
            {character.description}
          </p>
        </div>

        {/* Traits */}
        {character.traits && character.traits.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {character.traits.slice(0, 3).map((trait, index) => (
              <span
                key={index}
                className="text-xs px-2 py-1 bg-dark-600 text-dark-200 rounded-full"
              >
                {trait}
              </span>
            ))}
            {character.traits.length > 3 && (
              <span className="text-xs px-2 py-1 bg-dark-600 text-dark-200 rounded-full">
                +{character.traits.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Metadata */}
        {character.metadata?.archetype && (
          <div className="flex items-center space-x-2 text-xs text-dark-400">
            <Tag className="w-3 h-3" />
            <span>{character.metadata.archetype}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-dark-700">
          <div className="flex items-center space-x-1 text-xs text-dark-400">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(character.created_at)}</span>
          </div>

          {showActions && (
            <div className="flex space-x-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(character)
                }}
                className="p-1 hover:bg-dark-600 rounded text-dark-400 hover:text-white transition-colors"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(character)
                }}
                className="p-1 hover:bg-red-500 rounded text-dark-400 hover:text-white transition-colors"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

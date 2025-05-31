'use client'

import { useState } from 'react'
import {
  X,
  Download,
  Trash2,
  User,
  Eye,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MangaButton from '@/components/ui/MangaButton'

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

interface CharacterDetailModalProps {
  character: Character
  onClose: () => void
  onDelete?: (character: Character) => void
  onDownload?: (character: Character) => void
}

export default function CharacterDetailModal({
  character,
  onClose,
  onDelete,
  onDownload
}: CharacterDetailModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-800 rounded-lg border border-dark-600 max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header avec nom et bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">{character.name}</h2>
          <button
            onClick={onClose}
            className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Image centralisée et bien cadrée */}
          <div className="flex justify-center">
            <div className="relative w-96 h-[28rem] bg-dark-700 border border-dark-600 overflow-hidden">
              {character.image_url && !imageError ? (
                <>
                  <img
                    src={character.image_url}
                    alt={character.name}
                    className={cn(
                      'w-full h-full object-cover object-center transition-opacity duration-300',
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
                    <span className="text-sm">Image non disponible</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
              <User className="w-4 h-4 mr-2 text-primary-500" />
              Description
            </h3>
            <p className="text-dark-300 text-sm leading-relaxed">
              {character.description}
            </p>
          </div>

          {/* Date de création */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary-500" />
              Date de création
            </h3>
            <p className="text-dark-300 text-sm">
              {formatDate(character.created_at)}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-2 pt-2">
            <MangaButton
              onClick={() => onDownload?.(character)}
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              className="flex-1"
            >
              Télécharger
            </MangaButton>
            <MangaButton
              onClick={() => onDelete?.(character)}
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              className="flex-1"
            >
              Supprimer
            </MangaButton>
          </div>
        </div>
      </div>
    </div>
  )
}

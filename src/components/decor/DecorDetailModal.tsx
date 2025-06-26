'use client'

import { useState } from 'react'
import {
  X,
  Download,
  Trash2,
  Mountain,
  Eye,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MangaButton from '@/components/ui/MangaButton'

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

interface DecorDetailModalProps {
  decor: Decor
  onClose: () => void
  onDelete?: (decor: Decor) => void
  onDownload?: (decor: Decor) => void
}

export default function DecorDetailModal({
  decor,
  onClose,
  onDelete,
  onDownload
}: DecorDetailModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleDownload = () => {
    if (decor.image_url) {
      const link = document.createElement('a')
      link.href = decor.image_url
      link.download = `${decor.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-dark-800 rounded-lg border border-dark-600 max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header avec nom et bouton fermer */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">{decor.name}</h2>
          <button
            onClick={onClose}
            className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu scrollable */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Image centralisée avec proportions exactes 1136x785 (ratio 1.447) */}
          <div className="flex justify-center">
            <div className="relative w-[520px] h-[359px] bg-dark-700 border border-dark-600 overflow-hidden">
              {decor.image_url && !imageError ? (
                <>
                  <img
                    src={decor.image_url}
                    alt={decor.name}
                    className={cn(
                      'w-full h-full object-contain transition-opacity duration-300',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
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
              <Mountain className="w-4 h-4 mr-2 text-primary-500" />
              Description
            </h3>
            <p className="text-dark-300 text-sm leading-relaxed">
              {decor.description}
            </p>
          </div>

          {/* Creation date */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-primary-500" />
              Creation date
            </h3>
            <p className="text-dark-300 text-sm">
              {formatDate(decor.created_at)}
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-2 pt-2">
            <MangaButton
              onClick={() => onDownload?.(decor)}
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              className="flex-1"
            >
              Download
            </MangaButton>
            <MangaButton
              onClick={() => onDelete?.(decor)}
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
              className="flex-1"
            >
              Delete
            </MangaButton>
          </div>
        </div>
      </div>
    </div>
  )
}

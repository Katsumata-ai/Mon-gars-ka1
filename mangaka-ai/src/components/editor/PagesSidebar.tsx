'use client'

import { useState } from 'react'
import { 
  Plus, 
  Trash2, 
  Copy,
  FileText,
  Grid,
  Eye,
  Download,
  Upload,
  MoreVertical
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'

interface PagesSidebarProps {
  isVisible: boolean
  currentPage: number
  pages: number[]
  onPageSelect: (page: number) => void
  onAddPage: () => void
  onDeletePage: (page: number) => void
  onDuplicatePage?: (page: number) => void
  className?: string
}

export default function PagesSidebar({ 
  isVisible, 
  currentPage, 
  pages, 
  onPageSelect, 
  onAddPage, 
  onDeletePage,
  onDuplicatePage,
  className 
}: PagesSidebarProps) {
  const [draggedPage, setDraggedPage] = useState<number | null>(null)

  const handleDragStart = (page: number) => {
    setDraggedPage(page)
  }

  const handleDragEnd = () => {
    setDraggedPage(null)
  }

  const handleDuplicatePage = (page: number) => {
    onDuplicatePage?.(page)
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
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-accent-400" />
            Pages du Manga
          </h3>
          <MangaButton
            size="sm"
            variant="ghost"
            icon={<Plus className="w-4 h-4" />}
            onClick={onAddPage}
          />
        </div>

        <div className="text-sm text-dark-400">
          {pages.length} page{pages.length !== 1 ? 's' : ''} • Page {currentPage} active
        </div>
      </div>

      {/* Actions rapides */}
      <div className="p-4 border-b border-dark-700">
        <div className="grid grid-cols-2 gap-2">
          <MangaButton
            size="sm"
            variant="secondary"
            icon={<Copy className="w-4 h-4" />}
            onClick={() => handleDuplicatePage(currentPage)}
            className="text-xs"
          >
            Dupliquer
          </MangaButton>
          <MangaButton
            size="sm"
            variant="ghost"
            icon={<Download className="w-4 h-4" />}
            className="text-xs"
          >
            Exporter
          </MangaButton>
        </div>
      </div>

      {/* Liste des pages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {pages.map((page) => (
            <div
              key={page}
              draggable
              onDragStart={() => handleDragStart(page)}
              onDragEnd={handleDragEnd}
              className={cn(
                'group relative bg-dark-700 rounded-lg p-4 cursor-pointer transition-all hover:bg-dark-600',
                currentPage === page && 'ring-2 ring-primary-500 bg-primary-500/10',
                draggedPage === page && 'opacity-50'
              )}
              onClick={() => onPageSelect(page)}
            >
              {/* Miniature de la page */}
              <div className="w-full h-32 bg-white rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                <div className="text-gray-400 text-sm">
                  Page {page}
                </div>
                {/* Overlay pour la page active */}
                {currentPage === page && (
                  <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                    <Eye className="w-6 h-6 text-primary-400" />
                  </div>
                )}
              </div>

              {/* Informations de la page */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-medium text-sm">Page {page}</h4>
                  <p className="text-dark-400 text-xs">
                    {page === 1 ? 'Page de couverture' : 
                     page === 2 ? 'Introduction' : 
                     `Chapitre ${Math.ceil((page - 2) / 4)}`}
                  </p>
                </div>

                {/* Actions de la page */}
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDuplicatePage(page)
                    }}
                    className="p-1 hover:bg-dark-500 rounded text-dark-400 hover:text-white"
                    title="Dupliquer"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  
                  {pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeletePage(page)
                      }}
                      className="p-1 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Indicateur de statut */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Script terminé" />
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Assets en cours" />
                  <div className="w-2 h-2 bg-gray-500 rounded-full" title="Assemblage à faire" />
                </div>
                <span className="text-xs text-dark-500">
                  {page === currentPage ? 'Active' : 'Prête'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer avec statistiques */}
      <div className="p-4 border-t border-dark-700 bg-dark-900">
        <div className="text-xs text-dark-400 space-y-1">
          <div className="flex justify-between">
            <span>Pages terminées:</span>
            <span className="text-green-400">2/{pages.length}</span>
          </div>
          <div className="flex justify-between">
            <span>En cours:</span>
            <span className="text-yellow-400">1/{pages.length}</span>
          </div>
          <div className="flex justify-between">
            <span>À faire:</span>
            <span className="text-gray-400">{pages.length - 3}/{pages.length}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

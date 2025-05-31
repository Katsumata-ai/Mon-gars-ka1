'use client'

import { useState } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  FileText,
  Eye,
  X
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
  onReorderPages?: (newOrder: number[]) => void
  onClose?: () => void
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
  onReorderPages,
  onClose,
  className
}: PagesSidebarProps) {
  const [draggedPage, setDraggedPage] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Créer un tableau ordonné des pages avec leurs index
  const orderedPages = pages.map((page, index) => ({ page, index }))

  const handleDragStart = (e: React.DragEvent, page: number) => {
    setDraggedPage(page)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', page.toString())
  }

  const handleDragEnd = () => {
    setDraggedPage(null)
    setDragOverIndex(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const draggedPageNumber = parseInt(e.dataTransfer.getData('text/plain'))

    if (draggedPageNumber && onReorderPages) {
      const currentIndex = pages.indexOf(draggedPageNumber)
      if (currentIndex !== -1 && currentIndex !== targetIndex) {
        const newPages = [...pages]
        const [movedPage] = newPages.splice(currentIndex, 1)
        newPages.splice(targetIndex, 0, movedPage)

        // Renuméroter automatiquement les pages
        const renumberedPages = newPages.map((_, index) => index + 1)
        onReorderPages(renumberedPages)

        // Ajuster la page active si nécessaire
        if (currentPage === draggedPageNumber) {
          onPageSelect(targetIndex + 1)
        } else if (currentPage > currentIndex && currentPage <= targetIndex) {
          onPageSelect(currentPage - 1)
        } else if (currentPage < currentIndex && currentPage >= targetIndex) {
          onPageSelect(currentPage + 1)
        }
      }
    }

    handleDragEnd()
  }

  const handleDuplicatePage = (page: number) => {
    onDuplicatePage?.(page)
  }

  const handleDeletePage = (page: number) => {
    if (pages.length <= 1) return // Empêcher la suppression de la dernière page

    const pageIndex = pages.indexOf(page)
    onDeletePage(page)

    // Ajuster la page active si nécessaire
    if (currentPage === page) {
      // Si on supprime la page active, sélectionner la page précédente ou suivante
      const newActivePage = pageIndex > 0 ? pageIndex : 1
      onPageSelect(Math.min(newActivePage, pages.length - 1))
    } else if (currentPage > page) {
      // Si la page active est après la page supprimée, décrémenter
      onPageSelect(currentPage - 1)
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'w-72 bg-dark-800 border-l border-dark-700 flex flex-col h-full',
      className
    )}>
      {/* Header simplifié avec croix */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-400" />
            Pages
          </h3>
          <div className="flex items-center space-x-2">
            <MangaButton
              size="sm"
              variant="ghost"
              icon={<Plus className="w-4 h-4" />}
              onClick={onAddPage}
              title="Ajouter une page"
            />
            {onClose && (
              <MangaButton
                size="sm"
                variant="ghost"
                icon={<X className="w-4 h-4" />}
                onClick={onClose}
                title="Fermer le menu"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
              />
            )}
          </div>
        </div>
        <div className="text-sm text-dark-400 mt-2">
          {pages.length} page{pages.length !== 1 ? 's' : ''} • Page {currentPage} active
        </div>
      </div>

      {/* Liste des pages avec glisser-déposer */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {pages.map((page, index) => (
            <div key={page} className="relative">
              {/* Zone de dépôt supérieure */}
              {dragOverIndex === index && draggedPage !== page && (
                <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10 animate-pulse" />
              )}

              <div
                draggable
                onDragStart={(e) => handleDragStart(e, page)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={cn(
                  'group relative bg-dark-700 rounded-lg p-3 cursor-pointer transition-all duration-200 border select-none',
                  currentPage === page
                    ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/30'
                    : 'border-dark-600 hover:border-dark-500',
                  draggedPage === page && 'opacity-50 scale-95 rotate-1',
                  isDragging && draggedPage !== page && 'hover:bg-dark-600/50',
                  dragOverIndex === index && draggedPage !== page && 'transform translate-y-1'
                )}
                onClick={() => !isDragging && onPageSelect(page)}
              >
                {/* Contenu de la page avec indicateur de glissement */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Indicateur de glissement */}
                    <div className="flex flex-col space-y-0.5 text-dark-500 group-hover:text-dark-400 transition-colors cursor-grab active:cursor-grabbing">
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                      <div className="w-1 h-1 bg-current rounded-full"></div>
                    </div>

                    {/* Numéro de page avec indicateur visuel */}
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200',
                      currentPage === page
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-dark-600 text-gray-300 group-hover:bg-dark-500'
                    )}>
                      {page}
                    </div>

                    {/* Informations de la page */}
                    <div>
                      <h4 className="text-white font-medium text-sm">Page {page}</h4>
                      {page === 1 && (
                        <p className="text-dark-400 text-xs">Couverture</p>
                      )}
                    </div>
                  </div>

                  {/* Actions compactes */}
                  <div className={cn(
                    'flex items-center space-x-1 transition-opacity duration-200',
                    isDragging ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'
                  )}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDuplicatePage(page)
                      }}
                      className="p-1.5 hover:bg-dark-500 rounded text-dark-400 hover:text-white transition-colors duration-150"
                      title="Dupliquer la page"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeletePage(page)
                        }}
                        className="p-1.5 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400 transition-colors duration-150"
                        title="Supprimer la page"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Indicateur de page active */}
                {currentPage === page && (
                  <div className="absolute top-2 right-2">
                    <Eye className="w-4 h-4 text-blue-400 animate-pulse" />
                  </div>
                )}
              </div>

              {/* Zone de dépôt inférieure pour le dernier élément */}
              {index === pages.length - 1 && dragOverIndex === pages.length && (
                <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-500 rounded-full z-10 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  Plus,
  Trash2,
  Copy,
  FileText,
  Eye,
  X,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'
import { useAssemblyStore } from '../managers/StateManager'
import { useSaveManager } from '../managers/SaveManager'
import { useTextureManager } from '../managers/TextureManager'

// Interface pour les métadonnées de page
interface PageMetadata {
  id: string
  number: number
  title: string
  status: 'empty' | 'in_progress' | 'completed'
  elementsCount: number
  thumbnailUrl?: string
  lastModified: Date
  createdAt: Date
}

interface PixiPagesSidebarProps {
  projectId: string
  isVisible: boolean
  currentPage: number
  onPageSelect: (page: number) => void
  onAddPage: () => void
  onDeletePage: (page: number) => void
  onDuplicatePage?: (page: number) => void
  onClose?: () => void
  className?: string
}

export default function PixiPagesSidebar({
  projectId,
  isVisible,
  currentPage,
  onPageSelect,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onClose,
  className
}: PixiPagesSidebarProps) {
  const [pages, setPages] = useState<PageMetadata[]>([])
  const [thumbnailCache, setThumbnailCache] = useState<Record<string, string>>({})
  const [loadingThumbnails, setLoadingThumbnails] = useState<Record<string, boolean>>({})
  const [draggedPage, setDraggedPage] = useState<number | null>(null)
  const [previewPage, setPreviewPage] = useState<number | null>(null)
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null)

  const { elements, pixiApp } = useAssemblyStore()
  const saveManager = useSaveManager()
  const textureManager = useTextureManager()

  // Charger les pages au montage
  useEffect(() => {
    loadPages()
  }, [projectId])

  // Générer les miniatures quand les éléments changent
  useEffect(() => {
    if (elements.length > 0) {
      generateThumbnailForCurrentPage()
    }
  }, [elements, currentPage])

  // Charger les pages depuis Supabase
  const loadPages = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/pages`)
      if (response.ok) {
        const data = await response.json()
        const pagesData: PageMetadata[] = data.pages?.map((page: any) => ({
          id: page.id,
          number: page.page_number,
          title: page.title || `Page ${page.page_number}`,
          status: determinePageStatus(page.content),
          elementsCount: page.content?.stage?.children?.length || 0,
          thumbnailUrl: page.thumbnail_url,
          lastModified: new Date(page.updated_at),
          createdAt: new Date(page.created_at)
        })) || []

        setPages(pagesData)

        // Charger les miniatures existantes
        pagesData.forEach(page => {
          if (page.thumbnailUrl) {
            setThumbnailCache(prev => ({ ...prev, [page.id]: page.thumbnailUrl! }))
          }
        })
      }
    } catch (error) {
      console.error('Erreur chargement pages:', error)
    }
  }, [projectId])

  // Déterminer le statut d'une page
  const determinePageStatus = (content: any): PageMetadata['status'] => {
    const elementsCount = content?.stage?.children?.length || 0
    if (elementsCount === 0) return 'empty'
    if (elementsCount < 3) return 'in_progress'
    return 'completed'
  }

  // Générer une miniature pour la page courante
  const generateThumbnailForCurrentPage = useCallback(async () => {
    if (!pixiApp || !pixiApp.stage) return

    try {
      const pageId = `page_${projectId}_${currentPage}`
      
      // Éviter la génération multiple simultanée
      if (loadingThumbnails[pageId]) return

      setLoadingThumbnails(prev => ({ ...prev, [pageId]: true }))

      // Créer un canvas temporaire pour la miniature
      const canvas = document.createElement('canvas')
      canvas.width = 150
      canvas.height = 200
      const ctx = canvas.getContext('2d')

      if (ctx) {
        // Fond blanc
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 150, 200)

        // Extraire le contenu du stage PixiJS
        const stageCanvas = pixiApp.renderer.extract.canvas(pixiApp.stage)
        
        // Dessiner le contenu redimensionné
        ctx.drawImage(stageCanvas, 0, 0, 150, 200)

        // Convertir en data URL
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        
        // Mettre à jour le cache
        setThumbnailCache(prev => ({ ...prev, [pageId]: thumbnailDataUrl }))

        // Mettre à jour les métadonnées de la page
        setPages(prev => prev.map(page => 
          page.number === currentPage 
            ? { 
                ...page, 
                status: determinePageStatus({ stage: { children: elements } }),
                elementsCount: elements.length,
                lastModified: new Date()
              }
            : page
        ))
      }
    } catch (error) {
      console.error('Erreur génération miniature:', error)
    } finally {
      setLoadingThumbnails(prev => {
        const newState = { ...prev }
        delete newState[`page_${projectId}_${currentPage}`]
        return newState
      })
    }
  }, [pixiApp, projectId, currentPage, elements])

  // Gérer la sélection de page
  const handlePageSelect = useCallback((pageNumber: number) => {
    if (pageNumber !== currentPage) {
      onPageSelect(pageNumber)
    }
  }, [currentPage, onPageSelect])

  // Gérer l'ajout de page
  const handleAddPage = useCallback(() => {
    const newPageNumber = pages.length + 1
    const newPage: PageMetadata = {
      id: `page_${projectId}_${newPageNumber}`,
      number: newPageNumber,
      title: `Page ${newPageNumber}`,
      status: 'empty',
      elementsCount: 0,
      lastModified: new Date(),
      createdAt: new Date()
    }
    
    setPages(prev => [...prev, newPage])
    onAddPage()
  }, [pages.length, projectId, onAddPage])

  // Gérer la suppression de page
  const handleDeletePage = useCallback((pageNumber: number) => {
    if (pages.length <= 1) return

    setPages(prev => prev.filter(page => page.number !== pageNumber))
    
    // Nettoyer le cache de miniatures
    const pageId = `page_${projectId}_${pageNumber}`
    setThumbnailCache(prev => {
      const newCache = { ...prev }
      delete newCache[pageId]
      return newCache
    })

    onDeletePage(pageNumber)
  }, [pages.length, projectId, onDeletePage])

  // Gérer la duplication de page
  const handleDuplicatePage = useCallback((pageNumber: number) => {
    const sourcePage = pages.find(p => p.number === pageNumber)
    if (!sourcePage) return

    const newPageNumber = pages.length + 1
    const newPage: PageMetadata = {
      id: `page_${projectId}_${newPageNumber}`,
      number: newPageNumber,
      title: `${sourcePage.title} (Copie)`,
      status: sourcePage.status,
      elementsCount: sourcePage.elementsCount,
      lastModified: new Date(),
      createdAt: new Date()
    }

    setPages(prev => [...prev, newPage])

    // Copier la miniature si elle existe
    const sourceThumbnail = thumbnailCache[sourcePage.id]
    if (sourceThumbnail) {
      setThumbnailCache(prev => ({ ...prev, [newPage.id]: sourceThumbnail }))
    }

    onDuplicatePage?.(pageNumber)
  }, [pages, projectId, thumbnailCache, onDuplicatePage])

  // Obtenir l'icône de statut
  const getStatusIcon = (status: PageMetadata['status']) => {
    switch (status) {
      case 'empty':
        return <FileText className="w-3 h-3 text-gray-500" />
      case 'in_progress':
        return <Clock className="w-3 h-3 text-orange-400" />
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-400" />
      default:
        return <AlertCircle className="w-3 h-3 text-red-400" />
    }
  }

  // Obtenir la couleur de statut
  const getStatusColor = (status: PageMetadata['status']) => {
    switch (status) {
      case 'empty':
        return 'text-gray-500'
      case 'in_progress':
        return 'text-orange-400'
      case 'completed':
        return 'text-green-400'
      default:
        return 'text-red-400'
    }
  }

  if (!isVisible) return null

  return (
    <div className={cn(
      'w-80 bg-dark-800 border-l border-dark-700 flex flex-col h-full',
      className
    )}>
      {/* Header avec statistiques */}
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
              onClick={handleAddPage}
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
        
        {/* Statistiques */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
          <div className="text-center p-2 bg-dark-700 rounded">
            <div className="text-white font-semibold">{pages.length}</div>
            <div className="text-gray-400">Total</div>
          </div>
          <div className="text-center p-2 bg-dark-700 rounded">
            <div className="text-orange-400 font-semibold">
              {pages.filter(p => p.status === 'in_progress').length}
            </div>
            <div className="text-gray-400">En cours</div>
          </div>
          <div className="text-center p-2 bg-dark-700 rounded">
            <div className="text-green-400 font-semibold">
              {pages.filter(p => p.status === 'completed').length}
            </div>
            <div className="text-gray-400">Terminées</div>
          </div>
        </div>
      </div>

      {/* Liste des pages avec miniatures */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-3">
          {pages.map((page) => {
            const pageId = page.id
            const thumbnail = thumbnailCache[pageId]
            const isLoading = loadingThumbnails[pageId]
            const isActive = page.number === currentPage

            return (
              <div
                key={pageId}
                className={cn(
                  'group relative bg-dark-700 rounded-lg p-3 cursor-pointer transition-all duration-200 border',
                  isActive
                    ? 'ring-2 ring-blue-500 bg-blue-500/10 border-blue-500/30'
                    : 'border-dark-600 hover:border-dark-500 hover:bg-dark-600/50'
                )}
                onClick={() => handlePageSelect(page.number)}
                onMouseEnter={() => setPreviewPage(page.number)}
                onMouseLeave={() => setPreviewPage(null)}
              >
                <div className="flex items-start space-x-3">
                  {/* Miniature */}
                  <div className="relative w-16 h-20 bg-dark-600 rounded border border-dark-500 overflow-hidden flex-shrink-0">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Page ${page.number}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-400">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}
                    
                    {/* Indicateur de statut */}
                    <div className="absolute top-1 right-1">
                      {getStatusIcon(page.status)}
                    </div>
                  </div>

                  {/* Informations de la page */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium text-sm truncate">
                        {page.title}
                      </h4>
                      <span className={cn(
                        'text-xs px-2 py-1 rounded-full bg-dark-600',
                        getStatusColor(page.status)
                      )}>
                        {page.number}
                      </span>
                    </div>
                    
                    <div className="mt-1 text-xs text-dark-400">
                      {page.elementsCount} élément{page.elementsCount !== 1 ? 's' : ''}
                    </div>
                    
                    <div className="mt-1 text-xs text-dark-500">
                      Modifiée {page.lastModified.toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className={cn(
                      'flex items-center space-x-1 mt-2 transition-opacity duration-200',
                      'opacity-0 group-hover:opacity-100'
                    )}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicatePage(page.number)
                        }}
                        className="p-1 hover:bg-dark-500 rounded text-dark-400 hover:text-white transition-colors"
                        title="Dupliquer"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {pages.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeletePage(page.number)
                          }}
                          className="p-1 hover:bg-red-500/20 rounded text-dark-400 hover:text-red-400 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Indicateur de page active */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Eye className="w-4 h-4 text-blue-400 animate-pulse" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Canvas caché pour génération de miniatures */}
      <canvas
        ref={thumbnailCanvasRef}
        width={150}
        height={200}
        className="hidden"
      />
    </div>
  )
}

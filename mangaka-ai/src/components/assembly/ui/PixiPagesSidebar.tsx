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

  // Gérer l'ajout de page avec le nouveau StateManager
  const handleAddPage = useCallback(async () => {
    try {
      const { addPage } = useAssemblyStore.getState()
      const newPageId = await addPage(projectId, `Page ${pages.length + 1}`)

      // Mettre à jour la liste locale des pages
      const newPage: PageMetadata = {
        id: newPageId,
        number: pages.length + 1,
        title: `Page ${pages.length + 1}`,
        status: 'empty',
        elementsCount: 0,
        lastModified: new Date(),
        createdAt: new Date()
      }

      setPages(prev => [...prev, newPage])
      onAddPage()

      console.log('✅ Page ajoutée avec succès:', newPageId)
    } catch (error) {
      console.error('❌ Erreur ajout page:', error)
      // TODO: Afficher un toast d'erreur
    }
  }, [pages.length, projectId, onAddPage])

  // Gérer la suppression de page avec renumérotation intelligente
  const handleDeletePage = useCallback(async (pageNumber: number) => {
    if (pages.length <= 1) {
      console.warn('⚠️ Impossible de supprimer la dernière page')
      return
    }

    try {
      const pageToDelete = pages.find(p => p.number === pageNumber)
      if (!pageToDelete) {
        console.warn('⚠️ Page à supprimer non trouvée:', pageNumber)
        return
      }

      console.log('🗑️ PixiPagesSidebar: Suppression page', pageNumber, 'ID:', pageToDelete.id)

      const { deletePage } = useAssemblyStore.getState()
      const deletedPageNumber = await deletePage(projectId, pageToDelete.id)

      // ✅ CORRECTION : Recharger les pages depuis le serveur au lieu de faire une renumérotation manuelle
      await loadPages()

      // Nettoyer le cache de miniatures pour la page supprimée
      setThumbnailCache(prev => {
        const newCache = { ...prev }
        delete newCache[pageToDelete.id]
        return newCache
      })

      onDeletePage(deletedPageNumber)

      console.log('✅ PixiPagesSidebar: Page supprimée avec succès:', deletedPageNumber)
    } catch (error) {
      console.error('❌ Erreur suppression page PixiPagesSidebar:', error)
      // TODO: Afficher un toast d'erreur
    }
  }, [pages, projectId, onDeletePage, loadPages])

  // Gérer la duplication de page avec le nouveau StateManager
  const handleDuplicatePage = useCallback(async (pageNumber: number) => {
    const sourcePage = pages.find(p => p.number === pageNumber)
    if (!sourcePage) {
      console.warn('⚠️ Page source non trouvée pour duplication:', pageNumber)
      return
    }

    try {
      const { duplicatePage } = useAssemblyStore.getState()
      const newPageId = await duplicatePage(projectId, sourcePage.id)

      // Mettre à jour la liste locale des pages
      const newPageNumber = pages.length + 1
      const newPage: PageMetadata = {
        id: newPageId,
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

      onDuplicatePage(pageNumber)

      console.log('✅ Page dupliquée avec succès:', newPageId)
    } catch (error) {
      console.error('❌ Erreur duplication page:', error)
      // TODO: Afficher un toast d'erreur
    }
  }, [pages, projectId, thumbnailCache, onDuplicatePage])

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
      'w-72 bg-gradient-to-b from-dark-800 to-dark-900 border-l border-red-500/20 flex flex-col h-full shadow-xl',
      className
    )}>
      {/* ✅ AMÉLIORATION : Header moderne avec gradient et branding */}
      <div className="p-4 border-b border-red-500/20 bg-gradient-to-r from-red-500/5 to-orange-500/5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center">
            <div className="w-6 h-6 mr-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-md flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Pages
          </h3>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleAddPage}
              className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-200 group"
              title="Ajouter une page"
            >
              <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                title="Fermer le menu"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* ✅ AMÉLIORATION : Statistiques compactes avec design moderne */}
        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1 px-2 py-1 bg-dark-700/50 rounded-full">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-white font-medium">{pages.length}</span>
            <span className="text-dark-400">pages</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-dark-700/50 rounded-full">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <span className="text-orange-400 font-medium">
              {pages.filter(p => p.status === 'in_progress').length}
            </span>
            <span className="text-dark-400">en cours</span>
          </div>
          <div className="flex items-center space-x-1 px-2 py-1 bg-dark-700/50 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-green-400 font-medium">
              {pages.filter(p => p.status === 'completed').length}
            </span>
            <span className="text-dark-400">fini</span>
          </div>
        </div>
      </div>

      {/* ✅ AMÉLIORATION : Liste des pages avec design moderne */}
      <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        <div className="space-y-2">
          {pages.map((page) => {
            const pageId = page.id
            const thumbnail = thumbnailCache[pageId]
            const isLoading = loadingThumbnails[pageId]
            const isActive = page.number === currentPage

            return (
              <div
                key={pageId}
                className={cn(
                  'group relative rounded-xl p-3 cursor-pointer transition-all duration-300 border backdrop-blur-sm',
                  isActive
                    ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/40 shadow-lg shadow-red-500/10'
                    : 'bg-dark-700/60 border-dark-600/50 hover:border-red-500/30 hover:bg-dark-600/80 hover:shadow-md'
                )}
                onClick={() => handlePageSelect(page.number)}
                onMouseEnter={() => setPreviewPage(page.number)}
                onMouseLeave={() => setPreviewPage(null)}
              >
                <div className="flex items-start space-x-3">
                  {/* ✅ AMÉLIORATION : Miniature moderne avec effets */}
                  <div className="relative w-14 h-18 bg-gradient-to-br from-dark-600 to-dark-700 rounded-lg border border-dark-500/50 overflow-hidden flex-shrink-0 shadow-md">
                    {isLoading ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full"></div>
                      </div>
                    ) : thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={`Page ${page.number}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-dark-400 group-hover:text-red-400 transition-colors">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}

                    {/* ✅ AMÉLIORATION : Indicateur de statut moderne */}
                    <div className="absolute -top-1 -right-1">
                      {getStatusIcon(page.status)}
                    </div>

                    {/* ✅ NOUVEAU : Numéro de page en overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-white text-xs font-bold p-1 text-center">
                        {page.number}
                      </div>
                    </div>
                  </div>

                  {/* ✅ AMÉLIORATION : Informations de la page modernisées */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-semibold text-sm truncate group-hover:text-red-100 transition-colors">
                        {page.title}
                      </h4>
                      <div className={cn(
                        'text-xs px-2 py-1 rounded-full font-medium transition-all duration-200',
                        isActive
                          ? 'bg-red-500 text-white shadow-md'
                          : 'bg-dark-600/80 text-dark-300 group-hover:bg-red-500/20 group-hover:text-red-300'
                      )}>
                        #{page.number}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center space-x-2 text-xs">
                      <span className="text-dark-400 group-hover:text-dark-300 transition-colors">
                        {page.elementsCount} élément{page.elementsCount !== 1 ? 's' : ''}
                      </span>
                      <div className="w-1 h-1 bg-dark-500 rounded-full"></div>
                      <span className="text-dark-500 group-hover:text-dark-400 transition-colors">
                        {page.lastModified.toLocaleDateString()}
                      </span>
                    </div>

                    {/* ✅ AMÉLIORATION : Actions modernisées */}
                    <div className={cn(
                      'flex items-center space-x-1 mt-2 transition-all duration-300',
                      'opacity-0 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0'
                    )}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDuplicatePage(page.number)
                        }}
                        className="p-1.5 hover:bg-blue-500/20 rounded-lg text-dark-400 hover:text-blue-400 transition-all duration-200 hover:scale-110"
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
                          className="p-1.5 hover:bg-red-500/20 rounded-lg text-dark-400 hover:text-red-400 transition-all duration-200 hover:scale-110"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ✅ AMÉLIORATION : Indicateur de page active moderne */}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  </div>
                )}

                {/* ✅ NOUVEAU : Effet de survol */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-orange-500/0 group-hover:from-red-500/5 group-hover:to-orange-500/5 rounded-xl transition-all duration-300 pointer-events-none"></div>
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

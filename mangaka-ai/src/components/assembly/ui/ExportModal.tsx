'use client'

// Modal d'export pour mangaka-ai
// Interface utilisateur complète avec options avancées

import React, { useState, useEffect } from 'react'
import { X, Download, FileImage, FileText, Settings, Check } from 'lucide-react'
import { ExportManager, downloadBlob } from '@/services/ExportManager'
import { toast } from 'react-hot-toast'
import type { ExportOptions, ExportProgress, PageData } from '@/types/export.types'

interface ExportModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export default function ExportModal({ projectId, isOpen, onClose }: ExportModalProps) {
  // État du modal simplifié
  const [format, setFormat] = useState<'png' | 'pdf'>('pdf')
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [availablePages, setAvailablePages] = useState<PageData[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ✅ SIMPLIFICATION : Valeurs par défaut automatiques optimales
  const getOptimalSettings = (format: 'png' | 'pdf') => {
    if (format === 'pdf') {
      return { quality: 0.95, resolution: 2 } // Haute qualité pour PDF
    } else {
      return { quality: 0.9, resolution: 3 } // Très haute résolution pour PNG
    }
  }

  // Charger les pages disponibles quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && projectId) {
      loadAvailablePages()
    }
  }, [isOpen, projectId])

  const loadAvailablePages = async () => {
    setIsLoading(true)
    try {
      const exportManager = new ExportManager()
      const pages = await exportManager.fetchAllPages(projectId)
      setAvailablePages(pages)
      setSelectedPages(pages.map(p => p.id)) // Sélectionner toutes par défaut
    } catch (error) {
      console.error('Erreur chargement pages:', error)
      toast.error('Erreur lors du chargement des pages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (selectedPages.length === 0) {
      toast.error('Veuillez sélectionner au moins une page')
      return
    }

    // Validation pour PNG (une seule page)
    if (format === 'png' && selectedPages.length > 1) {
      toast.error('L\'export PNG ne supporte qu\'une seule page à la fois')
      return
    }

    setIsExporting(true)
    setProgress(null)

    try {
      // ✅ SIMPLIFICATION : Utiliser les paramètres optimaux automatiques
      const optimalSettings = getOptimalSettings(format)

      const exportManager = new ExportManager()
      const blob = await exportManager.exportPages({
        projectId,
        format,
        quality: optimalSettings.quality,
        resolution: optimalSettings.resolution,
        pageIds: selectedPages,
        onProgress: setProgress
      })

      // Générer le nom de fichier
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const pageCount = selectedPages.length
      const filename = `manga-${projectId}-${pageCount}pages-${timestamp}.${format}`
      
      // Télécharger le fichier
      downloadBlob(blob, filename)
      
      toast.success(`Export ${format.toUpperCase()} réussi ! (${pageCount} page${pageCount > 1 ? 's' : ''})`)
      onClose()
    } catch (error) {
      console.error('Erreur export:', error)
      toast.error(`Erreur lors de l'export: ${error.message}`)
    } finally {
      setIsExporting(false)
      setProgress(null)
    }
  }

  const togglePageSelection = (pageId: string) => {
    setSelectedPages(prev => {
      if (prev.includes(pageId)) {
        return prev.filter(id => id !== pageId)
      } else {
        return [...prev, pageId]
      }
    })
  }

  const selectAllPages = () => {
    setSelectedPages(availablePages.map(p => p.id))
  }

  const deselectAllPages = () => {
    setSelectedPages([])
  }

  const getEstimatedFileSize = (): string => {
    // ✅ SIMPLIFICATION : Utiliser les paramètres optimaux pour l'estimation
    const optimalSettings = getOptimalSettings(format)
    const baseSize = 1200 * 1600 * 3 // Estimation base en bytes
    const totalSize = baseSize * selectedPages.length * optimalSettings.resolution * optimalSettings.quality

    if (totalSize < 1024 * 1024) {
      return `~${Math.round(totalSize / 1024)} KB`
    } else {
      return `~${Math.round(totalSize / (1024 * 1024))} MB`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 rounded-lg border border-dark-600 w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-red-500" />
            <h2 className="text-xl font-bold text-white">Exporter les pages</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-1 text-dark-400 hover:text-white hover:bg-dark-700 rounded transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Format d'export</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                  format === 'png'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-dark-600 hover:border-dark-500 text-dark-300'
                }`}
              >
                <FileImage className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PNG</div>
                  <div className="text-xs text-dark-400">Page unique, haute qualité</div>
                </div>
                {format === 'png' && <Check className="w-4 h-4 ml-auto text-red-500" />}
              </button>

              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                  format === 'pdf'
                    ? 'border-red-500 bg-red-500/10 text-red-400'
                    : 'border-dark-600 hover:border-dark-500 text-dark-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-dark-400">Multi-pages, portable</div>
                </div>
                {format === 'pdf' && <Check className="w-4 h-4 ml-auto text-red-500" />}
              </button>
            </div>
          </div>

          {/* Page Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white">
                Pages à exporter ({selectedPages.length}/{availablePages.length})
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllPages}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAllPages}
                  className="text-xs text-dark-400 hover:text-dark-300 transition-colors"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                <span className="ml-2 text-dark-300">Chargement des pages...</span>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-dark-600 rounded-lg p-3 space-y-2 bg-dark-700">
                {availablePages.map(page => (
                  <label key={page.id} className="flex items-center space-x-3 cursor-pointer hover:bg-dark-600 p-2 rounded transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="w-4 h-4 text-red-500 border-dark-500 rounded focus:ring-red-500 bg-dark-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-white">Page {page.number}</div>
                      <div className="text-xs text-dark-400">{page.title}</div>
                    </div>
                    <div className="text-xs text-dark-400">
                      {new Date(page.lastModified).toLocaleDateString()}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ✅ SIMPLIFICATION : Paramètres automatiques - Section supprimée */}
          {/* Les paramètres de qualité et résolution sont maintenant automatiques selon le format */}

          {/* Export Info */}
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-dark-400" />
              <span className="text-sm font-medium text-white">Informations d'export</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-dark-300">
              <div>Format: <span className="font-medium text-white">{format.toUpperCase()}</span></div>
              <div>Pages: <span className="font-medium text-white">{selectedPages.length}</span></div>
              <div>Qualité: <span className="font-medium text-white">Optimale automatique</span></div>
              <div>Taille estimée: <span className="font-medium text-white">{getEstimatedFileSize()}</span></div>
            </div>
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white font-medium">{progress.message}</span>
                <span className="text-red-400">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-dark-600 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              {progress.pageId && (
                <div className="text-xs text-red-400 mt-1">
                  Page en cours: {availablePages.find(p => p.id === progress.pageId)?.number}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 border-t border-dark-700 bg-dark-800 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-dark-300 border border-dark-600 rounded-lg hover:bg-dark-700 hover:text-white transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedPages.length === 0 || isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Export en cours...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Exporter {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

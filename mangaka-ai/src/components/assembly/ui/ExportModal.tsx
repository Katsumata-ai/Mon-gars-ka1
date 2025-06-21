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
  // État du modal
  const [format, setFormat] = useState<'png' | 'pdf'>('pdf')
  const [quality, setQuality] = useState(0.9)
  const [resolution, setResolution] = useState(2)
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState<ExportProgress | null>(null)
  const [availablePages, setAvailablePages] = useState<PageData[]>([])
  const [isLoading, setIsLoading] = useState(false)

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
      const exportManager = new ExportManager()
      const blob = await exportManager.exportPages({
        projectId,
        format,
        quality,
        resolution,
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
    const baseSize = 1200 * 1600 * 3 // Estimation base en bytes
    const totalSize = baseSize * selectedPages.length * resolution * quality
    
    if (totalSize < 1024 * 1024) {
      return `~${Math.round(totalSize / 1024)} KB`
    } else {
      return `~${Math.round(totalSize / (1024 * 1024))} MB`
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Download className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Exporter les pages</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Format d'export</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                  format === 'png' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileImage className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PNG</div>
                  <div className="text-xs text-gray-500">Page unique, haute qualité</div>
                </div>
                {format === 'png' && <Check className="w-4 h-4 ml-auto" />}
              </button>
              
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 border-2 rounded-lg flex items-center space-x-3 transition-all ${
                  format === 'pdf' 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs text-gray-500">Multi-pages, portable</div>
                </div>
                {format === 'pdf' && <Check className="w-4 h-4 ml-auto" />}
              </button>
            </div>
          </div>

          {/* Page Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Pages à exporter ({selectedPages.length}/{availablePages.length})
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllPages}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAllPages}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Tout désélectionner
                </button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Chargement des pages...</span>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                {availablePages.map(page => (
                  <label key={page.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedPages.includes(page.id)}
                      onChange={() => togglePageSelection(page.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Page {page.number}</div>
                      <div className="text-xs text-gray-500">{page.title}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(page.lastModified).toLocaleDateString()}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quality Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Qualité: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Rapide</span>
                <span>Haute qualité</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Résolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={1}>1x (Standard - 1200×1600)</option>
                <option value={2}>2x (Haute qualité - 2400×3200)</option>
                <option value={3}>3x (Impression - 3600×4800)</option>
                <option value={4}>4x (Ultra HD - 4800×6400)</option>
              </select>
            </div>
          </div>

          {/* Export Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Informations d'export</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>Format: <span className="font-medium">{format.toUpperCase()}</span></div>
              <div>Pages: <span className="font-medium">{selectedPages.length}</span></div>
              <div>Résolution: <span className="font-medium">{resolution}x</span></div>
              <div>Taille estimée: <span className="font-medium">{getEstimatedFileSize()}</span></div>
            </div>
          </div>

          {/* Progress */}
          {isExporting && progress && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-blue-700 font-medium">{progress.message}</span>
                <span className="text-blue-600">{Math.round((progress.current / progress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              {progress.pageId && (
                <div className="text-xs text-blue-600 mt-1">
                  Page en cours: {availablePages.find(p => p.id === progress.pageId)?.number}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedPages.length === 0 || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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

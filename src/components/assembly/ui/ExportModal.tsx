'use client'

// Modal d'export pour mangaka-ai
// Interface utilisateur complète avec options avancées

import React, { useState, useEffect } from 'react'
import { X, Download, FileImage, FileText, Settings, Check } from 'lucide-react'
import { ExportManager, downloadBlob } from '@/services/ExportManager'
import { toast } from 'react-hot-toast'
import type { ExportOptions, ExportProgress, PageData } from '@/types/export.types'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useSubscriptionSafe } from '@/hooks/useSubscriptionSafe'
import { PremiumUpgradeModal } from '@/components/upselling/PremiumUpgradeModal'

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

  // ✅ NOUVEAU : Système de limites d'export
  const { isLimitReached, incrementUsage, getLimitInfo } = useUserLimits()
  const { hasActiveSubscription } = useSubscriptionSafe()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Informations sur les limites d'export
  const exportLimitInfo = getLimitInfo('project_exports')

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
      console.error('Error loading pages:', error)
      toast.error('Error loading pages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    if (selectedPages.length === 0) {
      toast.error('Please select at least one page')
      return
    }

    // Validation pour PNG (une seule page)
    if (format === 'png' && selectedPages.length > 1) {
      toast.error('PNG export only supports one page at a time')
      return
    }

    // ✅ NOUVEAU : Vérification des limites d'export pour utilisateurs gratuits
    if (!hasActiveSubscription && isLimitReached('project_exports')) {
      setShowUpgradeModal(true)
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

      // ✅ NOUVEAU : Incrémenter le compteur d'exports après succès
      if (!hasActiveSubscription) {
        await incrementUsage('project_exports', 1)
      }

      toast.success(`${format.toUpperCase()} export successful! (${pageCount} page${pageCount > 1 ? 's' : ''})`)
      onClose()
    } catch (error) {
      console.error('Export error:', error)
      toast.error(`Export error: ${error.message}`)
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
            <h2 className="text-xl font-bold text-white">Export Pages</h2>
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
            <label className="block text-sm font-medium text-white mb-3">Export Format</label>
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
                  <div className="text-xs text-dark-400">Single page, high quality</div>
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
                  <div className="text-xs text-dark-400">Multi-page, portable</div>
                </div>
                {format === 'pdf' && <Check className="w-4 h-4 ml-auto text-red-500" />}
              </button>
            </div>
          </div>

          {/* Page Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-white">
                Pages to export ({selectedPages.length}/{availablePages.length})
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllPages}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Select all
                </button>
                <button
                  onClick={deselectAllPages}
                  className="text-xs text-dark-400 hover:text-dark-300 transition-colors"
                >
                  Deselect all
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
                <span className="ml-2 text-dark-300">Loading pages...</span>
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
                      {(() => {
                        const date = new Date(page.lastModified)
                        const day = date.getDate().toString().padStart(2, '0')
                        const month = (date.getMonth() + 1).toString().padStart(2, '0')
                        const year = date.getFullYear().toString().slice(-2)
                        return `${day}/${month}/${year}`
                      })()}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ✅ SIMPLIFICATION: Automatic settings - Section removed */}
          {/* Les paramètres de qualité et résolution sont maintenant automatiques selon le format */}

          {/* ✅ NOUVEAU : Indicateur de limites d'export */}
          {!hasActiveSubscription && exportLimitInfo && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-300">
                  📤 Available exports
                </span>
                <span className={`text-sm font-bold ${
                  exportLimitInfo.isReached ? 'text-red-400' : 'text-green-400'
                }`}>
                  {exportLimitInfo.current}/{exportLimitInfo.limit}
                </span>
              </div>

              <div className="w-full bg-slate-600 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    exportLimitInfo.isReached ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(exportLimitInfo.percentage || 0, 100)}%` }}
                />
              </div>

              {exportLimitInfo.isReached && (
                <div className="mt-2 text-xs text-red-400">
                  ⚠️ You have used your free export
                </div>
              )}
            </div>
          )}

          {/* Export Info */}
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="w-4 h-4 text-dark-400" />
              <span className="text-sm font-medium text-white">Export Information</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm text-dark-300">
              <div>Format: <span className="font-medium text-white">{format.toUpperCase()}</span></div>
              <div>Pages: <span className="font-medium text-white">{selectedPages.length}</span></div>
              <div>Quality: <span className="font-medium text-white">Automatic optimal</span></div>
              <div>Estimated size: <span className="font-medium text-white">{getEstimatedFileSize()}</span></div>
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
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || selectedPages.length === 0 || isLoading}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : !hasActiveSubscription && exportLimitInfo?.isReached ? (
              <>
                <span>Upgrade to export</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>

        {/* [FR-UNTRANSLATED: ✅ NOUVEAU : Modale d'upselling pour les exports] */}
        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="project_exports"
          currentUsage={exportLimitInfo ? {
            used: exportLimitInfo.current,
            limit: exportLimitInfo.limit as number,
            type: 'exports'
          } : undefined}
        />
      </div>
    </div>
  )
}

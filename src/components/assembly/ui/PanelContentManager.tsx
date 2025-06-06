'use client'

import React, { useState, useEffect } from 'react'
import { useCanvasContext } from '../context/CanvasContext'
import { AssemblyElement, PanelElement, ImageElement } from '../types/assembly.types'
import { PanelContentAssociation } from '../types/panel-content.types'
import { Eye, EyeOff, Link, Unlink, Image, Layers } from 'lucide-react'

interface PanelContentManagerProps {
  selectedPanelId?: string | null
  className?: string
}

/**
 * Composant pour gérer les associations entre panels et images
 */
export default function PanelContentManager({
  selectedPanelId,
  className = ''
}: PanelContentManagerProps) {
  const { elements, panelContentService } = useCanvasContext()
  const [associations, setAssociations] = useState<PanelContentAssociation[]>([])
  const [selectedPanel, setSelectedPanel] = useState<PanelElement | null>(null)

  // Mettre à jour les associations quand les éléments changent
  useEffect(() => {
    const currentAssociations = panelContentService.getAllAssociations()
    setAssociations(currentAssociations)

    // Nettoyer les associations obsolètes
    const elementIds = elements.map(el => el.id)
    panelContentService.cleanup(elementIds)
  }, [elements, panelContentService])

  // Mettre à jour le panel sélectionné
  useEffect(() => {
    if (selectedPanelId) {
      const panel = elements.find(el => el.id === selectedPanelId && el.type === 'panel') as PanelElement
      setSelectedPanel(panel || null)
    } else {
      setSelectedPanel(null)
    }
  }, [selectedPanelId, elements])

  // Obtenir les panels disponibles
  const panels = elements.filter(el => el.type === 'panel') as PanelElement[]
  
  // Obtenir les images disponibles
  const images = elements.filter(el => el.type === 'image') as ImageElement[]

  // Obtenir les images associées au panel sélectionné
  const getImagesForSelectedPanel = (): ImageElement[] => {
    if (!selectedPanel) return []
    const imageIds = panelContentService.getImagesForPanel(selectedPanel.id)
    return images.filter(img => imageIds.includes(img.id))
  }

  // Obtenir les images non associées
  const getUnassociatedImages = (): ImageElement[] => {
    const allAssociatedImageIds = new Set<string>()
    associations.forEach(assoc => {
      assoc.imageIds.forEach(id => allAssociatedImageIds.add(id))
    })
    return images.filter(img => !allAssociatedImageIds.has(img.id))
  }

  // Ajouter une image au panel sélectionné
  const handleAddImageToPanel = (imageId: string) => {
    if (!selectedPanel) return
    panelContentService.addImageToPanel(selectedPanel.id, imageId)
    setAssociations(panelContentService.getAllAssociations())
  }

  // Supprimer une image du panel sélectionné
  const handleRemoveImageFromPanel = (imageId: string) => {
    if (!selectedPanel) return
    panelContentService.removeImageFromPanel(selectedPanel.id, imageId)
    setAssociations(panelContentService.getAllAssociations())
  }

  // Activer/désactiver le masquage
  const handleToggleMasking = (panelId: string, enabled: boolean) => {
    panelContentService.toggleMasking(panelId, enabled)
    setAssociations(panelContentService.getAllAssociations())
  }

  // Détecter automatiquement les images sous le panel
  const handleAutoDetect = () => {
    if (!selectedPanel) return
    
    const intersections = panelContentService.detectImagesUnderPanel(selectedPanel.id, elements)
    const significantImages = intersections
      .filter(intersection => intersection.isSignificant)
      .map(intersection => intersection.imageId)

    if (significantImages.length > 0) {
      panelContentService.createAutomaticAssociation(selectedPanel.id, significantImages)
      setAssociations(panelContentService.getAllAssociations())
    }
  }

  const associatedImages = getImagesForSelectedPanel()
  const unassociatedImages = getUnassociatedImages()
  const selectedAssociation = selectedPanel ? associations.find(a => a.panelId === selectedPanel.id) : null

  return (
    <div className={`bg-dark-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Layers size={16} className="text-blue-400" />
        <h3 className="text-white font-medium">Contenu des Panels</h3>
      </div>

      {selectedPanel ? (
        <div className="space-y-4">
          {/* Informations du panel sélectionné */}
          <div className="bg-dark-700 rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Panel sélectionné</span>
              {selectedAssociation && (
                <button
                  onClick={() => handleToggleMasking(selectedPanel.id, !selectedAssociation.maskEnabled)}
                  className={`p-1 rounded ${
                    selectedAssociation.maskEnabled 
                      ? 'text-green-400 hover:bg-green-400/20' 
                      : 'text-gray-400 hover:bg-gray-400/20'
                  }`}
                  title={selectedAssociation.maskEnabled ? 'Désactiver le masquage' : 'Activer le masquage'}
                >
                  {selectedAssociation.maskEnabled ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              )}
            </div>
            <div className="text-white font-mono text-xs">{selectedPanel.id}</div>
            <div className="text-gray-400 text-xs">
              {selectedPanel.transform.width}×{selectedPanel.transform.height}
            </div>
          </div>

          {/* Images associées */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-sm">Images associées ({associatedImages.length})</span>
              <button
                onClick={handleAutoDetect}
                className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-400/10 hover:bg-blue-400/20"
              >
                Auto-détecter
              </button>
            </div>
            
            {associatedImages.length > 0 ? (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {associatedImages.map(image => (
                  <div key={image.id} className="flex items-center justify-between bg-dark-700 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Image size={12} className="text-green-400" />
                      <span className="text-white text-xs font-mono">{image.id.slice(-8)}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveImageFromPanel(image.id)}
                      className="text-red-400 hover:text-red-300 p-1"
                      title="Supprimer l'association"
                    >
                      <Unlink size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-xs text-center py-4">
                Aucune image associée
              </div>
            )}
          </div>

          {/* Images disponibles */}
          {unassociatedImages.length > 0 && (
            <div>
              <span className="text-gray-300 text-sm">Images disponibles ({unassociatedImages.length})</span>
              <div className="space-y-2 max-h-32 overflow-y-auto mt-2">
                {unassociatedImages.map(image => (
                  <div key={image.id} className="flex items-center justify-between bg-dark-700 rounded p-2">
                    <div className="flex items-center gap-2">
                      <Image size={12} className="text-gray-400" />
                      <span className="text-white text-xs font-mono">{image.id.slice(-8)}</span>
                    </div>
                    <button
                      onClick={() => handleAddImageToPanel(image.id)}
                      className="text-green-400 hover:text-green-300 p-1"
                      title="Associer au panel"
                    >
                      <Link size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8">
          <Layers size={32} className="text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Sélectionnez un panel pour gérer son contenu</p>
        </div>
      )}

      {/* Résumé des associations */}
      {associations.length > 0 && (
        <div className="mt-6 pt-4 border-t border-dark-600">
          <span className="text-gray-400 text-xs">Résumé : {associations.length} panel(s) avec contenu</span>
        </div>
      )}
    </div>
  )
}

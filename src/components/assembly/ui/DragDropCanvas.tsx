'use client'

import React, { useCallback, useRef } from 'react'
import { useCanvasContext } from '../context/CanvasContext'
import { generateElementId } from '../managers/StateManager'
import { ImageElement, PanelElement } from '../types/assembly.types'

interface DragDropCanvasProps {
  children: React.ReactNode
  className?: string
}

interface DraggedImageData {
  type: 'image'
  sourceId: string
  imageUrl: string
  metadata: {
    originalWidth: number
    originalHeight: number
    name: string
    sourceType: 'character' | 'decor' | 'scene' | 'upload'
  }
}

/**
 * Wrapper pour le canvas qui gère le drag & drop d'images
 */
export default function DragDropCanvas({ children, className = '' }: DragDropCanvasProps) {
  const { elements, addElement, panelContentService } = useCanvasContext()
  const canvasRef = useRef<HTMLDivElement>(null)

  // Calculer l'intersection entre une image et un panel
  const calculateIntersection = useCallback((imageElement: ImageElement, panel: PanelElement): number => {
    const imageBounds = imageElement.transform
    const panelBounds = panel.transform

    const left = Math.max(panelBounds.x, imageBounds.x)
    const top = Math.max(panelBounds.y, imageBounds.y)
    const right = Math.min(panelBounds.x + panelBounds.width, imageBounds.x + imageBounds.width)
    const bottom = Math.min(panelBounds.y + panelBounds.height, imageBounds.y + imageBounds.height)

    if (left >= right || top >= bottom) {
      return 0 // Pas d'intersection
    }

    const intersectionArea = (right - left) * (bottom - top)
    const imageArea = imageBounds.width * imageBounds.height
    return (intersectionArea / imageArea) * 100
  }, [])

  // Gérer le drop d'une image
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    
    try {
      const dragDataStr = event.dataTransfer.getData('application/json')
      if (!dragDataStr) return

      const dragData: DraggedImageData = JSON.parse(dragDataStr)
      
      // Obtenir les coordonnées relatives au canvas
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Créer l'élément image
      const imageElement: ImageElement = {
        id: generateElementId(),
        type: 'image',
        layerType: 'characters',
        transform: {
          x: x - dragData.metadata.originalWidth / 2, // Centrer sur le curseur
          y: y - dragData.metadata.originalHeight / 2,
          width: dragData.metadata.originalWidth,
          height: dragData.metadata.originalHeight,
          rotation: 0,
          alpha: 1,
          zIndex: 20 // Au-dessus des autres éléments
        },
        imageData: {
          src: dragData.imageUrl,
          originalWidth: dragData.metadata.originalWidth,
          originalHeight: dragData.metadata.originalHeight,
          alt: dragData.metadata.name
        },
        properties: {
          name: dragData.metadata.name,
          locked: false,
          visible: true,
          blendMode: 'normal'
        },
        metadata: {
          sourceType: dragData.metadata.sourceType,
          sourceId: dragData.sourceId,
          addedAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }

      // Ajouter l'image au canvas
      addElement(imageElement)

      console.log('🎯 Image ajoutée par drag & drop:', {
        imageId: imageElement.id,
        position: { x: imageElement.transform.x, y: imageElement.transform.y },
        source: dragData.metadata.name
      })

      // Détecter automatiquement les panels qui pourraient contenir cette image
      const panels = elements.filter(el => el.type === 'panel') as PanelElement[]
      
      panels.forEach(panel => {
        const coveragePercentage = calculateIntersection(imageElement, panel)
        
        if (coveragePercentage > 10) { // Seuil de 10%
          console.log('🎯 Image automatiquement associée au panel:', {
            panelId: panel.id,
            imageId: imageElement.id,
            coverage: coveragePercentage.toFixed(1) + '%'
          })
          
          // Créer l'association
          panelContentService.addImageToPanel(panel.id, imageElement.id)
        }
      })

    } catch (error) {
      console.error('❌ Erreur lors du drop:', error)
    }
  }, [elements, addElement, panelContentService, calculateIntersection])

  // Gérer le dragover
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }, [])

  // Gérer le dragenter
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  return (
    <div
      ref={canvasRef}
      className={`relative ${className}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
    >
      {children}
      
      {/* Indicateur visuel de zone de drop */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="w-full h-full border-2 border-dashed border-transparent transition-colors duration-200 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Hook pour créer les props de drag pour les éléments d'image
 */
export function useDragProps() {
  const createDragProps = useCallback((
    sourceId: string,
    imageUrl: string,
    metadata: DraggedImageData['metadata']
  ) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      const dragData: DraggedImageData = {
        type: 'image',
        sourceId,
        imageUrl,
        metadata
      }

      event.dataTransfer.setData('application/json', JSON.stringify(dragData))
      event.dataTransfer.effectAllowed = 'copy'
      
      console.log('🎯 Drag démarré:', metadata.name)
    },
    style: { cursor: 'grab' } as React.CSSProperties
  }), [])

  return { createDragProps }
}

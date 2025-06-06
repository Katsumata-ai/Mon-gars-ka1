/**
 * Hook pour gérer le drag & drop d'images vers les panels
 */

import { useCallback, useEffect, useRef } from 'react'
import { useCanvasContext } from '../context/CanvasContext'
import { dragDropService, DragDropData, DropZone } from '../services/DragDropService'
import { AssemblyElement, PanelElement } from '../types/assembly.types'

export interface UseDragDropOptions {
  onImageDropped?: (imageElement: any) => void
  onDragStart?: (data: DragDropData) => void
  onDragEnd?: () => void
}

export function useDragDrop(options: UseDragDropOptions = {}) {
  const { addElement, elements, panelContentService } = useCanvasContext()
  const { onImageDropped, onDragStart, onDragEnd } = options

  /**
   * Démarrer un drag depuis une galerie d'images
   */
  const startImageDrag = useCallback((
    sourceId: string,
    imageUrl: string,
    metadata: DragDropData['metadata'],
    event: React.DragEvent
  ) => {
    const dragData: DragDropData = {
      type: 'image',
      sourceId,
      imageUrl,
      metadata
    }

    dragDropService.startDrag(dragData, event.nativeEvent)
    onDragStart?.(dragData)

    console.log('🎯 Drag d\'image démarré depuis galerie:', dragData)
  }, [onDragStart])

  /**
   * Gérer le drop sur le canvas
   */
  const handleCanvasDrop = useCallback((
    event: React.DragEvent,
    canvasPosition: { x: number, y: number }
  ) => {
    event.preventDefault()
    
    const droppedImage = dragDropService.handleDrop(
      canvasPosition.x,
      canvasPosition.y,
      elements
    )

    if (droppedImage) {
      // Ajouter l'image au canvas
      addElement(droppedImage)
      
      // Détecter automatiquement les panels qui pourraient contenir cette image
      const panels = elements.filter(el => el.type === 'panel') as PanelElement[]
      
      panels.forEach(panel => {
        const intersections = panelContentService.detectImagesUnderPanel(panel.id, [...elements, droppedImage])
        const newImageIntersection = intersections.find(i => i.imageId === droppedImage.id)
        
        if (newImageIntersection && newImageIntersection.isSignificant) {
          console.log('🎯 Image automatiquement associée au panel:', panel.id)
          panelContentService.addImageToPanel(panel.id, droppedImage.id)
        }
      })

      onImageDropped?.(droppedImage)
    }

    dragDropService.endDrag()
    onDragEnd?.()
  }, [elements, addElement, panelContentService, onImageDropped, onDragEnd])

  /**
   * Gérer le dragover sur le canvas
   */
  const handleCanvasDragOver = useCallback((event: React.DragEvent) => {
    if (dragDropService.isActive) {
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  /**
   * Enregistrer un panel comme zone de drop
   */
  const registerPanelDropZone = useCallback((panel: PanelElement) => {
    const dropZone: DropZone = {
      id: `panel-${panel.id}`,
      type: 'panel',
      bounds: {
        x: panel.transform.x,
        y: panel.transform.y,
        width: panel.transform.width,
        height: panel.transform.height
      },
      element: panel
    }

    dragDropService.registerDropZone(dropZone)
  }, [])

  /**
   * Supprimer un panel des zones de drop
   */
  const unregisterPanelDropZone = useCallback((panelId: string) => {
    dragDropService.unregisterDropZone(`panel-${panelId}`)
  }, [])

  /**
   * Mettre à jour les zones de drop pour tous les panels
   */
  const updatePanelDropZones = useCallback(() => {
    // Nettoyer les anciennes zones
    dragDropService.clearDropZones()
    
    // Enregistrer tous les panels actuels
    const panels = elements.filter(el => el.type === 'panel') as PanelElement[]
    panels.forEach(panel => {
      registerPanelDropZone(panel)
    })

    console.log('📍 Zones de drop mises à jour:', panels.length, 'panels')
  }, [elements, registerPanelDropZone])

  /**
   * Mettre à jour automatiquement les zones de drop quand les éléments changent
   */
  useEffect(() => {
    updatePanelDropZones()
  }, [updatePanelDropZones])

  /**
   * Nettoyer au démontage
   */
  useEffect(() => {
    return () => {
      dragDropService.clearDropZones()
      if (dragDropService.isActive) {
        dragDropService.endDrag()
      }
    }
  }, [])

  return {
    // Fonctions pour les galeries d'images
    startImageDrag,
    
    // Fonctions pour le canvas
    handleCanvasDrop,
    handleCanvasDragOver,
    
    // Gestion des zones de drop
    registerPanelDropZone,
    unregisterPanelDropZone,
    updatePanelDropZones,
    
    // État
    isDragging: dragDropService.isActive,
    currentDragData: dragDropService.currentDragData,
    dropZones: dragDropService.getDropZones()
  }
}

/**
 * Hook spécialisé pour les galeries d'images
 */
export function useImageGalleryDrag() {
  const { startImageDrag } = useDragDrop()

  /**
   * Créer les props de drag pour un élément d'image
   */
  const createDragProps = useCallback((
    sourceId: string,
    imageUrl: string,
    metadata: DragDropData['metadata']
  ) => ({
    draggable: true,
    onDragStart: (event: React.DragEvent) => {
      startImageDrag(sourceId, imageUrl, metadata, event)
    },
    style: { cursor: 'grab' }
  }), [startImageDrag])

  return {
    createDragProps,
    startImageDrag
  }
}

/**
 * Hook spécialisé pour le canvas
 */
export function useCanvasDrop(options: UseDragDropOptions = {}) {
  const { handleCanvasDrop, handleCanvasDragOver } = useDragDrop(options)
  const canvasRef = useRef<HTMLElement>(null)

  /**
   * Convertir les coordonnées d'événement en coordonnées canvas
   */
  const getCanvasPosition = useCallback((event: React.DragEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 }

    const rect = canvasRef.current.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
  }, [])

  /**
   * Créer les props de drop pour le canvas
   */
  const createDropProps = useCallback(() => ({
    ref: canvasRef,
    onDrop: (event: React.DragEvent) => {
      const position = getCanvasPosition(event)
      handleCanvasDrop(event, position)
    },
    onDragOver: handleCanvasDragOver,
    onDragEnter: (event: React.DragEvent) => {
      if (dragDropService.isActive) {
        event.preventDefault()
      }
    }
  }), [handleCanvasDrop, handleCanvasDragOver, getCanvasPosition])

  return {
    createDropProps,
    canvasRef
  }
}

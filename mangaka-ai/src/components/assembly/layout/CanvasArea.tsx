'use client'

import React, { useRef, useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { useCanvasContext } from '../context/CanvasContext'
import { getCursorForTool } from '../utils/CursorUtils'
import { AssemblyElement, ImageElement } from '../types/assembly.types'
import { generateElementId } from '../context/CanvasContext'

// Import dynamique pour éviter l'hydratation
const PixiApplication = dynamic(() => import('../core/PixiApplication'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
      <div className="text-white text-sm">Chargement du canvas...</div>
    </div>
  )
})

interface CanvasAreaProps {
  width?: number
  height?: number
  onElementClick?: (element: any) => void
  onCanvasClick?: (x: number, y: number) => void
  onBubbleDoubleClick?: (element: any, position: { x: number, y: number }) => void
  onBubbleRightClick?: (element: any, position: { x: number, y: number }) => void
  className?: string
}

/**
 * Zone centrale du canvas reproduisant l'interface Dashtoon
 * - Fond distinctif des menus latéraux
 * - Canvas centré et manipulable
 * - Contrôles de zoom et navigation
 * - Scroll libre dans toutes les directions
 */
export default function CanvasArea({
  width = 1200,
  height = 1600,
  onElementClick,
  onCanvasClick,
  onBubbleDoubleClick,
  onBubbleRightClick,
  className = ''
}: CanvasAreaProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasTransform, setCanvasTransform] = useState({
    x: 0,
    y: 0,
    scale: 1
  })

  // 🎯 État pour le feedback visuel
  const [hoveredPanelId, setHoveredPanelId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Utiliser le contexte canvas principal
  const { elements, addElement, updateElement, removeElement, panelContentService, activeTool, setZoom, zoom, pixiApp } = useCanvasContext()

  // Gérer le drop d'images sur le canvas - UNIQUEMENT DANS LES PANELS
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()

    try {
      const dragDataStr = event.dataTransfer.getData('application/json')
      if (!dragDataStr) return

      const dragData = JSON.parse(dragDataStr)

      // 🔧 CORRECTION : Utiliser la même logique de coordonnées que PixiApplication
      // Obtenir les coordonnées relatives au canvas PixiJS (pas au conteneur CSS)
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      // Coordonnées brutes relatives au conteneur
      const rawX = event.clientX - rect.left
      const rawY = event.clientY - rect.top

      // Convertir en coordonnées canvas en tenant compte des transformations CSS
      // Le canvas PixiJS est centré et transformé dans le conteneur
      const canvasRect = {
        x: rect.width / 2 + canvasTransform.x - (width * canvasTransform.scale) / 2,
        y: rect.height / 2 + canvasTransform.y - (height * canvasTransform.scale) / 2,
        width: width * canvasTransform.scale,
        height: height * canvasTransform.scale
      }

      // Coordonnées relatives au canvas PixiJS
      const canvasX = (rawX - canvasRect.x) / canvasTransform.scale
      const canvasY = (rawY - canvasRect.y) / canvasTransform.scale

      console.log('🎯 Calcul coordonnées drop:', {
        raw: { x: rawX, y: rawY },
        canvasRect,
        canvasTransform,
        final: { x: canvasX, y: canvasY }
      })

      // 🎯 VÉRIFIER SI LE DROP EST DANS UN PANEL EXISTANT
      console.log('🔍 Éléments disponibles:', elements.length)
      const panels = elements.filter(el => el.type === 'panel')
      console.log('🔍 Panels trouvés:', panels.length, panels.map(p => ({ id: p.id, bounds: p.transform })))

      let targetPanel = null
      for (const panel of panels) {
        const panelBounds = panel.transform
        console.log('🔍 Test collision panel:', {
          panelId: panel.id,
          panelBounds,
          dropCoords: { x: canvasX, y: canvasY },
          inBounds: {
            x: canvasX >= panelBounds.x && canvasX <= panelBounds.x + panelBounds.width,
            y: canvasY >= panelBounds.y && canvasY <= panelBounds.y + panelBounds.height
          }
        })

        if (canvasX >= panelBounds.x &&
            canvasX <= panelBounds.x + panelBounds.width &&
            canvasY >= panelBounds.y &&
            canvasY <= panelBounds.y + panelBounds.height) {
          targetPanel = panel
          console.log('✅ Panel trouvé pour le drop:', panel.id)
          break
        }
      }

      // ❌ SI PAS DANS UN PANEL, REFUSER LE DROP
      if (!targetPanel) {
        console.log('❌ Drop refusé : L\'image doit être déposée dans un panel existant')
        console.log('🔍 Coordonnées drop finales:', { x: canvasX, y: canvasY })
        console.log('🔍 Panels disponibles:', panels.map(p => ({
          id: p.id,
          bounds: p.transform,
          contains: {
            x: canvasX >= p.transform.x && canvasX <= p.transform.x + p.transform.width,
            y: canvasY >= p.transform.y && canvasY <= p.transform.y + p.transform.height
          }
        })))
        // Afficher un message d'erreur visuel
        // TODO: Ajouter une notification toast
        return
      }

      console.log('✅ Drop accepté dans le panel:', targetPanel.id)

      // 🎯 VÉRIFIER S'IL Y A DÉJÀ UNE IMAGE DANS CE PANEL
      const existingImage = elements.find(el =>
        el.type === 'image' &&
        el.metadata?.parentPanelId === targetPanel.id
      )

      if (existingImage) {
        console.log('🔄 Remplacement d\'image existante:', existingImage.id)

        // 🗑️ SUPPRIMER L'ANCIENNE IMAGE
        removeElement(existingImage.id)

        // 🧹 NETTOYER L'ASSOCIATION DANS LE SERVICE
        if (panelContentService) {
          panelContentService.removeImageFromPanel(targetPanel.id, existingImage.id)
        }

        console.log('✅ Image existante supprimée:', existingImage.id)
      }

      // 🎯 NOUVEAU COMPORTEMENT : Image prend automatiquement 100% du panel
      const imageWidth = targetPanel.transform.width
      const imageHeight = targetPanel.transform.height
      const imageX = targetPanel.transform.x
      const imageY = targetPanel.transform.y

      console.log('🎯 Image auto-fit à 100% du panel:', {
        panel: { x: targetPanel.transform.x, y: targetPanel.transform.y, width: targetPanel.transform.width, height: targetPanel.transform.height },
        image: { width: imageWidth, height: imageHeight },
        finalPosition: { x: imageX, y: imageY },
        isReplacement: !!existingImage
      })

      // Créer l'élément image
      const imageElement: ImageElement = {
        id: generateElementId(),
        type: 'image',
        layerType: 'characters',
        transform: {
          x: imageX,
          y: imageY,
          width: imageWidth,
          height: imageHeight,
          rotation: 0,
          alpha: 1,
          zIndex: targetPanel.transform.zIndex - 1 // Juste en-dessous du panel
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
          lastModified: new Date().toISOString(),
          parentPanelId: targetPanel.id, // 🔗 LIER L'IMAGE AU PANEL
          isUnifiedWithPanel: true // 🆕 MARQUER COMME ENTITÉ UNIFIÉE
        }
      }

      // Ajouter l'image au canvas
      addElement(imageElement)

      // 🎯 RENDRE LE PANEL TRANSPARENT pour voir l'image (seulement si pas déjà transparent)
      if (!existingImage) {
        updateElement(targetPanel.id, {
          panelStyle: {
            ...targetPanel.panelStyle,
            fillAlpha: 0.05 // Très transparent pour voir l'image
          }
        })
        console.log('🎨 Panel rendu transparent pour la première image')
      } else {
        console.log('🎨 Panel déjà transparent, pas de changement nécessaire')
      }

      // 🔗 CRÉER L'ASSOCIATION AUTOMATIQUEMENT
      setTimeout(() => {
        if (panelContentService && panelContentService.addImageToPanel) {
          panelContentService.addImageToPanel(targetPanel.id, imageElement.id)
          console.log('🔗 Association créée automatiquement:', {
            panelId: targetPanel.id,
            imageId: imageElement.id
          })
        }
      }, 100)

      console.log('🎯 Image ajoutée dans le panel:', {
        imageId: imageElement.id,
        panelId: targetPanel.id,
        position: { x: imageElement.transform.x, y: imageElement.transform.y },
        size: { width: imageElement.transform.width, height: imageElement.transform.height },
        source: dragData.metadata.name
      })

    } catch (error) {
      console.error('❌ Erreur lors du drop:', error)
    } finally {
      // 🎯 Nettoyer l'état après le drop
      setIsDragging(false)
      setHoveredPanelId(null)
      clearDragFeedback() // 🧹 Nettoyer le feedback PixiJS
    }
  }, [elements, addElement, updateElement, removeElement, panelContentService, canvasTransform])

  // 🎯 Fonction pour détecter le panel survolé
  const detectHoveredPanel = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current
    if (!container) return null

    const rect = container.getBoundingClientRect()

    // Même logique de conversion que dans handleDrop
    const rawX = clientX - rect.left
    const rawY = clientY - rect.top

    const canvasRect = {
      x: rect.width / 2 + canvasTransform.x - (width * canvasTransform.scale) / 2,
      y: rect.height / 2 + canvasTransform.y - (height * canvasTransform.scale) / 2,
      width: width * canvasTransform.scale,
      height: height * canvasTransform.scale
    }

    const canvasX = (rawX - canvasRect.x) / canvasTransform.scale
    const canvasY = (rawY - canvasRect.y) / canvasTransform.scale

    // Trouver le panel sous le curseur
    const panels = elements.filter(el => el.type === 'panel')
    for (const panel of panels) {
      const { x, y, width: panelWidth, height: panelHeight } = panel.transform
      if (canvasX >= x && canvasX <= x + panelWidth && canvasY >= y && canvasY <= y + panelHeight) {
        return panel.id
      }
    }
    return null
  }, [elements, canvasTransform, width, height])

  // 🎯 Fonction pour vérifier si un panel contient une image
  const panelHasImage = useCallback((panelId: string) => {
    return elements.some(el =>
      el.type === 'image' &&
      el.metadata?.parentPanelId === panelId
    )
  }, [elements])

  // 🎯 FEEDBACK VISUEL DANS PIXI.JS - Même système que la sélection
  const createDragFeedback = useCallback((panelId: string, hasImage: boolean) => {
    if (!pixiApp?.stage) return

    // Trouver le conteneur de feedback (ou le créer)
    let feedbackContainer = pixiApp.stage.getChildByName('dragFeedback') as Container
    if (!feedbackContainer) {
      feedbackContainer = new Container()
      feedbackContainer.label = 'dragFeedback'
      feedbackContainer.zIndex = 2000 // Au-dessus de tout
      pixiApp.stage.addChild(feedbackContainer)
    }

    // Nettoyer le feedback précédent
    feedbackContainer.removeChildren()

    // Trouver le panel
    const panel = elements.find(el => el.id === panelId && el.type === 'panel')
    if (!panel) return

    // Créer l'overlay coloré
    const overlay = new Graphics()
    const color = hasImage ? 0xef4444 : 0x22c55e // Rouge ou vert
    const alpha = 0.25

    overlay.rect(
      panel.transform.x,
      panel.transform.y,
      panel.transform.width,
      panel.transform.height
    )
    overlay.fill({ color, alpha })
    overlay.stroke({ width: 2, color, alpha: 0.8 })

    // Créer le texte
    const text = new Text({
      text: hasImage ? 'Remplacer' : 'Ajouter',
      style: new TextStyle({
        fontSize: 14,
        fontFamily: 'Arial',
        fill: 0xffffff,
        fontWeight: 'bold',
        stroke: { color: 0x000000, width: 2 }
      })
    })

    // Centrer le texte dans le panel
    text.x = panel.transform.x + (panel.transform.width / 2) - (text.width / 2)
    text.y = panel.transform.y + (panel.transform.height / 2) - (text.height / 2)

    feedbackContainer.addChild(overlay)
    feedbackContainer.addChild(text)

    console.log('🎯 Feedback PixiJS créé:', { panelId, hasImage, color: hasImage ? 'rouge' : 'vert' })
  }, [pixiApp, elements])

  const clearDragFeedback = useCallback(() => {
    if (!pixiApp?.stage) return

    const feedbackContainer = pixiApp.stage.getChildByName('dragFeedback')
    if (feedbackContainer) {
      feedbackContainer.removeChildren()
    }
    console.log('🧹 Feedback PixiJS nettoyé')
  }, [pixiApp])

  // Gérer le dragover avec feedback visuel
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'

    if (!isDragging) return

    // 🎯 Détecter le panel survolé
    const newHoveredPanelId = detectHoveredPanel(event.clientX, event.clientY)

    if (newHoveredPanelId !== hoveredPanelId) {
      setHoveredPanelId(newHoveredPanelId)

      if (newHoveredPanelId) {
        const hasImage = panelHasImage(newHoveredPanelId)
        console.log('🎯 Panel survolé:', newHoveredPanelId, hasImage ? '(remplacer)' : '(ajouter)')

        // 🎯 CRÉER LE FEEDBACK DANS PIXI.JS
        createDragFeedback(newHoveredPanelId, hasImage)
      } else {
        // 🧹 NETTOYER LE FEEDBACK
        clearDragFeedback()
      }
    }
  }, [isDragging, hoveredPanelId, detectHoveredPanel, panelHasImage])

  // Gérer le dragenter
  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(true)
  }, [])

  // Gérer le dragleave
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const { clientX, clientY } = event
    const isOutside = clientX < rect.left || clientX > rect.right ||
                     clientY < rect.top || clientY > rect.bottom

    if (isOutside) {
      setIsDragging(false)
      setHoveredPanelId(null)
      clearDragFeedback() // 🧹 Nettoyer le feedback PixiJS
    }
  }, [])

  // Gestionnaire de zoom avec molette (utilise useEffect pour éviter les event listeners passifs)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()

      const delta = e.deltaY > 0 ? -0.1 : 0.1
      const newScale = Math.max(0.1, Math.min(3, canvasTransform.scale + delta))

      setCanvasTransform(prev => ({
        ...prev,
        scale: newScale
      }))

      setZoom(Math.round(newScale * 100))
    }

    // Ajouter l'event listener avec { passive: false } pour permettre preventDefault
    container.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      container.removeEventListener('wheel', handleWheel)
    }
  }, [canvasTransform.scale, setZoom])

  // Gestionnaire de déplacement (pan)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 1) return // Seulement bouton du milieu
    
    e.preventDefault()
    const startX = e.clientX - canvasTransform.x
    const startY = e.clientY - canvasTransform.y

    const handleMouseMove = (e: MouseEvent) => {
      setCanvasTransform(prev => ({
        ...prev,
        x: e.clientX - startX,
        y: e.clientY - startY
      }))
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canvasTransform.x, canvasTransform.y])

  // Contrôles de zoom optimisés
  const handleZoomIn = () => {
    const newScale = Math.min(3, canvasTransform.scale + 0.2)
    setCanvasTransform(prev => ({ ...prev, scale: newScale }))
    setZoom(Math.round(newScale * 100))
  }

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, canvasTransform.scale - 0.2)
    setCanvasTransform(prev => ({ ...prev, scale: newScale }))
    setZoom(Math.round(newScale * 100))
  }

  const handleResetView = () => {
    setCanvasTransform({ x: 0, y: 0, scale: 1 })
    setZoom(100)
  }

  // Gestionnaire de clic optimisé selon l'outil actif
  const handleCanvasClick = useCallback((x: number, y: number) => {
    switch (activeTool) {
      case 'panel':
        // L'outil panel gère le clic-glisser dans PixiApplication
        break
      case 'dialogue':
        // Placer une bulle de dialogue
        // TODO: Implémenter le placement de bulle
        break
      default:
        // Outil de sélection ou autres
        onCanvasClick?.(x, y)
        break
    }
  }, [activeTool, onCanvasClick])

  // Gestionnaire de clic sur élément personnalisé
  const handleElementClick = useCallback((element: AssemblyElement | null) => {
    onElementClick?.(element)
  }, [onElementClick])

  return (
    <div
      ref={containerRef}
      className={`h-full relative overflow-hidden bg-dark-600 ${className}`}
      onMouseDown={handleMouseDown}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      style={{ cursor: getCursorForTool(activeTool) }}
    >
      {/* Contrôles de vue - Position fixe en bas à gauche */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2">
        <div className="bg-dark-800/90 backdrop-blur-sm rounded-lg p-2 flex items-center space-x-1">
          <button
            onClick={handleZoomOut}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Zoom arrière"
          >
            <ZoomOut size={16} />
          </button>
          
          <span className="text-sm text-gray-300 min-w-[3rem] text-center">
            {zoom}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Zoom avant"
          >
            <ZoomIn size={16} />
          </button>
          
          <div className="w-px h-6 bg-dark-600 mx-1" />
          
          <button
            onClick={handleResetView}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
            title="Réinitialiser la vue"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Zone de canvas - Centrée et transformable */}
      <div className="h-full flex items-center justify-center p-8 relative">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden transition-transform duration-200"
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: 'center'
          }}
        >
          <PixiApplication
            width={width}
            height={height}
            onElementClick={handleElementClick}
            onCanvasClick={handleCanvasClick}
            onBubbleDoubleClick={onBubbleDoubleClick}
            onBubbleRightClick={onBubbleRightClick}
            canvasTransform={canvasTransform}
            className="block"
          />
        </div>

        {/* 🎯 Feedback visuel maintenant géré dans PixiJS - Plus de problème de positionnement ! */}
      </div>

      {/* Indicateur de position (développement) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 left-4 bg-black/50 text-white text-xs p-2 rounded">
          <div>X: {Math.round(canvasTransform.x)}</div>
          <div>Y: {Math.round(canvasTransform.y)}</div>
          <div>Scale: {canvasTransform.scale.toFixed(2)}</div>
          <div>Zoom: {zoom}%</div>
        </div>
      )}
    </div>
  )
}

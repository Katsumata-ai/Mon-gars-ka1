'use client'

// KonvaApplication - Remplacement unifié de PixiApplication avec Konva.js
// Préserve TOUTE la logique existante : outils, événements, manipulation

import React, { useRef, useEffect, useCallback, useState } from 'react'
import Konva from 'konva'
import { Stage, Layer, Group, Line, Rect } from 'react-konva'
import { useCanvasContext } from '../context/CanvasContext'
import { AssemblyElement, PanelElement, DialogueElement } from '../types/assembly.types'
import { KonvaPanelTool } from '../tools/KonvaPanelTool'
import { KonvaSpeechBubbleTool } from '../tools/KonvaSpeechBubbleTool'
import { SelectTool } from '../tools/SelectTool'
import { BubbleTool } from '../tools/BubbleTool'
import KonvaPanel from '../objects/KonvaPanel'
import KonvaSpeechBubble from '../objects/KonvaSpeechBubble'
import KonvaSpeechBubbleUnified from '../objects/KonvaSpeechBubbleUnified'
// ✅ SUPPRIMÉ : KonvaInPlaceEditor remplacé par système unifié
import KonvaBubble from '../objects/KonvaBubble'

interface KonvaApplicationProps {
  width?: number
  height?: number
  className?: string
  onElementClick?: (element: AssemblyElement) => void
  onCanvasClick?: (x: number, y: number) => void
  onBubbleDoubleClick?: (element: DialogueElement, position: { x: number; y: number }) => void
  onBubbleRightClick?: (element: DialogueElement, position: { x: number; y: number }) => void
  canvasTransform?: { x: number; y: number; scale: number }
}

export default function KonvaApplication({
  width = 1200,
  height = 800,
  className = '',
  onElementClick,
  onCanvasClick,
  onBubbleDoubleClick,
  onBubbleRightClick,
  canvasTransform = { x: 0, y: 0, scale: 1 }
}: KonvaApplicationProps) {
  const stageRef = useRef<Konva.Stage>(null)
  const layerRef = useRef<Konva.Layer>(null)
  const selectionLayerRef = useRef<Konva.Layer>(null)
  
  // ✅ PRÉSERVATION COMPLÈTE : Même contexte que PixiJS
  const {
    elements,
    selectedElementIds,
    activeTool,
    setActiveTool,
    showGrid,
    gridSize,
    zoom,
    addElement,
    selectElement,
    updateElement,
    clearSelection,
    panelContentService,
    ui,
    placeBubbleAtPosition,
    cancelBubblePlacement,
    startBubblePlacement
  } = useCanvasContext()

  // ✅ SYSTÈME KONVA UNIFIÉ : Tous les outils en Konva natif
  const [panelTool] = useState(() => new KonvaPanelTool((panel: PanelElement) => {
    addElement(panel)
  }))

  const [speechBubbleTool] = useState(() => new KonvaSpeechBubbleTool((bubble: DialogueElement) => {
    addElement(bubble)
  }))

  const [selectTool] = useState(() => new SelectTool(
    selectElement,
    updateElement,
    panelContentService
  ))
  
  const [bubbleTool] = useState(() => new BubbleTool())

  // ✅ CORRECTION : État de création de panels avec drag
  const [isCreatingPanel, setIsCreatingPanel] = useState(false)
  const [panelStartPos, setPanelStartPos] = useState<{ x: number; y: number } | null>(null)
  const [currentPanelPreview, setCurrentPanelPreview] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // ✅ NOUVEAU : État d'édition TipTap pour bulles Konva
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null)

  // ✅ PRÉSERVATION COMPLÈTE : Filtrage des éléments par type
  const panelElements = elements.filter((el): el is PanelElement => 
    el.type === 'panel' && el.layerType === 'panels'
  )
  
  const bubbleElements = elements.filter((el): el is DialogueElement => 
    el.type === 'dialogue' && el.layerType === 'dialogue'
  )

  // ✅ CORRECTION : Logique PanelTool avec DRAG détection
  const handlePanelToolMouseDown = useCallback((x: number, y: number) => {
    console.log('🎯 PanelTool: Démarrage création (mousedown)', { x, y })
    setIsCreatingPanel(true)
    setIsDragging(false)
    setPanelStartPos({ x, y })
    setCurrentPanelPreview({ x, y, width: 0, height: 0 })
    panelTool.updateElements(elements)
    panelTool.startCreation(x, y, stageRef.current)
  }, [panelTool, elements])

  const handlePanelToolMouseMove = useCallback((x: number, y: number) => {
    if (isCreatingPanel && panelStartPos) {
      setIsDragging(true) // ✅ DÉTECTION DU DRAG

      const width = Math.abs(x - panelStartPos.x)
      const height = Math.abs(y - panelStartPos.y)
      const previewX = Math.min(x, panelStartPos.x)
      const previewY = Math.min(y, panelStartPos.y)

      console.log('🔄 PanelTool: Drag en cours', { x, y, width, height })

      setCurrentPanelPreview({ x: previewX, y: previewY, width, height })
      panelTool.updateCreation(x, y)
    }
  }, [isCreatingPanel, panelStartPos, panelTool])

  const handlePanelToolMouseUp = useCallback((x: number, y: number) => {
    if (isCreatingPanel && panelStartPos) {
      console.log('🎯 PanelTool: Fin création (mouseup)', { x, y, start: panelStartPos, isDragging })

      // Calculer les dimensions
      let width = Math.abs(x - panelStartPos.x)
      let height = Math.abs(y - panelStartPos.y)
      let finalX = Math.min(x, panelStartPos.x)
      let finalY = Math.min(y, panelStartPos.y)

      // ✅ CORRECTION : Logique permissive comme PixiJS
      if (!isDragging || width < 5 || height < 5) {
        console.log('🎯 Création panel par défaut (clic simple ou petit drag)')
        // Panel par défaut 100x100 à la position du clic
        width = 100
        height = 100
        finalX = panelStartPos.x
        finalY = panelStartPos.y
      }

      console.log('📏 Dimensions finales:', { width, height, x: finalX, y: finalY })

      // ✅ TOUJOURS créer le panel - jamais d'annulation !
      panelTool.updateCreation(finalX + width, finalY + height)
      const panel = panelTool.finishCreation(stageRef.current)

      if (panel) {
        console.log('✅ Panel créé avec succès:', panel)
        // Forcer la mise à jour des dimensions si nécessaire
        if (width === 100 && height === 100) {
          updateElement(panel.id, {
            transform: {
              ...panel.transform,
              x: finalX,
              y: finalY,
              width: 100,
              height: 100
            }
          })
        }
      }

      // Nettoyer l'état
      setIsCreatingPanel(false)
      setIsDragging(false)
      setPanelStartPos(null)
      setCurrentPanelPreview(null)
    }
  }, [isCreatingPanel, panelStartPos, isDragging, panelTool, updateElement])

  // ✅ SYSTÈME KONVA UNIFIÉ : Logique SpeechBubbleTool native
  const handleBubbleToolClick = useCallback((x: number, y: number) => {
    if (ui.bubblePlacementMode && ui.bubbleTypeToPlace) {
      console.log('💬 Création bulle Konva unifiée:', { x, y, type: ui.bubbleTypeToPlace })

      // Définir le type de bulle et créer avec l'outil Konva
      speechBubbleTool.setBubbleType(ui.bubbleTypeToPlace)
      const bubble = speechBubbleTool.placeBubble(x, y, stageRef.current)

      if (bubble) {
        // Sélectionner automatiquement la bulle créée
        selectElement(bubble.id)

        // Sortir du mode placement
        setActiveTool('select')
        cancelBubblePlacement()
      }
    }
  }, [ui.bubblePlacementMode, ui.bubbleTypeToPlace, speechBubbleTool, selectElement, setActiveTool, cancelBubblePlacement])

  // ✅ NOUVEAU : Gestionnaire d'édition TipTap pour bulles
  const handleStartBubbleEdit = useCallback((bubbleId: string) => {
    console.log('✏️ KonvaApplication: Démarrage édition bulle:', bubbleId)
    setEditingBubbleId(bubbleId)
  }, [])

  const handleCloseBubbleEdit = useCallback(() => {
    console.log('✏️ KonvaApplication: Fermeture édition bulle')
    setEditingBubbleId(null)
  }, [])

  // ✅ RECRÉATION FIDÈLE : Logique SelectTool EXACTEMENT comme PixiJS
  const handleSelectToolClick = useCallback((x: number, y: number, e: any) => {
    // Utiliser TOUS les éléments comme dans PixiJS (panels + bulles + images)
    if (e.evt.type === 'mousedown') {
      selectTool.handlePointerDown(x, y, elements)
    }
  }, [selectTool, elements])

  // ✅ CORRECTION : Gestionnaires séparés pour mousedown et mouseup
  const handleStageMouseDown = useCallback((e: any) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const { x, y } = pos

    console.log('🎯 KonvaApplication - MouseDown détecté:', { x, y, activeTool })

    switch (activeTool) {
      case 'panel':
        handlePanelToolMouseDown(x, y)
        break
      case 'dialogue':
        handleBubbleToolClick(x, y)
        break
      case 'select':
      default:
        handleSelectToolClick(x, y, e)
        break
    }

    onCanvasClick?.(x, y)
  }, [activeTool, onCanvasClick, handlePanelToolMouseDown, handleBubbleToolClick, handleSelectToolClick])

  const handleStageMouseUp = useCallback((e: any) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const { x, y } = pos

    console.log('🎯 KonvaApplication - MouseUp détecté:', { x, y, activeTool })

    switch (activeTool) {
      case 'panel':
        handlePanelToolMouseUp(x, y)
        break
      // Les autres outils n'ont pas besoin de mouseup
    }
  }, [activeTool, handlePanelToolMouseUp])

  // ✅ CORRECTION : Gestion du mouvement de souris avec Panel drag
  const handleStageMouseMove = useCallback((e: any) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const { x, y } = pos

    // Gestion spécifique par outil
    switch (activeTool) {
      case 'panel':
        handlePanelToolMouseMove(x, y)
        break
      case 'select':
        // ✅ CORRECTION : Inclure TOUTES les bulles Konva (plus de filtrage HTML)
        selectTool.handlePointerMove(x, y, elements)
        break
    }
  }, [activeTool, handlePanelToolMouseMove, selectTool, elements])

  // ✅ PRÉSERVATION COMPLÈTE : Gestion de la grille
  const renderGrid = useCallback(() => {
    if (!showGrid || !layerRef.current) return null

    const lines = []
    const stage = stageRef.current
    if (!stage) return null

    const stageWidth = stage.width()
    const stageHeight = stage.height()

    // Lignes verticales
    for (let i = 0; i <= stageWidth; i += gridSize) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i, 0, i, stageHeight]}
          stroke="#ddd"
          strokeWidth={1}
          opacity={0.5}
        />
      )
    }

    // Lignes horizontales
    for (let i = 0; i <= stageHeight; i += gridSize) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i, stageWidth, i]}
          stroke="#ddd"
          strokeWidth={1}
          opacity={0.5}
        />
      )
    }

    return lines
  }, [showGrid, gridSize])

  // ✅ PRÉSERVATION COMPLÈTE : Nettoyage des outils
  useEffect(() => {
    return () => {
      panelTool.destroy()
      selectTool.destroy()
      bubbleTool.destroy()
    }
  }, [panelTool, selectTool, bubbleTool])

  return (
    <div className={`konva-application ${className}`}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
        scaleX={canvasTransform.scale}
        scaleY={canvasTransform.scale}
        x={canvasTransform.x}
        y={canvasTransform.y}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
        onMouseMove={handleStageMouseMove}
      >
        {/* Couche principale */}
        <Layer ref={layerRef}>
          {/* ✅ GRILLE PRÉSERVÉE */}
          {renderGrid()}
          
          {/* ✅ PANELS KONVA - Logique préservée */}
          {panelElements.map(panel => (
            <KonvaPanel
              key={panel.id}
              element={panel}
              isSelected={selectedElementIds.includes(panel.id)}
              onSelect={selectElement}
              onUpdate={updateElement}
            />
          ))}
          
          {/* ✅ BULLES KONVA UNIFIÉES - Nouveau système unifié avec édition native */}
          {bubbleElements.map(bubble => (
            <KonvaSpeechBubbleUnified
              key={bubble.id}
              element={bubble}
              isSelected={selectedElementIds.includes(bubble.id)}
              isEditing={editingBubbleId === bubble.id}
              onSelect={selectElement}
              onUpdate={updateElement}
              onStartEdit={handleStartBubbleEdit}
              onFinishEdit={handleCloseBubbleEdit}
            />
          ))}
          
          {/* ✅ PRÉVISUALISATION PANEL */}
          {currentPanelPreview && (
            <Rect
              x={currentPanelPreview.x}
              y={currentPanelPreview.y}
              width={currentPanelPreview.width}
              height={currentPanelPreview.height}
              stroke="#3b82f6"
              strokeWidth={2}
              dash={[5, 5]}
              fill="rgba(59, 130, 246, 0.1)"
            />
          )}
        </Layer>
        
        {/* Couche de sélection */}
        <Layer ref={selectionLayerRef}>
          {/* Les cadres de sélection seront rendus ici */}
        </Layer>
      </Stage>

      {/* ✅ SYSTÈME UNIFIÉ : Édition intégrée directement dans KonvaSpeechBubbleUnified */}
    </div>
  )
}

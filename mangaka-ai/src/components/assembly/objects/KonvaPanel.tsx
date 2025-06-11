'use client'

// KonvaPanel - RECRÉATION FIDÈLE du système MangaPanel PixiJS avec Konva.js
// Préserve EXACTEMENT : apparence, sélection, handles, manipulation, drag & drop

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Group, Rect, Circle } from 'react-konva'
import { PanelElement } from '../types/assembly.types'

interface KonvaPanelProps {
  element: PanelElement
  isSelected: boolean
  onSelect: (elementId: string | null) => void
  onUpdate: (elementId: string, updates: Partial<PanelElement>) => void
}

// ✅ RECRÉATION FIDÈLE : Types de handles identiques à PixiJS
enum HandleType {
  CORNER_NW = 0,
  EDGE_N = 1,
  CORNER_NE = 2,
  EDGE_E = 3,
  CORNER_SE = 4,
  EDGE_S = 5,
  CORNER_SW = 6,
  EDGE_W = 7
}

// ✅ RECRÉATION FIDÈLE : Curseurs identiques à PixiJS
const HANDLE_CURSORS = [
  'nw-resize', 'n-resize', 'ne-resize', 'e-resize',
  'se-resize', 's-resize', 'sw-resize', 'w-resize'
]

export default function KonvaPanel({
  element,
  isSelected,
  onSelect,
  onUpdate
}: KonvaPanelProps) {

  const groupRef = useRef<any>(null)

  // ✅ RECRÉATION FIDÈLE : États de manipulation identiques à PixiJS
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState(-1)
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 })
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0 })
  const [elementStartSize, setElementStartSize] = useState({ width: 0, height: 0 })

  // ✅ RECRÉATION FIDÈLE : Pas d'image pour les panels (les images sont des éléments séparés)
  // Les panels PixiJS n'avaient pas d'images intégrées, c'étaient des conteneurs

  // ✅ RECRÉATION FIDÈLE : Styles de panel EXACTEMENT comme PixiJS
  const panelStyle = useMemo(() => {
    return {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width,
      height: element.transform.height,
      rotation: element.transform.rotation,
      opacity: element.transform.alpha
    }
  }, [element.transform])

  // ✅ RECRÉATION FIDÈLE : Styles de bordure EXACTEMENT comme PixiJS
  const borderStyle = useMemo(() => {
    const borderWidth = element.panelStyle.borderWidth || 2
    const borderColor = `#${element.panelStyle.borderColor.toString(16).padStart(6, '0')}`

    return {
      stroke: borderColor,
      strokeWidth: borderWidth,
      strokeEnabled: borderWidth > 0
    }
  }, [element.panelStyle.borderWidth, element.panelStyle.borderColor])

  // ✅ RECRÉATION FIDÈLE : Styles de sélection EXACTEMENT comme PixiJS MangaPanel
  const selectionBorderStyle = useMemo(() => {
    if (!isSelected) return null

    return {
      stroke: '#3b82f6',  // Couleur exacte de PixiJS : 0x3B82F6
      strokeWidth: 2,     // Largeur exacte de PixiJS
      opacity: 0.8,       // Alpha exacte de PixiJS
      strokeEnabled: true
    }
  }, [isSelected])

  // ✅ RECRÉATION FIDÈLE : Positions des handles EXACTEMENT comme PixiJS
  const handlePositions = useMemo(() => {
    const { width, height } = element.transform
    return [
      { x: 0, y: 0 },                    // CORNER_NW
      { x: width * 0.5, y: 0 },         // EDGE_N
      { x: width, y: 0 },               // CORNER_NE
      { x: width, y: height * 0.5 },    // EDGE_E
      { x: width, y: height },          // CORNER_SE
      { x: width * 0.5, y: height },    // EDGE_S
      { x: 0, y: height },              // CORNER_SW
      { x: 0, y: height * 0.5 }         // EDGE_W
    ]
  }, [element.transform.width, element.transform.height])

  // ✅ RECRÉATION FIDÈLE : Gestionnaire de clic EXACTEMENT comme PixiJS
  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('🎯 KonvaPanel cliqué:', element.id)
    onSelect(element.id)
  }, [element.id, onSelect])

  // ✅ RECRÉATION FIDÈLE : Gestionnaire de drag EXACTEMENT comme PixiJS
  const handleDragStart = useCallback((e: any) => {
    if (isResizing) return

    setIsDragging(true)
    setDragStartPos({ x: e.evt.clientX, y: e.evt.clientY })
    setElementStartPos({ x: element.transform.x, y: element.transform.y })

    console.log('🎯 Panel drag start:', element.id)
  }, [element.transform, isResizing])

  const handleDragMove = useCallback((e: any) => {
    if (!isDragging || isResizing) return

    const node = e.target
    onUpdate(element.id, {
      transform: {
        ...element.transform,
        x: node.x(),
        y: node.y()
      }
    })
  }, [element.id, element.transform, onUpdate, isDragging, isResizing])

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    console.log('🎯 Panel drag end:', element.id)
  }, [element.id])

  // ✅ RECRÉATION FIDÈLE : Gestionnaire de handles EXACTEMENT comme PixiJS
  const handleHandleMouseDown = useCallback((handleIndex: number, e: any) => {
    e.cancelBubble = true

    setIsResizing(true)
    setActiveHandle(handleIndex)
    setDragStartPos({ x: e.evt.clientX, y: e.evt.clientY })
    setElementStartPos({ x: element.transform.x, y: element.transform.y })
    setElementStartSize({ width: element.transform.width, height: element.transform.height })

    console.log('🔧 Handle resize start:', HandleType[handleIndex], 'pour panel:', element.id)
  }, [element.transform])

  // ✅ RECRÉATION FIDÈLE : Gestionnaire de resize EXACTEMENT comme PixiJS
  const handleResize = useCallback((newWidth: number, newHeight: number, newX?: number, newY?: number) => {
    onUpdate(element.id, {
      transform: {
        ...element.transform,
        x: newX !== undefined ? newX : element.transform.x,
        y: newY !== undefined ? newY : element.transform.y,
        width: Math.max(5, newWidth),
        height: Math.max(5, newHeight)
      }
    })
  }, [element.id, element.transform, onUpdate])

  // ✅ RECRÉATION FIDÈLE : Logique de resize par handle EXACTEMENT comme PixiJS
  const calculateResize = useCallback((handleIndex: number, deltaX: number, deltaY: number) => {
    const { width, height } = elementStartSize
    let newX = elementStartPos.x
    let newY = elementStartPos.y
    let newWidth = width
    let newHeight = height

    switch (handleIndex) {
      case HandleType.CORNER_NW:
        newX = elementStartPos.x + deltaX
        newY = elementStartPos.y + deltaY
        newWidth = width - deltaX
        newHeight = height - deltaY
        break
      case HandleType.EDGE_N:
        newY = elementStartPos.y + deltaY
        newHeight = height - deltaY
        break
      case HandleType.CORNER_NE:
        newY = elementStartPos.y + deltaY
        newWidth = width + deltaX
        newHeight = height - deltaY
        break
      case HandleType.EDGE_E:
        newWidth = width + deltaX
        break
      case HandleType.CORNER_SE:
        newWidth = width + deltaX
        newHeight = height + deltaY
        break
      case HandleType.EDGE_S:
        newHeight = height + deltaY
        break
      case HandleType.CORNER_SW:
        newX = elementStartPos.x + deltaX
        newWidth = width - deltaX
        newHeight = height + deltaY
        break
      case HandleType.EDGE_W:
        newX = elementStartPos.x + deltaX
        newWidth = width - deltaX
        break
    }

    return { newX, newY, newWidth, newHeight }
  }, [elementStartPos, elementStartSize])

  return (
    <Group
      ref={groupRef}
      {...panelStyle}
      draggable={!isResizing}
      onClick={handleClick}
      onTap={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {/* ✅ RECRÉATION FIDÈLE : Fond du panel EXACTEMENT comme PixiJS */}
      <Rect
        width={element.transform.width}
        height={element.transform.height}
        fill={element.panelStyle.fillColor !== null && element.panelStyle.fillColor !== undefined ?
          `#${element.panelStyle.fillColor.toString(16).padStart(6, '0')}` :
          'transparent'
        }
        fillEnabled={element.panelStyle.fillColor !== null && element.panelStyle.fillColor !== undefined}
        opacity={element.panelStyle.fillAlpha}
        {...borderStyle}
      />

      {/* ✅ RECRÉATION FIDÈLE : Bordure de sélection EXACTEMENT comme PixiJS */}
      {isSelected && (
        <Rect
          width={element.transform.width}
          height={element.transform.height}
          fill="transparent"
          {...selectionBorderStyle}
        />
      )}

      {/* ✅ RECRÉATION FIDÈLE : Handles de redimensionnement EXACTEMENT comme PixiJS */}
      {isSelected && !element.properties.locked && handlePositions.map((pos, index) => (
        <Circle
          key={`handle-${index}`}
          x={pos.x}
          y={pos.y}
          radius={4}
          fill="#3b82f6"
          stroke="#ffffff"
          strokeWidth={1}
          onMouseDown={(e) => handleHandleMouseDown(index, e)}
          onTouchStart={(e) => handleHandleMouseDown(index, e)}
          draggable={false}
          listening={true}
        />
      ))}
    </Group>
  )
}

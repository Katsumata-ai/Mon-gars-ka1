'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { DialogueElement } from '../types/assembly.types'
import { cn } from '@/lib/utils'

interface BubbleManipulatorProps {
  element: DialogueElement
  isSelected: boolean
  onResize: (size: { width: number, height: number }) => void
  onTailMove: (position: { x: number, y: number }) => void
  onStartEdit: () => void
  className?: string
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'
type DragState = {
  isDragging: boolean
  handle?: ResizeHandle
  startPos: { x: number, y: number }
  startSize: { width: number, height: number }
  startTailPos?: { x: number, y: number }
}

export default function BubbleManipulator({
  element,
  isSelected,
  onResize,
  onTailMove,
  onStartEdit,
  className
}: BubbleManipulatorProps) {
  const [dragState, setDragState] = useState<DragState>({ isDragging: false })
  const [isHovering, setIsHovering] = useState(false)
  const manipulatorRef = useRef<HTMLDivElement>(null)

  // ✅ CONTRAINTES DE REDIMENSIONNEMENT INTELLIGENTES
  const constraints = {
    minWidth: 80,
    minHeight: 50,
    maxWidth: 400,
    maxHeight: 250,
    aspectRatio: element.bubbleStyle.type === 'thought' ? 1 : undefined // Cercle pour pensées
  }

  // ✅ CALCUL DE LA POSITION DE LA QUEUE
  const getTailPosition = useCallback(() => {
    const { width, height } = element.transform
    const tailPercent = element.bubbleStyle.tailPositionPercent || 0.25
    
    // Position par défaut selon tailPosition
    switch (element.bubbleStyle.tailPosition) {
      case 'bottom-left':
        return { x: width * tailPercent, y: height }
      case 'bottom-right':
        return { x: width * (1 - tailPercent), y: height }
      case 'top-left':
        return { x: width * tailPercent, y: 0 }
      case 'top-right':
        return { x: width * (1 - tailPercent), y: 0 }
      default:
        return { x: width * tailPercent, y: height }
    }
  }, [element])

  // ✅ GESTIONNAIRE DE REDIMENSIONNEMENT
  const handleResizeStart = useCallback((handle: ResizeHandle, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setDragState({
      isDragging: true,
      handle,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { width: element.transform.width, height: element.transform.height }
    })
  }, [element])

  // ✅ GESTIONNAIRE DE DÉPLACEMENT DE QUEUE
  const handleTailStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const tailPos = getTailPosition()
    setDragState({
      isDragging: true,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { width: element.transform.width, height: element.transform.height },
      startTailPos: tailPos
    })
  }, [element, getTailPosition])

  // ✅ GESTIONNAIRE DE MOUVEMENT GLOBAL
  useEffect(() => {
    if (!dragState.isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startPos.x
      const deltaY = e.clientY - dragState.startPos.y

      if (dragState.handle) {
        // Redimensionnement
        let newWidth = dragState.startSize.width
        let newHeight = dragState.startSize.height

        // Calculer les nouvelles dimensions selon le handle
        switch (dragState.handle) {
          case 'e':
          case 'ne':
          case 'se':
            newWidth = dragState.startSize.width + deltaX
            break
          case 'w':
          case 'nw':
          case 'sw':
            newWidth = dragState.startSize.width - deltaX
            break
        }

        switch (dragState.handle) {
          case 's':
          case 'se':
          case 'sw':
            newHeight = dragState.startSize.height + deltaY
            break
          case 'n':
          case 'ne':
          case 'nw':
            newHeight = dragState.startSize.height - deltaY
            break
        }

        // Appliquer les contraintes
        newWidth = Math.max(constraints.minWidth, Math.min(constraints.maxWidth, newWidth))
        newHeight = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, newHeight))

        // Maintenir le ratio pour les bulles de pensée
        if (constraints.aspectRatio) {
          const avgSize = (newWidth + newHeight) / 2
          newWidth = newHeight = avgSize
        }

        onResize({ width: Math.round(newWidth), height: Math.round(newHeight) })

      } else if (dragState.startTailPos) {
        // Déplacement de queue
        const newTailX = dragState.startTailPos.x + deltaX
        const newTailY = dragState.startTailPos.y + deltaY
        onTailMove({ x: newTailX, y: newTailY })
      }
    }

    const handleMouseUp = () => {
      setDragState({ isDragging: false })
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState, onResize, onTailMove, constraints])

  // ✅ GESTIONNAIRE DOUBLE-CLIC POUR ÉDITION
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onStartEdit()
  }, [onStartEdit])

  if (!isSelected) return null

  const { width, height } = element.transform
  const tailPos = getTailPosition()

  // ✅ POSITIONS DES HANDLES DE REDIMENSIONNEMENT
  const handles: Array<{ handle: ResizeHandle, x: number, y: number, cursor: string }> = [
    { handle: 'nw', x: -4, y: -4, cursor: 'nw-resize' },
    { handle: 'n', x: width / 2 - 4, y: -4, cursor: 'n-resize' },
    { handle: 'ne', x: width - 4, y: -4, cursor: 'ne-resize' },
    { handle: 'e', x: width - 4, y: height / 2 - 4, cursor: 'e-resize' },
    { handle: 'se', x: width - 4, y: height - 4, cursor: 'se-resize' },
    { handle: 's', x: width / 2 - 4, y: height - 4, cursor: 's-resize' },
    { handle: 'sw', x: -4, y: height - 4, cursor: 'sw-resize' },
    { handle: 'w', x: -4, y: height / 2 - 4, cursor: 'w-resize' }
  ]

  return (
    <div
      ref={manipulatorRef}
      className={cn(
        'absolute pointer-events-none',
        className
      )}
      style={{
        left: element.transform.x,
        top: element.transform.y,
        width,
        height
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* ✅ CONTOUR DE SÉLECTION */}
      <div 
        className={cn(
          'absolute inset-0 border-2 border-primary-500 rounded-lg',
          'transition-all duration-200',
          isHovering ? 'border-primary-600 shadow-lg' : '',
          dragState.isDragging ? 'border-primary-700' : ''
        )}
        style={{
          pointerEvents: 'auto',
          cursor: 'move'
        }}
      />

      {/* ✅ HANDLES DE REDIMENSIONNEMENT */}
      {handles.map(({ handle, x, y, cursor }) => (
        <div
          key={handle}
          className={cn(
            'absolute w-3 h-3 bg-white border-2 border-primary-500 rounded-sm',
            'hover:bg-primary-50 hover:border-primary-600',
            'transition-all duration-150',
            'shadow-sm'
          )}
          style={{
            left: x,
            top: y,
            cursor,
            pointerEvents: 'auto'
          }}
          onMouseDown={(e) => handleResizeStart(handle, e)}
        />
      ))}

      {/* ✅ HANDLE DE QUEUE DRAGGABLE */}
      <div
        className={cn(
          'absolute w-4 h-4 bg-orange-400 border-2 border-white rounded-full',
          'hover:bg-orange-500 hover:scale-110',
          'transition-all duration-150',
          'shadow-md cursor-move'
        )}
        style={{
          left: tailPos.x - 8,
          top: tailPos.y - 8,
          pointerEvents: 'auto'
        }}
        onMouseDown={handleTailStart}
        title="Déplacer la queue de la bulle"
      />

      {/* ✅ LIGNE DE CONNEXION QUEUE */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width, height }}
      >
        <line
          x1={width / 2}
          y1={height / 2}
          x2={tailPos.x}
          y2={tailPos.y}
          stroke="#f97316"
          strokeWidth="2"
          strokeDasharray="4,4"
          opacity="0.6"
        />
      </svg>

      {/* ✅ TOOLTIP INFORMATIF */}
      {isHovering && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          Double-clic pour éditer • Drag pour redimensionner
        </div>
      )}
    </div>
  )
}

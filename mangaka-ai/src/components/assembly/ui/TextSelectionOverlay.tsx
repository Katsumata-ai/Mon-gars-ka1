'use client'

// TextSelectionOverlay - Overlay de sélection pour les textes libres
// Gère la sélection visuelle et les handles de redimensionnement

import React, { useState, useEffect, useCallback } from 'react'

interface TextBounds {
  left: number
  top: number
  width: number
  height: number
}

interface TextSelectionOverlayProps {
  selectedTextId: string | null
  onDragStart?: (textId: string, startX: number, startY: number) => void
  onDrag?: (textId: string, deltaX: number, deltaY: number) => void
  onDragEnd?: (textId: string) => void
  onResizeStart?: (textId: string, handle: string, startX: number, startY: number) => void
  onResize?: (textId: string, handle: string, deltaX: number, deltaY: number) => void
  onResizeEnd?: (textId: string) => void
  onDoubleClick?: (textId: string) => void
}

export default function TextSelectionOverlay({
  selectedTextId,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onDoubleClick
}: TextSelectionOverlayProps) {
  const [textBounds, setTextBounds] = useState<TextBounds | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0 })

  // ✅ RÉCUPÉRER LES BOUNDS DU TEXTE SÉLECTIONNÉ
  const updateTextBounds = useCallback(() => {
    if (!selectedTextId) {
      setTextBounds(null)
      return
    }

    // Chercher d'abord l'élément par data-text-id
    let textElement = document.querySelector(`[data-text-id="${selectedTextId}"]`) as HTMLElement

    // Si pas trouvé, chercher le parent container
    if (!textElement) {
      textElement = document.querySelector(`div[style*="position: absolute"] [data-text-id="${selectedTextId}"]`)?.parentElement as HTMLElement
    }

    if (textElement) {
      const rect = textElement.getBoundingClientRect()
      console.log('🎯 TextSelectionOverlay: Bounds trouvés pour', selectedTextId, rect)
      setTextBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      })
    } else {
      console.warn('🎯 TextSelectionOverlay: Élément non trouvé pour', selectedTextId)
    }
  }, [selectedTextId])

  useEffect(() => {
    updateTextBounds()
  }, [selectedTextId, updateTextBounds])

  // ✅ METTRE À JOUR LES BOUNDS PENDANT DRAG/RESIZE
  useEffect(() => {
    if (isDragging || isResizing) {
      const interval = setInterval(updateTextBounds, 8) // 120fps pour meilleur alignement
      return () => clearInterval(interval)
    }
  }, [isDragging, isResizing, updateTextBounds])

  // ✅ ÉCOUTER LES MISES À JOUR DE POSITION DES TEXTES
  useEffect(() => {
    const handleTextPositionUpdate = (event: CustomEvent) => {
      if (event.detail.textId === selectedTextId) {
        updateTextBounds()
      }
    }

    window.addEventListener('textPositionUpdate', handleTextPositionUpdate as EventListener)
    
    return () => {
      window.removeEventListener('textPositionUpdate', handleTextPositionUpdate as EventListener)
    }
  }, [selectedTextId, updateTextBounds])

  // ✅ GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX POUR DRAG ET RESIZE
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedTextId) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onDrag?.(selectedTextId, deltaX, deltaY)
      } else if (isResizing && selectedTextId && activeHandle) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        onResize?.(selectedTextId, activeHandle, deltaX, deltaY)
      }
    }

    const handleMouseUp = () => {
      if (isDragging && selectedTextId) {
        setIsDragging(false)
        onDragEnd?.(selectedTextId)
      } else if (isResizing && selectedTextId) {
        setIsResizing(false)
        setActiveHandle(null)
        onResizeEnd?.(selectedTextId)
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, selectedTextId, activeHandle, dragStart, resizeStart, onDrag, onDragEnd, onResize, onResizeEnd])

  // ✅ GESTION DU DOUBLE-CLIC
  const handleTextMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedTextId || !textBounds) return

    e.preventDefault()
    e.stopPropagation()

    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    onDragStart?.(selectedTextId, e.clientX, e.clientY)
  }, [selectedTextId, textBounds, onDragStart])

  const handleTextDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!selectedTextId) return
    e.preventDefault()
    e.stopPropagation()
    onDoubleClick?.(selectedTextId)
  }, [selectedTextId, onDoubleClick])

  // ✅ GESTION DES HANDLES DE REDIMENSIONNEMENT
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handle: string) => {
    console.log('🎯 TextSelectionOverlay: Handle mousedown:', handle, selectedTextId)

    if (!selectedTextId) {
      console.warn('🎯 TextSelectionOverlay: Pas de selectedTextId pour handle:', handle)
      return
    }

    e.preventDefault()
    e.stopPropagation()

    console.log('🎯 TextSelectionOverlay: Démarrage resize:', { selectedTextId, handle, clientX: e.clientX, clientY: e.clientY })

    setIsResizing(true)
    setActiveHandle(handle)
    setResizeStart({ x: e.clientX, y: e.clientY })
    onResizeStart?.(selectedTextId, handle, e.clientX, e.clientY)
  }, [selectedTextId, onResizeStart])

  if (!selectedTextId || !textBounds) {
    return null
  }

  console.log('🎯 TextSelectionOverlay: Rendu des handles pour', selectedTextId, textBounds)

  const handleSize = 8
  const { left, top, width, height } = textBounds

  // ✅ HANDLES DE REDIMENSIONNEMENT
  const resizeHandles = [
    { id: 'tl', position: 'top-left', x: left - handleSize/2, y: top - handleSize/2, cursor: 'nw-resize' },
    { id: 'tr', position: 'top-right', x: left + width - handleSize/2, y: top - handleSize/2, cursor: 'ne-resize' },
    { id: 'bl', position: 'bottom-left', x: left - handleSize/2, y: top + height - handleSize/2, cursor: 'sw-resize' },
    { id: 'br', position: 'bottom-right', x: left + width - handleSize/2, y: top + height - handleSize/2, cursor: 'se-resize' },
    { id: 'tc', position: 'top-center', x: left + width/2 - handleSize/2, y: top - handleSize/2, cursor: 'n-resize' },
    { id: 'bc', position: 'bottom-center', x: left + width/2 - handleSize/2, y: top + height - handleSize/2, cursor: 's-resize' },
    { id: 'ml', position: 'middle-left', x: left - handleSize/2, y: top + height/2 - handleSize/2, cursor: 'w-resize' },
    { id: 'mr', position: 'middle-right', x: left + width - handleSize/2, y: top + height/2 - handleSize/2, cursor: 'e-resize' }
  ]

  console.log('🎯 TextSelectionOverlay: Création de', resizeHandles.length, 'handles:', resizeHandles.map(h => h.id))

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 2500 // Au-dessus des textes libres
      }}
    >
      {/* ✅ CADRE DE SÉLECTION */}
      <div
        style={{
          position: 'absolute',
          left: textBounds.left - 2,
          top: textBounds.top - 2,
          width: textBounds.width + 4,
          height: textBounds.height + 4,
          border: '2px dashed #3b82f6',
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 0 0 2px rgba(59, 130, 246, 0.3)'
        }}
        onMouseDown={handleTextMouseDown}
        onDoubleClick={handleTextDoubleClick}
      />

      {/* ✅ HANDLES DE REDIMENSIONNEMENT */}
      {resizeHandles.map(handle => (
        <div
          key={handle.id}
          style={{
            position: 'absolute',
            left: handle.x,
            top: handle.y,
            width: handleSize,
            height: handleSize,
            backgroundColor: '#3b82f6',
            border: '2px solid white',
            borderRadius: '2px',
            cursor: handle.cursor,
            pointerEvents: 'auto',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, handle.id)}
        />
      ))}
    </div>
  )
}

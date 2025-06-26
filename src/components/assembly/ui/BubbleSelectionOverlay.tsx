import React, { useEffect, useState, useCallback } from 'react'

interface BubbleSelectionOverlayProps {
  selectedBubbleId: string | null
  onDragStart?: (bubbleId: string, startX: number, startY: number) => void
  onDrag?: (bubbleId: string, deltaX: number, deltaY: number) => void
  onDragEnd?: (bubbleId: string) => void
  onResizeStart?: (bubbleId: string, handle: string, startX: number, startY: number) => void
  onResize?: (bubbleId: string, handle: string, deltaX: number, deltaY: number) => void
  onResizeEnd?: (bubbleId: string) => void
  onDoubleClick?: (bubbleId: string) => void
}

interface BubbleBounds {
  left: number
  top: number
  width: number
  height: number
}

export default function BubbleSelectionOverlay({
  selectedBubbleId,
  onDragStart,
  onDrag,
  onDragEnd,
  onResizeStart,
  onResize,
  onResizeEnd,
  onDoubleClick
}: BubbleSelectionOverlayProps) {
  const [bubbleBounds, setBubbleBounds] = useState<BubbleBounds | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [activeHandle, setActiveHandle] = useState<string | null>(null)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [clickCount, setClickCount] = useState(0)
  const [clickTimer, setClickTimer] = useState<NodeJS.Timeout | null>(null)

  // ✅ RÉCUPÉRER LES BOUNDS DE LA BULLE SÉLECTIONNÉE
  const updateBubbleBounds = useCallback(() => {
    if (!selectedBubbleId) {
      setBubbleBounds(null)
      return
    }

    const bubbleElement = document.querySelector(`[data-bubble-id="${selectedBubbleId}"]`) as HTMLElement
    if (bubbleElement) {
      const rect = bubbleElement.getBoundingClientRect()
      setBubbleBounds({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height
      })
    }
  }, [selectedBubbleId])

  useEffect(() => {
    updateBubbleBounds()
  }, [selectedBubbleId, updateBubbleBounds])

  // ✅ METTRE À JOUR LES BOUNDS PENDANT DRAG/RESIZE (PLUS FRÉQUENT)
  useEffect(() => {
    if (isDragging || isResizing) {
      const interval = setInterval(updateBubbleBounds, 8) // 120fps pour meilleur alignement
      return () => clearInterval(interval)
    }
  }, [isDragging, isResizing, updateBubbleBounds])

  // ✅ NOUVEAU : Mise à jour immédiate quand selectedBubbleId change
  useEffect(() => {
    if (selectedBubbleId) {
      updateBubbleBounds()
    }
  }, [selectedBubbleId, updateBubbleBounds])

  // ✅ ÉCOUTER LES MISES À JOUR DE POSITION DES BULLES
  useEffect(() => {
    const handleBubblePositionUpdate = (event: CustomEvent) => {
      if (event.detail.bubbleId === selectedBubbleId) {
        // Mettre à jour immédiatement les bounds
        updateBubbleBounds()
      }
    }

    window.addEventListener('bubblePositionUpdate', handleBubblePositionUpdate as EventListener)

    return () => {
      window.removeEventListener('bubblePositionUpdate', handleBubblePositionUpdate as EventListener)
    }
  }, [selectedBubbleId, updateBubbleBounds])

  // ✅ GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX POUR DRAG ET RESIZE
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && selectedBubbleId) {
        const deltaX = e.clientX - dragStart.x
        const deltaY = e.clientY - dragStart.y
        onDrag?.(selectedBubbleId, deltaX, deltaY)
      } else if (isResizing && selectedBubbleId && activeHandle) {
        const deltaX = e.clientX - resizeStart.x
        const deltaY = e.clientY - resizeStart.y
        onResize?.(selectedBubbleId, activeHandle, deltaX, deltaY)
      }
    }

    const handleMouseUp = () => {
      if (isDragging && selectedBubbleId) {
        setIsDragging(false)
        onDragEnd?.(selectedBubbleId)
        console.log('🎯 BubbleSelectionOverlay: Drag end:', selectedBubbleId)
      } else if (isResizing && selectedBubbleId) {
        setIsResizing(false)
        setActiveHandle(null)
        onResizeEnd?.(selectedBubbleId)
        console.log('🎯 BubbleSelectionOverlay: Resize end:', selectedBubbleId)
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
  }, [isDragging, isResizing, selectedBubbleId, activeHandle, dragStart, resizeStart, onDrag, onDragEnd, onResize, onResizeEnd])

  // ✅ NOUVEAU : Écouter les désélections forcées depuis l'outil main
  useEffect(() => {
    const handleForceDeselectAll = () => {
      console.log('🖐️ BubbleSelectionOverlay: Désélection forcée - arrêt manipulation')
      setIsDragging(false)
      setIsResizing(false)
      setActiveHandle(null)
    }

    window.addEventListener('forceDeselectAll', handleForceDeselectAll)

    return () => {
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll)
    }
  }, [])

  // ✅ HANDLES DE REDIMENSIONNEMENT (8 positions)
  const getResizeHandles = useCallback(() => {
    if (!bubbleBounds) return []

    const handleSize = 14
    const { left, top, width, height } = bubbleBounds

    return [
      { id: 'tl', position: 'top-left', x: left - handleSize/2, y: top - handleSize/2, cursor: 'nw-resize' },
      { id: 'tc', position: 'top-center', x: left + width/2 - handleSize/2, y: top - handleSize/2, cursor: 'n-resize' },
      { id: 'tr', position: 'top-right', x: left + width - handleSize/2, y: top - handleSize/2, cursor: 'ne-resize' },
      { id: 'ml', position: 'middle-left', x: left - handleSize/2, y: top + height/2 - handleSize/2, cursor: 'w-resize' },
      { id: 'mr', position: 'middle-right', x: left + width - handleSize/2, y: top + height/2 - handleSize/2, cursor: 'e-resize' },
      { id: 'bl', position: 'bottom-left', x: left - handleSize/2, y: top + height - handleSize/2, cursor: 'sw-resize' },
      { id: 'bc', position: 'bottom-center', x: left + width/2 - handleSize/2, y: top + height - handleSize/2, cursor: 's-resize' },
      { id: 'br', position: 'bottom-right', x: left + width - handleSize/2, y: top + height - handleSize/2, cursor: 'se-resize' }
    ]
  }, [bubbleBounds])

  // ✅ GESTION DU DOUBLE-CLIC SIMPLIFIÉE
  const handleBubbleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!selectedBubbleId || !bubbleBounds) return

    e.preventDefault()
    e.stopPropagation()

    // Commencer le drag immédiatement
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    onDragStart?.(selectedBubbleId, e.clientX, e.clientY)
    console.log('🎯 BubbleSelectionOverlay: Drag start:', selectedBubbleId)
  }, [selectedBubbleId, bubbleBounds, onDragStart])

  // ✅ GESTION DU DOUBLE-CLIC NATIF
  const handleBubbleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!selectedBubbleId) return

    e.preventDefault()
    e.stopPropagation()

    // Arrêter tout drag en cours
    setIsDragging(false)

    // Déclencher le mode édition
    onDoubleClick?.(selectedBubbleId)
    console.log('🎯 BubbleSelectionOverlay: Double-click detected:', selectedBubbleId)
  }, [selectedBubbleId, onDoubleClick])

  // ✅ SUPPRIMÉ : Fonction redondante

  // ✅ GESTION DU RESIZE VIA HANDLES
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, handleId: string) => {
    if (!selectedBubbleId || !bubbleBounds) return

    e.preventDefault()
    e.stopPropagation()

    setIsResizing(true)
    setActiveHandle(handleId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: bubbleBounds.width,
      height: bubbleBounds.height
    })
    onResizeStart?.(selectedBubbleId, handleId, e.clientX, e.clientY)
    console.log('🎯 BubbleSelectionOverlay: Resize start:', selectedBubbleId, handleId)
  }, [selectedBubbleId, bubbleBounds, onResizeStart])

  // ✅ RENDU CONDITIONNEL
  if (!selectedBubbleId || !bubbleBounds) {
    return null
  }

  const handles = getResizeHandles()

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 3500 // ✅ CORRIGÉ : Au-dessus des bulles (3000) mais sous les modals (9999+)
      }}
    >
      {/* ✅ CADRE DE SÉLECTION BLEU */}
      <div
        style={{
          position: 'absolute',
          left: bubbleBounds.left - 2,
          top: bubbleBounds.top - 2,
          width: bubbleBounds.width + 4,
          height: bubbleBounds.height + 4,
          border: '2px dashed #007bff',
          pointerEvents: 'auto',
          cursor: isDragging ? 'grabbing' : 'grab',
          boxShadow: '0 0 0 2px rgba(0, 123, 255, 0.3)'
        }}
        onMouseDown={handleBubbleMouseDown}
        onDoubleClick={handleBubbleDoubleClick}
      />

      {/* [FR-UNTRANSLATED: ✅ HANDLES DE REDIMENSIONNEMENT] */}
      {handles.map(handle => (
        <div
          key={handle.id}
          style={{
            position: 'absolute',
            left: handle.x,
            top: handle.y,
            width: 14,
            height: 14,
            backgroundColor: '#ffffff',
            border: '2px solid #007bff',
            borderRadius: '2px',
            cursor: handle.cursor,
            pointerEvents: 'auto',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.4)',
            background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)'
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, handle.id)}
        />
      ))}
    </div>
  )
}

'use client'

// Cadre de sélection HTML unifié pour les bulles HTML
// Reproduit exactement l'apparence et le comportement du cadre PixiJS

import React, { useMemo, useEffect, useRef } from 'react'
import { DialogueElement } from '../types/assembly.types'
import { UnifiedCoordinateSystem } from '../core/CoordinateSystem'
import { BubbleManipulationManager, HandleType } from '../core/BubbleManipulationManager'

interface HtmlSelectionFrameProps {
  element: DialogueElement
  coordinateSystem: UnifiedCoordinateSystem
  isEditing: boolean
  onStartManipulation: (element: DialogueElement, handleType: HandleType, globalX: number, globalY: number) => void
}

/**
 * Cadre de sélection HTML qui reproduit exactement le cadre PixiJS
 * Même apparence, même comportement, même UX/UI
 */
export default function HtmlSelectionFrame({
  element,
  coordinateSystem,
  isEditing,
  onStartManipulation
}: HtmlSelectionFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null)

  // ✅ DEBUG : Vérifier que le cadre est rendu
  console.log('🎯 HtmlSelectionFrame rendu pour:', {
    elementId: element.id,
    isEditing,
    position: { x: element.transform.x, y: element.transform.y },
    size: { width: element.transform.width, height: element.transform.height }
  })

  // ✅ POSITION DIRECTE DOM (sans conversion)
  const frameStyle = useMemo(() => {
    // ✅ CORRECTION : Les coordonnées sont déjà en DOM, pas de conversion nécessaire
    const domPos = {
      x: element.transform.x,
      y: element.transform.y
    }

    console.log('🎯 HtmlSelectionFrame positionnement direct:', {
      elementId: element.id,
      domPos,
      frameSize: {
        width: element.transform.width + 4,
        height: element.transform.height + 4
      }
    })

    return {
      position: 'absolute' as const,
      left: `${domPos.x - 2}px`, // -2px comme dans PixiJS
      top: `${domPos.y - 2}px`,  // -2px comme dans PixiJS
      width: `${element.transform.width + 4}px`, // +4px comme dans PixiJS
      height: `${element.transform.height + 4}px`, // +4px comme dans PixiJS
      pointerEvents: 'none' as const, // Laisser passer les événements aux handles
      zIndex: 1150, // Au-dessus des bulles mais sous les handles
    }
  }, [element.transform])

  // ✅ STYLES DU CADRE (reproduction exacte du PixiJS)
  const borderStyle = useMemo(() => {
    if (isEditing) {
      return {
        border: '3px solid #10b981', // Vert pour édition (0x10b981)
        boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)', // Effet glow
      }
    } else {
      return {
        border: '2px solid #3b82f6', // Bleu professionnel (0x3b82f6)
        boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)', // Ombre portée
      }
    }
  }, [isEditing])

  // ✅ ANIMATION PULSE (reproduction de l'animation PixiJS)
  useEffect(() => {
    if (!frameRef.current) return

    const frame = frameRef.current
    let animationId: number

    const animate = () => {
      const time = Date.now() * 0.003
      const pulseScale = 1 + Math.sin(time) * 0.01 // Animation subtile
      
      frame.style.transform = `scale(${pulseScale})`
      frame.style.transformOrigin = 'center'
      
      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  // ✅ HANDLES DE MANIPULATION (reproduction exacte)
  const handles = useMemo(() => {
    const handleSize = 12 // Même taille que PixiJS
    // ✅ CORRECTION : Utiliser les coordonnées DOM directement
    const domPos = {
      x: element.transform.x,
      y: element.transform.y
    }

    return [
      // Coins (ordre important pour HandleType enum)
      { 
        x: domPos.x - handleSize/2, 
        y: domPos.y - handleSize/2, 
        handleType: HandleType.CORNER_NW,
        cursor: 'nw-resize'
      },
      { 
        x: domPos.x + element.transform.width - handleSize/2, 
        y: domPos.y - handleSize/2, 
        handleType: HandleType.CORNER_NE,
        cursor: 'ne-resize'
      },
      { 
        x: domPos.x - handleSize/2, 
        y: domPos.y + element.transform.height - handleSize/2, 
        handleType: HandleType.CORNER_SW,
        cursor: 'sw-resize'
      },
      { 
        x: domPos.x + element.transform.width - handleSize/2, 
        y: domPos.y + element.transform.height - handleSize/2, 
        handleType: HandleType.CORNER_SE,
        cursor: 'se-resize'
      },
      // Bords
      { 
        x: domPos.x + element.transform.width/2 - handleSize/2, 
        y: domPos.y - handleSize/2, 
        handleType: HandleType.EDGE_N,
        cursor: 'n-resize'
      },
      { 
        x: domPos.x + element.transform.width/2 - handleSize/2, 
        y: domPos.y + element.transform.height - handleSize/2, 
        handleType: HandleType.EDGE_S,
        cursor: 's-resize'
      },
      { 
        x: domPos.x - handleSize/2, 
        y: domPos.y + element.transform.height/2 - handleSize/2, 
        handleType: HandleType.EDGE_W,
        cursor: 'w-resize'
      },
      { 
        x: domPos.x + element.transform.width - handleSize/2, 
        y: domPos.y + element.transform.height/2 - handleSize/2, 
        handleType: HandleType.EDGE_E,
        cursor: 'e-resize'
      },
    ]
  }, [element.transform])

  // ✅ HANDLE DE QUEUE (reproduction exacte)
  const tailHandle = useMemo(() => {
    const tailPos = BubbleManipulationManager.calculateTailPosition(element)

    return {
      x: tailPos.x - 8, // Rayon 8px comme dans PixiJS
      y: tailPos.y - 8,
      handleType: HandleType.TAIL,
      cursor: 'move'
    }
  }, [element])

  // ✅ GESTION DES ÉVÉNEMENTS DE MANIPULATION
  const handleMouseDown = (handleType: HandleType, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    
    console.log('🔧 HTML Handle cliqué:', HandleType[handleType], 'pour élément:', element.id)
    
    onStartManipulation(element, handleType, event.clientX, event.clientY)
  }

  return (
    <>
      {/* ✅ CADRE PRINCIPAL */}
      <div
        ref={frameRef}
        className="html-selection-frame"
        style={{
          ...frameStyle,
          ...borderStyle,
          borderRadius: '4px',
          transition: 'all 0.2s ease-out'
        }}
      />

      {/* ✅ HANDLES DE REDIMENSIONNEMENT */}
      {handles.map((handle, index) => {
        const isCorner = handle.handleType <= HandleType.CORNER_SE
        
        return (
          <div
            key={`handle-${index}`}
            className="html-selection-handle"
            style={{
              position: 'absolute',
              left: `${handle.x}px`,
              top: `${handle.y}px`,
              width: '12px',
              height: '12px',
              backgroundColor: isCorner ? '#ffffff' : '#3b82f6',
              border: '2px solid #3b82f6',
              borderRadius: '2px',
              cursor: handle.cursor,
              pointerEvents: 'auto',
              zIndex: 1200,
              boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
              transition: 'transform 0.1s ease-out',
              transform: 'scale(1)',
            }}
            onMouseDown={(e) => handleMouseDown(handle.handleType, e)}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1.1)'
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.transform = 'scale(1)'
            }}
          />
        )
      })}

      {/* ✅ HANDLE DE QUEUE */}
      <div
        className="html-tail-handle"
        style={{
          position: 'absolute',
          left: `${tailHandle.x}px`,
          top: `${tailHandle.y}px`,
          width: '16px',
          height: '16px',
          backgroundColor: '#ff6b35',
          border: '2px solid #ffffff',
          borderRadius: '50%',
          cursor: tailHandle.cursor,
          pointerEvents: 'auto',
          zIndex: 1200,
          boxShadow: '1px 1px 3px rgba(0, 0, 0, 0.3)',
          transition: 'transform 0.1s ease-out',
        }}
        onMouseDown={(e) => handleMouseDown(tailHandle.handleType, e)}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(1.2)'
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.transform = 'scale(1)'
        }}
      />

      {/* ✅ DEBUG POINT (développement uniquement) */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'absolute',
            left: `${tailHandle.x + 6}px`,
            top: `${tailHandle.y + 6}px`,
            width: '4px',
            height: '4px',
            backgroundColor: '#ff0000',
            borderRadius: '50%',
            pointerEvents: 'none',
            zIndex: 1300,
          }}
        />
      )}
    </>
  )
}

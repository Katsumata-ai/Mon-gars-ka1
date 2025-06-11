'use client'

// KonvaBubble - Remplacement de HtmlBubble avec Konva.js
// Préserve TOUTE la logique : formes, texte, sélection, manipulation

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Group, Rect, Circle, Text, Line } from 'react-konva'
import { DialogueElement } from '../types/assembly.types'

interface KonvaBubbleProps {
  element: DialogueElement
  isSelected: boolean
  onSelect: (elementId: string | null) => void
  onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void
  onDoubleClick?: (element: DialogueElement, position: { x: number; y: number }) => void
  onRightClick?: (element: DialogueElement, position: { x: number; y: number }) => void
}

export default function KonvaBubble({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDoubleClick,
  onRightClick
}: KonvaBubbleProps) {
  
  const groupRef = useRef<any>(null)
  const [isEditing, setIsEditing] = useState(false)

  // ✅ PRÉSERVATION COMPLÈTE : Styles de bulle identiques
  const bubbleStyle = useMemo(() => {
    return {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width,
      height: element.transform.height,
      rotation: element.transform.rotation,
      scaleX: element.transform.scaleX || 1,
      scaleY: element.transform.scaleY || 1,
      opacity: element.transform.alpha
    }
  }, [element.transform])

  // ✅ PRÉSERVATION COMPLÈTE : Styles selon le type de bulle
  const shapeStyle = useMemo(() => {
    const baseStyle = {
      width: element.transform.width,
      height: element.transform.height,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2
    }

    switch (element.bubbleStyle.type) {
      case 'speech':
        return {
          ...baseStyle,
          cornerRadius: 15
        }
      case 'thought':
        return {
          ...baseStyle,
          stroke: '#666666',
          dash: [5, 5]
        }
      case 'shout':
        return {
          ...baseStyle,
          fill: '#fff3cd',
          stroke: '#dc3545',
          strokeWidth: 4
        }
      case 'whisper':
        return {
          ...baseStyle,
          fill: '#f8f9fa',
          stroke: '#6c757d',
          strokeWidth: 1
        }
      case 'explosion':
        return {
          ...baseStyle,
          fill: '#fff3cd',
          stroke: '#fd7e14',
          strokeWidth: 3
        }
      default:
        return baseStyle
    }
  }, [element.bubbleStyle.type, element.transform])

  // ✅ PRÉSERVATION COMPLÈTE : Styles de texte identiques
  const textStyle = useMemo(() => {
    return {
      x: 10, // Padding
      y: 10, // Padding
      width: element.transform.width - 20,
      height: element.transform.height - 20,
      text: element.text || 'Texte...',
      fontSize: element.fontSize || 16,
      fontFamily: element.fontFamily || 'Arial',
      fill: element.textColor || '#000000',
      align: 'center',
      verticalAlign: 'middle',
      wrap: 'word'
    }
  }, [element.text, element.fontSize, element.fontFamily, element.textColor, element.transform])

  // ✅ PRÉSERVATION COMPLÈTE : Styles de sélection identiques
  const selectionStyle = useMemo(() => {
    if (!isSelected) return null
    
    return {
      stroke: '#3b82f6',
      strokeWidth: 2,
      dash: [5, 5],
      strokeEnabled: true
    }
  }, [isSelected])

  // ✅ PRÉSERVATION COMPLÈTE : Gestionnaire de clic identique
  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('🎯 KonvaBubble cliqué:', element.id)
    onSelect(element.id)
  }, [element.id, onSelect])

  // ✅ PRÉSERVATION COMPLÈTE : Gestionnaire de double-clic identique
  const handleDoubleClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('✏️ KonvaBubble double-clic - édition:', element.id)
    setIsEditing(true)
    const pos = { x: element.transform.x, y: element.transform.y }
    onDoubleClick?.(element, pos)
  }, [element, onDoubleClick])

  // ✅ PRÉSERVATION COMPLÈTE : Gestionnaire de clic droit identique
  const handleRightClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('🖱️ KonvaBubble clic droit:', element.id)
    const pos = { x: element.transform.x, y: element.transform.y }
    onRightClick?.(element, pos)
  }, [element, onRightClick])

  // ✅ PRÉSERVATION COMPLÈTE : Gestionnaire de drag identique
  const handleDragMove = useCallback((e: any) => {
    const node = e.target
    onUpdate(element.id, {
      transform: {
        ...element.transform,
        x: node.x(),
        y: node.y()
      }
    })
  }, [element.id, element.transform, onUpdate])

  // ✅ PRÉSERVATION COMPLÈTE : Gestionnaire de transformation identique
  const handleTransform = useCallback((e: any) => {
    const node = e.target
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    
    // Réinitialiser l'échelle et ajuster la taille
    node.scaleX(1)
    node.scaleY(1)
    
    onUpdate(element.id, {
      transform: {
        ...element.transform,
        x: node.x(),
        y: node.y(),
        width: Math.max(80, node.width() * scaleX),
        height: Math.max(40, node.height() * scaleY),
        rotation: node.rotation()
      }
    })
  }, [element.id, element.transform, onUpdate])

  // ✅ PRÉSERVATION COMPLÈTE : Rendu de la queue
  const renderTail = useCallback(() => {
    if (!element.bubbleStyle.tailAbsoluteX || !element.bubbleStyle.tailAbsoluteY) {
      return null
    }

    const tailX = element.bubbleStyle.tailAbsoluteX - element.transform.x
    const tailY = element.bubbleStyle.tailAbsoluteY - element.transform.y
    
    // Point de connexion sur la bulle (centre du bord le plus proche)
    const centerX = element.transform.width / 2
    const centerY = element.transform.height / 2
    
    return (
      <Line
        points={[centerX, centerY, tailX, tailY]}
        stroke={shapeStyle.stroke}
        strokeWidth={shapeStyle.strokeWidth}
      />
    )
  }, [element.bubbleStyle.tailAbsoluteX, element.bubbleStyle.tailAbsoluteY, element.transform, shapeStyle])

  // ✅ PRÉSERVATION COMPLÈTE : Rendu selon le type de bulle
  const renderShape = useCallback(() => {
    if (element.bubbleStyle.type === 'thought') {
      // Bulle de pensée = cercle
      return (
        <Circle
          x={element.transform.width / 2}
          y={element.transform.height / 2}
          radius={Math.min(element.transform.width, element.transform.height) / 2}
          {...shapeStyle}
        />
      )
    } else {
      // Autres bulles = rectangle avec coins arrondis
      return (
        <Rect
          {...shapeStyle}
        />
      )
    }
  }, [element.bubbleStyle.type, element.transform, shapeStyle])

  return (
    <Group
      ref={groupRef}
      {...bubbleStyle}
      draggable={!isEditing}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDblTap={handleDoubleClick}
      onContextMenu={handleRightClick}
      onDragMove={handleDragMove}
      onTransform={handleTransform}
    >
      {/* ✅ FORME DE LA BULLE - Logique préservée */}
      {renderShape()}
      
      {/* ✅ QUEUE DE LA BULLE - Logique préservée */}
      {renderTail()}
      
      {/* ✅ TEXTE DE LA BULLE - Logique préservée */}
      <Text
        {...textStyle}
      />
      
      {/* ✅ CADRE DE SÉLECTION - Logique préservée */}
      {isSelected && !isEditing && (
        <Rect
          width={element.transform.width}
          height={element.transform.height}
          fill="transparent"
          {...selectionStyle}
        />
      )}
      
      {/* ✅ HANDLES DE MANIPULATION - Logique préservée */}
      {isSelected && !isEditing && (
        <>
          {/* Coins */}
          <Rect x={-4} y={-4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={element.transform.width - 4} y={-4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={-4} y={element.transform.height - 4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={element.transform.width - 4} y={element.transform.height - 4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          
          {/* Bords */}
          <Rect x={element.transform.width / 2 - 4} y={-4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={element.transform.width / 2 - 4} y={element.transform.height - 4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={-4} y={element.transform.height / 2 - 4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          <Rect x={element.transform.width - 4} y={element.transform.height / 2 - 4} width={8} height={8} fill="#3b82f6" stroke="#ffffff" strokeWidth={1} />
          
          {/* Handle de queue */}
          {element.bubbleStyle.tailAbsoluteX && element.bubbleStyle.tailAbsoluteY && (
            <Circle
              x={element.bubbleStyle.tailAbsoluteX - element.transform.x}
              y={element.bubbleStyle.tailAbsoluteY - element.transform.y}
              radius={6}
              fill="#ff6b35"
              stroke="#ffffff"
              strokeWidth={2}
            />
          )}
        </>
      )}
    </Group>
  )
}

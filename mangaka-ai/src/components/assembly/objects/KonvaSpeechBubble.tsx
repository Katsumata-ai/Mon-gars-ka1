'use client'

// KonvaSpeechBubble - Composant Konva unifié pour les speech bubbles
// Remplace complètement le système HTML/PixiJS mixte par du Konva pur

import React, { useCallback, useMemo, useState, useRef } from 'react'
import { Group, Shape, Text, Circle } from 'react-konva'
import { DialogueElement, BubbleType } from '../types/assembly.types'

interface KonvaSpeechBubbleProps {
  element: DialogueElement
  isSelected: boolean
  isEditing?: boolean
  onSelect: (elementId: string | null) => void
  onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void
  onStartEdit?: (elementId: string) => void
  onFinishEdit?: () => void
}

// ✅ RECRÉATION FIDÈLE : Types de handles identiques aux panels
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

export default function KonvaSpeechBubble({
  element,
  isSelected,
  isEditing = false,
  onSelect,
  onUpdate,
  onStartEdit,
  onFinishEdit
}: KonvaSpeechBubbleProps) {
  
  const groupRef = useRef<any>(null)
  
  // ✅ RECRÉATION FIDÈLE : États de manipulation identiques aux panels
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // ✅ RECRÉATION FIDÈLE : Styles de bulle EXACTEMENT comme les panels
  const bubbleStyle = useMemo(() => {
    return {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width,
      height: element.transform.height,
      rotation: element.transform.rotation,
      opacity: element.transform.alpha
    }
  }, [element.transform])

  // ✅ RECRÉATION FIDÈLE : Styles de sélection EXACTEMENT comme les panels
  const selectionBorderStyle = useMemo(() => {
    if (!isSelected) return null
    
    return {
      stroke: '#3b82f6',  // Couleur exacte des panels
      strokeWidth: 2,     // Largeur exacte des panels
      opacity: 0.8,       // Alpha exacte des panels
      strokeEnabled: true
    }
  }, [isSelected])

  // ✅ RECRÉATION FIDÈLE : Positions des handles EXACTEMENT comme les panels
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

  // ✅ GÉNÉRATION DE FORME DE BULLE VECTORIELLE
  const generateBubbleShape = useCallback((type: BubbleType, width: number, height: number) => {
    const ctx = document.createElement('canvas').getContext('2d')!
    
    switch (type) {
      case 'speech':
        return generateSpeechBubblePath(width, height)
      case 'thought':
        return generateThoughtBubblePath(width, height)
      case 'shout':
        return generateShoutBubblePath(width, height)
      case 'whisper':
        return generateWhisperBubblePath(width, height)
      case 'explosion':
        return generateExplosionBubblePath(width, height)
      default:
        return generateSpeechBubblePath(width, height)
    }
  }, [])

  // ✅ GESTIONNAIRES IDENTIQUES AUX PANELS
  const handleClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('🎯 KonvaSpeechBubble cliqué:', element.id)
    onSelect(element.id)
  }, [element.id, onSelect])

  const handleDoubleClick = useCallback((e: any) => {
    e.cancelBubble = true
    console.log('✏️ KonvaSpeechBubble double-clic - édition:', element.id)
    onStartEdit?.(element.id)
  }, [element.id, onStartEdit])

  const handleDragStart = useCallback((e: any) => {
    if (isResizing) return
    setIsDragging(true)
    console.log('🎯 Bubble drag start:', element.id)
  }, [element.id, isResizing])

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
    console.log('🎯 Bubble drag end:', element.id)
  }, [element.id])

  // ✅ GESTIONNAIRE DE HANDLES IDENTIQUE AUX PANELS
  const handleHandleMouseDown = useCallback((handleIndex: number, e: any) => {
    e.cancelBubble = true
    setIsResizing(true)
    console.log('🔧 Handle resize start:', HandleType[handleIndex], 'pour bubble:', element.id)
  }, [element.id])

  return (
    <Group
      ref={groupRef}
      {...bubbleStyle}
      draggable={!isResizing && !isEditing}
      onClick={handleClick}
      onTap={handleClick}
      onDblClick={handleDoubleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      {/* ✅ FORME DE BULLE VECTORIELLE KONVA */}
      <Shape
        sceneFunc={(context, shape) => {
          const path = generateBubbleShape(
            element.dialogueStyle.type,
            element.transform.width,
            element.transform.height
          )
          
          context.beginPath()
          // Dessiner la forme selon le type de bulle
          drawBubbleShape(context, element.dialogueStyle.type, element.transform.width, element.transform.height)
          context.closePath()
          
          // Remplissage
          context.fillStyle = `#${element.dialogueStyle.backgroundColor.toString(16).padStart(6, '0')}`
          context.fill()
          
          // Bordure
          context.strokeStyle = `#${element.dialogueStyle.outlineColor.toString(16).padStart(6, '0')}`
          context.lineWidth = element.dialogueStyle.outlineWidth
          if (element.dialogueStyle.dashedOutline) {
            context.setLineDash([5, 5])
          }
          context.stroke()
          
          context.fillStrokeShape(shape)
        }}
        width={element.transform.width}
        height={element.transform.height}
      />

      {/* ✅ TEXTE KONVA INTÉGRÉ - Masqué pendant l'édition */}
      {!isEditing && (
        <Text
          text={element.text || 'Cliquez pour éditer...'}
          x={10}
          y={10}
          width={element.transform.width - 20}
          height={element.transform.height - 20}
          fontSize={element.dialogueStyle.fontSize}
          fontFamily={element.dialogueStyle.fontFamily}
          fill={`#${element.dialogueStyle.textColor.toString(16).padStart(6, '0')}`}
          align={element.dialogueStyle.textAlign}
          verticalAlign="middle"
          wrap="word"
          listening={false}
        />
      )}

      {/* ✅ ZONE TRANSPARENTE POUR L'ÉDITION IN-PLACE */}
      {isEditing && (
        <Text
          text=""
          x={10}
          y={10}
          width={element.transform.width - 20}
          height={element.transform.height - 20}
          fill="transparent"
          listening={false}
        />
      )}
      
      {/* ✅ BORDURE DE SÉLECTION IDENTIQUE AUX PANELS */}
      {isSelected && (
        <Shape
          sceneFunc={(context, shape) => {
            context.beginPath()
            context.rect(0, 0, element.transform.width, element.transform.height)
            context.strokeStyle = '#3b82f6'
            context.lineWidth = 2
            context.setLineDash([5, 5])
            context.stroke()
            context.fillStrokeShape(shape)
          }}
          width={element.transform.width}
          height={element.transform.height}
          listening={false}
        />
      )}
      
      {/* ✅ HANDLES DE REDIMENSIONNEMENT IDENTIQUES AUX PANELS */}
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

// ✅ FONCTIONS DE GÉNÉRATION DE FORMES VECTORIELLES
function drawBubbleShape(context: any, type: BubbleType, width: number, height: number) {
  switch (type) {
    case 'speech':
      drawSpeechBubble(context, width, height)
      break
    case 'thought':
      drawThoughtBubble(context, width, height)
      break
    case 'shout':
      drawShoutBubble(context, width, height)
      break
    case 'whisper':
      drawWhisperBubble(context, width, height)
      break
    case 'explosion':
      drawExplosionBubble(context, width, height)
      break
    default:
      drawSpeechBubble(context, width, height)
  }
}

function drawSpeechBubble(context: any, width: number, height: number) {
  const radius = 10
  // Bulle arrondie avec queue triangulaire
  context.moveTo(radius, 0)
  context.lineTo(width - radius, 0)
  context.quadraticCurveTo(width, 0, width, radius)
  context.lineTo(width, height - radius)
  context.quadraticCurveTo(width, height, width - radius, height)
  context.lineTo(radius + 30, height)
  // Queue triangulaire
  context.lineTo(radius, height + 20)
  context.lineTo(radius, height)
  context.lineTo(radius, height)
  context.quadraticCurveTo(0, height, 0, height - radius)
  context.lineTo(0, radius)
  context.quadraticCurveTo(0, 0, radius, 0)
}

function drawThoughtBubble(context: any, width: number, height: number) {
  // Bulle ovale pour les pensées
  context.ellipse(width/2, height/2, width/2, height/2, 0, 0, 2 * Math.PI)
}

function drawShoutBubble(context: any, width: number, height: number) {
  // Forme en étoile/explosion pour les cris
  const centerX = width / 2
  const centerY = height / 2
  const spikes = 8
  const outerRadius = Math.min(width, height) / 2
  const innerRadius = outerRadius * 0.6
  
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / spikes
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    
    if (i === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
}

function drawWhisperBubble(context: any, width: number, height: number) {
  // Identique à speech mais sera rendu avec des pointillés
  drawSpeechBubble(context, width, height)
}

function drawExplosionBubble(context: any, width: number, height: number) {
  // Forme irrégulière avec pointes
  drawShoutBubble(context, width, height)
}

// Fonctions de génération de path (pour compatibilité)
function generateSpeechBubblePath(width: number, height: number): string {
  return `M10,0 L${width-10},0 Q${width},0 ${width},10 L${width},${height-10} Q${width},${height} ${width-10},${height} L40,${height} L10,${height+20} L10,${height} Q0,${height} 0,${height-10} L0,10 Q0,0 10,0 Z`
}

function generateThoughtBubblePath(width: number, height: number): string {
  return `M${width/2},0 A${width/2},${height/2} 0 1,1 ${width/2},${height} A${width/2},${height/2} 0 1,1 ${width/2},0 Z`
}

function generateShoutBubblePath(width: number, height: number): string {
  return generateSpeechBubblePath(width, height) // Simplifié pour l'instant
}

function generateWhisperBubblePath(width: number, height: number): string {
  return generateSpeechBubblePath(width, height)
}

function generateExplosionBubblePath(width: number, height: number): string {
  return generateSpeechBubblePath(width, height)
}

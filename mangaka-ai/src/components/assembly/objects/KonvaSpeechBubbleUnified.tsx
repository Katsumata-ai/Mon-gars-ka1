'use client'

// 🎯 SOLUTION SIMPLE COMME VOS CONCURRENTS : KonvaSpeechBubbleUnified
// Double-clic → Édition in-place → Adaptation intelligente → Fin d'édition
// Utilise l'approche standard Konva.js éprouvée

import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react'
import { Group, Shape, Text, Circle, Rect } from 'react-konva'
import { DialogueElement, BubbleType } from '../types/assembly.types'
import Konva from 'konva'
import TipTapUnifiedEditor from '../ui/TipTapUnifiedEditor'

interface KonvaSpeechBubbleUnifiedProps {
  element: DialogueElement
  isSelected: boolean
  isEditing?: boolean
  onSelect: (elementId: string | null) => void
  onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void
  onStartEdit?: (elementId: string) => void
  onFinishEdit?: () => void
}

/**
 * ✅ COMPOSANT UNIFIÉ DÉFINITIF
 * - Konva natif pour performance optimale
 * - Édition de texte intégrée dans le canvas
 * - Système de sélection et manipulation unifié
 * - Compatible avec l'architecture existante
 */
export default function KonvaSpeechBubbleUnified({
  element,
  isSelected,
  isEditing = false,
  onSelect,
  onUpdate,
  onStartEdit,
  onFinishEdit
}: KonvaSpeechBubbleUnifiedProps) {
  const groupRef = useRef<Konva.Group>(null)
  const textRef = useRef<Konva.Text>(null)
  const [isHovered, setIsHovered] = useState(false)

  // ✅ CONFIGURATION BULLE SELON LE TYPE
  const bubbleConfig = useMemo(() => {
    const { dialogueStyle } = element
    const baseConfig = {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width,
      height: element.transform.height,
      rotation: element.transform.rotation,
      scaleX: element.transform.scaleX,
      scaleY: element.transform.scaleY,
      opacity: element.transform.alpha
    }

    // Configuration spécifique selon le type de bulle
    switch (dialogueStyle.type) {
      case 'speech':
        return {
          ...baseConfig,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          cornerRadius: 20
        }
      case 'thought':
        return {
          ...baseConfig,
          fill: '#ffffff',
          stroke: '#666666',
          strokeWidth: 1,
          dash: [5, 5],
          cornerRadius: 50
        }
      case 'shout':
        return {
          ...baseConfig,
          fill: '#fff3cd',
          stroke: '#dc3545',
          strokeWidth: 3,
          cornerRadius: 10
        }
      case 'whisper':
        return {
          ...baseConfig,
          fill: '#f8f9fa',
          stroke: '#6c757d',
          strokeWidth: 1,
          dash: [3, 3],
          cornerRadius: 15
        }
      case 'explosion':
        return {
          ...baseConfig,
          fill: '#fff3cd',
          stroke: '#fd7e14',
          strokeWidth: 3,
          cornerRadius: 5
        }
      default:
        return {
          ...baseConfig,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 2,
          cornerRadius: 20
        }
    }
  }, [element])

  // ✅ CONFIGURATION TEXTE
  const textConfig = useMemo(() => ({
    x: bubbleConfig.x + 10,
    y: bubbleConfig.y + 10,
    width: bubbleConfig.width - 20,
    height: bubbleConfig.height - 20,
    text: element.text || 'Cliquez pour éditer...',
    fontSize: element.dialogueStyle.fontSize,
    fontFamily: element.dialogueStyle.fontFamily,
    fill: typeof element.dialogueStyle.textColor === 'string' 
      ? element.dialogueStyle.textColor 
      : `#${element.dialogueStyle.textColor.toString(16).padStart(6, '0')}`,
    align: element.dialogueStyle.textAlign,
    verticalAlign: 'middle',
    wrap: 'word',
    ellipsis: true
  }), [element, bubbleConfig])

  // ✅ FORME DE LA BULLE SELON LE TYPE
  const renderBubbleShape = useCallback(() => {
    const { type } = element.dialogueStyle

    switch (type) {
      case 'thought':
        // Bulle de pensée (cercle/ovale)
        return (
          <Shape
            sceneFunc={(context, shape) => {
              context.beginPath()
              context.ellipse(
                bubbleConfig.width / 2,
                bubbleConfig.height / 2,
                bubbleConfig.width / 2,
                bubbleConfig.height / 2,
                0, 0, 2 * Math.PI
              )
              context.fillStrokeShape(shape)
            }}
            fill={bubbleConfig.fill}
            stroke={bubbleConfig.stroke}
            strokeWidth={bubbleConfig.strokeWidth}
            dash={bubbleConfig.dash}
          />
        )
      
      case 'explosion':
        // Bulle d'explosion (forme étoilée)
        return (
          <Shape
            sceneFunc={(context, shape) => {
              const centerX = bubbleConfig.width / 2
              const centerY = bubbleConfig.height / 2
              const outerRadius = Math.min(bubbleConfig.width, bubbleConfig.height) / 2
              const innerRadius = outerRadius * 0.6
              const spikes = 8

              context.beginPath()
              for (let i = 0; i < spikes * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius
                const angle = (i * Math.PI) / spikes
                const x = centerX + Math.cos(angle) * radius
                const y = centerY + Math.sin(angle) * radius
                
                if (i === 0) {
                  context.moveTo(x, y)
                } else {
                  context.lineTo(x, y)
                }
              }
              context.closePath()
              context.fillStrokeShape(shape)
            }}
            fill={bubbleConfig.fill}
            stroke={bubbleConfig.stroke}
            strokeWidth={bubbleConfig.strokeWidth}
          />
        )

      default:
        // Bulle standard (rectangle arrondi)
        return (
          <Rect
            width={bubbleConfig.width}
            height={bubbleConfig.height}
            fill={bubbleConfig.fill}
            stroke={bubbleConfig.stroke}
            strokeWidth={bubbleConfig.strokeWidth}
            cornerRadius={bubbleConfig.cornerRadius}
            dash={bubbleConfig.dash}
          />
        )
    }
  }, [element.dialogueStyle.type, bubbleConfig])

  // ✅ GESTION DES ÉVÉNEMENTS
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (!isEditing) {
      onSelect(element.id)
    }
  }, [element.id, isEditing, onSelect])

  const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onStartEdit?.(element.id)
  }, [element.id, onStartEdit])

  const handleMouseEnter = useCallback(() => {
    if (!isEditing) {
      setIsHovered(true)
      document.body.style.cursor = 'pointer'
    }
  }, [isEditing])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    document.body.style.cursor = 'default'
  }, [])

  // ✅ SUPPRIMÉ : Ancien système textarea remplacé par TipTap unifié

  return (
    <>
      <Group
        ref={groupRef}
        x={bubbleConfig.x}
        y={bubbleConfig.y}
        rotation={bubbleConfig.rotation}
        scaleX={bubbleConfig.scaleX || 1}
        scaleY={bubbleConfig.scaleY || 1}
        opacity={bubbleConfig.opacity}
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        draggable={isSelected && !isEditing}
        onDragEnd={(e) => {
          onUpdate(element.id, {
            transform: {
              ...element.transform,
              x: e.target.x(),
              y: e.target.y()
            }
          })
        }}
      >
        {/* Forme de la bulle */}
        {renderBubbleShape()}

        {/* ✅ TEXTE DE LA BULLE - Masqué pendant l'édition */}
        <Text
          ref={textRef}
          {...textConfig}
          visible={!isEditing} // ✅ MASQUÉ pendant l'édition pour effet seamless
          listening={false} // Le texte ne capture pas les événements
        />

        {/* Indicateur de sélection */}
        {isSelected && !isEditing && (
          <Rect
            x={-2}
            y={-2}
            width={bubbleConfig.width + 4}
            height={bubbleConfig.height + 4}
            stroke="#3b82f6"
            strokeWidth={2}
            dash={[5, 5]}
            fill="transparent"
            listening={false}
          />
        )}

        {/* Indicateur de hover */}
        {isHovered && !isSelected && !isEditing && (
          <Rect
            x={-1}
            y={-1}
            width={bubbleConfig.width + 2}
            height={bubbleConfig.height + 2}
            stroke="#6b7280"
            strokeWidth={1}
            fill="transparent"
            listening={false}
          />
        )}
      </Group>

      {/* ✅ ÉDITEUR TIPTAP UNIFIÉ - Intégré directement dans le container Konva */}
      {isEditing && textRef.current && (
        <TipTapUnifiedEditor
          element={element}
          isEditing={isEditing}
          onUpdate={onUpdate}
          onFinishEdit={onFinishEdit || (() => {})}
          konvaContainer={textRef.current.getStage()?.container() as HTMLElement}
          bubblePosition={{
            x: bubbleConfig.x,
            y: bubbleConfig.y,
            width: bubbleConfig.width,
            height: bubbleConfig.height
          }}
          stageScale={textRef.current.getStage()?.scaleX() || 1}
        />
      )}
    </>
  )
}

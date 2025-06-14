'use client'

// UnifiedBubbleShape - Système graphique unifié pour les speech bubbles
// Architecture: Bulle + Queue rendues comme une seule forme SVG intégrée
// Garantit que la queue fait partie intégrante de la géométrie de la bulle

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { DialogueElement, QueueConfiguration } from '../types/assembly.types'

interface UnifiedBubbleShapeProps {
  width: number
  height: number
  queueConfig: QueueConfiguration
  isSelected: boolean
  onQueueUpdate: (config: QueueConfiguration) => void
  bubbleStyle: DialogueElement['dialogueStyle']
  bubbleId: string // ✅ NOUVEAU : ID de la bulle pour synchronisation
  className?: string
}

/**
 * Composant de forme unifiée : bulle + queue intégrées graphiquement
 * La queue fait partie intégrante de la géométrie de la bulle
 */
export default function UnifiedBubbleShape({
  width,
  height,
  queueConfig,
  isSelected,
  onQueueUpdate,
  bubbleStyle,
  bubbleId,
  className = ''
}: UnifiedBubbleShapeProps) {
  const containerRef = useRef<SVGSVGElement>(null)
  const [isDraggingRotation, setIsDraggingRotation] = useState(false)
  const [isDraggingLength, setIsDraggingLength] = useState(false)
  const [isGloballySelected, setIsGloballySelected] = useState(false)

  // ✅ GÉOMÉTRIE UNIFIÉE CORRIGÉE - Calculs adaptatifs selon la forme de la bulle
  const unifiedGeometry = useMemo(() => {
    const centerX = width / 2
    const centerY = height / 2
    const angleRad = (queueConfig.angle * Math.PI) / 180

    // ✅ NOUVEAU : Calcul d'attachement adaptatif selon le type de bulle
    let attachmentPoint: { x: number; y: number }

    switch (bubbleStyle.type) {
      case 'speech':
      case 'thought':
        // ✅ BULLES ARRONDIES : Calculs elliptiques purs
        attachmentPoint = calculateEllipticalAttachment(centerX, centerY, width, height, angleRad)
        break
      case 'shout':
        // Forme étoilée - calculs spéciaux
        attachmentPoint = calculateStarAttachment(centerX, centerY, width, height, angleRad)
        break
      case 'explosion':
        // Explosion sans queue - point fictif
        attachmentPoint = { x: centerX, y: centerY }
        break
      default:
        attachmentPoint = calculateEllipticalAttachment(centerX, centerY, width, height, angleRad)
    }

    // ✅ POINTE DE LA QUEUE - Extension depuis le point d'attache corrigé
    const tipPoint = {
      x: attachmentPoint.x + Math.cos(angleRad) * queueConfig.length,
      y: attachmentPoint.y + Math.sin(angleRad) * queueConfig.length
    }

    // ✅ HANDLES INTÉGRÉS - Handle orange au milieu pour accessibilité
    const rotationHandle = {
      x: attachmentPoint.x + Math.cos(angleRad) * (queueConfig.length * 0.5),
      y: attachmentPoint.y + Math.sin(angleRad) * (queueConfig.length * 0.5)
    }

    const lengthHandle = tipPoint

    return {
      centerX,
      centerY,
      attachmentPoint,
      tipPoint,
      rotationHandle,
      lengthHandle,
      angleRad
    }
  }, [width, height, queueConfig.angle, queueConfig.length, bubbleStyle.type])

  // ✅ GÉNÉRATION DE LA FORME UNIFIÉE (BULLE + QUEUE) - FUSION SEAMLESS
  const unifiedPath = useMemo(() => {
    const { centerX, centerY, attachmentPoint, tipPoint } = unifiedGeometry
    const { style, thickness, tapering = 0.8 } = queueConfig

    // ✅ CALCUL DES RAYONS POUR LES FONCTIONS DE GÉNÉRATION
    const radiusX = width / 2
    const radiusY = height / 2

    // ✅ NOUVEAU : GÉNÉRATION D'UNE FORME UNIFIÉE SEAMLESS
    switch (bubbleStyle.type) {
      case 'speech':
      case 'thought':
        return generateUnifiedEllipseWithQueue(
          centerX, centerY, radiusX, radiusY,
          attachmentPoint, tipPoint,
          thickness, tapering, style
        )
      case 'shout':
        // Bulle de cri sans queue
        return generateShoutBubblePath(centerX, centerY, radiusX, radiusY)
      case 'explosion':
        // Explosion sans queue
        return generateShoutBubblePath(centerX, centerY, radiusX, radiusY)
      default:
        return generateUnifiedEllipseWithQueue(
          centerX, centerY, radiusX, radiusY,
          attachmentPoint, tipPoint,
          thickness, tapering, style
        )
    }
  }, [unifiedGeometry, queueConfig, bubbleStyle.type, width, height])

  // ✅ STYLES UNIFIÉS
  const unifiedStyle = useMemo(() => {
    const { type, outlineColor, outlineWidth, backgroundColor } = bubbleStyle
    
    const baseStyle = {
      fill: typeof backgroundColor === 'string' 
        ? backgroundColor 
        : `#${backgroundColor.toString(16).padStart(6, '0')}`,
      stroke: typeof outlineColor === 'string' 
        ? outlineColor 
        : `#${outlineColor.toString(16).padStart(6, '0')}`,
      strokeWidth: outlineWidth,
      fillRule: 'evenodd' as const
    }

    // Styles spécifiques selon le type
    switch (type) {
      case 'thought':
        return { ...baseStyle, strokeDasharray: '5,5' }
      case 'shout':
      case 'explosion':
        return { ...baseStyle, strokeWidth: outlineWidth * 1.5 }
      default:
        return baseStyle
    }
  }, [bubbleStyle])

  // ✅ GESTION DES HANDLES
  const handleRotationMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingRotation(true)
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleLengthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingLength(true)
    document.body.style.cursor = 'ew-resize'
  }, [])

  // ✅ GESTION GLOBALE DES MOUVEMENTS
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current || (!isDraggingRotation && !isDraggingLength)) return

      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = event.clientX - rect.left
      const mouseY = event.clientY - rect.top

      if (isDraggingRotation) {
        // ✅ ROTATION AUTOUR DU PÉRIMÈTRE DE LA BULLE
        const { centerX, centerY } = unifiedGeometry
        const deltaX = mouseX - centerX
        const deltaY = mouseY - centerY
        let newAngle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI

        if (newAngle < 0) newAngle += 360

        onQueueUpdate({
          ...queueConfig,
          angle: newAngle,
          isManipulating: true
        })
      }

      if (isDraggingLength) {
        // ✅ CONTRÔLE DE LONGUEUR DEPUIS LE POINT D'ATTACHE
        const { attachmentPoint } = unifiedGeometry
        const deltaX = mouseX - attachmentPoint.x
        const deltaY = mouseY - attachmentPoint.y
        const newLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

        const minLength = 20
        const maxLength = 150
        const constrainedLength = Math.max(minLength, Math.min(maxLength, newLength))

        onQueueUpdate({
          ...queueConfig,
          length: constrainedLength,
          isManipulating: true
        })
      }
    }

    const handleMouseUp = () => {
      if (isDraggingRotation || isDraggingLength) {
        setIsDraggingRotation(false)
        setIsDraggingLength(false)
        document.body.style.cursor = 'default'

        onQueueUpdate({
          ...queueConfig,
          isManipulating: false
        })
      }
    }

    if (isDraggingRotation || isDraggingLength) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDraggingRotation, isDraggingLength, unifiedGeometry, queueConfig, onQueueUpdate])

  // ✅ SYNCHRONISATION AVEC LE SYSTÈME DE SÉLECTION GLOBAL
  useEffect(() => {
    const handleGlobalSelection = (event: CustomEvent) => {
      const { id, type } = event.detail
      if (type === 'bubble' && id === bubbleId) {
        setIsGloballySelected(true)
        console.log('🎯 UnifiedBubbleShape: Bulle sélectionnée globalement:', bubbleId)
      } else {
        setIsGloballySelected(false)
        console.log('🎯 UnifiedBubbleShape: Bulle désélectionnée globalement:', bubbleId)
      }
    }

    const handleGlobalDeselect = () => {
      setIsGloballySelected(false)
      console.log('🎯 UnifiedBubbleShape: Désélection globale:', bubbleId)
    }

    window.addEventListener('elementSelected', handleGlobalSelection as EventListener)
    window.addEventListener('globalDeselect', handleGlobalDeselect as EventListener)

    return () => {
      window.removeEventListener('elementSelected', handleGlobalSelection as EventListener)
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
    }
  }, [bubbleId])

  // ✅ BULLES EXPLOSION SANS QUEUE - Rendu spécial
  if (bubbleStyle.type === 'explosion') {
    return (
      <svg
        ref={containerRef}
        className={`unified-bubble-shape ${className}`}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 1
        }}
      >
        {/* ✅ BULLE EXPLOSION SANS QUEUE */}
        <path
          d={generateShoutBubblePath(width/2, height/2, width/2, height/2)}
          style={unifiedStyle}
        />
      </svg>
    )
  }

  // ✅ LOGIQUE DE VISIBILITÉ DES HANDLES : Combinaison de isSelected ET isGloballySelected
  // Pas de handles pour les bulles de cri et explosion
  const shouldShowHandles = (isSelected || isGloballySelected) &&
                           bubbleStyle.type !== 'shout' &&
                           bubbleStyle.type !== 'explosion'

  return (
    <svg
      ref={containerRef}
      className={`unified-bubble-shape ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
        zIndex: 1
      }}
    >
      {/* ✅ FORME UNIFIÉE - Bulle + Queue intégrées avec transition fluide */}
      <path
        d={unifiedPath}
        style={unifiedStyle}
      />

      {/* ✅ HANDLES DE MANIPULATION - Visibles seulement si sélectionné globalement */}
      {shouldShowHandles && (
        <>
          {/* Handle orange - Rotation autour du périmètre */}
          <circle
            cx={unifiedGeometry.rotationHandle.x}
            cy={unifiedGeometry.rotationHandle.y}
            r={8}
            style={{
              fill: '#ff6b35',
              stroke: '#ffffff',
              strokeWidth: 2,
              cursor: 'grab',
              pointerEvents: 'all'
            }}
            onMouseDown={handleRotationMouseDown}
          />

          {/* Handle bleu - Contrôle de longueur */}
          <circle
            cx={unifiedGeometry.lengthHandle.x}
            cy={unifiedGeometry.lengthHandle.y}
            r={8}
            style={{
              fill: '#3b82f6',
              stroke: '#ffffff',
              strokeWidth: 2,
              cursor: 'ew-resize',
              pointerEvents: 'all'
            }}
            onMouseDown={handleLengthMouseDown}
          />
        </>
      )}
    </svg>
  )
}

// ✅ FONCTIONS DE GÉNÉRATION DES FORMES DE BULLES

/**
 * Génère le chemin SVG pour une bulle de dialogue (ellipse comme thought bubble)
 */
function generateSpeechBubblePath(centerX: number, centerY: number, radiusX: number, radiusY: number): string {
  // ✅ NOUVEAU : Speech bubbles arrondies comme thought bubbles
  return `M ${centerX + radiusX} ${centerY}
          A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY}
          A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} Z`
}

/**
 * Génère le chemin SVG pour une bulle de pensée (ellipse)
 */
function generateThoughtBubblePath(centerX: number, centerY: number, radiusX: number, radiusY: number): string {
  return `M ${centerX + radiusX} ${centerY} 
          A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY} 
          A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} Z`
}

/**
 * Génère le chemin SVG pour une bulle de cri (forme étoilée)
 */
function generateShoutBubblePath(centerX: number, centerY: number, radiusX: number, radiusY: number): string {
  const points = 8
  const outerRadius = Math.min(radiusX, radiusY)
  const innerRadius = outerRadius * 0.6
  let path = `M ${centerX + outerRadius} ${centerY}`

  for (let i = 1; i <= points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / points
    const x = centerX + Math.cos(angle) * radius
    const y = centerY + Math.sin(angle) * radius
    path += ` L ${x} ${y}`
  }

  return path + ' Z'
}

/**
 * Génère le chemin SVG pour une bulle de chuchotement (rounded rectangle avec coins plus arrondis)
 */
function generateWhisperBubblePath(centerX: number, centerY: number, radiusX: number, radiusY: number): string {
  const x = centerX - radiusX
  const y = centerY - radiusY
  const width = radiusX * 2
  const height = radiusY * 2
  const radius = Math.min(width, height) * 0.3 // Plus arrondi que speech

  return `M ${x + radius} ${y} 
          L ${x + width - radius} ${y} 
          Q ${x + width} ${y} ${x + width} ${y + radius}
          L ${x + width} ${y + height - radius}
          Q ${x + width} ${y + height} ${x + width - radius} ${y + height}
          L ${x + radius} ${y + height}
          Q ${x} ${y + height} ${x} ${y + height - radius}
          L ${x} ${y + radius}
          Q ${x} ${y} ${x + radius} ${y} Z`
}

// ✅ FONCTIONS DE GÉNÉRATION DES QUEUES INTÉGRÉES

/**
 * Génère une queue triangulaire avec transition fluide seamless
 * Crée un vide blanc fluide sans séparation visuelle
 */
function generateIntegratedTriangleQueue(
  startX: number, startY: number,
  endX: number, endY: number,
  thickness: number, tapering: number = 0.8
): string {
  const angle = Math.atan2(endY - startY, endX - startX)
  const perpAngle = angle + Math.PI / 2

  const baseWidth = thickness
  const tipWidth = Math.max(1, thickness * (1 - tapering))

  // ✅ TRANSITION FLUIDE : Points de base qui se fondent naturellement avec la bulle
  const base1X = startX + Math.cos(perpAngle) * (baseWidth / 2)
  const base1Y = startY + Math.sin(perpAngle) * (baseWidth / 2)
  const base2X = startX - Math.cos(perpAngle) * (baseWidth / 2)
  const base2Y = startY - Math.sin(perpAngle) * (baseWidth / 2)

  // ✅ POINTE AFFINÉE
  const tip1X = endX + Math.cos(perpAngle) * (tipWidth / 2)
  const tip1Y = endY + Math.sin(perpAngle) * (tipWidth / 2)
  const tip2X = endX - Math.cos(perpAngle) * (tipWidth / 2)
  const tip2Y = endY - Math.sin(perpAngle) * (tipWidth / 2)

  // ✅ COURBES DOUCES pour transition naturelle sans séparation
  const controlOffset = thickness * 0.4
  const control1X = startX + Math.cos(perpAngle) * (baseWidth / 3) + Math.cos(angle) * controlOffset
  const control1Y = startY + Math.sin(perpAngle) * (baseWidth / 3) + Math.sin(angle) * controlOffset
  const control2X = startX - Math.cos(perpAngle) * (baseWidth / 3) + Math.cos(angle) * controlOffset
  const control2Y = startY - Math.sin(perpAngle) * (baseWidth / 3) + Math.sin(angle) * controlOffset

  return `M ${base1X} ${base1Y}
          Q ${control1X} ${control1Y} ${tip1X} ${tip1Y}
          L ${tip2X} ${tip2Y}
          Q ${control2X} ${control2Y} ${base2X} ${base2Y} Z`
}

/**
 * Génère une queue courbe intégrée à la bulle
 */
function generateIntegratedCurvedQueue(
  startX: number, startY: number,
  endX: number, endY: number,
  thickness: number
): string {
  const angle = Math.atan2(endY - startY, endX - startX)
  const perpAngle = angle + Math.PI / 2
  const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2)

  const baseWidth = thickness
  const tipWidth = thickness * 0.3

  const base1X = startX + Math.cos(perpAngle) * (baseWidth / 2)
  const base1Y = startY + Math.sin(perpAngle) * (baseWidth / 2)
  const base2X = startX - Math.cos(perpAngle) * (baseWidth / 2)
  const base2Y = startY - Math.sin(perpAngle) * (baseWidth / 2)

  const controlOffset = distance * 0.3
  const control1X = startX + Math.cos(angle) * controlOffset + Math.cos(perpAngle) * (tipWidth / 2)
  const control1Y = startY + Math.sin(angle) * controlOffset + Math.sin(perpAngle) * (tipWidth / 2)
  const control2X = startX + Math.cos(angle) * controlOffset - Math.cos(perpAngle) * (tipWidth / 2)
  const control2Y = startY + Math.sin(angle) * controlOffset - Math.sin(perpAngle) * (tipWidth / 2)

  return `M ${base1X} ${base1Y} Q ${control1X} ${control1Y} ${endX} ${endY} Q ${control2X} ${control2Y} ${base2X} ${base2Y} Z`
}

// ✅ NOUVELLES FONCTIONS DE GÉNÉRATION UNIFIÉE SEAMLESS

/**
 * Génère une ellipse avec queue seamless - APPROCHE CORRIGÉE
 * Bulle visible + transition fluide sans séparation
 */
function generateUnifiedEllipseWithQueue(
  centerX: number, centerY: number,
  radiusX: number, radiusY: number,
  attachmentPoint: { x: number; y: number },
  tipPoint: { x: number; y: number },
  thickness: number, tapering: number,
  style: string
): string {
  const angle = Math.atan2(tipPoint.y - attachmentPoint.y, tipPoint.x - attachmentPoint.x)
  const perpAngle = angle + Math.PI / 2

  const baseWidth = thickness
  const tipWidth = Math.max(1, thickness * (1 - tapering))

  // ✅ ELLIPSE DE BASE COMPLÈTE ET VISIBLE
  const ellipsePath = `M ${centerX + radiusX} ${centerY}
                      A ${radiusX} ${radiusY} 0 1 1 ${centerX - radiusX} ${centerY}
                      A ${radiusX} ${radiusY} 0 1 1 ${centerX + radiusX} ${centerY} Z`

  // ✅ QUEUE AVEC TRANSITION SEAMLESS
  const tip1X = tipPoint.x + Math.cos(perpAngle) * (tipWidth / 2)
  const tip1Y = tipPoint.y + Math.sin(perpAngle) * (tipWidth / 2)
  const tip2X = tipPoint.x - Math.cos(perpAngle) * (tipWidth / 2)
  const tip2Y = tipPoint.y - Math.sin(perpAngle) * (tipWidth / 2)

  // ✅ POINTS DE BASE QUI SE FONDENT DANS LA BULLE
  const base1X = attachmentPoint.x + Math.cos(perpAngle) * (baseWidth / 2)
  const base1Y = attachmentPoint.y + Math.sin(perpAngle) * (baseWidth / 2)
  const base2X = attachmentPoint.x - Math.cos(perpAngle) * (baseWidth / 2)
  const base2Y = attachmentPoint.y - Math.sin(perpAngle) * (baseWidth / 2)

  // ✅ QUEUE SIMPLE ET FLUIDE
  const queuePath = `M ${base1X} ${base1Y}
                    L ${tip1X} ${tip1Y}
                    L ${tip2X} ${tip2Y}
                    L ${base2X} ${base2Y} Z`

  return `${ellipsePath} ${queuePath}`
}

/**
 * Génère une forme étoilée avec queue intégrée
 */
function generateUnifiedStarWithQueue(
  centerX: number, centerY: number,
  radiusX: number, radiusY: number,
  attachmentPoint: { x: number; y: number },
  tipPoint: { x: number; y: number },
  thickness: number, tapering: number
): string {
  // Pour l'instant, utilise la méthode séparée pour les formes étoilées
  const starPath = generateShoutBubblePath(centerX, centerY, radiusX, radiusY)
  const queuePath = generateIntegratedTriangleQueue(
    attachmentPoint.x, attachmentPoint.y,
    tipPoint.x, tipPoint.y,
    thickness, tapering
  )
  return `${starPath} ${queuePath}`
}

// ✅ NOUVELLES FONCTIONS DE CALCUL D'ATTACHEMENT ADAPTATIF

/**
 * Calcule le point d'attache pour un rectangle arrondi (speech/whisper bubbles)
 * Correspond exactement à la géométrie de generateSpeechBubblePath
 */
function calculateRoundedRectAttachment(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  angleRad: number,
  type: 'speech' | 'whisper'
): { x: number; y: number } {
  const halfWidth = width / 2
  const halfHeight = height / 2

  // ✅ RAYON DES COINS - Identique à generateSpeechBubblePath
  const cornerRadius = type === 'whisper'
    ? Math.min(width, height) * 0.3
    : Math.min(width, height) * 0.2

  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  // ✅ CALCUL GÉOMÉTRIQUE PRÉCIS selon la forme réelle

  // Coordonnées du rectangle sans les coins arrondis
  const rectLeft = centerX - halfWidth
  const rectRight = centerX + halfWidth
  const rectTop = centerY - halfHeight
  const rectBottom = centerY + halfHeight

  // Zones des coins arrondis
  const cornerLeft = rectLeft + cornerRadius
  const cornerRight = rectRight - cornerRadius
  const cornerTop = rectTop + cornerRadius
  const cornerBottom = rectBottom - cornerRadius

  // ✅ DÉTERMINATION DE LA ZONE : côté droit, coin, ou côté courbe
  let attachX: number, attachY: number

  // Calculer l'intersection avec le rayon depuis le centre
  const targetX = centerX + cos * Math.max(halfWidth, halfHeight)
  const targetY = centerY + sin * Math.max(halfWidth, halfHeight)

  // ✅ LOGIQUE PAR ZONES GÉOMÉTRIQUES
  if (targetX >= cornerRight && targetY >= cornerTop && targetY <= cornerBottom) {
    // Zone droite (côté droit)
    attachX = rectRight
    attachY = centerY + sin * (halfWidth / Math.abs(cos))
    attachY = Math.max(cornerTop, Math.min(cornerBottom, attachY))
  } else if (targetX <= cornerLeft && targetY >= cornerTop && targetY <= cornerBottom) {
    // Zone gauche (côté gauche)
    attachX = rectLeft
    attachY = centerY + sin * (halfWidth / Math.abs(cos))
    attachY = Math.max(cornerTop, Math.min(cornerBottom, attachY))
  } else if (targetY <= cornerTop && targetX >= cornerLeft && targetX <= cornerRight) {
    // Zone haut (côté haut)
    attachY = rectTop
    attachX = centerX + cos * (halfHeight / Math.abs(sin))
    attachX = Math.max(cornerLeft, Math.min(cornerRight, attachX))
  } else if (targetY >= cornerBottom && targetX >= cornerLeft && targetX <= cornerRight) {
    // Zone bas (côté bas)
    attachY = rectBottom
    attachX = centerX + cos * (halfHeight / Math.abs(sin))
    attachX = Math.max(cornerLeft, Math.min(cornerRight, attachX))
  } else {
    // ✅ ZONES DE COINS ARRONDIS - Calcul sur la courbe circulaire
    let cornerCenterX: number, cornerCenterY: number

    if (targetX > cornerRight && targetY < cornerTop) {
      // Coin haut-droit
      cornerCenterX = cornerRight
      cornerCenterY = cornerTop
    } else if (targetX < cornerLeft && targetY < cornerTop) {
      // Coin haut-gauche
      cornerCenterX = cornerLeft
      cornerCenterY = cornerTop
    } else if (targetX < cornerLeft && targetY > cornerBottom) {
      // Coin bas-gauche
      cornerCenterX = cornerLeft
      cornerCenterY = cornerBottom
    } else {
      // Coin bas-droit
      cornerCenterX = cornerRight
      cornerCenterY = cornerBottom
    }

    // ✅ INTERSECTION AVEC LE CERCLE DU COIN
    const deltaX = centerX - cornerCenterX
    const deltaY = centerY - cornerCenterY
    const angleToCorner = Math.atan2(deltaY, deltaX)

    attachX = cornerCenterX + Math.cos(angleToCorner) * cornerRadius
    attachY = cornerCenterY + Math.sin(angleToCorner) * cornerRadius
  }

  return { x: attachX, y: attachY }
}

/**
 * Calcule le point d'attache pour une ellipse pure (thought bubbles)
 */
function calculateEllipticalAttachment(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  angleRad: number
): { x: number; y: number } {
  const radiusX = width / 2
  const radiusY = height / 2
  const cos = Math.cos(angleRad)
  const sin = Math.sin(angleRad)

  // ✅ FORMULE ELLIPTIQUE CLASSIQUE CORRIGÉE
  const denominator = Math.sqrt((radiusY * cos) ** 2 + (radiusX * sin) ** 2)

  return {
    x: centerX + (radiusX * radiusY * cos) / denominator,
    y: centerY + (radiusX * radiusY * sin) / denominator
  }
}

/**
 * Calcule le point d'attache pour une forme étoilée (shout bubbles)
 */
function calculateStarAttachment(
  centerX: number,
  centerY: number,
  width: number,
  height: number,
  angleRad: number
): { x: number; y: number } {
  const outerRadius = Math.min(width, height) / 2
  const safetyMargin = 3

  // ✅ ATTACHEMENT SUR LE RAYON EXTÉRIEUR DE L'ÉTOILE
  return {
    x: centerX + Math.cos(angleRad) * (outerRadius - safetyMargin),
    y: centerY + Math.sin(angleRad) * (outerRadius - safetyMargin)
  }
}

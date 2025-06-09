// Gestionnaire centralisé pour la manipulation des bulles de dialogue
// Gère le redimensionnement, le déplacement de queue, et les contraintes

import { DialogueElement, AssemblyElement } from '../types/assembly.types'

export enum HandleType {
  CORNER_NW = 0,
  CORNER_NE = 1, 
  CORNER_SW = 2,
  CORNER_SE = 3,
  EDGE_N = 4,
  EDGE_S = 5,
  EDGE_W = 6,
  EDGE_E = 7,
  TAIL = 8
}

export interface ManipulationState {
  isActive: boolean
  element: DialogueElement | null
  handleType: HandleType
  startPos: { x: number, y: number }
  startTransform: {
    x: number
    y: number
    width: number
    height: number
  }
  startTailPercent?: number
}

export interface BubbleConstraints {
  minWidth: number
  minHeight: number
  maxWidth: number
  maxHeight: number
  maintainAspectRatio?: boolean
  tailMinPercent: number
  tailMaxPercent: number
  // ✅ CONTRAINTES DE LONGUEUR DE QUEUE
  minTailLength: number
  maxTailLength: number
}

export class BubbleManipulationManager {
  private state: ManipulationState = {
    isActive: false,
    element: null,
    handleType: HandleType.CORNER_NW,
    startPos: { x: 0, y: 0 },
    startTransform: { x: 0, y: 0, width: 0, height: 0 }
  }

  private constraints: BubbleConstraints = {
    minWidth: 60,
    minHeight: 40,
    maxWidth: 400,
    maxHeight: 300,
    tailMinPercent: 0.1,
    tailMaxPercent: 0.9,
    // ✅ LONGUEUR DE QUEUE ILLIMITÉE
    minTailLength: 10,      // Longueur minimum pour visibilité
    maxTailLength: Infinity // ✅ AUCUNE LIMITE MAXIMUM !
  }

  private updateCallback: ((elementId: string, updates: Partial<AssemblyElement>) => void) | null = null

  constructor(updateCallback: (elementId: string, updates: Partial<AssemblyElement>) => void) {
    this.updateCallback = updateCallback
  }

  /**
   * Met à jour la position de la queue quand la bulle entière est déplacée
   */
  static updateTailAfterBubbleMove(element: DialogueElement, deltaX: number, deltaY: number): Partial<DialogueElement> {
    if (!element.bubbleStyle.tailAbsoluteX || !element.bubbleStyle.tailAbsoluteY) {
      return {} // Pas de queue 360° à mettre à jour
    }

    return {
      bubbleStyle: {
        ...element.bubbleStyle,
        tailAbsoluteX: element.bubbleStyle.tailAbsoluteX + deltaX,
        tailAbsoluteY: element.bubbleStyle.tailAbsoluteY + deltaY
      }
    }
  }

  /**
   * Démarre une manipulation (redimensionnement ou déplacement de queue)
   */
  startManipulation(
    element: DialogueElement, 
    handleType: HandleType, 
    globalX: number, 
    globalY: number
  ): void {
    this.state = {
      isActive: true,
      element,
      handleType,
      startPos: { x: globalX, y: globalY },
      startTransform: { ...element.transform },
      startTailPercent: element.bubbleStyle.tailPositionPercent || 0.25
    }

    console.log('🔧 Manipulation démarrée:', {
      elementId: element.id,
      handleType: HandleType[handleType],
      startPos: this.state.startPos,
      startTransform: this.state.startTransform
    })
  }

  /**
   * Met à jour la manipulation en cours
   */
  updateManipulation(globalX: number, globalY: number): void {
    if (!this.state.isActive || !this.state.element || !this.updateCallback) {
      return
    }

    const deltaX = globalX - this.state.startPos.x
    const deltaY = globalY - this.state.startPos.y

    if (this.state.handleType === HandleType.TAIL) {
      this.updateTailPosition(globalX, globalY)
    } else {
      this.updateBubbleSize(deltaX, deltaY)
    }
  }

  /**
   * Termine la manipulation
   */
  endManipulation(): void {
    if (this.state.isActive) {
      console.log('🔧 Manipulation terminée pour:', this.state.element?.id)
      this.state.isActive = false
      this.state.element = null
    }
  }

  /**
   * Vérifie si une manipulation est en cours
   */
  isManipulating(): boolean {
    return this.state.isActive
  }

  /**
   * Met à jour la taille de la bulle selon le handle
   */
  private updateBubbleSize(deltaX: number, deltaY: number): void {
    if (!this.state.element || !this.updateCallback) return

    const newTransform = this.calculateNewTransform(deltaX, deltaY)
    const constrainedTransform = this.applyConstraints(newTransform)

    // ✅ RECALCULER LES COORDONNÉES ABSOLUES DE LA QUEUE APRÈS REDIMENSIONNEMENT
    const updatedElement = {
      ...this.state.element,
      transform: { ...this.state.element.transform, ...constrainedTransform }
    }

    const newTailPosition = this.recalculateTailAbsolutePosition(updatedElement)

    console.log('🔧 BubbleManipulationManager updateBubbleSize:', {
      elementId: this.state.element.id,
      deltaX,
      deltaY,
      constrainedTransform,
      newTailPosition
    })

    this.updateCallback(this.state.element.id, {
      transform: {
        ...this.state.element.transform,
        ...constrainedTransform
      },
      bubbleStyle: {
        ...this.state.element.bubbleStyle,
        tailAbsoluteX: newTailPosition.x,
        tailAbsoluteY: newTailPosition.y
      }
    })
  }

  /**
   * Recalcule les coordonnées absolues de la queue après un changement de bulle
   */
  private recalculateTailAbsolutePosition(element: DialogueElement): { x: number, y: number } {
    const centerX = element.transform.x + element.transform.width / 2
    const centerY = element.transform.y + element.transform.height / 2

    const angle = element.bubbleStyle.tailAngleDegrees ?? 225
    const length = element.bubbleStyle.tailLength ?? 30

    // Calculer le nouveau point d'attachement
    const attachmentPoint = this.calculateAttachmentPoint(element, angle)

    // Calculer la nouvelle position finale
    const angleRad = angle * Math.PI / 180
    return {
      x: attachmentPoint.x + Math.cos(angleRad) * length,
      y: attachmentPoint.y + Math.sin(angleRad) * length
    }
  }

  /**
   * Met à jour la position de la queue avec système 360° dynamique
   * ✅ LONGUEUR ILLIMITÉE : La queue peut s'étendre sans limite maximum
   */
  private updateTailPosition(globalX: number, globalY: number): void {
    if (!this.state.element || !this.updateCallback) return

    const bubble = this.state.element
    const bubbleCenterX = bubble.transform.x + bubble.transform.width / 2
    const bubbleCenterY = bubble.transform.y + bubble.transform.height / 2

    // ✅ CALCUL 360° : Position absolue de la queue
    const tailAbsoluteX = globalX
    const tailAbsoluteY = globalY

    // ✅ CALCUL DE LA LONGUEUR DE LA QUEUE SANS LIMITE MAXIMUM
    const deltaX = tailAbsoluteX - bubbleCenterX
    const deltaY = tailAbsoluteY - bubbleCenterY
    const tailLength = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // ✅ CONTRAINTES : Seulement longueur minimum, PAS de maximum !
    const constrainedLength = Math.max(this.constraints.minTailLength, tailLength)

    // ✅ CALCUL DE L'ANGLE EN DEGRÉS (0-360°)
    let angleDegrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
    if (angleDegrees < 0) angleDegrees += 360

    // ✅ DÉTERMINATION AUTOMATIQUE DU CÔTÉ D'ATTACHEMENT
    const attachmentSide = this.calculateAttachmentSide(angleDegrees)

    // ✅ CALCUL DU POINT D'ATTACHEMENT SUR LE BORD DE LA BULLE
    const attachmentPoint = this.calculateAttachmentPoint(bubble, angleDegrees)

    // ✅ RECALCULER LA POSITION FINALE DE LA QUEUE AVEC LA LONGUEUR CONTRAINTE
    const finalTailX = attachmentPoint.x + Math.cos(angleDegrees * Math.PI / 180) * constrainedLength
    const finalTailY = attachmentPoint.y + Math.sin(angleDegrees * Math.PI / 180) * constrainedLength

    this.updateCallback(this.state.element.id, {
      bubbleStyle: {
        ...this.state.element.bubbleStyle,
        // Nouvelles propriétés 360°
        tailAbsoluteX: finalTailX,
        tailAbsoluteY: finalTailY,
        tailLength: constrainedLength,
        tailAngleDegrees: angleDegrees,
        tailAttachmentSide: attachmentSide,
        // Garder les anciennes pour compatibilité
        tailPositionPercent: 0.5
      }
    })

    console.log('🎯 Queue 360° repositionnée (LONGUEUR ILLIMITÉE):', {
      tailAbsoluteX: finalTailX,
      tailAbsoluteY: finalTailY,
      tailLength: constrainedLength,
      originalLength: tailLength,
      isLengthConstrained: constrainedLength !== tailLength,
      angleDegrees: angleDegrees.toFixed(1),
      attachmentSide,
      attachmentPoint
    })
  }

  /**
   * Calcule le côté d'attachement selon l'angle
   */
  private calculateAttachmentSide(angleDegrees: number): 'top' | 'bottom' | 'left' | 'right' {
    // Normaliser l'angle entre 0-360
    const angle = ((angleDegrees % 360) + 360) % 360

    if (angle >= 315 || angle < 45) return 'right'
    if (angle >= 45 && angle < 135) return 'bottom'
    if (angle >= 135 && angle < 225) return 'left'
    return 'top'
  }

  /**
   * Calcule le point d'attachement exact sur le bord de la bulle
   */
  private calculateAttachmentPoint(bubble: DialogueElement, angleDegrees: number): { x: number, y: number } {
    const centerX = bubble.transform.x + bubble.transform.width / 2
    const centerY = bubble.transform.y + bubble.transform.height / 2
    const halfWidth = bubble.transform.width / 2
    const halfHeight = bubble.transform.height / 2

    const angleRad = angleDegrees * Math.PI / 180

    // Calculer l'intersection avec le rectangle de la bulle
    const dx = Math.cos(angleRad)
    const dy = Math.sin(angleRad)

    // Trouver l'intersection avec les bords du rectangle
    let t = Infinity

    // Bord droit
    if (dx > 0) t = Math.min(t, halfWidth / dx)
    // Bord gauche
    if (dx < 0) t = Math.min(t, -halfWidth / dx)
    // Bord bas
    if (dy > 0) t = Math.min(t, halfHeight / dy)
    // Bord haut
    if (dy < 0) t = Math.min(t, -halfHeight / dy)

    return {
      x: centerX + dx * t,
      y: centerY + dy * t
    }
  }

  /**
   * Calcule la nouvelle transformation selon le type de handle
   */
  private calculateNewTransform(deltaX: number, deltaY: number) {
    const { x, y, width, height } = this.state.startTransform
    const newTransform = { x, y, width, height }

    switch (this.state.handleType) {
      case HandleType.CORNER_NW:
        newTransform.x = x + deltaX
        newTransform.y = y + deltaY
        newTransform.width = width - deltaX
        newTransform.height = height - deltaY
        break

      case HandleType.CORNER_NE:
        newTransform.y = y + deltaY
        newTransform.width = width + deltaX
        newTransform.height = height - deltaY
        break

      case HandleType.CORNER_SW:
        newTransform.x = x + deltaX
        newTransform.width = width - deltaX
        newTransform.height = height + deltaY
        break

      case HandleType.CORNER_SE:
        newTransform.width = width + deltaX
        newTransform.height = height + deltaY
        break

      case HandleType.EDGE_N:
        newTransform.y = y + deltaY
        newTransform.height = height - deltaY
        break

      case HandleType.EDGE_S:
        newTransform.height = height + deltaY
        break

      case HandleType.EDGE_W:
        newTransform.x = x + deltaX
        newTransform.width = width - deltaX
        break

      case HandleType.EDGE_E:
        newTransform.width = width + deltaX
        break
    }

    return newTransform
  }

  /**
   * Applique les contraintes de taille
   */
  private applyConstraints(transform: any) {
    const { x, y } = transform
    let { width, height } = transform

    // Contraintes de taille minimum
    if (width < this.constraints.minWidth) {
      width = this.constraints.minWidth
    }
    if (height < this.constraints.minHeight) {
      height = this.constraints.minHeight
    }

    // Contraintes de taille maximum
    if (width > this.constraints.maxWidth) {
      width = this.constraints.maxWidth
    }
    if (height > this.constraints.maxHeight) {
      height = this.constraints.maxHeight
    }

    return { x, y, width, height }
  }

  /**
   * Obtient le curseur approprié pour un type de handle
   */
  static getHandleCursor(handleType: HandleType): string {
    switch (handleType) {
      case HandleType.CORNER_NW:
      case HandleType.CORNER_SE:
        return 'nw-resize'
      case HandleType.CORNER_NE:
      case HandleType.CORNER_SW:
        return 'ne-resize'
      case HandleType.EDGE_N:
      case HandleType.EDGE_S:
        return 'n-resize'
      case HandleType.EDGE_W:
      case HandleType.EDGE_E:
        return 'e-resize'
      case HandleType.TAIL:
        return 'move'
      default:
        return 'pointer'
    }
  }

  /**
   * Calcule la position EXACTE du bout de la queue (où le handle doit être)
   */
  static calculateTailPosition(element: DialogueElement): { x: number, y: number } {
    // ✅ CALCUL UNIFIÉ : Toujours calculer depuis l'angle et la longueur
    const centerX = element.transform.x + element.transform.width / 2
    const centerY = element.transform.y + element.transform.height / 2

    // Utiliser les propriétés 360° si disponibles
    const angle = element.bubbleStyle.tailAngleDegrees ?? 225 // Par défaut bas-gauche
    const length = element.bubbleStyle.tailLength ?? 30

    // Calculer le point d'attachement sur le bord de la bulle
    const attachmentPoint = BubbleManipulationManager.calculateTailAttachmentPoint(element)

    // Calculer la position finale du bout de la queue
    const angleRad = angle * Math.PI / 180
    const tailEndX = attachmentPoint.x + Math.cos(angleRad) * length
    const tailEndY = attachmentPoint.y + Math.sin(angleRad) * length

    console.log('🎯 Position bout de queue calculée:', {
      elementId: element.id,
      angle,
      length,
      attachmentPoint,
      tailEnd: { x: tailEndX, y: tailEndY }
    })

    return {
      x: tailEndX,
      y: tailEndY
    }
  }

  /**
   * Calcule le point d'attachement de la queue sur la bulle
   */
  static calculateTailAttachmentPoint(element: DialogueElement): { x: number, y: number } {
    if (element.bubbleStyle.tailAngleDegrees !== undefined) {
      // Utiliser le système 360° pour calculer le point d'attachement
      const centerX = element.transform.x + element.transform.width / 2
      const centerY = element.transform.y + element.transform.height / 2
      const halfWidth = element.transform.width / 2
      const halfHeight = element.transform.height / 2

      const angleRad = element.bubbleStyle.tailAngleDegrees * Math.PI / 180
      const dx = Math.cos(angleRad)
      const dy = Math.sin(angleRad)

      // Trouver l'intersection avec les bords du rectangle
      let t = Infinity

      if (dx > 0) t = Math.min(t, halfWidth / dx)
      if (dx < 0) t = Math.min(t, -halfWidth / dx)
      if (dy > 0) t = Math.min(t, halfHeight / dy)
      if (dy < 0) t = Math.min(t, -halfHeight / dy)

      return {
        x: centerX + dx * t,
        y: centerY + dy * t
      }
    }

    // Fallback vers l'ancien système
    return BubbleManipulationManager.calculateTailPosition(element)
  }
}

// Gestionnaire de manipulation pour les bulles HTML - Inspiré de PanelTool
// Gère le drag & drop, redimensionnement et manipulation des bulles HTML

import { DialogueElement } from '../types/assembly.types'

export enum HandleType {
  // Coins
  CORNER_NW = 0,
  CORNER_NE = 1,
  CORNER_SW = 2,
  CORNER_SE = 3,
  // Bords
  EDGE_N = 4,
  EDGE_S = 5,
  EDGE_W = 6,
  EDGE_E = 7,
  // Queue
  TAIL = 8,
  // Déplacement
  MOVE = 9
}

export interface ManipulationState {
  isActive: boolean
  type: 'move' | 'resize' | 'tail'
  handleType: HandleType
  element: DialogueElement
  startPos: { x: number; y: number }
  elementStartPos: { x: number; y: number }
  elementStartSize: { width: number; height: number }
  startTailPos: { x: number; y: number }
}

export class BubbleManipulationHandler {
  private state: ManipulationState | null = null
  private onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void

  constructor(onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void) {
    this.onUpdate = onUpdate
  }

  /**
   * Démarre la manipulation d'une bulle
   */
  startManipulation(
    element: DialogueElement,
    handleType: HandleType,
    clientX: number,
    clientY: number
  ): void {
    console.log('🔧 Démarrage manipulation bulle HTML:', {
      elementId: element.id,
      handleType: HandleType[handleType],
      position: { clientX, clientY }
    })

    // Déterminer le type de manipulation
    let manipulationType: 'move' | 'resize' | 'tail'
    if (handleType === HandleType.TAIL) {
      manipulationType = 'tail'
    } else if (handleType === HandleType.MOVE) {
      manipulationType = 'move'
    } else {
      manipulationType = 'resize'
    }

    this.state = {
      isActive: true,
      type: manipulationType,
      handleType,
      element,
      startPos: { x: clientX, y: clientY },
      elementStartPos: { x: element.transform.x, y: element.transform.y },
      elementStartSize: { width: element.transform.width, height: element.transform.height },
      startTailPos: { 
        x: element.bubbleStyle.tailAbsoluteX, 
        y: element.bubbleStyle.tailAbsoluteY 
      }
    }

    // Ajouter les event listeners globaux
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('mouseup', this.handleMouseUp)
    document.body.style.cursor = this.getHandleCursor(handleType)
    document.body.style.userSelect = 'none'

    console.log('✅ Manipulation démarrée:', manipulationType)
  }

  /**
   * Gère le mouvement de la souris pendant la manipulation
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.state) return

    const deltaX = event.clientX - this.state.startPos.x
    const deltaY = event.clientY - this.state.startPos.y

    switch (this.state.type) {
      case 'move':
        this.handleMove(deltaX, deltaY)
        break
      case 'resize':
        this.handleResize(deltaX, deltaY)
        break
      case 'tail':
        this.handleTailMove(event.clientX, event.clientY)
        break
    }
  }

  /**
   * Gère le déplacement de la bulle
   */
  private handleMove(deltaX: number, deltaY: number): void {
    if (!this.state) return

    const newX = this.state.elementStartPos.x + deltaX
    const newY = this.state.elementStartPos.y + deltaY

    this.onUpdate(this.state.element.id, {
      transform: {
        ...this.state.element.transform,
        x: newX,
        y: newY
      }
    })
  }

  /**
   * Gère le redimensionnement de la bulle
   */
  private handleResize(deltaX: number, deltaY: number): void {
    if (!this.state) return

    const { handleType, elementStartPos, elementStartSize } = this.state
    let newX = elementStartPos.x
    let newY = elementStartPos.y
    let newWidth = elementStartSize.width
    let newHeight = elementStartSize.height

    // Logique de redimensionnement selon le handle (identique aux panels)
    switch (handleType) {
      case HandleType.CORNER_NW:
        newX = elementStartPos.x + deltaX
        newY = elementStartPos.y + deltaY
        newWidth = elementStartSize.width - deltaX
        newHeight = elementStartSize.height - deltaY
        break
      case HandleType.CORNER_NE:
        newY = elementStartPos.y + deltaY
        newWidth = elementStartSize.width + deltaX
        newHeight = elementStartSize.height - deltaY
        break
      case HandleType.CORNER_SW:
        newX = elementStartPos.x + deltaX
        newWidth = elementStartSize.width - deltaX
        newHeight = elementStartSize.height + deltaY
        break
      case HandleType.CORNER_SE:
        newWidth = elementStartSize.width + deltaX
        newHeight = elementStartSize.height + deltaY
        break
      case HandleType.EDGE_N:
        newY = elementStartPos.y + deltaY
        newHeight = elementStartSize.height - deltaY
        break
      case HandleType.EDGE_S:
        newHeight = elementStartSize.height + deltaY
        break
      case HandleType.EDGE_W:
        newX = elementStartPos.x + deltaX
        newWidth = elementStartSize.width - deltaX
        break
      case HandleType.EDGE_E:
        newWidth = elementStartSize.width + deltaX
        break
    }

    // Contraintes de taille minimale
    const minWidth = 80
    const minHeight = 40
    newWidth = Math.max(newWidth, minWidth)
    newHeight = Math.max(newHeight, minHeight)

    // Ajuster la position si la taille minimale est atteinte
    if (newWidth === minWidth && (handleType === HandleType.CORNER_NW || handleType === HandleType.CORNER_SW || handleType === HandleType.EDGE_W)) {
      newX = elementStartPos.x + elementStartSize.width - minWidth
    }
    if (newHeight === minHeight && (handleType === HandleType.CORNER_NW || handleType === HandleType.CORNER_NE || handleType === HandleType.EDGE_N)) {
      newY = elementStartPos.y + elementStartSize.height - minHeight
    }

    this.onUpdate(this.state.element.id, {
      transform: {
        ...this.state.element.transform,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }
    })
  }

  /**
   * Gère le déplacement de la queue
   */
  private handleTailMove(clientX: number, clientY: number): void {
    if (!this.state) return

    // Convertir les coordonnées client en coordonnées relatives à la bulle
    // Pour simplifier, on utilise les coordonnées absolues
    this.onUpdate(this.state.element.id, {
      bubbleStyle: {
        ...this.state.element.bubbleStyle,
        tailAbsoluteX: clientX,
        tailAbsoluteY: clientY
      }
    })
  }

  /**
   * Termine la manipulation
   */
  private handleMouseUp = (): void => {
    if (!this.state) return

    console.log('✅ Manipulation terminée pour:', this.state.element.id)

    // Nettoyer les event listeners
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('mouseup', this.handleMouseUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''

    this.state = null
  }

  /**
   * Obtient le curseur approprié pour un handle
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
      case HandleType.MOVE:
        return 'move'
      default:
        return 'default'
    }
  }

  /**
   * Obtient le curseur approprié pour un handle (méthode d'instance)
   */
  getHandleCursor(handleType: HandleType): string {
    return BubbleManipulationHandler.getHandleCursor(handleType)
  }

  /**
   * Vérifie si une manipulation est en cours
   */
  get isActive(): boolean {
    return this.state?.isActive || false
  }

  /**
   * Annule la manipulation en cours
   */
  cancelManipulation(): void {
    if (this.state) {
      document.removeEventListener('mousemove', this.handleMouseMove)
      document.removeEventListener('mouseup', this.handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      this.state = null
    }
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.cancelManipulation()
  }
}

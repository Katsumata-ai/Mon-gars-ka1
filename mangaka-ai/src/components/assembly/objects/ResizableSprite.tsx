// Sprite redimensionnable avec 8 handles pour PixiJS v8
import { Container, Graphics, Sprite, Texture, FederatedPointerEvent } from 'pixi.js'
import { SpriteElement, ResizeHandle } from '../types/assembly.types'

// Interface pour les événements de redimensionnement
interface ResizeEvent {
  elementId: string
  newWidth: number
  newHeight: number
  newX: number
  newY: number
  maintainAspectRatio: boolean
}

// Classe pour gérer un sprite redimensionnable
export class ResizableSprite extends Container {
  private spriteElement: SpriteElement
  private mainSprite: Sprite
  private selectionBorder: Graphics
  private resizeHandles: Map<string, Graphics> = new Map()
  private isDragging = false
  private isResizing = false
  private dragStartPos = { x: 0, y: 0 }
  private elementStartPos = { x: 0, y: 0 }
  private elementStartSize = { width: 0, height: 0 }
  private activeHandle: string | null = null
  private onUpdate?: (element: SpriteElement) => void
  private onResize?: (event: ResizeEvent) => void

  // Positions des handles de redimensionnement
  private readonly HANDLE_POSITIONS: ResizeHandle[] = [
    { id: 'top-left', position: 'top-left', cursor: 'nw-resize', x: 0, y: 0 },
    { id: 'top-center', position: 'top-center', cursor: 'n-resize', x: 0.5, y: 0 },
    { id: 'top-right', position: 'top-right', cursor: 'ne-resize', x: 1, y: 0 },
    { id: 'middle-right', position: 'middle-right', cursor: 'e-resize', x: 1, y: 0.5 },
    { id: 'bottom-right', position: 'bottom-right', cursor: 'se-resize', x: 1, y: 1 },
    { id: 'bottom-center', position: 'bottom-center', cursor: 's-resize', x: 0.5, y: 1 },
    { id: 'bottom-left', position: 'bottom-left', cursor: 'sw-resize', x: 0, y: 1 },
    { id: 'middle-left', position: 'middle-left', cursor: 'w-resize', x: 0, y: 0.5 }
  ]

  constructor(
    element: SpriteElement,
    texture: Texture,
    onUpdate?: (element: SpriteElement) => void,
    onResize?: (event: ResizeEvent) => void
  ) {
    super()

    this.spriteElement = element
    this.onUpdate = onUpdate
    this.onResize = onResize

    // Créer le sprite principal
    this.mainSprite = new Sprite(texture)
    this.mainSprite.width = element.transform.width
    this.mainSprite.height = element.transform.height
    this.addChild(this.mainSprite)

    // Créer la bordure de sélection
    this.selectionBorder = new Graphics()
    this.addChild(this.selectionBorder)

    // Créer les handles de redimensionnement
    this.createResizeHandles()

    // Configurer la position et les propriétés
    this.updateTransform()
    this.updateVisibility()

    // Configurer les événements
    this.setupEvents()
  }

  // Créer les handles de redimensionnement
  private createResizeHandles() {
    this.HANDLE_POSITIONS.forEach(handleDef => {
      const handle = new Graphics()
      
      // Dessiner le handle
      handle.rect(-4, -4, 8, 8)
      handle.fill(0xFFFFFF)
      handle.stroke({ width: 1, color: 0x3B82F6 })

      // Configurer l'interactivité
      handle.eventMode = 'static'
      handle.cursor = handleDef.cursor

      // Événements de redimensionnement
      handle.on('pointerdown', (event: FederatedPointerEvent) => {
        this.startResize(event, handleDef.id)
      })

      this.resizeHandles.set(handleDef.id, handle)
      this.addChild(handle)
    })
  }

  // Configurer les événements principaux
  private setupEvents() {
    // Rendre le sprite principal interactif
    this.mainSprite.eventMode = 'static'
    this.mainSprite.cursor = 'move'

    // Événements de drag
    this.mainSprite.on('pointerdown', this.startDrag.bind(this))

    // Événements globaux (ajoutés au stage)
    if (this.parent) {
      const stage = this.parent
      stage.on('pointermove', this.onPointerMove.bind(this))
      stage.on('pointerup', this.onPointerUp.bind(this))
      stage.on('pointerupoutside', this.onPointerUp.bind(this))
    }
  }

  // Démarrer le drag
  private startDrag(event: FederatedPointerEvent) {
    if (this.isResizing) return

    this.isDragging = true
    this.dragStartPos = { x: event.global.x, y: event.global.y }
    this.elementStartPos = { x: this.spriteElement.transform.x, y: this.spriteElement.transform.y }

    event.stopPropagation()
  }

  // Démarrer le redimensionnement
  private startResize(event: FederatedPointerEvent, handleId: string) {
    this.isResizing = true
    this.activeHandle = handleId
    this.dragStartPos = { x: event.global.x, y: event.global.y }
    this.elementStartPos = { x: this.spriteElement.transform.x, y: this.spriteElement.transform.y }
    this.elementStartSize = { 
      width: this.spriteElement.transform.width, 
      height: this.spriteElement.transform.height 
    }

    event.stopPropagation()
  }

  // Gérer le mouvement du pointeur
  private onPointerMove(event: FederatedPointerEvent) {
    if (!this.isDragging && !this.isResizing) return

    const deltaX = event.global.x - this.dragStartPos.x
    const deltaY = event.global.y - this.dragStartPos.y

    if (this.isDragging) {
      // Déplacer l'élément
      this.spriteElement.transform.x = this.elementStartPos.x + deltaX
      this.spriteElement.transform.y = this.elementStartPos.y + deltaY
      this.updateTransform()
      this.onUpdate?.(this.spriteElement)
    } else if (this.isResizing && this.activeHandle) {
      // Redimensionner l'élément
      this.handleResize(deltaX, deltaY, event.shiftKey)
    }
  }

  // Gérer le redimensionnement selon le handle actif
  private handleResize(deltaX: number, deltaY: number, maintainAspectRatio: boolean) {
    if (!this.activeHandle) return

    const originalAspectRatio = this.elementStartSize.width / this.elementStartSize.height
    let newWidth = this.elementStartSize.width
    let newHeight = this.elementStartSize.height
    let newX = this.elementStartPos.x
    let newY = this.elementStartPos.y

    switch (this.activeHandle) {
      case 'top-left':
        newWidth = this.elementStartSize.width - deltaX
        newHeight = this.elementStartSize.height - deltaY
        newX = this.elementStartPos.x + deltaX
        newY = this.elementStartPos.y + deltaY
        break
      case 'top-center':
        newHeight = this.elementStartSize.height - deltaY
        newY = this.elementStartPos.y + deltaY
        break
      case 'top-right':
        newWidth = this.elementStartSize.width + deltaX
        newHeight = this.elementStartSize.height - deltaY
        newY = this.elementStartPos.y + deltaY
        break
      case 'middle-right':
        newWidth = this.elementStartSize.width + deltaX
        break
      case 'bottom-right':
        newWidth = this.elementStartSize.width + deltaX
        newHeight = this.elementStartSize.height + deltaY
        break
      case 'bottom-center':
        newHeight = this.elementStartSize.height + deltaY
        break
      case 'bottom-left':
        newWidth = this.elementStartSize.width - deltaX
        newHeight = this.elementStartSize.height + deltaY
        newX = this.elementStartPos.x + deltaX
        break
      case 'middle-left':
        newWidth = this.elementStartSize.width - deltaX
        newX = this.elementStartPos.x + deltaX
        break
    }

    // Maintenir les proportions si Shift est pressé
    if (maintainAspectRatio) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newHeight = newWidth / originalAspectRatio
      } else {
        newWidth = newHeight * originalAspectRatio
      }
    }

    // Appliquer les tailles minimales
    newWidth = Math.max(20, newWidth)
    newHeight = Math.max(20, newHeight)

    // Mettre à jour l'élément
    this.spriteElement.transform.x = newX
    this.spriteElement.transform.y = newY
    this.spriteElement.transform.width = newWidth
    this.spriteElement.transform.height = newHeight

    this.updateTransform()
    this.onUpdate?.(this.spriteElement)

    // Déclencher l'événement de redimensionnement
    this.onResize?.({
      elementId: this.spriteElement.id,
      newWidth,
      newHeight,
      newX,
      newY,
      maintainAspectRatio
    })
  }

  // Terminer le drag/resize
  private onPointerUp() {
    this.isDragging = false
    this.isResizing = false
    this.activeHandle = null
  }

  // Mettre à jour la transformation
  private updateTransform() {
    const transform = this.spriteElement.transform
    
    this.x = transform.x
    this.y = transform.y
    this.rotation = transform.rotation
    this.alpha = transform.alpha
    this.zIndex = transform.zIndex

    // Mettre à jour la taille du sprite
    this.mainSprite.width = transform.width
    this.mainSprite.height = transform.height

    // Mettre à jour la bordure de sélection
    this.updateSelectionBorder()

    // Mettre à jour les positions des handles
    this.updateHandlePositions()
  }

  // Mettre à jour la bordure de sélection
  private updateSelectionBorder() {
    this.selectionBorder.clear()
    
    if (this.spriteElement.properties.visible) {
      this.selectionBorder.rect(0, 0, this.spriteElement.transform.width, this.spriteElement.transform.height)
      this.selectionBorder.stroke({ width: 2, color: 0x3B82F6, alpha: 0.8 })
    }
  }

  // Mettre à jour les positions des handles
  private updateHandlePositions() {
    const width = this.spriteElement.transform.width
    const height = this.spriteElement.transform.height

    this.HANDLE_POSITIONS.forEach(handleDef => {
      const handle = this.resizeHandles.get(handleDef.id)
      if (handle) {
        handle.x = width * handleDef.x
        handle.y = height * handleDef.y
      }
    })
  }

  // Mettre à jour la visibilité
  private updateVisibility() {
    this.visible = this.spriteElement.properties.visible
    
    // Masquer les handles si l'élément est verrouillé
    const handlesVisible = !this.spriteElement.properties.locked
    this.resizeHandles.forEach(handle => {
      handle.visible = handlesVisible
    })
    this.selectionBorder.visible = handlesVisible
  }

  // Mettre à jour l'élément
  updateElement(element: SpriteElement) {
    this.spriteElement = element
    this.updateTransform()
    this.updateVisibility()
  }

  // Définir l'état de sélection
  setSelected(selected: boolean) {
    this.selectionBorder.visible = selected && !this.spriteElement.properties.locked
    this.resizeHandles.forEach(handle => {
      handle.visible = selected && !this.spriteElement.properties.locked
    })
  }

  // Nettoyer les ressources
  destroy() {
    this.resizeHandles.clear()
    super.destroy({ children: true })
  }
}

// Factory function pour créer un ResizableSprite
export function createResizableSprite(
  element: SpriteElement,
  texture: Texture,
  onUpdate?: (element: SpriteElement) => void,
  onResize?: (event: ResizeEvent) => void
): ResizableSprite {
  return new ResizableSprite(element, texture, onUpdate, onResize)
}

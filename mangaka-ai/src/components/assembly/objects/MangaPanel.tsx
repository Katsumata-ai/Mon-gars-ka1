// Panels manga avec formes multiples pour PixiJS v8
import { Container, Graphics, FederatedPointerEvent } from 'pixi.js'
import { PanelElement, PanelShape } from '../types/assembly.types'

// Interface pour les événements de panel
interface PanelEvent {
  elementId: string
  newWidth: number
  newHeight: number
  newX: number
  newY: number
  shape: PanelShape
}

// Classe pour gérer un panel manga
export class MangaPanel extends Container {
  private panelElement: PanelElement
  private panelGraphics: Graphics
  private selectionBorder: Graphics
  private resizeHandles: Graphics[] = []
  private isDragging = false
  private isResizing = false
  private dragStartPos = { x: 0, y: 0 }
  private elementStartPos = { x: 0, y: 0 }
  private elementStartSize = { width: 0, height: 0 }
  private activeHandle = -1
  private onUpdate?: (element: PanelElement) => void
  private onResize?: (event: PanelEvent) => void

  // 🆕 SYSTÈME DE FEEDBACK VISUEL
  private feedbackOverlay: Graphics
  private feedbackIcon: Graphics
  private feedbackState: 'none' | 'drop' | 'replace' = 'none'

  constructor(
    element: PanelElement,
    onUpdate?: (element: PanelElement) => void,
    onResize?: (event: PanelEvent) => void
  ) {
    super()

    this.panelElement = element
    this.onUpdate = onUpdate
    this.onResize = onResize

    // Créer les composants
    this.panelGraphics = new Graphics()
    this.selectionBorder = new Graphics()

    // 🆕 Créer les composants de feedback visuel
    this.feedbackOverlay = new Graphics()
    this.feedbackIcon = new Graphics()
    this.feedbackOverlay.visible = false
    this.feedbackIcon.visible = false

    this.addChild(this.panelGraphics)
    this.addChild(this.feedbackOverlay) // 🆕 Overlay au-dessus du panel
    this.addChild(this.feedbackIcon) // 🆕 Icône au-dessus de l'overlay
    this.addChild(this.selectionBorder)

    // Créer les handles de redimensionnement
    this.createResizeHandles()

    // Configurer et dessiner
    this.updatePanel()
    this.updateTransform()
    this.setupEvents()
  }

  // Créer les handles de redimensionnement
  private createResizeHandles() {
    const positions = [
      { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
      { x: 1, y: 0.5 }, { x: 1, y: 1 }, { x: 0.5, y: 1 },
      { x: 0, y: 1 }, { x: 0, y: 0.5 }
    ]

    positions.forEach((pos, index) => {
      const handle = new Graphics()
      handle.rect(-4, -4, 8, 8)
      handle.fill(0xFFFFFF)
      handle.stroke({ width: 1, color: 0x3B82F6 })
      handle.eventMode = 'static'
      handle.cursor = this.getResizeCursor(index)
      
      handle.on('pointerdown', (event: FederatedPointerEvent) => {
        this.startResize(event, index)
      })

      this.resizeHandles.push(handle)
      this.addChild(handle)
    })
  }

  // Obtenir le curseur de redimensionnement
  private getResizeCursor(handleIndex: number): string {
    const cursors = ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 
                   'se-resize', 's-resize', 'sw-resize', 'w-resize']
    return cursors[handleIndex]
  }

  // Configurer les événements
  private setupEvents() {
    this.panelGraphics.eventMode = 'static'
    this.panelGraphics.cursor = 'move'

    // Événements de drag
    this.panelGraphics.on('pointerdown', this.startDrag.bind(this))

    // Événements globaux
    if (this.parent) {
      const stage = this.parent
      stage.on('pointermove', this.onPointerMove.bind(this))
      stage.on('pointerup', this.onPointerUp.bind(this))
    }
  }

  // Dessiner le panel selon sa forme
  private updatePanel() {
    this.panelGraphics.clear()
    
    const { width, height } = this.panelElement.transform
    const style = this.panelElement.panelStyle

    // Définir le style de ligne
    const lineStyle = {
      width: style.borderWidth,
      color: style.borderColor,
      alpha: 1
    }

    // Dessiner selon la forme du panel
    switch (style.shape) {
      case 'rectangle':
        this.drawRectanglePanel(width, height, style, lineStyle)
        break
      case 'circle':
        this.drawCirclePanel(width, height, style, lineStyle)
        break
      case 'polygon':
        this.drawPolygonPanel(width, height, style, lineStyle)
        break
      case 'irregular':
        this.drawIrregularPanel(width, height, style, lineStyle)
        break
    }
  }

  // Panel rectangulaire
  private drawRectanglePanel(width: number, height: number, style: any, lineStyle: any) {
    if (style.cornerRadius && style.cornerRadius > 0) {
      // Rectangle avec coins arrondis
      this.panelGraphics.roundRect(0, 0, width, height, style.cornerRadius)
    } else {
      // Rectangle normal
      this.panelGraphics.rect(0, 0, width, height)
    }

    // Remplissage si défini
    if (style.fillColor !== null) {
      this.panelGraphics.fill({ color: style.fillColor, alpha: style.fillAlpha })
    }

    // Bordure selon le style
    if (style.borderStyle === 'dashed') {
      this.drawDashedBorder(width, height, lineStyle)
    } else if (style.borderStyle === 'dotted') {
      this.drawDottedBorder(width, height, lineStyle)
    } else {
      this.panelGraphics.stroke(lineStyle)
    }
  }

  // Panel circulaire
  private drawCirclePanel(width: number, height: number, style: any, lineStyle: any) {
    const radius = Math.min(width, height) / 2
    const centerX = width / 2
    const centerY = height / 2

    this.panelGraphics.circle(centerX, centerY, radius)

    // Remplissage si défini
    if (style.fillColor !== null) {
      this.panelGraphics.fill({ color: style.fillColor, alpha: style.fillAlpha })
    }

    // Bordure
    if (style.borderStyle === 'dashed') {
      this.drawDashedCircle(centerX, centerY, radius, lineStyle)
    } else if (style.borderStyle === 'dotted') {
      this.drawDottedCircle(centerX, centerY, radius, lineStyle)
    } else {
      this.panelGraphics.stroke(lineStyle)
    }
  }

  // Panel polygonal (hexagone par défaut)
  private drawPolygonPanel(width: number, height: number, style: any, lineStyle: any) {
    const sides = 6 // Hexagone
    const points = this.getPolygonPoints(width, height, sides)

    this.panelGraphics.poly(points)

    // Remplissage si défini
    if (style.fillColor !== null) {
      this.panelGraphics.fill({ color: style.fillColor, alpha: style.fillAlpha })
    }

    // Bordure
    this.panelGraphics.stroke(lineStyle)
  }

  // Panel irrégulier (forme libre)
  private drawIrregularPanel(width: number, height: number, style: any, lineStyle: any) {
    const points = this.getIrregularPoints(width, height)

    this.panelGraphics.poly(points)

    // Remplissage si défini
    if (style.fillColor !== null) {
      this.panelGraphics.fill({ color: style.fillColor, alpha: style.fillAlpha })
    }

    // Bordure
    this.panelGraphics.stroke(lineStyle)
  }

  // Obtenir les points d'un polygone régulier
  private getPolygonPoints(width: number, height: number, sides: number): number[] {
    const points = []
    const centerX = width / 2
    const centerY = height / 2
    const radiusX = width / 2
    const radiusY = height / 2

    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      const x = centerX + Math.cos(angle) * radiusX
      const y = centerY + Math.sin(angle) * radiusY
      points.push(x, y)
    }

    return points
  }

  // Obtenir les points d'une forme irrégulière
  private getIrregularPoints(width: number, height: number): number[] {
    // Créer une forme irrégulière basée sur des points de contrôle
    const points = []
    const segments = 8
    const centerX = width / 2
    const centerY = height / 2

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      // Variation aléatoire du rayon pour créer une forme irrégulière
      const radiusVariation = 0.7 + Math.random() * 0.6
      const radiusX = (width / 2) * radiusVariation
      const radiusY = (height / 2) * radiusVariation
      
      const x = centerX + Math.cos(angle) * radiusX
      const y = centerY + Math.sin(angle) * radiusY
      points.push(x, y)
    }

    return points
  }

  // Dessiner une bordure en pointillés
  private drawDashedBorder(width: number, height: number, lineStyle: any) {
    const dashLength = 8
    const gapLength = 4
    
    // Top
    for (let x = 0; x < width; x += dashLength + gapLength) {
      this.panelGraphics.moveTo(x, 0)
      this.panelGraphics.lineTo(Math.min(x + dashLength, width), 0)
    }
    
    // Right
    for (let y = 0; y < height; y += dashLength + gapLength) {
      this.panelGraphics.moveTo(width, y)
      this.panelGraphics.lineTo(width, Math.min(y + dashLength, height))
    }
    
    // Bottom
    for (let x = width; x > 0; x -= dashLength + gapLength) {
      this.panelGraphics.moveTo(x, height)
      this.panelGraphics.lineTo(Math.max(x - dashLength, 0), height)
    }
    
    // Left
    for (let y = height; y > 0; y -= dashLength + gapLength) {
      this.panelGraphics.moveTo(0, y)
      this.panelGraphics.lineTo(0, Math.max(y - dashLength, 0))
    }
    
    this.panelGraphics.stroke(lineStyle)
  }

  // Dessiner une bordure en pointillés
  private drawDottedBorder(width: number, height: number, lineStyle: any) {
    const dotSpacing = 6
    
    // Top
    for (let x = 0; x <= width; x += dotSpacing) {
      this.panelGraphics.circle(x, 0, 1)
      this.panelGraphics.fill(lineStyle.color)
    }
    
    // Right
    for (let y = 0; y <= height; y += dotSpacing) {
      this.panelGraphics.circle(width, y, 1)
      this.panelGraphics.fill(lineStyle.color)
    }
    
    // Bottom
    for (let x = width; x >= 0; x -= dotSpacing) {
      this.panelGraphics.circle(x, height, 1)
      this.panelGraphics.fill(lineStyle.color)
    }
    
    // Left
    for (let y = height; y >= 0; y -= dotSpacing) {
      this.panelGraphics.circle(0, y, 1)
      this.panelGraphics.fill(lineStyle.color)
    }
  }

  // Dessiner un cercle en pointillés
  private drawDashedCircle(centerX: number, centerY: number, radius: number, lineStyle: any) {
    const circumference = 2 * Math.PI * radius
    const dashLength = 8
    const gapLength = 4
    const totalDashGap = dashLength + gapLength
    const numDashes = Math.floor(circumference / totalDashGap)

    for (let i = 0; i < numDashes; i++) {
      const startAngle = (i * totalDashGap / circumference) * 2 * Math.PI
      const endAngle = ((i * totalDashGap + dashLength) / circumference) * 2 * Math.PI
      
      const startX = centerX + Math.cos(startAngle) * radius
      const startY = centerY + Math.sin(startAngle) * radius
      const endX = centerX + Math.cos(endAngle) * radius
      const endY = centerY + Math.sin(endAngle) * radius
      
      this.panelGraphics.moveTo(startX, startY)
      this.panelGraphics.lineTo(endX, endY)
    }
    
    this.panelGraphics.stroke(lineStyle)
  }

  // Dessiner un cercle en pointillés
  private drawDottedCircle(centerX: number, centerY: number, radius: number, lineStyle: any) {
    const circumference = 2 * Math.PI * radius
    const dotSpacing = 6
    const numDots = Math.floor(circumference / dotSpacing)

    for (let i = 0; i < numDots; i++) {
      const angle = (i / numDots) * 2 * Math.PI
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      this.panelGraphics.circle(x, y, 1)
      this.panelGraphics.fill(lineStyle.color)
    }
  }

  // Démarrer le drag
  private startDrag(event: FederatedPointerEvent) {
    this.isDragging = true
    this.dragStartPos = { x: event.global.x, y: event.global.y }
    this.elementStartPos = { 
      x: this.panelElement.transform.x, 
      y: this.panelElement.transform.y 
    }
    event.stopPropagation()
  }

  // Démarrer le redimensionnement
  private startResize(event: FederatedPointerEvent, handleIndex: number) {
    this.isResizing = true
    this.activeHandle = handleIndex
    this.dragStartPos = { x: event.global.x, y: event.global.y }
    this.elementStartPos = { 
      x: this.panelElement.transform.x, 
      y: this.panelElement.transform.y 
    }
    this.elementStartSize = { 
      width: this.panelElement.transform.width, 
      height: this.panelElement.transform.height 
    }
    event.stopPropagation()
  }

  // Gérer le mouvement du pointeur
  private onPointerMove(event: FederatedPointerEvent) {
    if (!this.isDragging && !this.isResizing) return

    const deltaX = event.global.x - this.dragStartPos.x
    const deltaY = event.global.y - this.dragStartPos.y

    if (this.isDragging) {
      this.panelElement.transform.x = this.elementStartPos.x + deltaX
      this.panelElement.transform.y = this.elementStartPos.y + deltaY
      this.updateTransform()
      this.onUpdate?.(this.panelElement)
    } else if (this.isResizing) {
      this.handleResize(deltaX, deltaY, event.shiftKey)
    }
  }

  // Gérer le redimensionnement
  private handleResize(deltaX: number, deltaY: number, maintainAspectRatio: boolean) {
    // Logique de redimensionnement similaire à ResizableSprite
    let newWidth = this.elementStartSize.width
    let newHeight = this.elementStartSize.height
    let newX = this.elementStartPos.x
    let newY = this.elementStartPos.y

    // Appliquer les changements selon le handle actif
    switch (this.activeHandle) {
      case 0: // top-left
        newWidth = this.elementStartSize.width - deltaX
        newHeight = this.elementStartSize.height - deltaY
        newX = this.elementStartPos.x + deltaX
        newY = this.elementStartPos.y + deltaY
        break
      case 2: // top-right
        newWidth = this.elementStartSize.width + deltaX
        newHeight = this.elementStartSize.height - deltaY
        newY = this.elementStartPos.y + deltaY
        break
      case 4: // bottom-right
        newWidth = this.elementStartSize.width + deltaX
        newHeight = this.elementStartSize.height + deltaY
        break
      case 6: // bottom-left
        newWidth = this.elementStartSize.width - deltaX
        newHeight = this.elementStartSize.height + deltaY
        newX = this.elementStartPos.x + deltaX
        break
      // Autres handles...
    }

    // Maintenir les proportions pour les cercles
    if (this.panelElement.panelStyle.shape === 'circle' || maintainAspectRatio) {
      const size = Math.max(newWidth, newHeight)
      newWidth = size
      newHeight = size
    }

    // Appliquer les tailles minimales
    newWidth = Math.max(20, newWidth)
    newHeight = Math.max(20, newHeight)

    // Mettre à jour l'élément
    this.panelElement.transform.x = newX
    this.panelElement.transform.y = newY
    this.panelElement.transform.width = newWidth
    this.panelElement.transform.height = newHeight

    this.updatePanel()
    this.updateTransform()
    this.onUpdate?.(this.panelElement)

    // Déclencher l'événement de redimensionnement
    this.onResize?.({
      elementId: this.panelElement.id,
      newWidth,
      newHeight,
      newX,
      newY,
      shape: this.panelElement.panelStyle.shape
    })
  }

  // Terminer les interactions
  private onPointerUp() {
    this.isDragging = false
    this.isResizing = false
    this.activeHandle = -1
  }

  // Mettre à jour la transformation
  private updateTransform() {
    const transform = this.panelElement.transform
    
    this.x = transform.x
    this.y = transform.y
    this.rotation = transform.rotation
    this.alpha = transform.alpha
    this.zIndex = transform.zIndex

    this.updateSelectionBorder()
    this.updateHandlePositions()
  }

  // Mettre à jour la bordure de sélection
  private updateSelectionBorder() {
    this.selectionBorder.clear()
    
    if (this.panelElement.properties.visible) {
      this.selectionBorder.rect(0, 0, 
        this.panelElement.transform.width, 
        this.panelElement.transform.height)
      this.selectionBorder.stroke({ width: 2, color: 0x3B82F6, alpha: 0.8 })
    }
  }

  // Mettre à jour les positions des handles
  private updateHandlePositions() {
    const width = this.panelElement.transform.width
    const height = this.panelElement.transform.height

    const positions = [
      { x: 0, y: 0 }, { x: width * 0.5, y: 0 }, { x: width, y: 0 },
      { x: width, y: height * 0.5 }, { x: width, y: height }, 
      { x: width * 0.5, y: height }, { x: 0, y: height }, { x: 0, y: height * 0.5 }
    ]

    this.resizeHandles.forEach((handle, index) => {
      if (positions[index]) {
        handle.x = positions[index].x
        handle.y = positions[index].y
      }
    })
  }

  // Définir l'état de sélection
  setSelected(selected: boolean) {
    this.selectionBorder.visible = selected && !this.panelElement.properties.locked
    this.resizeHandles.forEach(handle => {
      handle.visible = selected && !this.panelElement.properties.locked
    })
  }

  // Mettre à jour l'élément
  updateElement(element: PanelElement) {
    this.panelElement = element
    this.updatePanel()
    this.updateTransform()
  }

  // 🆕 MÉTHODES DE FEEDBACK VISUEL

  /**
   * Afficher le feedback de drop (panel vide)
   */
  showDropFeedback() {
    if (this.feedbackState === 'drop') return

    this.feedbackState = 'drop'
    this.updateFeedbackOverlay()
    this.updateFeedbackIcon('drop')

    this.feedbackOverlay.visible = true
    this.feedbackIcon.visible = true

    console.log('🟢 Feedback DROP activé pour panel:', this.panelElement.id)
  }

  /**
   * Afficher le feedback de remplacement (panel avec image)
   */
  showReplaceFeedback() {
    if (this.feedbackState === 'replace') return

    this.feedbackState = 'replace'
    this.updateFeedbackOverlay()
    this.updateFeedbackIcon('replace')

    this.feedbackOverlay.visible = true
    this.feedbackIcon.visible = true

    console.log('🔴 Feedback REPLACE activé pour panel:', this.panelElement.id)
  }

  /**
   * Masquer le feedback visuel
   */
  hideFeedback() {
    if (this.feedbackState === 'none') return

    this.feedbackState = 'none'
    this.feedbackOverlay.visible = false
    this.feedbackIcon.visible = false

    console.log('⚫ Feedback masqué pour panel:', this.panelElement.id)
  }

  /**
   * Mettre à jour l'overlay de feedback
   */
  private updateFeedbackOverlay() {
    this.feedbackOverlay.clear()

    const { width, height } = this.panelElement.transform
    const { cornerRadius } = this.panelElement.panelStyle

    // Dessiner l'overlay selon l'état
    if (cornerRadius && cornerRadius > 0) {
      this.feedbackOverlay.roundRect(0, 0, width, height, cornerRadius)
    } else {
      this.feedbackOverlay.rect(0, 0, width, height)
    }

    // Couleur selon l'état
    if (this.feedbackState === 'drop') {
      // Vert subtil pour drop
      this.feedbackOverlay.fill({ color: 0x22C55E, alpha: 0.3 })
    } else if (this.feedbackState === 'replace') {
      // Rouge subtil pour replace
      this.feedbackOverlay.fill({ color: 0xEF4444, alpha: 0.3 })
    }
  }

  /**
   * Mettre à jour l'icône de feedback
   */
  private updateFeedbackIcon(type: 'drop' | 'replace') {
    this.feedbackIcon.clear()

    const { width, height } = this.panelElement.transform
    const centerX = width / 2
    const centerY = height / 2
    const iconSize = 32

    // Couleur de l'icône
    const iconColor = type === 'drop' ? 0x16A34A : 0xDC2626

    if (type === 'drop') {
      // Icône "+" pour drop
      this.drawPlusIcon(centerX, centerY, iconSize, iconColor)
    } else {
      // Icône "replace" pour replace
      this.drawReplaceIcon(centerX, centerY, iconSize, iconColor)
    }
  }

  /**
   * Dessiner l'icône "+"
   */
  private drawPlusIcon(centerX: number, centerY: number, size: number, color: number) {
    const thickness = 4
    const length = size * 0.6

    // Ligne horizontale
    this.feedbackIcon.rect(centerX - length/2, centerY - thickness/2, length, thickness)
    this.feedbackIcon.fill(color)

    // Ligne verticale
    this.feedbackIcon.rect(centerX - thickness/2, centerY - length/2, thickness, length)
    this.feedbackIcon.fill(color)
  }

  /**
   * Dessiner l'icône "replace" (flèches circulaires)
   */
  private drawReplaceIcon(centerX: number, centerY: number, size: number, color: number) {
    const radius = size * 0.3
    const thickness = 3

    // Cercle avec flèche (représentation simplifiée)
    this.feedbackIcon.circle(centerX, centerY, radius)
    this.feedbackIcon.stroke({ width: thickness, color })

    // Flèche
    const arrowSize = size * 0.15
    this.feedbackIcon.moveTo(centerX + radius - arrowSize, centerY - arrowSize)
    this.feedbackIcon.lineTo(centerX + radius, centerY)
    this.feedbackIcon.lineTo(centerX + radius - arrowSize, centerY + arrowSize)
    this.feedbackIcon.stroke({ width: thickness, color })
  }

  // Nettoyer les ressources
  destroy() {
    super.destroy({ children: true })
  }
}

// Factory function pour créer un MangaPanel
export function createMangaPanel(
  element: PanelElement,
  onUpdate?: (element: PanelElement) => void,
  onResize?: (event: PanelEvent) => void
): MangaPanel {
  return new MangaPanel(element, onUpdate, onResize)
}

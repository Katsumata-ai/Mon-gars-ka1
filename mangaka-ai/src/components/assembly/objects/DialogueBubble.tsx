// Bulles de dialogue avec 5 types pour PixiJS v8
import { Container, Graphics, Text, TextStyle, FederatedPointerEvent } from 'pixi.js'
import { DialogueElement, BubbleType } from '../types/assembly.types'

// Interface pour les événements de dialogue
interface DialogueEvent {
  elementId: string
  newText: string
  newWidth: number
  newHeight: number
  newX: number
  newY: number
}

// Classe pour gérer une bulle de dialogue
export class DialogueBubble extends Container {
  private dialogueElement: DialogueElement
  private bubbleGraphics: Graphics
  private textDisplay: Text
  private selectionBorder: Graphics
  private resizeHandles: Graphics[] = []
  private isDragging = false
  private isResizing = false
  private isEditing = false
  private dragStartPos = { x: 0, y: 0 }
  private elementStartPos = { x: 0, y: 0 }
  private onUpdate?: (element: DialogueElement) => void
  private onTextEdit?: (event: DialogueEvent) => void

  constructor(
    element: DialogueElement,
    onUpdate?: (element: DialogueElement) => void,
    onTextEdit?: (event: DialogueEvent) => void
  ) {
    super()

    this.dialogueElement = element
    this.onUpdate = onUpdate
    this.onTextEdit = onTextEdit

    // Créer les composants
    this.bubbleGraphics = new Graphics()
    this.textDisplay = new Text()
    this.selectionBorder = new Graphics()

    this.addChild(this.bubbleGraphics)
    this.addChild(this.textDisplay)
    this.addChild(this.selectionBorder)

    // Créer les handles de redimensionnement
    this.createResizeHandles()

    // Configurer et dessiner
    this.updateBubble()
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
      handle.rect(-3, -3, 6, 6)
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
    this.bubbleGraphics.eventMode = 'static'
    this.bubbleGraphics.cursor = 'move'

    // Événements de drag
    this.bubbleGraphics.on('pointerdown', this.startDrag.bind(this))

    // Double-clic pour éditer le texte
    this.textDisplay.eventMode = 'static'
    this.textDisplay.on('pointertap', this.startTextEdit.bind(this))

    // Événements globaux
    if (this.parent) {
      const stage = this.parent
      stage.on('pointermove', this.onPointerMove.bind(this))
      stage.on('pointerup', this.onPointerUp.bind(this))
    }
  }

  // Dessiner la bulle selon son type
  private updateBubble() {
    this.bubbleGraphics.clear()
    
    const { width, height } = this.dialogueElement.transform
    const style = this.dialogueElement.bubbleStyle

    // Définir le style de ligne
    const lineStyle = {
      width: 2,
      color: style.outlineColor,
      alpha: 1
    }

    // Dessiner selon le type de bulle
    switch (style.type) {
      case 'speech':
        this.drawSpeechBubble(width, height, style, lineStyle)
        break
      case 'thought':
        this.drawThoughtBubble(width, height, style, lineStyle)
        break
      case 'shout':
        this.drawShoutBubble(width, height, style, lineStyle)
        break
      case 'whisper':
        this.drawWhisperBubble(width, height, style, lineStyle)
        break
      case 'explosion':
        this.drawExplosionBubble(width, height, style, lineStyle)
        break
    }

    // Mettre à jour le texte
    this.updateText()
  }

  // Bulle de dialogue classique
  private drawSpeechBubble(width: number, height: number, style: any, lineStyle: any) {
    const cornerRadius = 10
    
    // Corps de la bulle
    this.bubbleGraphics.roundRect(0, 0, width, height, cornerRadius)
    this.bubbleGraphics.fill(style.backgroundColor)
    
    if (style.dashedOutline) {
      // Ligne pointillée (simulation)
      this.drawDashedRect(0, 0, width, height, cornerRadius, lineStyle)
    } else {
      this.bubbleGraphics.stroke(lineStyle)
    }

    // Queue de la bulle
    this.drawBubbleTail(width, height, style.tailPosition, lineStyle)
  }

  // Bulle de pensée (ellipse avec petites bulles)
  private drawThoughtBubble(width: number, height: number, style: any, lineStyle: any) {
    // Ellipse principale
    this.bubbleGraphics.ellipse(width / 2, height / 2, width / 2, height / 2)
    this.bubbleGraphics.fill(style.backgroundColor)
    this.bubbleGraphics.stroke(lineStyle)

    // Petites bulles de pensée
    const bubblePositions = this.getThoughtBubblePositions(width, height, style.tailPosition)
    bubblePositions.forEach(pos => {
      this.bubbleGraphics.circle(pos.x, pos.y, pos.radius)
      this.bubbleGraphics.fill(style.backgroundColor)
      this.bubbleGraphics.stroke(lineStyle)
    })
  }

  // Bulle de cri (forme irrégulière)
  private drawShoutBubble(width: number, height: number, style: any, lineStyle: any) {
    const points = this.getShoutBubblePoints(width, height)
    
    this.bubbleGraphics.poly(points)
    this.bubbleGraphics.fill(style.backgroundColor)
    this.bubbleGraphics.stroke({ ...lineStyle, width: 3 })
  }

  // Bulle de chuchotement (ligne pointillée fine)
  private drawWhisperBubble(width: number, height: number, style: any, lineStyle: any) {
    const cornerRadius = 15
    
    this.bubbleGraphics.roundRect(0, 0, width, height, cornerRadius)
    this.bubbleGraphics.fill({ ...style.backgroundColor, alpha: 0.8 })
    
    // Ligne pointillée fine
    this.drawDashedRect(0, 0, width, height, cornerRadius, { ...lineStyle, width: 1 })
  }

  // Bulle d'explosion (forme en étoile)
  private drawExplosionBubble(width: number, height: number, style: any, lineStyle: any) {
    const points = this.getExplosionBubblePoints(width, height)
    
    this.bubbleGraphics.poly(points)
    this.bubbleGraphics.fill(style.backgroundColor)
    this.bubbleGraphics.stroke({ ...lineStyle, width: 4 })
  }

  // Dessiner la queue de la bulle
  private drawBubbleTail(width: number, height: number, position: string, lineStyle: any) {
    const tailSize = 15
    let tailPoints: number[] = []

    switch (position) {
      case 'bottom-left':
        tailPoints = [20, height, 5, height + tailSize, 35, height]
        break
      case 'bottom-right':
        tailPoints = [width - 35, height, width - 5, height + tailSize, width - 20, height]
        break
      case 'top-left':
        tailPoints = [20, 0, 5, -tailSize, 35, 0]
        break
      case 'top-right':
        tailPoints = [width - 35, 0, width - 5, -tailSize, width - 20, 0]
        break
    }

    if (tailPoints.length > 0) {
      this.bubbleGraphics.poly(tailPoints)
      this.bubbleGraphics.fill(this.dialogueElement.bubbleStyle.backgroundColor)
      this.bubbleGraphics.stroke(lineStyle)
    }
  }

  // Obtenir les positions des petites bulles de pensée
  private getThoughtBubblePositions(width: number, height: number, tailPosition: string) {
    const positions = []
    const baseX = tailPosition.includes('right') ? width - 20 : 20
    const baseY = tailPosition.includes('top') ? -10 : height + 10

    positions.push({ x: baseX, y: baseY, radius: 8 })
    positions.push({ x: baseX + (tailPosition.includes('right') ? 15 : -15), y: baseY + 15, radius: 5 })
    positions.push({ x: baseX + (tailPosition.includes('right') ? 25 : -25), y: baseY + 25, radius: 3 })

    return positions
  }

  // Obtenir les points pour la bulle de cri
  private getShoutBubblePoints(width: number, height: number): number[] {
    const points = []
    const segments = 12
    const centerX = width / 2
    const centerY = height / 2

    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const radius = i % 2 === 0 ? Math.min(width, height) / 2 : Math.min(width, height) / 3
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      points.push(x, y)
    }

    return points
  }

  // Obtenir les points pour la bulle d'explosion
  private getExplosionBubblePoints(width: number, height: number): number[] {
    const points = []
    const spikes = 8
    const centerX = width / 2
    const centerY = height / 2

    for (let i = 0; i < spikes * 2; i++) {
      const angle = (i / (spikes * 2)) * Math.PI * 2
      const radius = i % 2 === 0 ? Math.min(width, height) / 2 : Math.min(width, height) / 4
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      points.push(x, y)
    }

    return points
  }

  // Dessiner un rectangle en pointillés (simulation)
  private drawDashedRect(x: number, y: number, width: number, height: number, radius: number, lineStyle: any) {
    // Simulation de ligne pointillée avec de petits segments
    const dashLength = 5
    const gapLength = 3
    
    // Top
    for (let i = x; i < x + width; i += dashLength + gapLength) {
      this.bubbleGraphics.moveTo(i, y)
      this.bubbleGraphics.lineTo(Math.min(i + dashLength, x + width), y)
    }
    
    // Right
    for (let i = y; i < y + height; i += dashLength + gapLength) {
      this.bubbleGraphics.moveTo(x + width, i)
      this.bubbleGraphics.lineTo(x + width, Math.min(i + dashLength, y + height))
    }
    
    // Bottom
    for (let i = x + width; i > x; i -= dashLength + gapLength) {
      this.bubbleGraphics.moveTo(i, y + height)
      this.bubbleGraphics.lineTo(Math.max(i - dashLength, x), y + height)
    }
    
    // Left
    for (let i = y + height; i > y; i -= dashLength + gapLength) {
      this.bubbleGraphics.moveTo(x, i)
      this.bubbleGraphics.lineTo(x, Math.max(i - dashLength, y))
    }
    
    this.bubbleGraphics.stroke(lineStyle)
  }

  // Mettre à jour le texte
  private updateText() {
    const style = this.dialogueElement.bubbleStyle
    
    const textStyle = new TextStyle({
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fill: style.textColor,
      align: style.textAlign,
      wordWrap: true,
      wordWrapWidth: this.dialogueElement.transform.width - 20,
      breakWords: true
    })

    this.textDisplay.text = this.dialogueElement.text
    this.textDisplay.style = textStyle

    // Centrer le texte dans la bulle
    this.textDisplay.x = (this.dialogueElement.transform.width - this.textDisplay.width) / 2
    this.textDisplay.y = (this.dialogueElement.transform.height - this.textDisplay.height) / 2
  }

  // Démarrer le drag
  private startDrag(event: FederatedPointerEvent) {
    this.isDragging = true
    this.dragStartPos = { x: event.global.x, y: event.global.y }
    this.elementStartPos = { 
      x: this.dialogueElement.transform.x, 
      y: this.dialogueElement.transform.y 
    }
    event.stopPropagation()
  }

  // Démarrer le redimensionnement
  private startResize(event: FederatedPointerEvent, handleIndex: number) {
    this.isResizing = true
    // Logique de redimensionnement similaire à ResizableSprite
    event.stopPropagation()
  }

  // Démarrer l'édition de texte
  private startTextEdit(event: FederatedPointerEvent) {
    if (this.isEditing) return
    
    this.isEditing = true
    // Créer un input temporaire pour l'édition
    this.createTextInput()
    event.stopPropagation()
  }

  // Créer un input pour l'édition de texte
  private createTextInput() {
    // Cette fonction sera implémentée pour créer un input HTML temporaire
    // superposé au texte pour l'édition
    console.log('Édition de texte à implémenter')
  }

  // Gérer le mouvement du pointeur
  private onPointerMove(event: FederatedPointerEvent) {
    if (!this.isDragging && !this.isResizing) return

    const deltaX = event.global.x - this.dragStartPos.x
    const deltaY = event.global.y - this.dragStartPos.y

    if (this.isDragging) {
      this.dialogueElement.transform.x = this.elementStartPos.x + deltaX
      this.dialogueElement.transform.y = this.elementStartPos.y + deltaY
      this.updateTransform()
      this.onUpdate?.(this.dialogueElement)
    }
  }

  // Terminer les interactions
  private onPointerUp() {
    this.isDragging = false
    this.isResizing = false
  }

  // Mettre à jour la transformation
  private updateTransform() {
    const transform = this.dialogueElement.transform
    
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
    
    if (this.dialogueElement.properties.visible) {
      this.selectionBorder.rect(0, 0, 
        this.dialogueElement.transform.width, 
        this.dialogueElement.transform.height)
      this.selectionBorder.stroke({ width: 2, color: 0x3B82F6, alpha: 0.8 })
    }
  }

  // Mettre à jour les positions des handles
  private updateHandlePositions() {
    const width = this.dialogueElement.transform.width
    const height = this.dialogueElement.transform.height

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
    this.selectionBorder.visible = selected && !this.dialogueElement.properties.locked
    this.resizeHandles.forEach(handle => {
      handle.visible = selected && !this.dialogueElement.properties.locked
    })
  }

  // Mettre à jour l'élément
  updateElement(element: DialogueElement) {
    this.dialogueElement = element
    this.updateBubble()
    this.updateTransform()
  }

  // Nettoyer les ressources
  destroy() {
    super.destroy({ children: true })
  }
}

// Factory function pour créer une DialogueBubble
export function createDialogueBubble(
  element: DialogueElement,
  onUpdate?: (element: DialogueElement) => void,
  onTextEdit?: (event: DialogueEvent) => void
): DialogueBubble {
  return new DialogueBubble(element, onUpdate, onTextEdit)
}

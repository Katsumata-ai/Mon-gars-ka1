// Outil de création de bulles de dialogue pour le workflow Dashtoon

import { Graphics, Text, TextStyle } from 'pixi.js'
import { DialogueElement, BubbleType } from '../types/assembly.types'
import { generateElementId } from '../managers/StateManager'

export interface BubbleCreationState {
  isPlacing: boolean
  x: number
  y: number
  previewGraphics: Graphics | null
  bubbleType: BubbleType
}

/**
 * Gestionnaire pour l'outil de création de bulles de dialogue
 * Permet de placer des bulles en cliquant
 */
export class BubbleTool {
  private state: BubbleCreationState = {
    isPlacing: false,
    x: 0,
    y: 0,
    previewGraphics: null,
    bubbleType: 'speech'
  }

  private onBubbleCreated?: (bubble: DialogueElement) => void

  constructor(onBubbleCreated?: (bubble: DialogueElement) => void) {
    this.onBubbleCreated = onBubbleCreated
  }

  /**
   * Change le type de bulle
   */
  setBubbleType(type: BubbleType): void {
    this.state.bubbleType = type
  }

  /**
   * Démarre le mode placement de bulle
   */
  startPlacement(stage: any): void {
    this.state.isPlacing = true
    
    // Créer la prévisualisation
    this.state.previewGraphics = new Graphics()
    this.state.previewGraphics.name = 'bubble-preview'
    this.state.previewGraphics.alpha = 0.7
    stage.addChild(this.state.previewGraphics)
  }

  /**
   * Met à jour la position de la prévisualisation
   */
  updatePreview(x: number, y: number): void {
    if (!this.state.isPlacing || !this.state.previewGraphics) return

    this.state.x = x
    this.state.y = y
    this.drawBubblePreview()
  }

  /**
   * Place la bulle à la position actuelle
   * ✅ MIGRATION : Crée maintenant des bulles compatibles HTML/CSS
   */
  placeBubble(x: number, y: number, stage: any): DialogueElement | null {
    // ✅ CORRECTION : Permettre la création même sans mode placement pour simplifier
    // if (!this.state.isPlacing) return null

    // ✅ MIGRATION : Créer l'élément bulle compatible HTML/CSS
    const bubble: DialogueElement = {
      id: generateElementId(),
      type: 'dialogue',
      layerType: 'dialogue',
      text: '', // ✅ Texte vide pour édition immédiate
      transform: {
        x,
        y,
        rotation: 0,
        alpha: 1,
        zIndex: 200, // Au-dessus des panels
        width: 150,  // ✅ Taille optimale pour HTML
        height: 80
      },
      bubbleStyle: { // ✅ STRUCTURE COMPATIBLE HTML/CSS
        type: this.state.bubbleType,
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        textColor: '#000000', // ✅ Format CSS pour HTML
        dashedOutline: this.state.bubbleType === 'whisper',
        tailPosition: 'bottom-left', // Position de la queue
        fontSize: 16, // ✅ Taille optimale pour HTML
        fontFamily: 'Arial, sans-serif', // ✅ Fallback CSS
        textAlign: 'center',

        // ✅ NOUVELLES PROPRIÉTÉS 360° - INITIALISATION PAR DÉFAUT
        tailAbsoluteX: x + 30,    // Position initiale de la queue
        tailAbsoluteY: y + 100,   // Position initiale de la queue
        tailLength: 30,           // Longueur initiale
        tailAngleDegrees: 225,    // Angle initial (bas-gauche)
        tailAttachmentSide: 'bottom' as const
      },
      properties: {
        name: `Bulle ${this.state.bubbleType}`,
        locked: false,
        visible: true,
        blendMode: 'normal'
      },
      // ✅ NOUVEAU : Marqueur pour rendu HTML
      renderMode: 'html' as const // Nouveau champ pour la migration
    }

    // Nettoyer la prévisualisation
    this.cancelPlacement(stage)

    // Notifier la création
    this.onBubbleCreated?.(bubble)

    console.log('🎈 HTML Bubble created:', {
      id: bubble.id,
      type: bubble.bubbleStyle.type,
      position: { x, y },
      renderMode: 'html'
    })

    return bubble
  }

  /**
   * Annule le placement en cours
   */
  cancelPlacement(stage: any): void {
    if (this.state.previewGraphics) {
      stage.removeChild(this.state.previewGraphics)
      this.state.previewGraphics.destroy()
      this.state.previewGraphics = null
    }

    this.state.isPlacing = false
  }

  /**
   * Dessine la prévisualisation de la bulle
   */
  private drawBubblePreview(): void {
    if (!this.state.previewGraphics) return

    const graphics = this.state.previewGraphics
    graphics.clear()

    const width = 150
    const height = 80
    const x = this.state.x - width / 2
    const y = this.state.y - height / 2

    // Couleurs selon le type de bulle
    const colors = {
      speech: { bg: 0xffffff, border: 0x000000 },
      thought: { bg: 0xf0f0f0, border: 0x666666 },
      shout: { bg: 0xffff00, border: 0xff0000 },
      whisper: { bg: 0xe6e6e6, border: 0x999999 },
      explosion: { bg: 0xff6600, border: 0xff0000 }
    }

    const color = colors[this.state.bubbleType]

    // Dessiner la bulle selon le type
    switch (this.state.bubbleType) {
      case 'speech':
        this.drawSpeechBubble(graphics, x, y, width, height, color)
        break
      case 'thought':
        this.drawThoughtBubble(graphics, x, y, width, height, color)
        break
      case 'shout':
        this.drawShoutBubble(graphics, x, y, width, height, color)
        break
      case 'whisper':
        this.drawWhisperBubble(graphics, x, y, width, height, color)
        break
      case 'explosion':
        this.drawExplosionBubble(graphics, x, y, width, height, color)
        break
    }
  }

  private drawSpeechBubble(graphics: Graphics, x: number, y: number, width: number, height: number, color: any): void {
    // Bulle ovale avec queue
    graphics
      .roundRect(x, y, width, height, 20)
      .fill({ color: color.bg, alpha: 0.9 })
      .stroke({ width: 2, color: color.border })

    // Queue de la bulle
    graphics
      .moveTo(x + width * 0.3, y + height)
      .lineTo(x + width * 0.2, y + height + 20)
      .lineTo(x + width * 0.5, y + height)
      .fill({ color: color.bg })
      .stroke({ width: 2, color: color.border })
  }

  private drawThoughtBubble(graphics: Graphics, x: number, y: number, width: number, height: number, color: any): void {
    // Bulle nuage avec petites bulles
    graphics
      .roundRect(x, y, width, height, 30)
      .fill({ color: color.bg, alpha: 0.9 })
      .stroke({ width: 2, color: color.border })

    // Petites bulles de pensée
    graphics
      .circle(x + width * 0.2, y + height + 10, 5)
      .fill({ color: color.bg })
      .stroke({ width: 1, color: color.border })

    graphics
      .circle(x + width * 0.1, y + height + 25, 3)
      .fill({ color: color.bg })
      .stroke({ width: 1, color: color.border })
  }

  private drawShoutBubble(graphics: Graphics, x: number, y: number, width: number, height: number, color: any): void {
    // Bulle en étoile/explosion
    const centerX = x + width / 2
    const centerY = y + height / 2
    const points = 8
    const outerRadius = Math.min(width, height) / 2
    const innerRadius = outerRadius * 0.6

    graphics.moveTo(centerX + outerRadius, centerY)

    for (let i = 1; i <= points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / points
      const px = centerX + Math.cos(angle) * radius
      const py = centerY + Math.sin(angle) * radius
      graphics.lineTo(px, py)
    }

    graphics
      .fill({ color: color.bg, alpha: 0.9 })
      .stroke({ width: 3, color: color.border })
  }

  private drawWhisperBubble(graphics: Graphics, x: number, y: number, width: number, height: number, color: any): void {
    // Bulle avec bordure en pointillés
    graphics
      .roundRect(x, y, width, height, 15)
      .fill({ color: color.bg, alpha: 0.8 })
      .stroke({ width: 1, color: color.border, alpha: 0.7 })
  }

  private drawExplosionBubble(graphics: Graphics, x: number, y: number, width: number, height: number, color: any): void {
    // Bulle dentelée
    const centerX = x + width / 2
    const centerY = y + height / 2
    const points = 12
    const radius = Math.min(width, height) / 2

    graphics.moveTo(centerX + radius, centerY)

    for (let i = 1; i <= points; i++) {
      const angle = (i * 2 * Math.PI) / points
      const r = radius + (Math.random() - 0.5) * 20
      const px = centerX + Math.cos(angle) * r
      const py = centerY + Math.sin(angle) * r
      graphics.lineTo(px, py)
    }

    graphics
      .fill({ color: color.bg, alpha: 0.9 })
      .stroke({ width: 3, color: color.border })
  }

  /**
   * Vérifie si l'outil est actif
   */
  get isActive(): boolean {
    return this.state.isPlacing
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    if (this.state.previewGraphics) {
      this.state.previewGraphics.destroy()
    }
  }
}

/**
 * Hook pour utiliser l'outil de création de bulles
 */
export function useBubbleTool(onBubbleCreated?: (bubble: DialogueElement) => void) {
  const tool = new BubbleTool(onBubbleCreated)
  
  return {
    setBubbleType: tool.setBubbleType.bind(tool),
    startPlacement: tool.startPlacement.bind(tool),
    updatePreview: tool.updatePreview.bind(tool),
    placeBubble: tool.placeBubble.bind(tool),
    cancelPlacement: tool.cancelPlacement.bind(tool),
    isActive: tool.isActive,
    destroy: tool.destroy.bind(tool)
  }
}

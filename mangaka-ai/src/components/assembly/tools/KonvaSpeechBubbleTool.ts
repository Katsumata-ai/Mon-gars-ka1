// KonvaSpeechBubbleTool - Système unifié pour les speech bubbles avec Konva.js
// Architecture identique à KonvaPanelTool pour une cohérence parfaite

import Konva from 'konva'
import { AssemblyElement, DialogueElement, BubbleType } from '../types/assembly.types'
import { generateElementId } from '../managers/StateManager'

interface BubbleCreationState {
  isPlacing: boolean
  x: number
  y: number
  bubbleType: BubbleType
  previewShape?: Konva.Group
}

export class KonvaSpeechBubbleTool {
  private state: BubbleCreationState = {
    isPlacing: false,
    x: 0,
    y: 0,
    bubbleType: 'speech'
  }

  private onBubbleCreated?: (bubble: DialogueElement) => void
  private elements: AssemblyElement[] = []

  constructor(onBubbleCreated?: (bubble: DialogueElement) => void) {
    this.onBubbleCreated = onBubbleCreated
  }

  /**
   * Met à jour la liste des éléments pour la détection de collision
   */
  updateElements(elements: AssemblyElement[]): void {
    this.elements = elements
  }

  /**
   * Getter pour vérifier si l'outil est actif
   */
  get isActive(): boolean {
    return this.state.isPlacing
  }

  /**
   * Change le type de bulle à créer
   */
  setBubbleType(type: BubbleType): void {
    this.state.bubbleType = type
    console.log('🎯 KonvaSpeechBubbleTool: Type de bulle défini:', type)
  }

  /**
   * Démarre le mode placement de bulle - ✅ KONVA NATIF
   */
  startPlacement(x: number, y: number, stage: Konva.Stage | null): void {
    this.state.isPlacing = true
    this.state.x = x
    this.state.y = y

    console.log('🎯 KonvaSpeechBubbleTool: Démarrage placement bulle', { 
      type: this.state.bubbleType, 
      position: { x, y } 
    })
  }

  /**
   * Place la bulle à la position spécifiée - ✅ KONVA NATIF
   */
  placeBubble(x: number, y: number, stage: Konva.Stage | null): DialogueElement | null {
    // ✅ CORRECTION CRITIQUE : Structure DialogueElement correcte avec dialogueStyle
    const bubble: DialogueElement = {
      id: generateElementId('bubble'),
      type: 'dialogue',
      layerType: 'dialogue',
      text: '', // Texte vide pour édition immédiate
      transform: {
        x,
        y,
        width: 150,  // Taille par défaut optimale
        height: 80,
        rotation: 0,
        alpha: 1,
        zIndex: Date.now()
      },
      dialogueStyle: {
        type: this.state.bubbleType,
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        outlineWidth: 2,
        textColor: 0x000000,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        dashedOutline: this.state.bubbleType === 'whisper',
        tailPosition: 'bottom-left',
        tailLength: 30,
        tailAngleDegrees: 225,
        tailAttachmentSide: 'bottom'
      },
      properties: {
        visible: true,
        locked: false,
        selectable: true,
        name: `Bulle ${this.state.bubbleType}`
      }
    }

    // Vérifier les collisions et ajuster si nécessaire
    if (this.checkCollision(bubble)) {
      console.log('⚠️ KonvaSpeechBubbleTool: Collision détectée, ajustement automatique')
      bubble.transform.x += 10
      bubble.transform.y += 10
    }

    console.log('✅ KonvaSpeechBubbleTool: Bulle créée', bubble)

    // Nettoyer l'état
    this.state.isPlacing = false

    // Notifier la création
    if (this.onBubbleCreated) {
      this.onBubbleCreated(bubble)
    }

    return bubble
  }

  /**
   * Annule le placement en cours - ✅ KONVA NATIF
   */
  cancelPlacement(): void {
    if (!this.state.isPlacing) return

    console.log('❌ KonvaSpeechBubbleTool: Annulation placement')
    this.state.isPlacing = false
  }

  /**
   * Vérifie les collisions avec les éléments existants - ✅ LOGIQUE PRÉSERVÉE
   */
  private checkCollision(newBubble: DialogueElement): boolean {
    return this.elements.some(element => {
      if (element.type !== 'dialogue') return false

      const existing = element.transform
      const newTransform = newBubble.transform

      return !(
        newTransform.x + newTransform.width < existing.x ||
        newTransform.x > existing.x + existing.width ||
        newTransform.y + newTransform.height < existing.y ||
        newTransform.y > existing.y + existing.height
      )
    })
  }

  /**
   * Nettoie les ressources - ✅ KONVA NATIF
   */
  destroy(): void {
    this.cancelPlacement()
    this.elements = []
    this.onBubbleCreated = undefined
    console.log('🧹 KonvaSpeechBubbleTool: Nettoyage terminé')
  }
}

/**
 * Hook pour utiliser KonvaSpeechBubbleTool - ✅ INTERFACE PRÉSERVÉE
 */
export function useKonvaSpeechBubbleTool(onBubbleCreated?: (bubble: DialogueElement) => void) {
  const tool = new KonvaSpeechBubbleTool(onBubbleCreated)

  return {
    setBubbleType: tool.setBubbleType.bind(tool),
    startPlacement: tool.startPlacement.bind(tool),
    placeBubble: tool.placeBubble.bind(tool),
    cancelPlacement: tool.cancelPlacement.bind(tool),
    updateElements: tool.updateElements.bind(tool),
    isActive: tool.isActive,
    destroy: tool.destroy.bind(tool)
  }
}

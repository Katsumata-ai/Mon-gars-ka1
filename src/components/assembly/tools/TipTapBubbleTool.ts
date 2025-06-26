// TipTapBubbleTool - Outil pour créer des bulles TipTap
// IDENTIQUE au workflow PanelTool : création → switch auto vers select → sélection

import { AssemblyElement, DialogueElement, BubbleType } from '../types/assembly.types'
import { generateElementId } from '../managers/StateManager'

interface BubbleCreationState {
  isCreating: boolean
  x: number
  y: number
  bubbleType: BubbleType
}

export class TipTapBubbleTool {
  private state: BubbleCreationState = {
    isCreating: false,
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
    return this.state.isCreating
  }

  /**
   * Change le type de bulle à créer
   */
  setBubbleType(type: BubbleType): void {
    this.state.bubbleType = type
    console.log('🎯 TipTapBubbleTool: Type de bulle défini:', type)
  }

  /**
   * Démarre la création de bulle (IDENTIQUE à PanelTool)
   */
  startCreation(x: number, y: number): void {
    this.state.isCreating = true
    this.state.x = x
    this.state.y = y

    console.log('🎯 TipTapBubbleTool: Démarrage création bulle', {
      type: this.state.bubbleType,
      position: { x, y }
    })
  }

  /**
   * Termine la création de bulle (IDENTIQUE au workflow PanelTool)
   */
  finishCreation(): DialogueElement | null {
    if (!this.state.isCreating) return null

    // Créer l'élément bulle TipTap avec centrage
    const bubble: DialogueElement = {
      id: generateElementId(),
      type: 'dialogue',
      layerType: 'dialogue',
      text: '', // Texte vide pour édition immédiate
      transform: {
        x: this.state.x - 75, // Centrer la bulle (150px/2)
        y: this.state.y - 40, // Centrer la bulle (80px/2)
        rotation: 0,
        alpha: 1,
        zIndex: 200, // Au-dessus des panels
        width: 150,  // Taille par défaut
        height: 80
      },
      dialogueStyle: {
        type: this.state.bubbleType,
        backgroundColor: this.getBubbleStyleDefaults(this.state.bubbleType).backgroundColor,
        outlineColor: this.getBubbleStyleDefaults(this.state.bubbleType).outlineColor,
        outlineWidth: this.getBubbleStyleDefaults(this.state.bubbleType).outlineWidth,
        textColor: 0x000000,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        dashedOutline: this.state.bubbleType === 'whisper' || this.state.bubbleType === 'thought',
        // ✅ LEGACY SUPPORT
        tailPosition: 'bottom-left',
        tailLength: 30,
        tailAngleDegrees: 225,
        tailAttachmentSide: 'bottom',
        // ✅ NEW ENHANCED QUEUE SYSTEM
        queue: {
          angle: 225, // Bottom-left direction (default)
          length: 40,
          thickness: 20,
          style: 'triangle',
          seamlessConnection: true,
          isManipulating: false,
          showHandles: false,
          snapToCardinal: false,
          curvature: 0.3,
          tapering: 0.2
        }
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
      console.log('⚠️ TipTapBubbleTool: Collision détectée, ajustement automatique')
      bubble.transform.x += 10
      bubble.transform.y += 10
    }

    // Terminer la création
    this.state.isCreating = false

    // Notifier la création
    if (this.onBubbleCreated) {
      this.onBubbleCreated(bubble)
    }

    console.log('✅ TipTapBubbleTool: Bulle créée:', bubble)
    return bubble
  }

  /**
   * Annule la création en cours
   */
  cancelCreation(): void {
    this.state.isCreating = false
    console.log('❌ TipTapBubbleTool: Création annulée')
  }

  /**
   * Vérifie les collisions avec les éléments existants
   */
  private checkCollision(bubble: DialogueElement): boolean {
    const bubbleBounds = {
      x: bubble.transform.x,
      y: bubble.transform.y,
      width: bubble.transform.width,
      height: bubble.transform.height
    }

    return this.elements.some(element => {
      if (element.id === bubble.id) return false

      const elementBounds = {
        x: element.transform.x,
        y: element.transform.y,
        width: element.transform.width,
        height: element.transform.height
      }

      return this.rectanglesOverlap(bubbleBounds, elementBounds)
    })
  }

  /**
   * Vérifie si deux rectangles se chevauchent
   */
  private rectanglesOverlap(rect1: any, rect2: any): boolean {
    return !(rect1.x + rect1.width < rect2.x || 
             rect2.x + rect2.width < rect1.x || 
             rect1.y + rect1.height < rect2.y || 
             rect2.y + rect2.height < rect1.y)
  }

  /**
   * Retourne les styles par défaut selon le type de bulle
   */
  private getBubbleStyleDefaults(type: BubbleType) {
    const defaults = {
      speech: {
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        outlineWidth: 2
      },
      thought: {
        backgroundColor: 0xf0f8ff,
        outlineColor: 0x4169e1,
        outlineWidth: 1
      },
      shout: {
        backgroundColor: 0xfff5ee,
        outlineColor: 0xff4500,
        outlineWidth: 3
      },
      whisper: {
        backgroundColor: 0xf5f5f5,
        outlineColor: 0x696969,
        outlineWidth: 1
      },
      explosion: {
        backgroundColor: 0xffffe0,
        outlineColor: 0xffd700,
        outlineWidth: 4
      }
    }

    return defaults[type] || defaults.speech
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.state.isPlacing = false
    this.onBubbleCreated = undefined
    this.elements = []
  }
}

/*[FR-UNTRANSLATED: *
 * Hook pour utiliser TipTapBubbleTool]
 */
export function useTipTapBubbleTool(onBubbleCreated?: (bubble: DialogueElement) => void) {
  const tool = new TipTapBubbleTool(onBubbleCreated)

  return {
    setBubbleType: tool.setBubbleType.bind(tool),
    startCreation: tool.startCreation.bind(tool),
    finishCreation: tool.finishCreation.bind(tool),
    cancelCreation: tool.cancelCreation.bind(tool),
    updateElements: tool.updateElements.bind(tool),
    isActive: tool.isActive,
    destroy: tool.destroy.bind(tool)
  }
}

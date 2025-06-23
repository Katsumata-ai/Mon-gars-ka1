// FreeTextTool - Outil pour créer du texte libre avec TipTap
// Utilise la même police et les mêmes styles que les bulles de dialogue

import { TextElement } from '../types/assembly.types'
import { generateElementId } from '../context/CanvasContext'

interface FreeTextToolState {
  isCreating: boolean
  x: number
  y: number
}

export class FreeTextTool {
  private state: FreeTextToolState = {
    isCreating: false,
    x: 0,
    y: 0
  }

  public isActive = false
  private onTextCreated?: (text: TextElement) => void

  constructor(onTextCreated?: (text: TextElement) => void) {
    this.onTextCreated = onTextCreated
  }

  /**
   * Active l'outil
   */
  activate(): void {
    this.isActive = true
    console.log('🎯 FreeTextTool: Activé')
  }

  /**
   * Désactive l'outil
   */
  deactivate(): void {
    this.isActive = false
    this.cancelCreation()
    console.log('🎯 FreeTextTool: Désactivé')
  }

  /**
   * Démarre la création de texte
   */
  startCreation(x: number, y: number): void {
    this.state.isCreating = true
    this.state.x = x
    this.state.y = y

    console.log('🎯 FreeTextTool: Démarrage création texte', {
      position: { x, y }
    })
  }

  /**
   * Termine la création de texte
   */
  finishCreation(): TextElement | null {
    if (!this.state.isCreating) return null

    // Créer l'élément texte libre avec les mêmes styles que les bulles
    const textElement: TextElement = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      layerType: 'dialogue', // Même couche que les bulles
      text: '', // Vide pour déclencher le placeholder // Texte vide pour édition immédiate
      transform: {
        x: this.state.x - 100, // Centrer le texte (200px/2)
        y: this.state.y - 25,  // Centrer le texte (50px/2)
        rotation: 0,
        alpha: 1,
        zIndex: 150, // Entre les panels et les bulles
        width: 200,  // Taille par défaut
        height: 50
      },
      textStyle: {
        fontSize: 20, // Même taille que les bulles
        fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
        fontWeight: '700',
        textColor: '#000000', // Même couleur que les bulles
        textAlign: 'center',
        lineHeight: 1.3,
        letterSpacing: '0.02em',
        textShadow: '0 0 1px rgba(255, 255, 255, 0.8)',
        backgroundColor: 'transparent', // Pas d'arrière-plan
        borderColor: 'transparent',
        borderWidth: 0,
        maxWidth: 200 // Largeur initiale pour le retour à la ligne
      },
      properties: {
        visible: true,
        locked: false,
        selectable: true,
        name: 'Texte libre'
      }
    }

    // Terminer la création
    this.state.isCreating = false

    // Notifier la création
    if (this.onTextCreated) {
      this.onTextCreated(textElement)
    }

    return textElement
  }

  /**
   * Annule la création en cours
   */
  cancelCreation(): void {
    if (this.state.isCreating) {
      this.state.isCreating = false
    }
  }

  /**
   * Vérifie si l'outil est en cours de création
   */
  get isCreating(): boolean {
    return this.state.isCreating
  }

  /**
   * Obtient la position actuelle de création
   */
  get creationPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y }
  }

  /**
   * Vérifie les collisions avec d'autres éléments
   */
  private checkCollision(textElement: TextElement): boolean {
    // Pas de détection de collision pour les textes libres
    return false
  }

  /**
   * Met à jour les éléments (pour la compatibilité avec les autres outils)
   */
  updateElements(elements: any[]): void {
    // Pas d'action spécifique nécessaire pour l'outil texte
  }

  /**
   * Nettoie les ressources de l'outil
   */
  destroy(): void {
    this.deactivate()
    this.onTextCreated = undefined
    console.log('🗑️ FreeTextTool: Détruit')
  }
}

/**
 * Hook pour utiliser FreeTextTool
 */
export function useFreeTextTool(onTextCreated?: (text: TextElement) => void) {
  const tool = new FreeTextTool(onTextCreated)

  return {
    activate: tool.activate.bind(tool),
    deactivate: tool.deactivate.bind(tool),
    startCreation: tool.startCreation.bind(tool),
    finishCreation: tool.finishCreation.bind(tool),
    cancelCreation: tool.cancelCreation.bind(tool),
    updateElements: tool.updateElements.bind(tool),
    isActive: tool.isActive,
    isCreating: tool.isCreating,
    creationPosition: tool.creationPosition,
    destroy: tool.destroy.bind(tool)
  }
}

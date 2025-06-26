// Outil de placement d'images derrière les panels pour le workflow Dashtoon

import { Sprite, Texture } from 'pixi.js'
import { SpriteElement, PanelElement } from '../types/assembly.types'
import { generateElementId } from '../managers/StateManager'

export interface ImagePlacementState {
  isDragging: boolean
  draggedImageUrl: string | null
  draggedImageId: string | null
  targetPanel: PanelElement | null
  previewSprite: Sprite | null
}

/**
 * Gestionnaire pour le placement d'images derrière les panels
 * Implémente le workflow Dashtoon : images derrière panels sélectionnés
 */
export class ImagePlacementTool {
  private state: ImagePlacementState = {
    isDragging: false,
    draggedImageUrl: null,
    draggedImageId: null,
    targetPanel: null,
    previewSprite: null
  }

  private onImagePlaced?: (sprite: SpriteElement) => void

  constructor(onImagePlaced?: (sprite: SpriteElement) => void) {
    this.onImagePlaced = onImagePlaced
  }

  /**
   * Démarre le drag d'une image
   */
  startDrag(imageId: string, imageUrl: string): void {
    this.state.isDragging = true
    this.state.draggedImageId = imageId
    this.state.draggedImageUrl = imageUrl
  }

  /**
   * Met à jour la position pendant le drag
   */
  updateDrag(x: number, y: number, panels: PanelElement[]): void {
    if (!this.state.isDragging) return

    // Trouver le panel sous la position
    const targetPanel = this.findPanelAtPosition(x, y, panels)
    this.state.targetPanel = targetPanel

    // TODO: Mettre à jour la prévisualisation
  }

  /**
   * Termine le drag et place l'image
   */
  finishDrag(x: number, y: number, panels: PanelElement[]): SpriteElement | null {
    if (!this.state.isDragging || !this.state.draggedImageUrl) return null

    const targetPanel = this.findPanelAtPosition(x, y, panels)

    if (targetPanel) {
      // Placer l'image derrière le panel
      const sprite = this.createSpriteForPanel(targetPanel, this.state.draggedImageUrl)
      this.onImagePlaced?.(sprite)
      this.cancelDrag()
      return sprite
    }

    this.cancelDrag()
    return null
  }

  /**
   * Annule le drag en cours
   */
  cancelDrag(): void {
    if (this.state.previewSprite) {
      this.state.previewSprite.destroy()
      this.state.previewSprite = null
    }

    this.state.isDragging = false
    this.state.draggedImageUrl = null
    this.state.draggedImageId = null
    this.state.targetPanel = null
  }

  /**
   * Trouve le panel à une position donnée
   */
  private findPanelAtPosition(x: number, y: number, panels: PanelElement[]): PanelElement | null {
    for (const panel of panels) {
      const { x: px, y: py, width, height } = panel.transform
      
      if (x >= px && x <= px + width && y >= py && y <= py + height) {
        return panel
      }
    }
    return null
  }

  /**
   * Crée un sprite adapté à un panel
   */
  private createSpriteForPanel(panel: PanelElement, imageUrl: string): SpriteElement {
    const { x, y, width, height } = panel.transform

    return {
      id: generateElementId(),
      type: 'sprite',
      layerType: 'characters', // Derrière les panels
      transform: {
        x,
        y,
        rotation: 0,
        alpha: 1,
        zIndex: 50, // Derrière les panels (zIndex 100)
        width,
        height
      },
      properties: {
        imageUrl,
        maintainAspectRatio: true,
        cropMode: 'fit', // Adapter à la taille du panel
        filters: []
      },
      metadata: {
        name: `Image dans panel ${panel.metadata.name}`,
        locked: false,
        visible: true,
        createdAt: new Date(),
        modifiedAt: new Date(),
        parentPanelId: panel.id // Lien avec le panel
      }
    }
  }

  /**
   * Place une image dans un panel spécifique
   */
  placeImageInPanel(imageUrl: string, panel: PanelElement): SpriteElement {
    return this.createSpriteForPanel(panel, imageUrl)
  }

  /**
   * Redimensionne une image selon son panel parent
   */
  resizeImageToPanel(sprite: SpriteElement, panel: PanelElement): SpriteElement {
    return {
      ...sprite,
      transform: {
        ...sprite.transform,
        x: panel.transform.x,
        y: panel.transform.y,
        width: panel.transform.width,
        height: panel.transform.height
      },
      metadata: {
        ...sprite.metadata,
        modifiedAt: new Date(),
        parentPanelId: panel.id
      }
    }
  }

  /**
   * Vérifie si l'outil est actif
   */
  get isActive(): boolean {
    return this.state.isDragging
  }

  /**
   * Obtient le panel cible actuel
   */
  get targetPanel(): PanelElement | null {
    return this.state.targetPanel
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.cancelDrag()
  }
}

/**
 * Hook pour utiliser l'outil de placement d'images
 */
export function useImagePlacementTool(onImagePlaced?: (sprite: SpriteElement) => void) {
  const tool = new ImagePlacementTool(onImagePlaced)
  
  return {
    startDrag: tool.startDrag.bind(tool),
    updateDrag: tool.updateDrag.bind(tool),
    finishDrag: tool.finishDrag.bind(tool),
    cancelDrag: tool.cancelDrag.bind(tool),
    placeImageInPanel: tool.placeImageInPanel.bind(tool),
    resizeImageToPanel: tool.resizeImageToPanel.bind(tool),
    isActive: tool.isActive,
    targetPanel: tool.targetPanel,
    destroy: tool.destroy.bind(tool)
  }
}

/**
 * Utilitaires pour la gestion des images et panels
 */
export const ImagePanelUtils = {
  /**
   * Trouve toutes les images liées à un panel
   */
  findImagesForPanel(panelId: string, sprites: SpriteElement[]): SpriteElement[] {
    return sprites.filter(sprite => 
      sprite.metadata.parentPanelId === panelId
    )
  },

  /**
   * Supprime toutes les images d'un panel
   */
  removeImagesFromPanel(panelId: string, sprites: SpriteElement[]): SpriteElement[] {
    return sprites.filter(sprite => 
      sprite.metadata.parentPanelId !== panelId
    )
  },

  /*[FR-UNTRANSLATED: *
   * Met à jour toutes les images d'un panel quand il est redimensionné]
   */
  updateImagesForPanel(panel: PanelElement, sprites: SpriteElement[]): SpriteElement[] {
    return sprites.map(sprite => {
      if (sprite.metadata.parentPanelId === panel.id) {
        return {
          ...sprite,
          transform: {
            ...sprite.transform,
            x: panel.transform.x,
            y: panel.transform.y,
            width: panel.transform.width,
            height: panel.transform.height
          },
          metadata: {
            ...sprite.metadata,
            modifiedAt: new Date()
          }
        }
      }
      return sprite
    })
  }
}

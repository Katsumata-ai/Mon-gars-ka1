// Outil de création de panels pour le workflow Dashtoon

// ✅ MIGRATION KONVA : Remplacement PixiJS par Konva.js
import Konva from 'konva'
import { AssemblyElement, PanelElement } from '../types/assembly.types'
import { generateElementId } from '../managers/StateManager'
// Le service sera passé via les callbacks

export interface PanelCreationState {
  isCreating: boolean
  startX: number
  startY: number
  currentX: number
  currentY: number
  previewGraphics: Graphics | null
}

/**
 * Gestionnaire pour l'outil de création de panels
 * Permet de dessiner des rectangles en cliquant-glissant
 */
export class PanelTool {
  private state: PanelCreationState = {
    isCreating: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    previewGraphics: null
  }

  private onPanelCreated?: (panel: PanelElement) => void
  private elements: AssemblyElement[] = [] // Cache des éléments pour la détection de collision

  constructor(onPanelCreated?: (panel: PanelElement) => void) {
    this.onPanelCreated = onPanelCreated
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
   * Démarre la création d'un panel
   */
  startCreation(x: number, y: number, stage: any): void {
    this.state.isCreating = true
    this.state.startX = x
    this.state.startY = y
    this.state.currentX = x
    this.state.currentY = y

    // Créer le graphique de prévisualisation
    this.state.previewGraphics = new Graphics()
    this.state.previewGraphics.name = 'panel-preview'
    stage.addChild(this.state.previewGraphics)

    this.updatePreview()
  }

  /**
   * Met à jour la position pendant le glissement
   */
  updateCreation(x: number, y: number): void {
    if (!this.state.isCreating) return

    this.state.currentX = x
    this.state.currentY = y
    this.updatePreview()
  }

  /**
   * Termine la création du panel
   */
  finishCreation(stage: any): PanelElement | null {
    if (!this.state.isCreating) return null

    const width = Math.abs(this.state.currentX - this.state.startX)
    const height = Math.abs(this.state.currentY - this.state.startY)

    // Si la taille est très petite (simple clic), créer un panel de taille par défaut
    const isSimpleClick = width < 20 || height < 20
    const finalWidth = isSimpleClick ? 200 : width
    const finalHeight = isSimpleClick ? 150 : height

    // Calculer la position finale
    const x = isSimpleClick ? this.state.startX - finalWidth / 2 : Math.min(this.state.startX, this.state.currentX)
    const y = isSimpleClick ? this.state.startY - finalHeight / 2 : Math.min(this.state.startY, this.state.currentY)

    // 🚫 VÉRIFICATION ANTI-COLLISION : Empêcher les panels dans les panels
    if (!this.isValidPlacement(x, y, finalWidth, finalHeight)) {
      console.warn('🚫 Placement de panel invalide : collision avec un panel existant')
      this.cancelCreation(stage)
      return null
    }

    // Créer l'élément panel
    const panel: PanelElement = {
      id: generateElementId(),
      type: 'panel',
      layerType: 'panels',
      transform: {
        x,
        y,
        rotation: 0,
        alpha: 1,
        zIndex: 100,
        width: finalWidth,
        height: finalHeight
      },
      panelStyle: {
        shape: 'rectangle',
        borderColor: 0x000000, // Noir pur
        borderWidth: 8, // 🎯 BEAUCOUP PLUS ÉPAIS pour distinction claire
        borderStyle: 'solid',
        fillColor: 0x000000, // 🎯 FOND NOIR par défaut pour panels vides
        fillAlpha: 1.0, // 🎯 Complètement opaque pour bien voir le fond noir
        cornerRadius: 6 // Légèrement réduit pour compenser l'épaisseur
      },
      properties: {
        name: `Panel`,
        locked: false,
        visible: true,
        blendMode: 'normal'
      },
      metadata: {
        sourceType: 'manual',
        addedAt: '',
        lastModified: ''
      }
    }

    console.log('✅ Panel créé:', panel)

    // 🔍 DÉTECTION AUTOMATIQUE DES IMAGES SOUS LE PANEL
    // La détection sera gérée par le callback onPanelCreated
    console.log('📋 Panel créé, détection automatique sera gérée par le contexte')

    // Nettoyer la prévisualisation
    this.cancelCreation(stage)

    // Notifier la création
    this.onPanelCreated?.(panel)

    return panel
  }

  /**
   * Annule la création en cours
   */
  cancelCreation(stage: any): void {
    if (this.state.previewGraphics) {
      stage.removeChild(this.state.previewGraphics)
      this.state.previewGraphics.destroy()
      this.state.previewGraphics = null
    }

    this.state.isCreating = false
  }

  /**
   * Met à jour la prévisualisation du panel
   */
  private updatePreview(): void {
    if (!this.state.previewGraphics) return

    const graphics = this.state.previewGraphics
    graphics.clear()

    const x = Math.min(this.state.startX, this.state.currentX)
    const y = Math.min(this.state.startY, this.state.currentY)
    const width = Math.abs(this.state.currentX - this.state.startX)
    const height = Math.abs(this.state.currentY - this.state.startY)

    // Vérifier si le placement est valide
    const isValid = this.isValidPlacement(x, y, width, height)

    // Couleurs selon la validité du placement
    const strokeColor = isValid ? 0x00ff00 : 0xff0000 // Vert si valide, rouge si invalide
    const fillColor = isValid ? 0x00ff00 : 0xff0000
    const alpha = isValid ? 0.8 : 0.6

    // Dessiner le rectangle de prévisualisation avec feedback visuel
    graphics
      .rect(x, y, width, height)
      .stroke({ width: 2, color: strokeColor, alpha })
      .fill({ color: fillColor, alpha: 0.1 })
  }

  /**
   * Vérifie si le placement d'un panel est valide (pas de collision avec d'autres panels)
   */
  private isValidPlacement(x: number, y: number, width: number, height: number): boolean {
    const newPanelBounds = { x, y, width, height }

    // Filtrer seulement les panels existants
    const existingPanels = this.elements.filter(el => el.type === 'panel')

    console.log('🔍 Vérification placement panel:', {
      newPanel: newPanelBounds,
      existingPanelsCount: existingPanels.length,
      existingPanels: existingPanels.map(p => ({
        id: p.id,
        bounds: { x: p.transform.x, y: p.transform.y, width: p.transform.width, height: p.transform.height }
      }))
    })

    // Vérifier la collision avec chaque panel existant
    for (const panel of existingPanels) {
      if (this.boundsOverlap(newPanelBounds, panel.transform)) {
        console.warn('🚫 Collision détectée avec panel:', panel.id)
        return false
      }
    }

    return true
  }

  /**
   * Vérifie si deux rectangles se chevauchent
   */
  private boundsOverlap(bounds1: any, bounds2: any): boolean {
    const overlap = !(
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds2.x + bounds2.width <= bounds1.x ||
      bounds1.y + bounds1.height <= bounds2.y ||
      bounds2.y + bounds2.height <= bounds1.y
    )

    console.log('🔍 Test overlap:', {
      bounds1,
      bounds2,
      overlap
    })

    return overlap
  }

  /**
   * Vérifie si l'outil est en cours d'utilisation
   */
  get isActive(): boolean {
    return this.state.isCreating
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
 * Hook pour utiliser l'outil de création de panels
 */
export function usePanelTool(onPanelCreated?: (panel: PanelElement) => void) {
  const tool = new PanelTool(onPanelCreated)

  return {
    startCreation: tool.startCreation.bind(tool),
    updateCreation: tool.updateCreation.bind(tool),
    finishCreation: tool.finishCreation.bind(tool),
    cancelCreation: tool.cancelCreation.bind(tool),
    updateElements: tool.updateElements.bind(tool),
    isActive: tool.isActive,
    destroy: tool.destroy.bind(tool)
  }
}

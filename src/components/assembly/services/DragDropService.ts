/**
 * Service pour gérer le drag & drop d'images vers les panels
 */

import { AssemblyElement, PanelElement, ImageElement } from '../types/assembly.types'
import { generateElementId } from '../context/CanvasContext'

export interface DragDropData {
  type: 'image' | 'scene' | 'character' | 'decor'
  sourceId: string
  imageUrl: string
  metadata: {
    originalWidth: number
    originalHeight: number
    name: string
    sourceType: 'character' | 'decor' | 'scene' | 'upload'
  }
}

export interface DropZone {
  id: string
  type: 'panel' | 'canvas'
  bounds: {
    x: number
    y: number
    width: number
    height: number
  }
  element?: PanelElement
}

export class DragDropService {
  private dragData: DragDropData | null = null
  private dropZones: Map<string, DropZone> = new Map()
  private isDragging: boolean = false
  private dragPreview: HTMLElement | null = null

  /**
   * Démarrer une opération de drag
   */
  startDrag(data: DragDropData, event: DragEvent): void {
    this.dragData = data
    this.isDragging = true
    
    // Créer un aperçu de drag personnalisé
    this.createDragPreview(data, event)
    
    console.log('🎯 Drag démarré:', data)
  }

  /**
   * Créer un aperçu visuel pour le drag
   */
  private createDragPreview(data: DragDropData, event: DragEvent): void {
    const preview = document.createElement('div')
    preview.className = 'drag-preview'
    preview.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 10000;
      background: rgba(59, 130, 246, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transform: translate(-50%, -50%);
    `
    preview.textContent = `📷 ${data.metadata.name}`
    
    document.body.appendChild(preview)
    this.dragPreview = preview
    
    // Positionner l'aperçu
    this.updateDragPreview(event.clientX, event.clientY)
  }

  /**
   * Mettre à jour la position de l'aperçu de drag
   */
  updateDragPreview(x: number, y: number): void {
    if (this.dragPreview) {
      this.dragPreview.style.left = `${x}px`
      this.dragPreview.style.top = `${y}px`
    }
  }

  /**
   * Enregistrer une zone de drop
   */
  registerDropZone(zone: DropZone): void {
    this.dropZones.set(zone.id, zone)
    console.log('📍 Zone de drop enregistrée:', zone.id)
  }

  /**
   * Supprimer une zone de drop
   */
  unregisterDropZone(zoneId: string): void {
    this.dropZones.delete(zoneId)
    console.log('🗑️ Zone de drop supprimée:', zoneId)
  }

  /**
   * Trouver la zone de drop sous le curseur
   */
  findDropZoneAt(x: number, y: number): DropZone | null {
    for (const zone of this.dropZones.values()) {
      if (this.isPointInBounds(x, y, zone.bounds)) {
        return zone
      }
    }
    return null
  }

  /**
   * Vérifier si un point est dans des bounds
   */
  private isPointInBounds(x: number, y: number, bounds: { x: number, y: number, width: number, height: number }): boolean {
    return x >= bounds.x && 
           x <= bounds.x + bounds.width && 
           y >= bounds.y && 
           y <= bounds.y + bounds.height
  }

  /**
   * Gérer le drop sur une zone
   */
  handleDrop(x: number, y: number, canvasElements: AssemblyElement[]): ImageElement | null {
    if (!this.isDragging || !this.dragData) {
      console.warn('⚠️ Tentative de drop sans drag actif')
      return null
    }

    const dropZone = this.findDropZoneAt(x, y)
    
    if (dropZone) {
      console.log('🎯 Drop détecté sur zone:', dropZone.id)
      
      if (dropZone.type === 'panel' && dropZone.element) {
        return this.handleDropOnPanel(dropZone.element, x, y)
      } else if (dropZone.type === 'canvas') {
        return this.handleDropOnCanvas(x, y)
      }
    } else {
      // Drop sur le canvas général
      return this.handleDropOnCanvas(x, y)
    }

    return null
  }

  /**
   * Gérer le drop sur un panel
   */
  private handleDropOnPanel(panel: PanelElement, x: number, y: number): ImageElement | null {
    if (!this.dragData) return null

    // Créer une nouvelle image positionnée dans le panel
    const image: ImageElement = {
      id: generateElementId(),
      type: 'image',
      layerType: 'characters', // Ajuster selon le type de source
      transform: {
        x: panel.transform.x + 10, // Petit offset pour éviter le chevauchement exact
        y: panel.transform.y + 10,
        width: Math.min(this.dragData.metadata.originalWidth, panel.transform.width - 20),
        height: Math.min(this.dragData.metadata.originalHeight, panel.transform.height - 20),
        rotation: 0,
        alpha: 1,
        zIndex: panel.transform.zIndex - 5 // En-dessous du panel
      },
      imageData: {
        src: this.dragData.imageUrl,
        originalWidth: this.dragData.metadata.originalWidth,
        originalHeight: this.dragData.metadata.originalHeight,
        alt: this.dragData.metadata.name
      },
      properties: {
        name: this.dragData.metadata.name,
        locked: false,
        visible: true,
        blendMode: 'normal'
      },
      metadata: {
        sourceType: this.dragData.metadata.sourceType,
        sourceId: this.dragData.sourceId,
        addedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }

    console.log('🎯 Image créée dans panel:', {
      imageId: image.id,
      panelId: panel.id,
      position: { x: image.transform.x, y: image.transform.y },
      size: { width: image.transform.width, height: image.transform.height }
    })

    return image
  }

  /**
   * Gérer le drop sur le canvas
   */
  private handleDropOnCanvas(x: number, y: number): ImageElement | null {
    if (!this.dragData) return null

    // Créer une nouvelle image à la position du drop
    const image: ImageElement = {
      id: generateElementId(),
      type: 'image',
      layerType: 'characters',
      transform: {
        x: x - this.dragData.metadata.originalWidth / 2, // Centrer sur le curseur
        y: y - this.dragData.metadata.originalHeight / 2,
        width: this.dragData.metadata.originalWidth,
        height: this.dragData.metadata.originalHeight,
        rotation: 0,
        alpha: 1,
        zIndex: 20 // Au-dessus des autres éléments
      },
      imageData: {
        src: this.dragData.imageUrl,
        originalWidth: this.dragData.metadata.originalWidth,
        originalHeight: this.dragData.metadata.originalHeight,
        alt: this.dragData.metadata.name
      },
      properties: {
        name: this.dragData.metadata.name,
        locked: false,
        visible: true,
        blendMode: 'normal'
      },
      metadata: {
        sourceType: this.dragData.metadata.sourceType,
        sourceId: this.dragData.sourceId,
        addedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }
    }

    console.log('🎯 Image créée sur canvas:', {
      imageId: image.id,
      position: { x: image.transform.x, y: image.transform.y },
      size: { width: image.transform.width, height: image.transform.height }
    })

    return image
  }

  /**
   * Terminer l'opération de drag
   */
  endDrag(): void {
    this.isDragging = false
    this.dragData = null
    
    // Supprimer l'aperçu de drag
    if (this.dragPreview) {
      document.body.removeChild(this.dragPreview)
      this.dragPreview = null
    }
    
    console.log('🏁 Drag terminé')
  }

  /**
   * Vérifier si un drag est en cours
   */
  get isActive(): boolean {
    return this.isDragging
  }

  /**
   * Obtenir les données du drag actuel
   */
  get currentDragData(): DragDropData | null {
    return this.dragData
  }

  /**
   * Obtenir toutes les zones de drop
   */
  getDropZones(): DropZone[] {
    return Array.from(this.dropZones.values())
  }

  /**
   * Mettre à jour les bounds d'une zone de drop
   */
  updateDropZoneBounds(zoneId: string, bounds: DropZone['bounds']): void {
    const zone = this.dropZones.get(zoneId)
    if (zone) {
      zone.bounds = bounds
      console.log('📍 Bounds de zone de drop mis à jour:', zoneId)
    }
  }

  /**
   * Nettoyer toutes les zones de drop
   */
  clearDropZones(): void {
    this.dropZones.clear()
    console.log('🧹 Toutes les zones de drop supprimées')
  }
}

// Instance singleton
export const dragDropService = new DragDropService()

/**
 * Service pour gérer les associations entre panels et images
 */

import { AssemblyElement, PanelElement, ImageElement } from '../types/assembly.types'
import { 
  PanelContentAssociation, 
  ImagePanelIntersection, 
  PanelContentManager 
} from '../types/panel-content.types'

export class PanelContentService implements PanelContentManager {
  public associations: Map<string, PanelContentAssociation> = new Map()

  /**
   * Détecter automatiquement les images sous un panel
   */
  detectImagesUnderPanel(panelId: string, elements: AssemblyElement[]): ImagePanelIntersection[] {
    const panel = elements.find(el => el.id === panelId && el.type === 'panel') as PanelElement
    if (!panel) {
      console.warn('🚫 Panel non trouvé:', panelId)
      return []
    }

    // Filtrer les images qui ont un z-index inférieur au panel
    const imagesBelow = elements.filter(el => 
      el.type === 'image' && 
      el.transform.zIndex < panel.transform.zIndex
    ) as ImageElement[]

    console.log('🔍 Détection images sous panel:', {
      panelId,
      panelBounds: {
        x: panel.transform.x,
        y: panel.transform.y,
        width: panel.transform.width,
        height: panel.transform.height,
        zIndex: panel.transform.zIndex
      },
      imagesBelowCount: imagesBelow.length,
      imagesBelow: imagesBelow.map(img => ({
        id: img.id,
        bounds: {
          x: img.transform.x,
          y: img.transform.y,
          width: img.transform.width,
          height: img.transform.height,
          zIndex: img.transform.zIndex
        }
      }))
    })

    const intersections: ImagePanelIntersection[] = []

    imagesBelow.forEach(image => {
      const intersection = this.calculateIntersection(panel, image)
      if (intersection) {
        intersections.push(intersection)
      }
    })

    console.log('✅ Intersections détectées:', intersections)
    return intersections
  }

  /**
   * Calculer l'intersection entre un panel et une image
   */
  private calculateIntersection(panel: PanelElement, image: ImageElement): ImagePanelIntersection | null {
    const panelBounds = panel.transform
    const imageBounds = image.transform

    // Calculer l'intersection des rectangles
    const left = Math.max(panelBounds.x, imageBounds.x)
    const top = Math.max(panelBounds.y, imageBounds.y)
    const right = Math.min(panelBounds.x + panelBounds.width, imageBounds.x + imageBounds.width)
    const bottom = Math.min(panelBounds.y + panelBounds.height, imageBounds.y + imageBounds.height)

    // Vérifier s'il y a une intersection
    if (left >= right || top >= bottom) {
      return null // Pas d'intersection
    }

    const intersectionWidth = right - left
    const intersectionHeight = bottom - top
    const intersectionArea = intersectionWidth * intersectionHeight
    const imageArea = imageBounds.width * imageBounds.height
    const coveragePercentage = (intersectionArea / imageArea) * 100

    console.log('📐 Calcul intersection:', {
      panelBounds,
      imageBounds,
      intersection: { left, top, right, bottom },
      intersectionArea,
      imageArea,
      coveragePercentage
    })

    return {
      imageId: image.id,
      panelId: panel.id,
      intersectionBounds: {
        x: left,
        y: top,
        width: intersectionWidth,
        height: intersectionHeight
      },
      coveragePercentage,
      isSignificant: coveragePercentage > 10 // Seuil de 10%
    }
  }

  /**
   * Créer une association automatique
   */
  createAutomaticAssociation(panelId: string, imageIds: string[]): void {
    const association: PanelContentAssociation = {
      panelId,
      imageIds,
      associationType: 'automatic',
      maskEnabled: true,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    this.associations.set(panelId, association)
    
    console.log('🔗 Association automatique créée:', association)
  }

  /**
   * Créer une association manuelle
   */
  createManualAssociation(panelId: string, imageIds: string[]): void {
    const existing = this.associations.get(panelId)
    
    const association: PanelContentAssociation = {
      panelId,
      imageIds,
      associationType: 'manual',
      maskEnabled: existing?.maskEnabled ?? true,
      metadata: {
        createdAt: existing?.metadata?.createdAt ?? Date.now(),
        updatedAt: Date.now()
      }
    }

    this.associations.set(panelId, association)
    
    console.log('🔗 Association manuelle créée:', association)
  }

  /**
   * Supprimer une association
   */
  removeAssociation(panelId: string): void {
    const removed = this.associations.delete(panelId)
    if (removed) {
      console.log('🗑️ Association supprimée pour panel:', panelId)
    }
  }

  /**
   * Ajouter une image à un panel existant
   */
  addImageToPanel(panelId: string, imageId: string): void {
    const association = this.associations.get(panelId)
    if (association) {
      if (!association.imageIds.includes(imageId)) {
        association.imageIds.push(imageId)
        association.metadata!.updatedAt = Date.now()
        console.log('➕ Image ajoutée au panel:', { panelId, imageId })
      }
    } else {
      this.createManualAssociation(panelId, [imageId])
    }
  }

  /**
   * Supprimer une image d'un panel
   */
  removeImageFromPanel(panelId: string, imageId: string): void {
    const association = this.associations.get(panelId)
    if (association) {
      association.imageIds = association.imageIds.filter(id => id !== imageId)
      association.metadata!.updatedAt = Date.now()
      console.log('➖ Image supprimée du panel:', { panelId, imageId })
      
      // Supprimer l'association si plus d'images
      if (association.imageIds.length === 0) {
        this.removeAssociation(panelId)
      }
    }
  }

  /**
   * Obtenir les images associées à un panel
   */
  getImagesForPanel(panelId: string): string[] {
    const association = this.associations.get(panelId)
    return association?.imageIds ?? []
  }

  /**
   * Obtenir les panels qui contiennent une image
   */
  getPanelsForImage(imageId: string): string[] {
    const panels: string[] = []
    
    this.associations.forEach((association, panelId) => {
      if (association.imageIds.includes(imageId)) {
        panels.push(panelId)
      }
    })
    
    return panels
  }

  /**
   * Activer/désactiver le masquage pour un panel
   */
  toggleMasking(panelId: string, enabled: boolean): void {
    const association = this.associations.get(panelId)
    if (association) {
      association.maskEnabled = enabled
      association.metadata!.updatedAt = Date.now()
      console.log('🎭 Masquage modifié:', { panelId, enabled })
    }
  }

  /**
   * Obtenir toutes les associations
   */
  getAllAssociations(): PanelContentAssociation[] {
    return Array.from(this.associations.values())
  }

  /**
   * Nettoyer les associations pour les panels/images supprimés
   */
  cleanup(existingElementIds: string[]): void {
    const toRemove: string[] = []
    
    this.associations.forEach((association, panelId) => {
      // Supprimer si le panel n'existe plus
      if (!existingElementIds.includes(panelId)) {
        toRemove.push(panelId)
        return
      }
      
      // Nettoyer les images qui n'existent plus
      association.imageIds = association.imageIds.filter(imageId => 
        existingElementIds.includes(imageId)
      )
      
      // Supprimer l'association si plus d'images
      if (association.imageIds.length === 0) {
        toRemove.push(panelId)
      }
    })
    
    toRemove.forEach(panelId => this.removeAssociation(panelId))
    
    if (toRemove.length > 0) {
      console.log('🧹 Nettoyage associations:', toRemove)
    }
  }
}

// Instance singleton
export const panelContentService = new PanelContentService()

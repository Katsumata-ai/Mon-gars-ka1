/**
 * Service avancé pour le masquage PixiJS des panels
 */

import { Container, Graphics, Sprite, Texture } from 'pixi.js'
import { AssemblyElement, PanelElement, ImageElement } from '../types/assembly.types'
import { PanelMaskingOptions } from '../types/panel-content.types'

export class PanelMaskingService {
  private maskCache: Map<string, Graphics> = new Map()

  /**
   * Créer un masque pour un panel
   */
  createPanelMask(panel: PanelElement, options: PanelMaskingOptions = { maskType: 'rectangular' }): Graphics {
    const cacheKey = this.getMaskCacheKey(panel, options)
    
    // Vérifier le cache
    if (this.maskCache.has(cacheKey)) {
      return this.maskCache.get(cacheKey)!.clone()
    }

    const mask = new Graphics()
    
    switch (options.maskType) {
      case 'rectangular':
        this.createRectangularMask(mask, panel, options)
        break
      case 'rounded':
        this.createRoundedMask(mask, panel, options)
        break
      case 'custom':
        this.createCustomMask(mask, panel, options)
        break
      default:
        this.createRectangularMask(mask, panel, options)
    }

    // Mettre en cache
    this.maskCache.set(cacheKey, mask.clone())
    
    console.log('🎭 Masque créé pour panel:', {
      panelId: panel.id,
      maskType: options.maskType,
      cacheKey
    })

    return mask
  }

  /**
   * Créer un masque rectangulaire
   */
  private createRectangularMask(mask: Graphics, panel: PanelElement, options: PanelMaskingOptions): void {
    const { padding = { top: 0, right: 0, bottom: 0, left: 0 } } = options
    
    const x = padding.left
    const y = padding.top
    const width = panel.transform.width - padding.left - padding.right
    const height = panel.transform.height - padding.top - padding.bottom

    mask.rect(x, y, width, height)
    mask.fill({ color: 0xffffff, alpha: options.maskOpacity || 1 })
  }

  /**
   * Créer un masque arrondi
   */
  private createRoundedMask(mask: Graphics, panel: PanelElement, options: PanelMaskingOptions): void {
    const { padding = { top: 0, right: 0, bottom: 0, left: 0 }, cornerRadius = 10 } = options
    
    const x = padding.left
    const y = padding.top
    const width = panel.transform.width - padding.left - padding.right
    const height = panel.transform.height - padding.top - padding.bottom

    mask.roundRect(x, y, width, height, cornerRadius)
    mask.fill({ color: 0xffffff, alpha: options.maskOpacity || 1 })
  }

  /**
   * Créer un masque personnalisé
   */
  private createCustomMask(mask: Graphics, panel: PanelElement, options: PanelMaskingOptions): void {
    // Pour l'instant, utiliser le masque rectangulaire
    // TODO: Implémenter des formes personnalisées
    this.createRectangularMask(mask, panel, options)
  }

  /**
   * Appliquer un masque à un conteneur d'images
   */
  applyMaskToContainer(container: Container, mask: Graphics): void {
    // Positionner le masque correctement
    mask.x = container.x
    mask.y = container.y
    
    // Appliquer le masque
    container.mask = mask
    
    console.log('🎭 Masque appliqué au conteneur:', {
      containerPosition: { x: container.x, y: container.y },
      maskPosition: { x: mask.x, y: mask.y },
      childrenCount: container.children.length
    })
  }

  /**
   * Créer un conteneur masqué pour les images d'un panel
   */
  createMaskedImageContainer(
    panel: PanelElement, 
    images: ImageElement[], 
    options: PanelMaskingOptions = { maskType: 'rectangular' }
  ): Container {
    const maskedContainer = new Container()
    maskedContainer.name = `masked-container-${panel.id}`
    
    // Positionner le conteneur à la position du panel
    maskedContainer.x = panel.transform.x
    maskedContainer.y = panel.transform.y
    maskedContainer.zIndex = panel.transform.zIndex - 1 // Juste en-dessous du panel

    // Créer le masque
    const mask = this.createPanelMask(panel, options)
    
    // Ajouter les images au conteneur
    images.forEach(image => {
      const imageSprite = this.createImageSprite(image, panel)
      if (imageSprite) {
        maskedContainer.addChild(imageSprite)
      }
    })

    // Appliquer le masque
    this.applyMaskToContainer(maskedContainer, mask)
    
    // Ajouter le masque au stage (nécessaire pour PixiJS)
    maskedContainer.parent?.addChild(mask)

    console.log('🎭 Conteneur masqué créé:', {
      panelId: panel.id,
      imagesCount: images.length,
      containerPosition: { x: maskedContainer.x, y: maskedContainer.y },
      zIndex: maskedContainer.zIndex
    })

    return maskedContainer
  }

  /**
   * Créer un sprite d'image pour le masquage
   */
  private createImageSprite(image: ImageElement, panel: PanelElement): Sprite | null {
    try {
      // Pour l'instant, créer un placeholder
      // TODO: Charger la vraie texture de l'image
      const texture = Texture.WHITE
      const sprite = new Sprite(texture)
      
      // Positionner relativement au panel
      sprite.x = image.transform.x - panel.transform.x
      sprite.y = image.transform.y - panel.transform.y
      sprite.width = image.transform.width
      sprite.height = image.transform.height
      sprite.alpha = image.transform.alpha
      sprite.rotation = image.transform.rotation
      
      sprite.name = `image-sprite-${image.id}`
      
      console.log('🖼️ Sprite d'image créé:', {
        imageId: image.id,
        relativePosition: { x: sprite.x, y: sprite.y },
        size: { width: sprite.width, height: sprite.height }
      })

      return sprite
    } catch (error) {
      console.error('❌ Erreur création sprite image:', error)
      return null
    }
  }

  /**
   * Mettre à jour un conteneur masqué
   */
  updateMaskedContainer(
    container: Container, 
    panel: PanelElement, 
    images: ImageElement[],
    options: PanelMaskingOptions = { maskType: 'rectangular' }
  ): void {
    // Mettre à jour la position du conteneur
    container.x = panel.transform.x
    container.y = panel.transform.y
    container.zIndex = panel.transform.zIndex - 1

    // Recréer le masque si nécessaire
    const newMask = this.createPanelMask(panel, options)
    
    // Supprimer l'ancien masque
    if (container.mask) {
      container.mask.destroy()
    }
    
    // Appliquer le nouveau masque
    this.applyMaskToContainer(container, newMask)

    // Mettre à jour les sprites d'images
    container.removeChildren()
    images.forEach(image => {
      const imageSprite = this.createImageSprite(image, panel)
      if (imageSprite) {
        container.addChild(imageSprite)
      }
    })

    console.log('🔄 Conteneur masqué mis à jour:', {
      panelId: panel.id,
      imagesCount: images.length
    })
  }

  /**
   * Supprimer un conteneur masqué
   */
  removeMaskedContainer(container: Container): void {
    // Supprimer le masque
    if (container.mask) {
      container.mask.destroy()
      container.mask = null
    }

    // Supprimer tous les enfants
    container.removeChildren()
    
    // Supprimer le conteneur du parent
    if (container.parent) {
      container.parent.removeChild(container)
    }

    container.destroy()
    
    console.log('🗑️ Conteneur masqué supprimé')
  }

  /**
   * Générer une clé de cache pour un masque
   */
  private getMaskCacheKey(panel: PanelElement, options: PanelMaskingOptions): string {
    return `${panel.id}-${panel.transform.width}x${panel.transform.height}-${options.maskType}-${options.cornerRadius || 0}`
  }

  /**
   * Nettoyer le cache des masques
   */
  clearMaskCache(): void {
    this.maskCache.forEach(mask => mask.destroy())
    this.maskCache.clear()
    console.log('🧹 Cache des masques nettoyé')
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number, keys: string[] } {
    return {
      size: this.maskCache.size,
      keys: Array.from(this.maskCache.keys())
    }
  }
}

// Instance singleton
export const panelMaskingService = new PanelMaskingService()

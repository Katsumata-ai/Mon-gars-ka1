// Système de coordonnées unifié pour la migration PixiJS → HTML/CSS
// Gère la conversion bidirectionnelle et la synchronisation des transformations

import { Application } from 'pixi.js'

export interface CanvasTransform {
  x: number
  y: number
  scale: number
}

export interface DOMPoint {
  x: number
  y: number
}

export interface CanvasPoint {
  x: number
  y: number
}

export interface ViewportInfo {
  width: number
  height: number
  centerX: number
  centerY: number
}

/**
 * Système de coordonnées unifié pour gérer la conversion entre :
 * - Coordonnées Canvas PixiJS (locales au stage)
 * - Coordonnées DOM (relatives au viewport)
 * - Transformations CSS (translate + scale)
 */
export class UnifiedCoordinateSystem {
  private canvasTransform: CanvasTransform
  private pixiApp: Application | null = null
  private domLayer: HTMLElement | null = null
  private viewport: ViewportInfo
  private canvasSize: { width: number; height: number }

  constructor(
    canvasTransform: CanvasTransform,
    viewport: ViewportInfo,
    canvasSize: { width: number; height: number }
  ) {
    this.canvasTransform = { ...canvasTransform }
    this.viewport = { ...viewport }
    this.canvasSize = { ...canvasSize }
  }

  /**
   * Met à jour les références aux éléments PixiJS et DOM
   */
  setReferences(pixiApp: Application, domLayer: HTMLElement) {
    this.pixiApp = pixiApp
    this.domLayer = domLayer
  }

  /**
   * Met à jour la transformation du canvas
   */
  updateCanvasTransform(transform: CanvasTransform) {
    this.canvasTransform = { ...transform }
    this.syncTransformations()
  }

  /**
   * Met à jour les informations du viewport
   */
  updateViewport(viewport: ViewportInfo) {
    this.viewport = { ...viewport }
  }

  /**
   * ✅ CONVERSION CANVAS → DOM - CORRECTION ALIGNEMENT FINAL
   * Convertit les coordonnées canvas PixiJS vers les coordonnées DOM absolues
   */
  canvasToDOM(canvasX: number, canvasY: number): DOMPoint {
    // ✅ CORRECTION FINALE : Reproduction exacte du système PixiJS
    // Les coordonnées canvas sont déjà dans le bon référentiel
    // Il faut juste appliquer les transformations du conteneur canvas

    // 1. Appliquer l'échelle
    const scaledX = canvasX * this.canvasTransform.scale
    const scaledY = canvasY * this.canvasTransform.scale

    // 2. Appliquer la translation
    const translatedX = scaledX + this.canvasTransform.x
    const translatedY = scaledY + this.canvasTransform.y

    // 3. Centrer dans le viewport (comme le canvas PixiJS)
    const finalX = this.viewport.centerX + translatedX
    const finalY = this.viewport.centerY + translatedY

    console.log('🔄 canvasToDOM conversion:', {
      input: { canvasX, canvasY },
      transform: this.canvasTransform,
      viewport: this.viewport,
      steps: {
        scaled: { x: scaledX, y: scaledY },
        translated: { x: translatedX, y: translatedY },
        final: { x: finalX, y: finalY }
      }
    })

    return {
      x: finalX,
      y: finalY
    }
  }

  /**
   * ✅ CONVERSION DOM → CANVAS
   * Convertit les coordonnées DOM vers les coordonnées canvas PixiJS
   */
  domToCanvas(domX: number, domY: number): CanvasPoint {
    // 1. Calculer la position du canvas dans le viewport
    const canvasRect = this.getCanvasRect()
    
    // 2. Convertir les coordonnées DOM vers les coordonnées canvas
    const canvasX = (domX - canvasRect.x) / this.canvasTransform.scale
    const canvasY = (domY - canvasRect.y) / this.canvasTransform.scale
    
    return {
      x: canvasX,
      y: canvasY
    }
  }

  /**
   * ✅ CALCUL DU RECTANGLE DU CANVAS
   * Calcule la position et taille du canvas dans le viewport
   */
  private getCanvasRect() {
    const scaledWidth = this.canvasSize.width * this.canvasTransform.scale
    const scaledHeight = this.canvasSize.height * this.canvasTransform.scale
    
    return {
      x: this.viewport.centerX + this.canvasTransform.x - (scaledWidth / 2),
      y: this.viewport.centerY + this.canvasTransform.y - (scaledHeight / 2),
      width: scaledWidth,
      height: scaledHeight
    }
  }

  /**
   * ✅ SYNCHRONISATION DES TRANSFORMATIONS
   * Synchronise les transformations entre PixiJS et DOM
   */
  syncTransformations() {
    if (this.domLayer) {
      // Appliquer la même transformation CSS que le canvas PixiJS
      this.domLayer.style.transform = 
        `translate(${this.canvasTransform.x}px, ${this.canvasTransform.y}px) scale(${this.canvasTransform.scale})`
      this.domLayer.style.transformOrigin = 'center'
    }
  }

  /**
   * ✅ OBTENIR L'ÉCHELLE ACTUELLE
   */
  getScale(): number {
    return this.canvasTransform.scale
  }

  /**
   * ✅ OBTENIR LA TRANSFORMATION ACTUELLE
   */
  getTransform(): CanvasTransform {
    return { ...this.canvasTransform }
  }

  /**
   * ✅ VÉRIFIER SI UN POINT EST DANS LE CANVAS
   */
  isPointInCanvas(domX: number, domY: number): boolean {
    const canvasRect = this.getCanvasRect()
    return (
      domX >= canvasRect.x &&
      domX <= canvasRect.x + canvasRect.width &&
      domY >= canvasRect.y &&
      domY <= canvasRect.y + canvasRect.height
    )
  }

  /**
   * ✅ CONVERSION POUR ÉVÉNEMENTS PIXI
   * Ajuste les coordonnées PixiJS pour tenir compte des transformations CSS
   * (Compatible avec la fonction existante adjustCoordinatesForCanvasTransform)
   */
  adjustPixiCoordinates(pixiX: number, pixiY: number): CanvasPoint {
    return {
      x: pixiX / this.canvasTransform.scale,
      y: pixiY / this.canvasTransform.scale
    }
  }

  /**
   * ✅ DEBUG : Afficher les informations de transformation
   */
  debugInfo(label: string, point?: { x: number; y: number }) {
    const info = {
      label,
      canvasTransform: this.canvasTransform,
      viewport: this.viewport,
      canvasSize: this.canvasSize,
      canvasRect: this.getCanvasRect()
    }
    
    if (point) {
      const canvasPoint = this.domToCanvas(point.x, point.y)
      const domPoint = this.canvasToDOM(canvasPoint.x, canvasPoint.y)
      
      info['conversions'] = {
        original: point,
        toCanvas: canvasPoint,
        backToDom: domPoint,
        accuracy: {
          deltaX: Math.abs(point.x - domPoint.x),
          deltaY: Math.abs(point.y - domPoint.y)
        }
      }
    }
    
    console.log('🔄 CoordinateSystem Debug:', info)
    return info
  }
}

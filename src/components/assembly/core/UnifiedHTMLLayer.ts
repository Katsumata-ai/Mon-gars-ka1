// UnifiedHTMLLayer - Système unifié pour les couches HTML
// Étend UnifiedCoordinateSystem pour synchroniser automatiquement les couches HTML avec le canvas

import { UnifiedCoordinateSystem, CanvasTransform, ViewportInfo } from './CoordinateSystem'

/**
 * Interface pour les événements de coordonnées
 */
export interface CoordinateEvent {
  clientX: number
  clientY: number
  target?: EventTarget | null
}

/**
 * UnifiedHTMLLayer - Système unifié pour les couches HTML
 * 
 * Cette classe étend UnifiedCoordinateSystem pour fournir une synchronisation
 * automatique des couches HTML avec le canvas principal.
 * 
 * Utilisation :
 * 1. Créer une instance avec l'élément HTML cible
 * 2. Appeler syncTransformations() lors des changements de canvas
 * 3. Utiliser convertEventCoordinates() pour les événements
 * 
 * Avantages :
 * - Synchronisation parfaite avec le canvas
 * - Positionnement correct des éléments
 * - Performance optimisée
 * - Préservation complète des fonctionnalités TipTap
 */
export class UnifiedHTMLLayer extends UnifiedCoordinateSystem {
  private htmlElement: HTMLElement
  private isInitialized: boolean = false
  private lastTransform: CanvasTransform | null = null

  constructor(
    htmlElement: HTMLElement,
    canvasTransform: CanvasTransform,
    viewport: ViewportInfo,
    canvasSize: { width: number; height: number }
  ) {
    super(canvasTransform, viewport, canvasSize)
    this.htmlElement = htmlElement
    this.initializeLayer()
  }

  /**
   * Initialise la couche HTML avec les styles de base
   */
  private initializeLayer() {
    if (!this.htmlElement || this.isInitialized) return

    // Styles de base pour l'optimisation GPU et la performance
    this.htmlElement.style.position = 'absolute'
    this.htmlElement.style.top = '0'
    this.htmlElement.style.left = '0'
    this.htmlElement.style.width = '100%'
    this.htmlElement.style.height = '100%'
    this.htmlElement.style.pointerEvents = 'none' // Laisser passer les clics au canvas
    this.htmlElement.style.overflow = 'hidden'
    this.htmlElement.style.transition = 'none'
    this.htmlElement.style.willChange = 'transform' // Optimisation GPU
    this.htmlElement.style.backfaceVisibility = 'hidden'
    this.htmlElement.style.perspective = '1000px'

    this.isInitialized = true
    console.log('🔧 UnifiedHTMLLayer: Couche initialisée', this.htmlElement)
  }

  /**
   * ✅ SYNCHRONISATION DES TRANSFORMATIONS - VERSION AMÉLIORÉE
   * Synchronise les transformations entre le canvas et la couche HTML
   * Utilise la même logique que CanvasArea.tsx pour une synchronisation parfaite
   */
  syncTransformations() {
    if (!this.htmlElement || !this.isInitialized) return

    const currentTransform = this.getTransform()

    // Optimisation : éviter les recalculs inutiles
    if (this.lastTransform && 
        this.lastTransform.x === currentTransform.x &&
        this.lastTransform.y === currentTransform.y &&
        this.lastTransform.scale === currentTransform.scale) {
      return
    }

    // ✅ REPRODUCTION EXACTE du système CanvasArea.tsx
    // Même transformation CSS que le canvas principal
    this.htmlElement.style.transform = 
      `translate(${Math.round(currentTransform.x)}px, ${Math.round(currentTransform.y)}px) scale(${currentTransform.scale})`
    this.htmlElement.style.transformOrigin = 'center'

    this.lastTransform = { ...currentTransform }

    console.log('🔄 UnifiedHTMLLayer: Transformation synchronisée', {
      transform: currentTransform,
      element: this.htmlElement.className
    })
  }

  /**
   * ✅ CONVERSION D'ÉVÉNEMENTS - VERSION AMÉLIORÉE
   * Convertit les coordonnées d'événements en tenant compte des transformations
   * Utilise la même logique que getDOMCoordinates de SimpleCanvasEditor
   */
  convertEventCoordinates(event: CoordinateEvent): { x: number; y: number } {
    if (!this.htmlElement) {
      console.warn('⚠️ UnifiedHTMLLayer: Élément HTML non disponible pour conversion')
      return { x: 0, y: 0 }
    }

    const rect = this.htmlElement.getBoundingClientRect()
    const currentTransform = this.getTransform()

    // Coordonnées DOM brutes
    const rawX = event.clientX - rect.left
    const rawY = event.clientY - rect.top

    // ✅ REPRODUCTION EXACTE de getDOMCoordinates
    // Ajuster pour translate + scale dans le bon ordre
    const x = (rawX - currentTransform.x) / currentTransform.scale
    const y = (rawY - currentTransform.y) / currentTransform.scale

    console.log('🔧 UnifiedHTMLLayer: Conversion coordonnées', {
      raw: { x: rawX, y: rawY },
      transform: currentTransform,
      adjusted: { x, y },
      element: this.htmlElement.className
    })

    return { x, y }
  }

  /**
   * ✅ MISE À JOUR AVEC SYNCHRONISATION AUTOMATIQUE
   * Met à jour la transformation et synchronise automatiquement
   */
  updateCanvasTransform(transform: CanvasTransform) {
    super.updateCanvasTransform(transform)
    this.syncTransformations()
  }

  /**
   * ✅ CONVERSION POUR CRÉATION D'ÉLÉMENTS
   * Convertit les coordonnées de clic pour la création d'éléments
   * Assure que les éléments apparaissent exactement où l'utilisateur clique
   */
  convertClickCoordinates(x: number, y: number): { x: number; y: number } {
    const currentTransform = this.getTransform()

    // Appliquer la transformation inverse pour obtenir les coordonnées canvas
    const canvasX = (x - currentTransform.x) / currentTransform.scale
    const canvasY = (y - currentTransform.y) / currentTransform.scale

    console.log('🎯 UnifiedHTMLLayer: Conversion clic', {
      input: { x, y },
      transform: currentTransform,
      canvas: { x: canvasX, y: canvasY }
    })

    return { x: canvasX, y: canvasY }
  }

  /**
   * ✅ VÉRIFICATION DE SANTÉ
   * Vérifie que la couche est correctement configurée
   */
  isHealthy(): boolean {
    return this.isInitialized && 
           this.htmlElement !== null && 
           this.htmlElement.isConnected
  }

  /**
   * ✅ NETTOYAGE
   * Nettoie les ressources lors de la destruction
   */
  destroy() {
    this.isInitialized = false
    this.lastTransform = null
    console.log('🧹 UnifiedHTMLLayer: Nettoyage effectué')
  }

  /*[FR-UNTRANSLATED: *
   * ✅ DEBUG
   * Affiche les informations de debug pour le diagnostic]
   */
  debugInfo(label: string = 'UnifiedHTMLLayer') {
    const info = {
      label,
      isInitialized: this.isInitialized,
      isHealthy: this.isHealthy(),
      htmlElement: {
        className: this.htmlElement?.className,
        isConnected: this.htmlElement?.isConnected,
        transform: this.htmlElement?.style.transform
      },
      currentTransform: this.getTransform(),
      lastTransform: this.lastTransform
    }

    console.log('🔍 UnifiedHTMLLayer Debug:', info)
    return info
  }
}

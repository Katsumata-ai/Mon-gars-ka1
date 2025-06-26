// UnifiedTransformManager - Gestionnaire de transformation unifié avec RequestAnimationFrame
// Résout le problème de synchronisation entre les panels Konva et les bulles TipTap HTML
// Architecture : RAF + Batching + Application simultanée = Synchronisation parfaite (0ms délai)

import { CanvasTransform } from './CoordinateSystem'

export interface TransformTarget {
  id: string
  type: 'konva' | 'html'
  element: any // Konva.Stage | HTMLElement
  applyTransform: (transform: CanvasTransform) => void
}

export interface TransformationEvent {
  transform: CanvasTransform
  timestamp: number
  source: string
}

/**
 * Gestionnaire de transformation unifié utilisant RequestAnimationFrame
 * pour synchroniser parfaitement les transformations Konva et HTML
 */
export class UnifiedTransformManager {
  private static instance: UnifiedTransformManager | null = null
  
  // État de synchronisation
  private rafId: number | null = null
  private pendingTransform: CanvasTransform | null = null
  private lastAppliedTransform: CanvasTransform | null = null
  
  // Registres des cibles
  private konvaTargets = new Map<string, TransformTarget>()
  private htmlTargets = new Map<string, TransformTarget>()
  
  // Callbacks et événements
  private transformCallbacks = new Set<(event: TransformationEvent) => void>()
  private isEnabled = true
  
  // Performance tracking
  private performanceMetrics = {
    transformCount: 0,
    averageLatency: 0,
    lastTransformTime: 0
  }

  private constructor() {
    console.log('🔧 UnifiedTransformManager: Initialisation du gestionnaire unifié')
  }

  /**
   * Singleton pattern pour assurer une instance unique
   */
  static getInstance(): UnifiedTransformManager {
    if (!UnifiedTransformManager.instance) {
      UnifiedTransformManager.instance = new UnifiedTransformManager()
    }
    return UnifiedTransformManager.instance
  }

  /**
   * ✅ MÉTHODE PRINCIPALE : Mise à jour de transformation
   * Utilise RAF pour batching et application simultanée
   */
  updateTransform(transform: CanvasTransform, source = 'unknown'): void {
    if (!this.isEnabled) return

    // Optimisation : éviter les transformations identiques
    if (this.isTransformIdentical(transform)) {
      return
    }

    this.pendingTransform = { ...transform }
    
    // Batching via RAF : une seule application par frame
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.applyPendingTransform(source)
      })
    }


  }

  /**
   * ✅ APPLICATION SIMULTANÉE DES TRANSFORMATIONS
   * Applique aux cibles Konva et HTML en même temps = synchronisation parfaite
   */
  private applyPendingTransform(source: string): void {
    if (!this.pendingTransform) return

    const startTime = performance.now()
    const transform = this.pendingTransform
    
    try {
      // Application simultanée aux deux systèmes
      this.applyToKonvaTargets(transform)
      this.applyToHTMLTargets(transform)
      
      // Mise à jour de l'état
      this.lastAppliedTransform = { ...transform }
      this.pendingTransform = null
      this.rafId = null

      // Métriques de performance
      const latency = performance.now() - startTime
      this.updatePerformanceMetrics(latency)

      // Notification des callbacks
      this.notifyTransformCallbacks({
        transform,
        timestamp: Date.now(),
        source
      })



    } catch (error) {
      console.error('❌ UnifiedTransformManager: Erreur lors de l\'application', error)
      this.rafId = null
    }
  }

  /**
   * ✅ APPLICATION AUX CIBLES KONVA
   */
  private applyToKonvaTargets(transform: CanvasTransform): void {
    this.konvaTargets.forEach((target, id) => {
      try {
        target.applyTransform(transform)
      } catch (error) {
        console.error(`❌ Erreur application Konva ${id}:`, error)
      }
    })
  }

  /**
   * ✅ APPLICATION AUX CIBLES HTML
   */
  private applyToHTMLTargets(transform: CanvasTransform): void {
    this.htmlTargets.forEach((target, id) => {
      try {
        target.applyTransform(transform)
      } catch (error) {
        console.error(`❌ Erreur application HTML ${id}:`, error)
      }
    })
  }

  /**
   * ✅ ENREGISTREMENT DES CIBLES KONVA
   */
  registerKonvaTarget(id: string, stage: any): void {
    const target: TransformTarget = {
      id,
      type: 'konva',
      element: stage,
      applyTransform: (transform: CanvasTransform) => {
        // Application native Konva
        stage.scale({ x: transform.scale, y: transform.scale })
        stage.position({ x: transform.x, y: transform.y })
        stage.batchDraw()
      }
    }

    this.konvaTargets.set(id, target)
  }

  /**
   * ✅ ENREGISTREMENT DES CIBLES HTML
   */
  registerHTMLTarget(id: string, element: HTMLElement): void {
    const target: TransformTarget = {
      id,
      type: 'html',
      element,
      applyTransform: (transform: CanvasTransform) => {
        // Application CSS optimisée
        element.style.transform = 
          `translate(${Math.round(transform.x)}px, ${Math.round(transform.y)}px) scale(${transform.scale})`
        element.style.transformOrigin = 'center'
        element.style.transition = 'none' // Pas de transition CSS
      }
    }

    this.htmlTargets.set(id, target)
  }

  /**
   * ✅ DÉSENREGISTREMENT
   */
  unregisterTarget(id: string): void {
    const removedKonva = this.konvaTargets.delete(id)
    const removedHTML = this.htmlTargets.delete(id)
    

  }

  /**
   * ✅ CALLBACKS DE TRANSFORMATION
   */
  onTransformChange(callback: (event: TransformationEvent) => void): () => void {
    this.transformCallbacks.add(callback)
    return () => this.transformCallbacks.delete(callback)
  }

  /**
   * ✅ UTILITAIRES
   */
  private isTransformIdentical(transform: CanvasTransform): boolean {
    if (!this.lastAppliedTransform) return false
    
    const last = this.lastAppliedTransform
    return (
      Math.abs(last.x - transform.x) < 0.1 &&
      Math.abs(last.y - transform.y) < 0.1 &&
      Math.abs(last.scale - transform.scale) < 0.001
    )
  }

  private updatePerformanceMetrics(latency: number): void {
    this.performanceMetrics.transformCount++
    this.performanceMetrics.averageLatency = 
      (this.performanceMetrics.averageLatency + latency) / 2
    this.performanceMetrics.lastTransformTime = performance.now()
  }

  private notifyTransformCallbacks(event: TransformationEvent): void {
    this.transformCallbacks.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('❌ Erreur callback transformation:', error)
      }
    })
  }

  /**
   * ✅ CONTRÔLES
   */
  enable(): void {
    this.isEnabled = true
  }

  disable(): void {
    this.isEnabled = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  /**
   * ✅ MÉTRIQUES DE PERFORMANCE
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics }
  }

  /**
   * ✅ ÉTAT ACTUEL
   */
  getCurrentTransform(): CanvasTransform | null {
    return this.lastAppliedTransform ? { ...this.lastAppliedTransform } : null
  }

  /**
   * ✅ NETTOYAGE
   */
  destroy(): void {
    this.disable()
    this.konvaTargets.clear()
    this.htmlTargets.clear()
    this.transformCallbacks.clear()
    UnifiedTransformManager.instance = null
    console.log('🗑️ UnifiedTransformManager: Détruit')
  }
}

// [FR-UNTRANSLATED: Export de l'instance singleton]
export const transformManager = UnifiedTransformManager.getInstance()

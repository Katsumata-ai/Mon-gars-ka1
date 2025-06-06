// Système de monitoring de performance en temps réel pour PixiJS
import { Application } from 'pixi.js'

// Interface pour les métriques de performance
interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  renderTime: number
  loadTime: number
  textureMemory: number
  elementCount: number
  lastUpdate: number
}

// Interface pour les seuils de performance
interface PerformanceThresholds {
  minFPS: number
  maxMemoryMB: number
  maxRenderTimeMS: number
  maxLoadTimeMS: number
}

// Seuils par défaut basés sur les objectifs
const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  minFPS: 60,
  maxMemoryMB: 300,
  maxRenderTimeMS: 16.67, // 60 FPS = 16.67ms par frame
  maxLoadTimeMS: 2000
}

// Classe pour monitorer les performances
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    loadTime: 0,
    textureMemory: 0,
    elementCount: 0,
    lastUpdate: 0
  }
  
  private thresholds: PerformanceThresholds
  private pixiApp: Application | null = null
  private monitoringInterval: NodeJS.Timeout | null = null
  private frameCount = 0
  private lastFrameTime = 0
  private onWarning?: (metric: string, value: number, threshold: number) => void
  
  constructor(thresholds: Partial<PerformanceThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  }

  // Initialiser le monitoring avec l'application PixiJS
  initialize(pixiApp: Application, onWarning?: (metric: string, value: number, threshold: number) => void) {
    this.pixiApp = pixiApp
    this.onWarning = onWarning
    this.startMonitoring()
  }

  // Démarrer le monitoring
  private startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    // Monitoring toutes les secondes
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics()
      this.checkThresholds()
    }, 1000)

    // Monitoring FPS en temps réel
    if (this.pixiApp) {
      this.pixiApp.ticker.add(this.updateFPS.bind(this))
    }
  }

  // Arrêter le monitoring
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    if (this.pixiApp) {
      this.pixiApp.ticker.remove(this.updateFPS.bind(this))
    }
  }

  // Mettre à jour les métriques
  private updateMetrics() {
    const now = performance.now()
    
    // Mémoire JavaScript
    if ('memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize
    }

    // Mémoire des textures PixiJS
    if (this.pixiApp) {
      this.metrics.textureMemory = this.calculateTextureMemory()
      this.metrics.renderTime = this.pixiApp.renderer.lastObjectRenderedTime || 0
    }

    this.metrics.lastUpdate = now
  }

  // Calculer la mémoire utilisée par les textures
  private calculateTextureMemory(): number {
    if (!this.pixiApp) return 0
    
    let totalMemory = 0
    const renderer = this.pixiApp.renderer
    
    // Estimer la mémoire des textures
    if ('texture' in renderer && 'managedTextures' in renderer.texture) {
      const textures = (renderer.texture as any).managedTextures
      for (const texture of textures) {
        if (texture.source && texture.source.resource) {
          const { width, height } = texture.source.resource
          // Estimation: 4 bytes par pixel (RGBA)
          totalMemory += width * height * 4
        }
      }
    }
    
    return totalMemory
  }

  // Mettre à jour le FPS
  private updateFPS() {
    const now = performance.now()
    
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = now
      return
    }

    this.frameCount++
    const deltaTime = now - this.lastFrameTime

    // Calculer FPS toutes les 60 frames
    if (this.frameCount >= 60) {
      this.metrics.fps = Math.round((this.frameCount * 1000) / deltaTime)
      this.frameCount = 0
      this.lastFrameTime = now
    }
  }

  // Vérifier les seuils de performance
  private checkThresholds() {
    const { fps, memoryUsage, renderTime } = this.metrics
    const { minFPS, maxMemoryMB, maxRenderTimeMS } = this.thresholds

    // Vérifier FPS
    if (fps > 0 && fps < minFPS) {
      this.onWarning?.('FPS', fps, minFPS)
    }

    // Vérifier mémoire (convertir en MB)
    const memoryMB = memoryUsage / (1024 * 1024)
    if (memoryMB > maxMemoryMB) {
      this.onWarning?.('Memory', memoryMB, maxMemoryMB)
    }

    // Vérifier temps de rendu
    if (renderTime > maxRenderTimeMS) {
      this.onWarning?.('RenderTime', renderTime, maxRenderTimeMS)
    }
  }

  // Obtenir les métriques actuelles
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // Obtenir un rapport de performance
  getPerformanceReport(): {
    metrics: PerformanceMetrics
    thresholds: PerformanceThresholds
    status: 'good' | 'warning' | 'critical'
    issues: string[]
  } {
    const metrics = this.getMetrics()
    const issues: string[] = []
    let status: 'good' | 'warning' | 'critical' = 'good'

    // Analyser les problèmes
    if (metrics.fps > 0 && metrics.fps < this.thresholds.minFPS) {
      issues.push(`FPS trop bas: ${metrics.fps} (min: ${this.thresholds.minFPS})`)
      status = metrics.fps < this.thresholds.minFPS * 0.8 ? 'critical' : 'warning'
    }

    const memoryMB = metrics.memoryUsage / (1024 * 1024)
    if (memoryMB > this.thresholds.maxMemoryMB) {
      issues.push(`Mémoire excessive: ${memoryMB.toFixed(1)}MB (max: ${this.thresholds.maxMemoryMB}MB)`)
      status = memoryMB > this.thresholds.maxMemoryMB * 1.2 ? 'critical' : 'warning'
    }

    if (metrics.renderTime > this.thresholds.maxRenderTimeMS) {
      issues.push(`Temps de rendu lent: ${metrics.renderTime.toFixed(2)}ms (max: ${this.thresholds.maxRenderTimeMS}ms)`)
      status = metrics.renderTime > this.thresholds.maxRenderTimeMS * 1.5 ? 'critical' : 'warning'
    }

    return {
      metrics,
      thresholds: this.thresholds,
      status,
      issues
    }
  }

  // Mesurer le temps de chargement
  measureLoadTime<T>(operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now()
    
    return operation().then(result => {
      const loadTime = performance.now() - startTime
      this.metrics.loadTime = loadTime
      
      if (loadTime > this.thresholds.maxLoadTimeMS) {
        this.onWarning?.('LoadTime', loadTime, this.thresholds.maxLoadTimeMS)
      }
      
      return result
    })
  }

  // Optimisations automatiques basées sur les métriques
  suggestOptimizations(): string[] {
    const suggestions: string[] = []
    const metrics = this.getMetrics()

    if (metrics.fps < this.thresholds.minFPS) {
      suggestions.push('Réduire le nombre d\'éléments visibles')
      suggestions.push('Implémenter le culling d\'objets hors écran')
      suggestions.push('Optimiser les textures (réduire la résolution)')
    }

    const memoryMB = metrics.memoryUsage / (1024 * 1024)
    if (memoryMB > this.thresholds.maxMemoryMB * 0.8) {
      suggestions.push('Nettoyer le cache des textures')
      suggestions.push('Implémenter un système de pagination des éléments')
      suggestions.push('Utiliser des object pools pour réduire le garbage collection')
    }

    if (metrics.renderTime > this.thresholds.maxRenderTimeMS * 0.8) {
      suggestions.push('Grouper les objets similaires en containers')
      suggestions.push('Utiliser des sprites statiques pour les éléments non-interactifs')
      suggestions.push('Réduire la complexité des shaders')
    }

    return suggestions
  }

  // Nettoyer les ressources
  destroy() {
    this.stopMonitoring()
    this.pixiApp = null
    this.onWarning = undefined
  }
}

// Instance globale du monitor
export const performanceMonitor = new PerformanceMonitor()

// Hook pour utiliser le monitor de performance
export const usePerformanceMonitor = () => {
  return performanceMonitor
}

// Gestionnaire de chargement d'images avec gestion CORS
// Optimisé pour l'export haute qualité

import type { ImageLoadConfig } from '@/types/export.types'

export class CrossOriginImageLoader {
  private cache = new Map<string, HTMLImageElement>()
  private loadingPromises = new Map<string, Promise<HTMLImageElement>>()
  
  private defaultConfig: ImageLoadConfig = {
    crossOrigin: true,
    timeout: 10000, // 10 secondes
    retryCount: 3,
    fallbackToProxy: false
  }

  /**
   * Charge une image avec gestion CORS et cache
   */
  async loadImage(url: string, config?: Partial<ImageLoadConfig>): Promise<HTMLImageElement> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    // Vérifier le cache
    if (this.cache.has(url)) {
      return this.cache.get(url)!
    }

    // Vérifier si un chargement est déjà en cours
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!
    }

    // Créer une nouvelle promesse de chargement
    const loadingPromise = this.loadImageWithRetry(url, finalConfig)
    this.loadingPromises.set(url, loadingPromise)

    try {
      const image = await loadingPromise
      this.cache.set(url, image)
      return image
    } finally {
      this.loadingPromises.delete(url)
    }
  }

  /**
   * Charge une image avec retry automatique
   */
  private async loadImageWithRetry(url: string, config: ImageLoadConfig): Promise<HTMLImageElement> {
    let lastError: Error | null = null

    for (let attempt = 0; attempt < config.retryCount; attempt++) {
      try {
        return await this.loadImageSingle(url, config, attempt > 0)
      } catch (error) {
        lastError = error as Error
        console.warn(`Tentative ${attempt + 1}/${config.retryCount} échouée pour ${url}:`, error)
        
        // Attendre avant de réessayer
        if (attempt < config.retryCount - 1) {
          await this.delay(1000 * (attempt + 1))
        }
      }
    }

    throw new Error(`Impossible de charger l'image après ${config.retryCount} tentatives: ${lastError?.message}`)
  }

  /**
   * Charge une image unique avec timeout
   */
  private loadImageSingle(url: string, config: ImageLoadConfig, isRetry: boolean = false): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      // Configuration CORS
      if (config.crossOrigin && !isRetry) {
        img.crossOrigin = 'anonymous'
      }

      // Timeout
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout lors du chargement de l'image: ${url}`))
      }, config.timeout)

      img.onload = () => {
        clearTimeout(timeoutId)
        resolve(img)
      }

      img.onerror = () => {
        clearTimeout(timeoutId)
        reject(new Error(`Erreur lors du chargement de l'image: ${url}`))
      }

      img.src = url
    })
  }

  /**
   * Précharge plusieurs images en parallèle
   */
  async preloadImages(urls: string[], config?: Partial<ImageLoadConfig>): Promise<Map<string, HTMLImageElement>> {
    const results = new Map<string, HTMLImageElement>()
    
    const loadPromises = urls.map(async (url) => {
      try {
        const image = await this.loadImage(url, config)
        results.set(url, image)
      } catch (error) {
        console.warn(`Impossible de précharger l'image ${url}:`, error)
      }
    })

    await Promise.allSettled(loadPromises)
    return results
  }

  /**
   * Vérifie si une image est en cache
   */
  isImageCached(url: string): boolean {
    return this.cache.has(url)
  }

  /**
   * Vide le cache des images
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Obtient la taille du cache
   */
  getCacheSize(): number {
    return this.cache.size
  }

  /**
   * Obtient les statistiques du cache
   */
  getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys())
    }
  }

  /**
   * Crée un placeholder pour une image qui n'a pas pu être chargée
   */
  createPlaceholder(width: number, height: number, text: string = 'Image non disponible'): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    
    const ctx = canvas.getContext('2d')!
    
    // Fond gris clair
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, width, height)
    
    // Bordure
    ctx.strokeStyle = '#cccccc'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, width - 2, height - 2)
    
    // Texte centré
    ctx.fillStyle = '#666666'
    ctx.font = '14px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, width / 2, height / 2)
    
    return canvas
  }

  /**
   * Utilitaire pour attendre
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.cache.clear()
    this.loadingPromises.clear()
  }
}

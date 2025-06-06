// Gestionnaire de mémoire intelligent pour maintenir <300MB d'utilisation
import { Texture, Assets } from 'pixi.js'

// Interface pour les métadonnées de texture
interface TextureMetadata {
  id: string
  url: string
  size: number
  lastAccessed: number
  accessCount: number
  priority: 'high' | 'medium' | 'low'
}

// Interface pour le cache LRU
interface CacheEntry {
  texture: Texture
  metadata: TextureMetadata
  createdAt: number
}

// Configuration du gestionnaire de mémoire
interface MemoryConfig {
  maxCacheSizeMB: number
  maxTextureAge: number
  cleanupInterval: number
  preloadBatchSize: number
}

// Configuration par défaut optimisée
const DEFAULT_CONFIG: MemoryConfig = {
  maxCacheSizeMB: 100, // 100MB pour les textures
  maxTextureAge: 30 * 60 * 1000, // 30 minutes
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  preloadBatchSize: 5
}

// Classe pour gérer la mémoire intelligemment
export class MemoryManager {
  private textureCache = new Map<string, CacheEntry>()
  private loadingPromises = new Map<string, Promise<Texture>>()
  private config: MemoryConfig
  private cleanupInterval: NodeJS.Timeout | null = null
  private currentCacheSize = 0

  constructor(config: Partial<MemoryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.startCleanupTimer()
  }

  // Démarrer le nettoyage automatique
  private startCleanupTimer() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }

    this.cleanupInterval = setInterval(() => {
      this.performCleanup()
    }, this.config.cleanupInterval)
  }

  // Obtenir une texture avec cache LRU
  async getTexture(url: string, priority: 'high' | 'medium' | 'low' = 'medium'): Promise<Texture> {
    const id = this.generateTextureId(url)
    
    // Vérifier le cache
    const cached = this.textureCache.get(id)
    if (cached) {
      // Mettre à jour les métadonnées d'accès
      cached.metadata.lastAccessed = Date.now()
      cached.metadata.accessCount++
      return cached.texture
    }

    // Vérifier si le chargement est en cours
    const existingPromise = this.loadingPromises.get(id)
    if (existingPromise) {
      return existingPromise
    }

    // Charger la nouvelle texture
    const loadPromise = this.loadTexture(url, priority)
    this.loadingPromises.set(id, loadPromise)

    try {
      const texture = await loadPromise
      this.loadingPromises.delete(id)
      return texture
    } catch (error) {
      this.loadingPromises.delete(id)
      throw error
    }
  }

  // Charger une texture
  private async loadTexture(url: string, priority: 'high' | 'medium' | 'low'): Promise<Texture> {
    try {
      const texture = await Assets.load(url)
      const id = this.generateTextureId(url)
      
      // Calculer la taille de la texture
      const size = this.calculateTextureSize(texture)
      
      // Vérifier si on a assez de place
      await this.ensureSpace(size)
      
      // Créer l'entrée de cache
      const metadata: TextureMetadata = {
        id,
        url,
        size,
        lastAccessed: Date.now(),
        accessCount: 1,
        priority
      }

      const entry: CacheEntry = {
        texture,
        metadata,
        createdAt: Date.now()
      }

      // Ajouter au cache
      this.textureCache.set(id, entry)
      this.currentCacheSize += size

      return texture
    } catch (error) {
      console.error(`Erreur lors du chargement de la texture ${url}:`, error)
      throw error
    }
  }

  // Calculer la taille d'une texture en bytes
  private calculateTextureSize(texture: Texture): number {
    if (!texture.source || !texture.source.resource) return 0
    
    const { width, height } = texture.source.resource
    // Estimation: 4 bytes par pixel (RGBA)
    return width * height * 4
  }

  // Générer un ID unique pour une texture
  private generateTextureId(url: string): string {
    return `texture_${url.replace(/[^a-zA-Z0-9]/g, '_')}`
  }

  // S'assurer qu'il y a assez d'espace pour une nouvelle texture
  private async ensureSpace(requiredSize: number) {
    const maxSizeBytes = this.config.maxCacheSizeMB * 1024 * 1024
    
    while (this.currentCacheSize + requiredSize > maxSizeBytes) {
      const evicted = this.evictLRU()
      if (!evicted) {
        // Si on ne peut plus rien évacuer, forcer le nettoyage
        this.performCleanup()
        break
      }
    }
  }

  // Évacuer l'élément le moins récemment utilisé
  private evictLRU(): boolean {
    let oldestEntry: CacheEntry | null = null
    let oldestId: string | null = null
    let oldestTime = Date.now()

    // Trouver l'entrée la plus ancienne (priorité basse d'abord)
    for (const [id, entry] of this.textureCache.entries()) {
      const score = this.calculateEvictionScore(entry)
      if (score < oldestTime) {
        oldestTime = score
        oldestEntry = entry
        oldestId = id
      }
    }

    if (oldestEntry && oldestId) {
      this.removeFromCache(oldestId, oldestEntry)
      return true
    }

    return false
  }

  // Calculer le score d'éviction (plus bas = évacuer en premier)
  private calculateEvictionScore(entry: CacheEntry): number {
    const { metadata } = entry
    const age = Date.now() - metadata.lastAccessed
    const priorityWeight = metadata.priority === 'high' ? 3 : metadata.priority === 'medium' ? 2 : 1
    
    // Score basé sur l'âge, la fréquence d'accès et la priorité
    return metadata.lastAccessed - (metadata.accessCount * priorityWeight * 10000)
  }

  // Supprimer une entrée du cache
  private removeFromCache(id: string, entry: CacheEntry) {
    entry.texture.destroy()
    this.textureCache.delete(id)
    this.currentCacheSize -= entry.metadata.size
  }

  // Effectuer un nettoyage complet
  private performCleanup() {
    const now = Date.now()
    const expiredIds: string[] = []

    // Identifier les textures expirées
    for (const [id, entry] of this.textureCache.entries()) {
      const age = now - entry.metadata.lastAccessed
      if (age > this.config.maxTextureAge) {
        expiredIds.push(id)
      }
    }

    // Supprimer les textures expirées
    expiredIds.forEach(id => {
      const entry = this.textureCache.get(id)
      if (entry) {
        this.removeFromCache(id, entry)
      }
    })

    // Forcer le garbage collection si disponible
    if (typeof window !== 'undefined' && 'gc' in window) {
      (window as any).gc()
    }
  }

  // Précharger des textures en arrière-plan
  async preloadTextures(urls: string[], priority: 'high' | 'medium' | 'low' = 'low'): Promise<void> {
    const batches = this.chunkArray(urls, this.config.preloadBatchSize)
    
    for (const batch of batches) {
      await Promise.allSettled(
        batch.map(url => this.getTexture(url, priority))
      )
      
      // Pause entre les batches pour éviter de bloquer l'interface
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  // Diviser un tableau en chunks
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  // Obtenir les statistiques de mémoire
  getMemoryStats() {
    const totalTextures = this.textureCache.size
    const totalSizeMB = this.currentCacheSize / (1024 * 1024)
    const maxSizeMB = this.config.maxCacheSizeMB
    const usagePercent = (totalSizeMB / maxSizeMB) * 100

    const priorityStats = {
      high: 0,
      medium: 0,
      low: 0
    }

    for (const entry of this.textureCache.values()) {
      priorityStats[entry.metadata.priority]++
    }

    return {
      totalTextures,
      totalSizeMB: Math.round(totalSizeMB * 100) / 100,
      maxSizeMB,
      usagePercent: Math.round(usagePercent * 100) / 100,
      priorityStats,
      loadingCount: this.loadingPromises.size
    }
  }

  // Vider le cache complètement
  clearCache() {
    for (const [id, entry] of this.textureCache.entries()) {
      this.removeFromCache(id, entry)
    }
    this.currentCacheSize = 0
  }

  // Supprimer une texture spécifique
  removeTexture(url: string) {
    const id = this.generateTextureId(url)
    const entry = this.textureCache.get(id)
    if (entry) {
      this.removeFromCache(id, entry)
    }
  }

  // Mettre à jour la priorité d'une texture
  updateTexturePriority(url: string, priority: 'high' | 'medium' | 'low') {
    const id = this.generateTextureId(url)
    const entry = this.textureCache.get(id)
    if (entry) {
      entry.metadata.priority = priority
    }
  }

  // Nettoyer les ressources
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    this.clearCache()
    this.loadingPromises.clear()
  }
}

// Instance globale du gestionnaire de mémoire
export const memoryManager = new MemoryManager()

// Hook pour utiliser le gestionnaire de mémoire
export const useMemoryManager = () => {
  return memoryManager
}

// Gestionnaire de textures pour PixiJS v8 avec cache intelligent
import { Assets, Texture } from 'pixi.js'
import { toast } from 'react-hot-toast'

// Interface pour les métadonnées d'image
interface ImageMetadata {
  id: string
  url: string
  type: 'character' | 'decor' | 'scene'
  name: string
  width?: number
  height?: number
  lastUsed?: Date
}

// Interface pour le cache de textures
interface TextureCache {
  texture: Texture
  metadata: ImageMetadata
  loadedAt: Date
  accessCount: number
}

// Classe pour gérer les textures avec cache intelligent
export class TextureManager {
  private cache = new Map<string, TextureCache>()
  private loadingPromises = new Map<string, Promise<Texture>>()
  private maxCacheSize = 100 // Nombre maximum de textures en cache
  private maxCacheAge = 30 * 60 * 1000 // 30 minutes en millisecondes

  constructor() {
    // Nettoyer le cache périodiquement
    setInterval(() => {
      this.cleanupCache()
    }, 5 * 60 * 1000) // Toutes les 5 minutes
  }

  // Charger une texture avec cache
  async loadTexture(imageMetadata: ImageMetadata): Promise<Texture | null> {
    const { id, url } = imageMetadata

    // Vérifier le cache d'abord
    const cached = this.cache.get(id)
    if (cached) {
      cached.accessCount++
      cached.metadata.lastUsed = new Date()
      return cached.texture
    }

    // Vérifier si le chargement est déjà en cours
    const existingPromise = this.loadingPromises.get(id)
    if (existingPromise) {
      return existingPromise
    }

    // Créer une nouvelle promesse de chargement
    const loadPromise = this.loadTextureFromUrl(url, imageMetadata)
    this.loadingPromises.set(id, loadPromise)

    try {
      const texture = await loadPromise
      
      // Ajouter au cache
      if (texture) {
        this.addToCache(id, texture, imageMetadata)
      }

      return texture
    } catch (error) {
      console.error(`Erreur chargement texture ${id}:`, error)
      toast.error(`Erreur de chargement: ${imageMetadata.name}`)
      return null
    } finally {
      this.loadingPromises.delete(id)
    }
  }

  // Charger une texture depuis une URL
  private async loadTextureFromUrl(url: string, metadata: ImageMetadata): Promise<Texture> {
    try {
      // Utiliser Assets.load() de PixiJS v8
      const texture = await Assets.load({
        alias: metadata.id,
        src: url,
        loadParser: 'loadTextures'
      })

      if (!texture) {
        throw new Error('Texture non chargée')
      }

      return texture
    } catch (error) {
      console.error('Erreur Assets.load:', error)
      
      // Fallback : chargement manuel
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          try {
            const texture = Texture.from(img)
            resolve(texture)
          } catch (err) {
            reject(err)
          }
        }
        
        img.onerror = () => {
          reject(new Error(`Impossible de charger l'image: ${url}`))
        }
        
        img.src = url
      })
    }
  }

  // Ajouter une texture au cache
  private addToCache(id: string, texture: Texture, metadata: ImageMetadata) {
    // Vérifier la limite du cache
    if (this.cache.size >= this.maxCacheSize) {
      this.evictLeastUsed()
    }

    this.cache.set(id, {
      texture,
      metadata: {
        ...metadata,
        lastUsed: new Date()
      },
      loadedAt: new Date(),
      accessCount: 1
    })
  }

  // Supprimer les textures les moins utilisées
  private evictLeastUsed() {
    let leastUsed: string | null = null
    let minAccessCount = Infinity
    let oldestAccess = new Date()

    for (const [id, cached] of this.cache.entries()) {
      if (cached.accessCount < minAccessCount || 
          (cached.accessCount === minAccessCount && cached.metadata.lastUsed! < oldestAccess)) {
        leastUsed = id
        minAccessCount = cached.accessCount
        oldestAccess = cached.metadata.lastUsed!
      }
    }

    if (leastUsed) {
      const cached = this.cache.get(leastUsed)
      if (cached) {
        cached.texture.destroy()
        this.cache.delete(leastUsed)
        console.log(`Texture évincée du cache: ${leastUsed}`)
      }
    }
  }

  // Nettoyer le cache des textures expirées
  private cleanupCache() {
    const now = new Date()
    const expiredIds: string[] = []

    for (const [id, cached] of this.cache.entries()) {
      const age = now.getTime() - cached.loadedAt.getTime()
      if (age > this.maxCacheAge) {
        expiredIds.push(id)
      }
    }

    expiredIds.forEach(id => {
      const cached = this.cache.get(id)
      if (cached) {
        cached.texture.destroy()
        this.cache.delete(id)
      }
    })
  }

  // Charger les images depuis les galeries Supabase
  async loadImagesFromGalleries(projectId: string): Promise<ImageMetadata[]> {
    const images: ImageMetadata[] = []

    try {
      // Charger les personnages
      const charactersResponse = await fetch(`/api/projects/${projectId}/characters`)
      if (charactersResponse.ok) {
        const charactersData = await charactersResponse.json()
        charactersData.characters?.forEach((char: any) => {
          if (char.image_url) {
            images.push({
              id: `character_${char.id}`,
              url: char.image_url,
              type: 'character',
              name: char.name || 'Personnage'
            })
          }
        })
      }

      // Charger les décors
      const decorsResponse = await fetch(`/api/projects/${projectId}/decors`)
      if (decorsResponse.ok) {
        const decorsData = await decorsResponse.json()
        decorsData.decors?.forEach((decor: any) => {
          if (decor.image_url) {
            images.push({
              id: `decor_${decor.id}`,
              url: decor.image_url,
              type: 'decor',
              name: decor.name || 'Décor'
            })
          }
        })
      }

      // Charger les scènes
      const scenesResponse = await fetch(`/api/projects/${projectId}/scenes`)
      if (scenesResponse.ok) {
        const scenesData = await scenesResponse.json()
        scenesData.scenes?.forEach((scene: any) => {
          if (scene.image_url) {
            images.push({
              id: `scene_${scene.id}`,
              url: scene.image_url,
              type: 'scene',
              name: scene.name || 'Scène'
            })
          }
        })
      }

      console.log(`${images.length} images chargées depuis les galeries`)
      return images

    } catch (error) {
      console.error('Erreur chargement galeries:', error)
      toast.error('Erreur lors du chargement des images')
      return []
    }
  }

  // Précharger les textures les plus utilisées
  async preloadPopularTextures(images: ImageMetadata[], limit = 10): Promise<void> {
    // Trier par dernière utilisation (les plus récentes d'abord)
    const sortedImages = images
      .filter(img => img.lastUsed)
      .sort((a, b) => (b.lastUsed?.getTime() || 0) - (a.lastUsed?.getTime() || 0))
      .slice(0, limit)

    const preloadPromises = sortedImages.map(img => this.loadTexture(img))
    
    try {
      await Promise.allSettled(preloadPromises)
      console.log(`${sortedImages.length} textures populaires préchargées`)
    } catch (error) {
      console.error('Erreur préchargement:', error)
    }
  }

  // Obtenir les statistiques du cache
  getCacheStats() {
    const totalTextures = this.cache.size
    const totalMemory = Array.from(this.cache.values())
      .reduce((total, cached) => {
        const texture = cached.texture
        return total + (texture.width * texture.height * 4) // 4 bytes par pixel (RGBA)
      }, 0)

    return {
      totalTextures,
      totalMemoryMB: Math.round(totalMemory / (1024 * 1024) * 100) / 100,
      maxCacheSize: this.maxCacheSize,
      loadingCount: this.loadingPromises.size
    }
  }

  // Vider le cache
  clearCache() {
    for (const cached of this.cache.values()) {
      cached.texture.destroy()
    }
    this.cache.clear()
    this.loadingPromises.clear()
    console.log('Cache de textures vidé')
  }

  // Obtenir une texture du cache
  getFromCache(id: string): Texture | null {
    const cached = this.cache.get(id)
    if (cached) {
      cached.accessCount++
      cached.metadata.lastUsed = new Date()
      return cached.texture
    }
    return null
  }

  // Vérifier si une texture est en cours de chargement
  isLoading(id: string): boolean {
    return this.loadingPromises.has(id)
  }
}

// Instance globale du gestionnaire de textures
export const textureManager = new TextureManager()

// Hook pour utiliser le gestionnaire de textures
export function useTextureManager() {
  return textureManager
}

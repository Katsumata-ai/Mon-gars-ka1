// Gestionnaire de Z-Index intelligent pour la migration PixiJS → HTML/CSS
// Gère la superposition des couches et résout les conflits automatiquement

export type LayerType = 
  | 'PIXI_BACKGROUND'
  | 'PIXI_CHARACTERS' 
  | 'PIXI_PANELS'
  | 'PIXI_UI'
  | 'DOM_BUBBLES'
  | 'DOM_SELECTION'
  | 'DOM_MANIPULATION'
  | 'DOM_MODALS'

export type Priority = 'low' | 'normal' | 'high' | 'critical'

export interface LayerConfig {
  baseZIndex: number
  maxElements: number
  allowOverlap: boolean
  description: string
}

/**
 * Gestionnaire intelligent des Z-Index pour éviter les conflits
 * entre les couches PixiJS et DOM
 */
export class LayerManager {
  private static instance: LayerManager | null = null
  
  // ✅ DÉFINITION DES COUCHES AVEC ESPACEMENT SÉCURISÉ
  private static readonly LAYER_CONFIGS: Record<LayerType, LayerConfig> = {
    // Couches PixiJS (100-900)
    PIXI_BACKGROUND: {
      baseZIndex: 100,
      maxElements: 50,
      allowOverlap: true,
      description: 'Arrière-plans et décors PixiJS'
    },
    PIXI_CHARACTERS: {
      baseZIndex: 200,
      maxElements: 100,
      allowOverlap: true,
      description: 'Personnages et sprites PixiJS'
    },
    PIXI_PANELS: {
      baseZIndex: 300,
      maxElements: 50,
      allowOverlap: false,
      description: 'Panels et cadres PixiJS'
    },
    PIXI_UI: {
      baseZIndex: 400,
      maxElements: 20,
      allowOverlap: true,
      description: 'Interface utilisateur PixiJS'
    },
    
    // Couches DOM (1000+)
    DOM_BUBBLES: {
      baseZIndex: 1000,
      maxElements: 100,
      allowOverlap: false,
      description: 'Bulles de dialogue HTML'
    },
    DOM_SELECTION: {
      baseZIndex: 1100,
      maxElements: 10,
      allowOverlap: true,
      description: 'Cadres de sélection'
    },
    DOM_MANIPULATION: {
      baseZIndex: 1200,
      maxElements: 10,
      allowOverlap: true,
      description: 'Handles de manipulation'
    },
    DOM_MODALS: {
      baseZIndex: 1300,
      maxElements: 5,
      allowOverlap: true,
      description: 'Modales et overlays'
    }
  }

  private elementRegistry = new Map<string, { layerType: LayerType; zIndex: number; priority: Priority }>()
  private layerUsage = new Map<LayerType, number>()

  private constructor() {
    // Initialiser le comptage d'usage des couches
    Object.keys(LayerManager.LAYER_CONFIGS).forEach(layerType => {
      this.layerUsage.set(layerType as LayerType, 0)
    })
  }

  /**
   * ✅ SINGLETON PATTERN
   */
  static getInstance(): LayerManager {
    if (!LayerManager.instance) {
      LayerManager.instance = new LayerManager()
    }
    return LayerManager.instance
  }

  /**
   * ✅ ASSIGNATION AUTOMATIQUE DE Z-INDEX
   * Assigne un z-index optimal en évitant les conflits
   */
  assignZIndex(elementId: string, layerType: LayerType, priority: Priority = 'normal'): number {
    const config = LayerManager.LAYER_CONFIGS[layerType]
    const currentUsage = this.layerUsage.get(layerType) || 0
    
    // Vérifier la limite d'éléments
    if (currentUsage >= config.maxElements) {
      console.warn(`⚠️ Layer ${layerType} has reached maximum elements (${config.maxElements})`)
    }
    
    // Calculer le z-index avec offset de priorité
    const priorityOffset = this.getPriorityOffset(priority)
    const elementOffset = config.allowOverlap ? 0 : currentUsage
    const zIndex = config.baseZIndex + priorityOffset + elementOffset
    
    // Enregistrer l'élément
    this.elementRegistry.set(elementId, { layerType, zIndex, priority })
    this.layerUsage.set(layerType, currentUsage + 1)
    
    console.log(`🎯 Z-Index assigné:`, {
      elementId,
      layerType,
      priority,
      zIndex,
      usage: `${currentUsage + 1}/${config.maxElements}`
    })
    
    return zIndex
  }

  /**
   * ✅ LIBÉRATION D'UN Z-INDEX
   */
  releaseZIndex(elementId: string): void {
    const registration = this.elementRegistry.get(elementId)
    if (registration) {
      const currentUsage = this.layerUsage.get(registration.layerType) || 0
      this.layerUsage.set(registration.layerType, Math.max(0, currentUsage - 1))
      this.elementRegistry.delete(elementId)
      
      console.log(`🗑️ Z-Index libéré:`, {
        elementId,
        layerType: registration.layerType,
        newUsage: this.layerUsage.get(registration.layerType)
      })
    }
  }

  /**
   * ✅ MISE À JOUR DE LA PRIORITÉ
   */
  updatePriority(elementId: string, newPriority: Priority): number | null {
    const registration = this.elementRegistry.get(elementId)
    if (!registration) {
      console.warn(`⚠️ Element ${elementId} not found in registry`)
      return null
    }
    
    // Recalculer le z-index avec la nouvelle priorité
    const config = LayerManager.LAYER_CONFIGS[registration.layerType]
    const priorityOffset = this.getPriorityOffset(newPriority)
    const newZIndex = config.baseZIndex + priorityOffset
    
    // Mettre à jour l'enregistrement
    registration.priority = newPriority
    registration.zIndex = newZIndex
    this.elementRegistry.set(elementId, registration)
    
    return newZIndex
  }

  /**
   * ✅ RÉSOLUTION DES CONFLITS
   * Détecte et résout automatiquement les conflits de z-index
   */
  resolveConflicts(): { conflicts: number; resolved: number } {
    const conflicts: Array<{ elementId: string; zIndex: number }> = []
    const zIndexMap = new Map<number, string[]>()
    
    // Détecter les conflits
    this.elementRegistry.forEach((registration, elementId) => {
      const existing = zIndexMap.get(registration.zIndex) || []
      existing.push(elementId)
      zIndexMap.set(registration.zIndex, existing)
      
      if (existing.length > 1) {
        conflicts.push({ elementId, zIndex: registration.zIndex })
      }
    })
    
    // Résoudre les conflits
    let resolved = 0
    zIndexMap.forEach((elementIds, zIndex) => {
      if (elementIds.length > 1) {
        // Réassigner les z-index en conflit
        elementIds.forEach((elementId, index) => {
          if (index > 0) { // Garder le premier, réassigner les autres
            const registration = this.elementRegistry.get(elementId)!
            const newZIndex = this.assignZIndex(elementId, registration.layerType, registration.priority)
            resolved++
            
            console.log(`🔧 Conflit résolu:`, {
              elementId,
              oldZIndex: zIndex,
              newZIndex
            })
          }
        })
      }
    })
    
    return { conflicts: conflicts.length, resolved }
  }

  /**
   * ✅ OBTENIR L'OFFSET DE PRIORITÉ
   */
  private getPriorityOffset(priority: Priority): number {
    switch (priority) {
      case 'low': return 0
      case 'normal': return 10
      case 'high': return 20
      case 'critical': return 30
      default: return 10
    }
  }

  /**
   * ✅ OBTENIR LES INFORMATIONS D'UN ÉLÉMENT
   */
  getElementInfo(elementId: string) {
    return this.elementRegistry.get(elementId)
  }

  /**
   * ✅ OBTENIR LES STATISTIQUES DES COUCHES
   */
  getLayerStats() {
    const stats = new Map<LayerType, { usage: number; max: number; percentage: number }>()
    
    Object.entries(LayerManager.LAYER_CONFIGS).forEach(([layerType, config]) => {
      const usage = this.layerUsage.get(layerType as LayerType) || 0
      stats.set(layerType as LayerType, {
        usage,
        max: config.maxElements,
        percentage: Math.round((usage / config.maxElements) * 100)
      })
    })
    
    return stats
  }

  /**
   * ✅ DEBUG : Afficher l'état complet
   */
  debugInfo() {
    console.log('🎯 LayerManager Debug Info:', {
      totalElements: this.elementRegistry.size,
      layerUsage: Object.fromEntries(this.layerUsage),
      layerStats: Object.fromEntries(this.getLayerStats()),
      elements: Object.fromEntries(this.elementRegistry)
    })
  }

  /**
   * ✅ NETTOYAGE COMPLET
   */
  cleanup() {
    this.elementRegistry.clear()
    this.layerUsage.clear()
    
    // Réinitialiser le comptage
    Object.keys(LayerManager.LAYER_CONFIGS).forEach(layerType => {
      this.layerUsage.set(layerType as LayerType, 0)
    })
    
    console.log('🧹 LayerManager cleaned up')
  }
}

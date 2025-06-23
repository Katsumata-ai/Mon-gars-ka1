// Pool d'instances TipTap optimisé pour éviter les fuites mémoire
// Gère la réutilisation et le nettoyage sécurisé des éditeurs

import { Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

export interface EditorConfig {
  extensions: any[]
  editable: boolean
  content: string
  onUpdate?: (props: { editor: Editor }) => void
  onFocus?: (props: { editor: Editor }) => void
  onBlur?: (props: { editor: Editor }) => void
}

export interface PoolStats {
  totalCreated: number
  activeEditors: number
  availableEditors: number
  memoryUsage: number
  averageLifetime: number
}

/**
 * Pool d'instances TipTap pour optimiser les performances et éviter les fuites mémoire
 */
export class TipTapPool {
  private static instance: TipTapPool | null = null
  
  private availableEditors: Editor[] = []
  private activeEditors = new Map<string, { editor: Editor; createdAt: number; bubbleId: string }>()
  private editorConfigs = new Map<string, EditorConfig>()
  
  // Configuration du pool
  private readonly maxPoolSize = 10
  private readonly maxIdleTime = 300000 // 5 minutes
  private readonly cleanupInterval = 60000 // 1 minute
  
  // Statistiques
  private stats = {
    totalCreated: 0,
    totalDestroyed: 0,
    memoryLeaksDetected: 0,
    cleanupCycles: 0
  }
  
  private cleanupTimer: NodeJS.Timeout | null = null

  private constructor() {
    this.startCleanupTimer()
    this.setupMemoryMonitoring()
  }

  /**
   * ✅ SINGLETON PATTERN
   */
  static getInstance(): TipTapPool {
    if (!TipTapPool.instance) {
      TipTapPool.instance = new TipTapPool()
    }
    return TipTapPool.instance
  }

  /**
   * ✅ ACQUISITION D'UN ÉDITEUR
   * Réutilise une instance existante ou en crée une nouvelle
   */
  acquireEditor(bubbleId: string, config?: Partial<EditorConfig>): Editor {
    console.log(`📝 Acquiring editor for bubble: ${bubbleId}`)
    
    // Vérifier si une instance est déjà active pour cette bulle
    const existing = this.activeEditors.get(bubbleId)
    if (existing) {
      console.log(`♻️ Reusing existing editor for bubble: ${bubbleId}`)
      this.updateEditorConfig(existing.editor, config)
      return existing.editor
    }
    
    // Essayer de réutiliser une instance disponible
    let editor = this.availableEditors.pop()
    
    if (!editor) {
      // Créer une nouvelle instance
      editor = this.createEditor(config)
      this.stats.totalCreated++
      console.log(`🆕 Created new editor (total: ${this.stats.totalCreated})`)
    } else {
      console.log(`♻️ Reused pooled editor (available: ${this.availableEditors.length})`)
    }
    
    // Nettoyer et configurer l'éditeur
    this.cleanupEditorReferences(editor)
    this.updateEditorConfig(editor, config)
    
    // Enregistrer comme actif
    this.activeEditors.set(bubbleId, {
      editor,
      createdAt: Date.now(),
      bubbleId
    })
    
    // Sauvegarder la configuration
    if (config) {
      this.editorConfigs.set(bubbleId, { ...this.getDefaultConfig(), ...config })
    }
    
    return editor
  }

  /**
   * ✅ LIBÉRATION D'UN ÉDITEUR
   * Libère un éditeur et le remet dans le pool ou le détruit
   */
  releaseEditor(bubbleId: string): void {
    console.log(`🗑️ Releasing editor for bubble: ${bubbleId}`)
    
    const activeEditor = this.activeEditors.get(bubbleId)
    if (!activeEditor) {
      console.warn(`⚠️ No active editor found for bubble: ${bubbleId}`)
      return
    }
    
    const { editor } = activeEditor
    
    // Supprimer de la liste active
    this.activeEditors.delete(bubbleId)
    this.editorConfigs.delete(bubbleId)
    
    // Nettoyage complet de l'éditeur
    this.cleanupEditorReferences(editor)
    this.resetEditorState(editor)
    
    // Remettre dans le pool ou détruire
    if (this.availableEditors.length < this.maxPoolSize) {
      this.availableEditors.push(editor)
      console.log(`♻️ Editor returned to pool (available: ${this.availableEditors.length})`)
    } else {
      this.destroyEditor(editor)
      console.log(`💥 Editor destroyed (pool full)`)
    }
  }

  /**
   * ✅ CRÉATION D'UN ÉDITEUR
   */
  private createEditor(config?: Partial<EditorConfig>): Editor {
    const finalConfig = { ...this.getDefaultConfig(), ...config }
    
    const editor = new Editor({
      extensions: finalConfig.extensions,
      editable: finalConfig.editable,
      content: finalConfig.content,
      onUpdate: finalConfig.onUpdate,
      onFocus: finalConfig.onFocus,
      onBlur: finalConfig.onBlur
    })
    
    return editor
  }

  /**
   * ✅ CONFIGURATION PAR DÉFAUT
   */
  private getDefaultConfig(): EditorConfig {
    return {
      extensions: [StarterKit],
      editable: true,
      content: '',
      onUpdate: undefined,
      onFocus: undefined,
      onBlur: undefined
    }
  }

  /**
   * ✅ MISE À JOUR DE LA CONFIGURATION
   */
  private updateEditorConfig(editor: Editor, config?: Partial<EditorConfig>): void {
    if (!config) return
    
    if (config.content !== undefined) {
      editor.commands.setContent(config.content)
    }
    
    if (config.editable !== undefined) {
      editor.setEditable(config.editable)
    }
    
    // Les callbacks sont gérés au niveau du composant React
  }

  /**
   * ✅ NETTOYAGE DES RÉFÉRENCES CIRCULAIRES
   * Prévient les fuites mémoire en supprimant les références circulaires
   */
  private cleanupEditorReferences(editor: Editor): void {
    try {
      // Supprimer les références circulaires DOM ↔ Editor
      const dom = editor.view.dom as any
      if (dom && dom.editor) {
        delete dom.editor
      }
      
      // Nettoyer les event listeners personnalisés
      const view = editor.view as any
      if (view && view._listeners) {
        view._listeners.clear?.()
      }
      
      // Supprimer les références dans les extensions
      editor.extensionManager.extensions.forEach((extension: any) => {
        if (extension.storage) {
          Object.keys(extension.storage).forEach(key => {
            if (typeof extension.storage[key] === 'object') {
              extension.storage[key] = null
            }
          })
        }
      })
      
    } catch (error) {
      this.stats.memoryLeaksDetected++
    }
  }

  /**
   * ✅ RÉINITIALISATION DE L'ÉTAT
   */
  private resetEditorState(editor: Editor): void {
    try {
      // Vider le contenu
      editor.commands.clearContent()
      
      // Réinitialiser l'historique
      editor.commands.clearHistory?.()
      
      // Supprimer la sélection
      editor.commands.blur()
      
      // Réinitialiser l'état d'édition
      editor.setEditable(true)
      
    } catch (error) {
      // Erreur silencieuse
    }
  }

  /**
   * ✅ DESTRUCTION SÉCURISÉE
   */
  private destroyEditor(editor: Editor): void {
    try {
      this.cleanupEditorReferences(editor)
      editor.destroy()
      this.stats.totalDestroyed++
    } catch (error) {
      // Erreur silencieuse
    }
  }

  /**
   * ✅ NETTOYAGE AUTOMATIQUE
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.cleanupInterval)
  }

  /**
   * ✅ CYCLE DE NETTOYAGE
   */
  private performCleanup(): void {
    const now = Date.now()
    let cleanedUp = 0
    
    // Nettoyer les éditeurs inactifs trop anciens
    this.activeEditors.forEach((activeEditor, bubbleId) => {
      if (now - activeEditor.createdAt > this.maxIdleTime) {
        console.log(`🧹 Cleaning up idle editor for bubble: ${bubbleId}`)
        this.releaseEditor(bubbleId)
        cleanedUp++
      }
    })
    
    // Nettoyer les éditeurs disponibles en excès
    while (this.availableEditors.length > this.maxPoolSize / 2) {
      const editor = this.availableEditors.pop()
      if (editor) {
        this.destroyEditor(editor)
        cleanedUp++
      }
    }
    
    this.stats.cleanupCycles++
    
    if (cleanedUp > 0) {
      console.log(`🧹 Cleanup cycle completed: ${cleanedUp} editors cleaned`)
    }
  }

  /**
   * ✅ MONITORING MÉMOIRE
   */
  private setupMemoryMonitoring(): void {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)) {
      setInterval(() => {
        const memory = (window.performance as any).memory
        const usage = memory.usedJSHeapSize / 1024 / 1024 // MB
        
        if (usage > 100) { // Plus de 100MB
          this.performCleanup()
        }
      }, 30000) // Vérifier toutes les 30 secondes
    }
  }

  /**
   * ✅ OBTENIR LES STATISTIQUES
   */
  getStats(): PoolStats {
    const memoryUsage = typeof window !== 'undefined' && 'performance' in window && 'memory' in (window.performance as any)
      ? (window.performance as any).memory.usedJSHeapSize / 1024 / 1024
      : 0
    
    const totalLifetime = Array.from(this.activeEditors.values())
      .reduce((sum, editor) => sum + (Date.now() - editor.createdAt), 0)
    
    return {
      totalCreated: this.stats.totalCreated,
      activeEditors: this.activeEditors.size,
      availableEditors: this.availableEditors.length,
      memoryUsage,
      averageLifetime: this.activeEditors.size > 0 ? totalLifetime / this.activeEditors.size : 0
    }
  }

  /**
   * ✅ NETTOYAGE COMPLET
   */
  cleanup(): void {
    console.log('🧹 TipTapPool cleanup started')
    
    // Arrêter le timer
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
    
    // Détruire tous les éditeurs actifs
    this.activeEditors.forEach((activeEditor, bubbleId) => {
      this.destroyEditor(activeEditor.editor)
    })
    this.activeEditors.clear()
    
    // Détruire tous les éditeurs disponibles
    this.availableEditors.forEach(editor => {
      this.destroyEditor(editor)
    })
    this.availableEditors.length = 0
    
    // Nettoyer les configurations
    this.editorConfigs.clear()
    
    console.log('🧹 TipTapPool cleanup completed')
  }
}

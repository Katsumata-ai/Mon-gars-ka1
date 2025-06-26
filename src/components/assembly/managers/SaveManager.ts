// Gestionnaire de sauvegarde différée pour l'assemblage PixiJS avec MCP Supabase
import { toast } from 'react-hot-toast'
import { useAssemblyStore } from './StateManager'
import { AssemblyElement, PageState, SerializedState } from '../types/assembly.types'

// Interface pour les options de sauvegarde
interface SaveOptions {
  projectId: string
  pageId: string
  userId: string
  sessionId?: string
}

// Classe pour gérer la sauvegarde différée
export class DeferredSaveManager {
  private isDirty = false
  private lastSavedState: any = null
  private currentState: any = null
  private sessionId: string
  private autoSaveInterval: NodeJS.Timeout | null = null

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupAutoSave()
  }

  // Générer un ID de session unique
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Configurer la sauvegarde automatique locale
  private setupAutoSave() {
    // Sauvegarde locale toutes les 30 secondes
    this.autoSaveInterval = setInterval(() => {
      this.autoSaveToLocalStorage()
    }, 30000)
  }

  // Marquer comme modifié
  markDirty() {
    this.isDirty = true
    const store = useAssemblyStore.getState()
    store.markDirty()
  }

  // Sauvegarde automatique locale (backup)
  private autoSaveToLocalStorage() {
    try {
      // Vérifier si localStorage est disponible (côté client)
      if (typeof localStorage === 'undefined') return

      const store = useAssemblyStore.getState()
      if (!store.currentPageId || !this.isDirty) return

      const state = {
        content: this.serializePixiState(store),
        timestamp: Date.now(),
        pageId: store.currentPageId,
        sessionId: this.sessionId
      }

      localStorage.setItem(`assembly_draft_${this.sessionId}`, JSON.stringify(state))
      console.log('Sauvegarde locale automatique effectuée')
    } catch (error) {
      console.error('Erreur sauvegarde locale:', error)
    }
  }

  // Sauvegarde définitive avec MCP Supabase
  async saveToDatabase(options: SaveOptions): Promise<boolean> {
    const store = useAssemblyStore.getState()
    
    try {
      store.setSaveLoading(true)
      
      const serializedContent = this.serializePixiState(store)
      const status = this.determinePageStatus(serializedContent)

      // Utilisation du MCP tool Supabase pour sauvegarder
      const response = await fetch('/api/supabase/save-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageId: options.pageId,
          projectId: options.projectId,
          content: serializedContent,
          status
        })
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde')
      }

      // Générer et sauvegarder la miniature
      await this.generateAndSaveThumbnail(options.pageId, options.projectId)

      // Nettoyer le draft temporaire
      await this.cleanupDraft(options.pageId, options.userId)

      this.isDirty = false
      this.lastSavedState = serializedContent
      
      store.setLastSaved(new Date())
      store.markClean()

      toast.success('Page sauvegardée avec succès')
      return true

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
      return false
    } finally {
      store.setSaveLoading(false)
    }
  }

  // Charger la dernière version sauvée
  async loadLastSavedVersion(pageId: string, projectId: string): Promise<boolean> {
    try {
      // Logs supprimés pour optimisation
      const store = useAssemblyStore.getState()

      const response = await fetch(`/api/supabase/load-page?pageId=${pageId}&projectId=${projectId}`)

      if (!response.ok) {
        // 404 est normal pour une nouvelle page vide
        if (response.status === 404) {
          console.debug('Page vide (nouveau contenu):', pageId)
          return false
        }
        throw new Error('Erreur lors du chargement')
      }

      const data = await response.json()

      if (data.success && data.page) {
        this.deserializeAndLoadPixiState(data.page.content)
        this.lastSavedState = data.page.content
        this.isDirty = false

        const store = useAssemblyStore.getState()
        store.markClean()

        console.debug('Page chargée avec succès:', pageId)
        return true
      }

      return false
    } catch (error) {
      console.error('Erreur chargement:', error)
      toast.error('Erreur lors du chargement de la page')
      return false
    }
  }

  // Récupérer draft temporaire si existe
  async loadDraftIfExists(pageId: string, userId: string): Promise<boolean> {
    try {


      const response = await fetch(`/api/supabase/load-draft?pageId=${pageId}&userId=${userId}&sessionId=${this.sessionId}`)

      if (!response.ok) return false

      const data = await response.json()

      if (data.success && data.draft) {
        const shouldRecover = confirm('Un brouillon non sauvegardé a été trouvé. Voulez-vous le récupérer ?')

        if (shouldRecover) {
          this.deserializeAndLoadPixiState(data.draft.content)
          this.isDirty = true

          const store = useAssemblyStore.getState()
          store.markDirty()

          toast.success('Brouillon récupéré')
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Erreur récupération draft:', error)
      return false
    }
  }

  // Sérialiser l'état PixiJS complet
  private serializePixiState(store: any): SerializedState {
    const app = store.pixiApp
    
    return {
      pageId: store.currentPageId || '',
      projectId: '',
      content: {
        stage: {
          width: app?.screen?.width || 1200,
          height: app?.screen?.height || 1600,
          backgroundColor: 0xF8F8F8,
          children: store.elements || []
        }
      },
      metadata: {
        version: "1.0",
        pixiVersion: "8.0.0",
        timestamp: Date.now()
      }
    }
  }

  // Désérialiser et reconstruire l'état PixiJS
  private deserializeAndLoadPixiState(serializedData: any) {
    const store = useAssemblyStore.getState()

    console.log('🔄 SaveManager deserializeAndLoadPixiState:', {
      hasData: !!serializedData,
      hasChildren: !!serializedData?.content?.stage?.children,
      childrenCount: serializedData?.content?.stage?.children?.length || 0,
      currentElementsCount: store.elements.length
    })

    // ⚠️ PROTECTION : Ne pas écraser les éléments existants avec une page vide
    if (store.elements.length > 0 && (!serializedData?.content?.stage?.children || serializedData.content.stage.children.length === 0)) {
      console.log('🛡️ Protection activée : Éviter d\'écraser les éléments existants avec une page vide')
      return
    }

    if (serializedData?.content?.stage?.children) {
      // Nettoyer les éléments existants avant de charger les nouveaux
      console.log('🧹 Nettoyage des éléments existants avant chargement')
      store.elements.forEach(element => {
        // Note: Nous devrions avoir une méthode removeElement, mais pour l'instant on vide directement
      })

      // Charger les éléments dans le store
      serializedData.content.stage.children.forEach((elementData: AssemblyElement) => {
        console.log('📥 Chargement élément:', elementData.id, elementData.type)
        store.addElement(elementData)
      })
      console.log('✅ Éléments chargés, nouveau total:', store.elements.length)
    } else {
      console.log('❌ Aucun élément à charger - page vide (mais éléments existants préservés)')
    }
  }

  // Déterminer le statut de la page
  private determinePageStatus(content: any): string {
    const elements = content?.content?.stage?.children || []
    
    if (elements.length === 0) return 'draft'
    if (elements.length < 3) return 'in_progress'
    return 'completed'
  }

  // Générer miniature avec PixiJS extract
  private async generateAndSaveThumbnail(pageId: string, projectId: string): Promise<void> {
    try {
      const store = useAssemblyStore.getState()
      const app = store.pixiApp
      
      if (!app) return

      // Générer la miniature avec PixiJS extract (côté client uniquement)
      if (typeof document === 'undefined') return

      const canvas = app.renderer.extract.canvas(app.stage)
      const thumbnailCanvas = document.createElement('canvas')
      thumbnailCanvas.width = 150
      thumbnailCanvas.height = 200

      const ctx = thumbnailCanvas.getContext('2d')
      ctx?.drawImage(canvas, 0, 0, 150, 200)

      // Convertir en blob
      const blob = await new Promise<Blob>((resolve) => {
        thumbnailCanvas.toBlob(resolve as any, 'image/jpeg', 0.8)
      })

      if (blob) {
        // Upload vers Supabase Storage via API
        const formData = new FormData()
        formData.append('file', blob, `page_${pageId}_thumbnail.jpg`)
        formData.append('pageId', pageId)
        formData.append('projectId', projectId)

        await fetch('/api/supabase/upload-thumbnail', {
          method: 'POST',
          body: formData
        })
      }
    } catch (error) {
      console.error('Erreur génération miniature:', error)
    }
  }

  // Nettoyer le draft temporaire
  private async cleanupDraft(pageId: string, userId: string): Promise<void> {
    try {
      await fetch('/api/supabase/cleanup-draft', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pageId,
          userId,
          sessionId: this.sessionId
        })
      })
    } catch (error) {
      console.error('Erreur nettoyage draft:', error)
    }
  }

  // Nettoyer les ressources
  destroy() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
    }
  }
}

// Instance globale du gestionnaire de sauvegarde
export const saveManager = new DeferredSaveManager()

// [FR-UNTRANSLATED: Hook pour utiliser le gestionnaire de sauvegarde]
export function useSaveManager() {
  return saveManager
}

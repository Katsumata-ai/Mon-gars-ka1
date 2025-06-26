// Hook pour les raccourcis clavier du workflow Dashtoon

import { useEffect } from 'react'
import { useAssemblyStore } from '../managers/StateManager'
import { usePolotnoContext } from '../context/PolotnoContext'

/**
 * Hook pour gérer les raccourcis clavier spécifiques au workflow Dashtoon
 */
export function useDashtoonShortcuts() {
  const { setActiveTool, activeTool } = useAssemblyStore()
  const { toggleGrid, zoomIn, zoomOut, resetZoom } = usePolotnoContext()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on tape dans un input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Raccourcis pour les outils
      switch (event.key.toLowerCase()) {
        case 'v':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('select')
          }
          break

        case 'p':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('panel')
          }
          break

        case 'b':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('dialogue')
          }
          break

        case 't':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('text')
          }
          break

        case 'z':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('zoom')
          }
          break

        case 'g':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            toggleGrid()
          }
          break

        case '+':
        case '=':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            zoomIn()
          }
          break

        case '-':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            zoomOut()
          }
          break

        case '0':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            resetZoom()
          }
          break

        case 'h':
          if (!event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setActiveTool('pan')
          }
          break

        case 'escape':
          event.preventDefault()
          setActiveTool('select')
          break

        default:
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTool, toggleGrid, zoomIn, zoomOut, resetZoom])

  return { activeTool }
}

/**
 * Hook pour les raccourcis de navigation et actions
 */
export function useDashtoonActions() {
  const { 
    undo, 
    redo, 
    canUndo, 
    canRedo,
    clearSelection,
    selectAll
  } = useAssemblyStore()

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on tape dans un input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return
      }

      const isCtrl = event.ctrlKey || event.metaKey

      if (isCtrl) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) {
              if (canRedo) redo()
            } else {
              if (canUndo) undo()
            }
            break

          case 'y':
            event.preventDefault()
            if (canRedo) redo()
            break

          case 'a':
            event.preventDefault()
            selectAll()
            break

          case 'd':
            event.preventDefault()
            clearSelection()
            break

          default:
            break
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, canUndo, canRedo, clearSelection, selectAll])

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    clearSelection,
    selectAll
  }
}

/**
 * Hook combiné pour tous les raccourcis Dashtoon
 */
export function useDashtoonKeyboardShortcuts() {
  const toolShortcuts = useDashtoonShortcuts()
  const actionShortcuts = useDashtoonActions()

  return {
    ...toolShortcuts,
    ...actionShortcuts
  }
}

/**
 * Utilitaires pour afficher les raccourcis
 */
export const ShortcutUtils = {
  /**
   * Formate un raccourci pour l'affichage
   */
  formatShortcut(key: string, ctrl = false, shift = false): string {
    const parts = []
    
    if (ctrl) {
      parts.push(navigator.platform.includes('Mac') ? '⌘' : 'Ctrl')
    }
    
    if (shift) {
      parts.push('Shift')
    }
    
    parts.push(key.toUpperCase())
    
    return parts.join('+')
  },

  /**
   * Liste des raccourcis disponibles
   */
  getShortcutList() {
    return [
      { tool: 'Sélection', shortcut: 'V', description: 'Outil de sélection' },
      { tool: 'Panel', shortcut: 'P', description: 'Créer des panels' },
      { tool: 'Bulle', shortcut: 'B', description: 'Ajouter des bulles de dialogue' },
      { tool: 'Texte', shortcut: 'T', description: 'Ajouter du texte' },
      { tool: 'Grille', shortcut: 'G', description: 'Afficher/masquer la grille' },
      { tool: 'Zoom avant', shortcut: '+', description: 'Augmenter le zoom' },
      { tool: 'Zoom arrière', shortcut: '-', description: 'Diminuer le zoom' },
      { tool: 'Zoom 100%', shortcut: '0', description: 'Réinitialiser le zoom' },
      { tool: 'Déplacement', shortcut: 'H', description: 'Déplacer la vue' },
      { tool: 'Annuler', shortcut: 'Ctrl+Z', description: 'Annuler la dernière action' },
      { tool: 'Rétablir', shortcut: 'Ctrl+Y', description: 'Rétablir l\'action annulée' },
      { tool: 'Tout sélectionner', shortcut: 'Ctrl+A', description: 'Sélectionner tous les éléments' },
      { tool: 'Désélectionner', shortcut: 'Ctrl+D', description: 'Désélectionner tout' },
      { tool: 'Échapper', shortcut: 'Esc', description: '[FR-UNTRANSLATED: Retour à l\'outil de sélection]' }
    ]
  }
}

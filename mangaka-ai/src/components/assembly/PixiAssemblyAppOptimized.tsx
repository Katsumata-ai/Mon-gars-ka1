'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import VerticalToolbar from './layout/VerticalToolbar'
import CanvasArea from './layout/CanvasArea'
import RightPanel from './layout/RightPanel'
import TipTapBubbleTypeModal from './ui/TipTapBubbleTypeModal'
// BubbleTextEditor supprimé - utilisation du nouveau système d'overlay intégré
import { CanvasProvider } from './context/CanvasContext'
import { useCanvas } from './hooks/useCanvasOptimized'
import { useDashtoonKeyboardShortcuts } from './hooks/useDashtoonShortcuts'
import { AssemblyElement, BubbleType, DialogueElement } from './types/assembly.types'

interface PixiAssemblyAppProps {
  projectId: string
  currentPage?: number
  className?: string
}

// Composant interne qui utilise le contexte optimisé
const PixiAssemblyAppContent: React.FC<PixiAssemblyAppProps> = ({
  projectId,
  currentPage = 1,
  className = ''
}) => {
  // Utiliser le nouveau système React optimisé
  const canvas = useCanvas()

  // Monitoring de performance désactivé temporairement pour éviter les erreurs
  useEffect(() => {
    // TODO: Réactiver le monitoring une fois les problèmes résolus
    // if (canvas.pixiApp) {
    //   performanceMonitor.initialize(canvas.pixiApp, (metric, value, threshold) => {
    //     if (metric === 'FPS' && value < threshold * 0.8) {
    //       toast.error(`Performance critique: ${metric} ${value.toFixed(1)}`)
    //     }
    //   })
    // }

    // return () => {
    //   performanceMonitor.stopMonitoring()
    // }
  }, [canvas.pixiApp])

  // Raccourcis clavier optimisés
  useDashtoonKeyboardShortcuts()

  // Gestionnaire de sauvegarde optimisé
  const handleSave = useCallback(async () => {
    if (!canvas.currentPageId) {
      toast.error('Aucune page sélectionnée')
      return
    }

    try {
      canvas.save.setSaveLoading(true)
      
      // Simuler la sauvegarde optimisée
      await new Promise(resolve => setTimeout(resolve, 500))
      
      canvas.save.setLastSaved(new Date())
      canvas.save.markClean()
      toast.success('Page sauvegardée avec succès')
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    } finally {
      canvas.save.setSaveLoading(false)
    }
  }, [canvas])

  // Gestionnaire d'export optimisé
  const handleExport = useCallback(async () => {
    try {
      toast.success('Export en cours...')
      // TODO: Implémenter l'export optimisé
    } catch (error) {
      console.error('Erreur export:', error)
      toast.error('Erreur lors de l\'export')
    }
  }, [])

  // Gestionnaire de clic sur élément optimisé
  const handleElementClick = useCallback((element: AssemblyElement | null) => {
    if (element) {
      canvas.selectElement(element.id)
    } else {
      canvas.clearSelection()
    }
  }, [canvas])

  // Gestionnaire de clic sur canvas optimisé
  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (canvas.activeTool === 'select') {
      canvas.clearSelection()
      return
    }

    // ⚠️ IMPORTANT : Ne pas créer d'éléments ici !
    // Les outils (PanelTool, BubbleTool, etc.) gèrent leur propre création
    // Ce gestionnaire ne sert que pour la sélection et la désélection

    console.log('🎯 Clic canvas:', { x, y, tool: canvas.activeTool })
    canvas.markDirty()
  }, [canvas])

  // ✅ GESTIONNAIRES POUR LA MODAL DE BULLE
  const handleBubbleTypeSelect = useCallback((type: BubbleType) => {
    console.log('💬 Type de bulle sélectionné:', type)
    // Démarrer le mode placement avec le type sélectionné
    canvas.startBubblePlacement(type)
    // ✅ CORRECTION : La modal se ferme automatiquement dans startBubblePlacement
  }, [canvas])

  const handleBubbleModalClose = useCallback(() => {
    console.log('💬 Fermeture modal bulle')
    // ✅ CORRECTION : Fermer directement sans toggle pour éviter la réouverture
    canvas.closeBubbleTypeModal()
  }, [canvas])

  // Gestionnaire d'annulation supprimé - géré directement par le modal

  // ✅ ÉDITION DE TEXTE GÉRÉE DANS PIXIAPPLICATION

  const [contextMenu, setContextMenu] = useState<{
    element: DialogueElement
    position: { x: number, y: number }
  } | null>(null)

  // ✅ GESTIONNAIRE DOUBLE-CLIC POUR ÉDITION DE TEXTE (GÉRÉ DANS PIXIAPPLICATION)
  const handleBubbleDoubleClick = useCallback((element: DialogueElement, _position: { x: number, y: number }) => {
    console.log('🎨 MANGAKA: Double-clic sur bulle - édition gérée dans PixiApplication', element.id)
    setContextMenu(null) // Fermer le menu contextuel si ouvert
  }, [])

  // ✅ GESTIONNAIRE CLIC DROIT POUR MENU CONTEXTUEL
  const handleBubbleRightClick = useCallback((element: DialogueElement, position: { x: number, y: number }) => {
    console.log('🎨 MANGAKA: Clic droit sur bulle pour menu', element.id)
    setContextMenu({ element, position })
  }, [])

  // ✅ GESTIONNAIRES D'ÉDITION SUPPRIMÉS - GÉRÉS DANS PIXIAPPLICATION

  // ✅ GESTIONNAIRE CHANGEMENT DE TYPE DE BULLE
  const handleBubbleTypeChange = useCallback((type: BubbleType) => {
    if (!contextMenu) return

    const updatedDialogueStyle = {
      ...contextMenu.element.dialogueStyle,
      type
    }

    canvas.updateElement(contextMenu.element.id, {
      dialogueStyle: updatedDialogueStyle
    })
    setContextMenu(null)
    console.log('🎨 MANGAKA: Type de bulle changé vers', type)
  }, [contextMenu, canvas])

  // ✅ FERMER LES MENUS EN CLIQUANT AILLEURS
  const handleCloseMenus = useCallback(() => {
    setContextMenu(null)
  }, [])

  // ✅ RACCOURCIS CLAVIER MANGAKA AVANCÉS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Raccourcis clavier toujours actifs

      const selectedBubbles = canvas.selectedElements.filter(el => el.type === 'dialogue') as DialogueElement[]

      // Types de bulles (1-5)
      const typeMap: Record<string, BubbleType> = {
        '1': 'speech', '2': 'thought', '3': 'shout', '4': 'whisper', '5': 'explosion'
      }

      if (typeMap[e.key] && selectedBubbles.length > 0) {
        e.preventDefault()
        selectedBubbles.forEach(bubble => {
          canvas.updateElement(bubble.id, {
            dialogueStyle: { ...bubble.dialogueStyle, type: typeMap[e.key] }
          })
        })
        return
      }

      // Duplication (Ctrl+D)
      if (e.ctrlKey && e.key === 'd' && selectedBubbles.length > 0) {
        e.preventDefault()
        selectedBubbles.forEach(bubble => {
          const newBubble = {
            ...bubble,
            id: `bubble_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            transform: {
              ...bubble.transform,
              x: bubble.transform.x + 20,
              y: bubble.transform.y + 20
            }
          }
          canvas.addElement(newBubble)
        })
        return
      }

      // Suppression (Delete)
      if (e.key === 'Delete' && canvas.selectedElementIds.length > 0) {
        e.preventDefault()
        canvas.removeElements(canvas.selectedElementIds)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canvas])

  return (
    <>
      <DashtoonLayout
        className={className}
        leftToolbar={
          <VerticalToolbar
            onSave={handleSave}
            onExport={handleExport}
          />
        }
        centerCanvas={
          <CanvasArea
            width={1200}
            height={1600}
            onElementClick={handleElementClick}
            onCanvasClick={handleCanvasClick}
            onBubbleDoubleClick={handleBubbleDoubleClick}
            onBubbleRightClick={handleBubbleRightClick}
          />
        }
        rightPanel={
          <RightPanel
            projectId={projectId}
            currentPage={currentPage}
            onPageSelect={() => {}} // TODO: Implémenter avec le nouveau système
            onAddPage={() => {}} // TODO: Implémenter avec le nouveau système
            onDeletePage={() => {}} // TODO: Implémenter avec le nouveau système
          />
        }
      />

      {/* ✅ MODAL DE SÉLECTION DU TYPE DE BULLE */}
      <TipTapBubbleTypeModal
        isOpen={canvas.ui.bubbleTypeModalVisible}
        onClose={handleBubbleModalClose}
        onSelectType={handleBubbleTypeSelect}
      />

      {/* ✅ ÉDITEUR DE TEXTE INTÉGRÉ DANS PIXIAPPLICATION */}
      {/* Le nouveau système d'overlay de texte est géré directement dans PixiApplication */}

      {/* ✅ INDICATEUR DE MODE PLACEMENT */}
      {(() => {
        console.log('🎯 Rendu indicateur - État UI:', {
          bubblePlacementMode: canvas.ui.bubblePlacementMode,
          bubbleTypeToPlace: canvas.ui.bubbleTypeToPlace,
          bubbleTypeModalVisible: canvas.ui.bubbleTypeModalVisible
        })
        return canvas.ui.bubblePlacementMode && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-medium">
                Cliquez pour placer votre bulle {canvas.ui.bubbleTypeToPlace}
              </span>
              <button
                onClick={canvas.cancelBubblePlacement}
                className="ml-4 text-white/80 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )
      })()}
    </>
  )
}

// Composant principal avec Provider optimisé
const PixiAssemblyAppOptimized: React.FC<PixiAssemblyAppProps> = (props) => {
  return (
    <CanvasProvider>
      <PixiAssemblyAppContent {...props} />
    </CanvasProvider>
  )
}

export default PixiAssemblyAppOptimized
export { PixiAssemblyAppOptimized }

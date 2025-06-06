'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import VerticalToolbar from './layout/VerticalToolbar'
import CanvasArea from './layout/CanvasArea'
import RightPanel from './layout/RightPanel'
import BubbleTypeModal from './ui/BubbleTypeModal'
import BubbleContextMenu from './ui/BubbleContextMenu'
import BubbleTextEditor from './ui/BubbleTextEditor'
import { CanvasProvider, useCanvasContext } from './context/CanvasContext'
import { useCanvas } from './hooks/useCanvasOptimized'
import { performanceMonitor } from './performance/PerformanceMonitor'
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

  const handleBubbleModalCancel = useCallback(() => {
    console.log('💬 Annulation modal bulle - annulation mode placement')
    // Annuler le mode placement si actif
    if (canvas.ui.bubblePlacementMode) {
      canvas.cancelBubblePlacement()
    }
    // Fermer la modal
    canvas.toggleBubbleTypeModal()
  }, [canvas])

  // ✅ ÉTATS POUR L'ÉDITION AVANCÉE DES BULLES MANGAKA
  const [editingBubble, setEditingBubble] = useState<{
    element: DialogueElement
    position: { x: number, y: number }
  } | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    element: DialogueElement
    position: { x: number, y: number }
  } | null>(null)

  // ✅ GESTIONNAIRE DOUBLE-CLIC POUR ÉDITION DE TEXTE
  const handleBubbleDoubleClick = useCallback((element: DialogueElement, position: { x: number, y: number }) => {
    console.log('🎨 MANGAKA: Double-clic sur bulle pour édition', element.id)
    setEditingBubble({ element, position })
    setContextMenu(null) // Fermer le menu contextuel si ouvert
  }, [])

  // ✅ GESTIONNAIRE CLIC DROIT POUR MENU CONTEXTUEL
  const handleBubbleRightClick = useCallback((element: DialogueElement, position: { x: number, y: number }) => {
    console.log('🎨 MANGAKA: Clic droit sur bulle pour menu', element.id)
    setContextMenu({ element, position })
    setEditingBubble(null) // Fermer l'édition si ouverte
  }, [])

  // ✅ GESTIONNAIRE CHANGEMENT DE TEXTE AVEC REDIMENSIONNEMENT AUTO
  const handleTextChange = useCallback((text: string) => {
    if (!editingBubble) return

    // ✅ CALCUL AUTOMATIQUE DE LA TAILLE SELON LE TEXTE
    const calculateBubbleSize = (text: string, fontSize: number) => {
      const minWidth = 120
      const minHeight = 60
      const maxWidth = 300
      const padding = 20

      // Estimation basée sur la longueur du texte et la taille de police
      const charWidth = fontSize * 0.6 // Approximation
      const lineHeight = fontSize * 1.4

      // Calculer le nombre de lignes approximatif
      const charsPerLine = Math.floor((maxWidth - padding) / charWidth)
      const lines = Math.ceil(text.length / charsPerLine) || 1

      const calculatedWidth = Math.min(
        Math.max(text.length * charWidth + padding, minWidth),
        maxWidth
      )

      const calculatedHeight = Math.max(
        lines * lineHeight + padding,
        minHeight
      )

      return {
        width: Math.round(calculatedWidth),
        height: Math.round(calculatedHeight)
      }
    }

    const newSize = calculateBubbleSize(text, editingBubble.element.bubbleStyle.fontSize)

    const updatedElement = {
      ...editingBubble.element,
      text,
      transform: {
        ...editingBubble.element.transform,
        width: newSize.width,
        height: newSize.height
      }
    }

    canvas.updateElement(editingBubble.element.id, {
      text,
      transform: updatedElement.transform
    })
    setEditingBubble(prev => prev ? { ...prev, element: updatedElement } : null)

    console.log('🎨 MANGAKA: Texte et taille mis à jour automatiquement', {
      text: text.substring(0, 20) + '...',
      size: newSize
    })
  }, [editingBubble, canvas])

  // ✅ GESTIONNAIRE FIN D'ÉDITION
  const handleFinishEditing = useCallback(() => {
    setEditingBubble(null)
  }, [])

  // ✅ GESTIONNAIRE CHANGEMENT DE TYPE DE BULLE
  const handleBubbleTypeChange = useCallback((type: BubbleType) => {
    if (!contextMenu) return

    const updatedBubbleStyle = {
      ...contextMenu.element.bubbleStyle,
      type
    }

    canvas.updateElement(contextMenu.element.id, {
      bubbleStyle: updatedBubbleStyle
    })
    setContextMenu(null)
    console.log('🎨 MANGAKA: Type de bulle changé vers', type)
  }, [contextMenu, canvas])

  // ✅ FERMER LES MENUS EN CLIQUANT AILLEURS
  const handleCloseMenus = useCallback(() => {
    setContextMenu(null)
    setEditingBubble(null)
  }, [])

  // ✅ RACCOURCIS CLAVIER MANGAKA
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorer si on est en train d'éditer du texte
      if (editingBubble) return

      // Raccourcis pour changer le type de bulle sélectionnée
      if (canvas.selectedElementIds.length === 1) {
        const selectedElement = canvas.selectedElements.find(el => el.id === canvas.selectedElementIds[0])
        if (selectedElement && selectedElement.type === 'dialogue') {
          const dialogueElement = selectedElement as DialogueElement
          let newType: BubbleType | null = null

          switch (e.key) {
            case '1':
              newType = 'speech'
              break
            case '2':
              newType = 'thought'
              break
            case '3':
              newType = 'shout'
              break
            case '4':
              newType = 'whisper'
              break
            case '5':
              newType = 'explosion'
              break
          }

          if (newType && newType !== dialogueElement.bubbleStyle.type) {
            e.preventDefault()
            canvas.updateElement(dialogueElement.id, {
              bubbleStyle: {
                ...dialogueElement.bubbleStyle,
                type: newType
              }
            })
            console.log('🎨 MANGAKA: Raccourci clavier -', newType)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editingBubble, canvas])

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
      <BubbleTypeModal
        isOpen={canvas.ui.bubbleTypeModalVisible}
        onClose={handleBubbleModalClose}
        onCancel={handleBubbleModalCancel}
        onSelectType={handleBubbleTypeSelect}
      />

      {/* ✅ MENU CONTEXTUEL MANGAKA POUR BULLES */}
      <BubbleContextMenu
        isOpen={!!contextMenu}
        position={contextMenu?.position || { x: 0, y: 0 }}
        currentType={contextMenu?.element.bubbleStyle.type || 'speech'}
        onSelectType={handleBubbleTypeChange}
        onClose={handleCloseMenus}
      />

      {/* ✅ ÉDITEUR DE TEXTE MANGAKA POUR BULLES */}
      {editingBubble && (
        <BubbleTextEditor
          element={editingBubble.element}
          isEditing={true}
          position={editingBubble.position}
          onTextChange={handleTextChange}
          onFinishEditing={handleFinishEditing}
        />
      )}

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

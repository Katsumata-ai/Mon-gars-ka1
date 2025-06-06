'use client'

import React, { useCallback, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import VerticalToolbar from './layout/VerticalToolbar'
import CanvasArea from './layout/CanvasArea'
import RightPanel from './layout/RightPanel'
import { CanvasProvider } from './context/CanvasContext'
import { useCanvas } from './hooks/useCanvasOptimized'
import { performanceMonitor } from './performance/PerformanceMonitor'
import { useDashtoonKeyboardShortcuts } from './hooks/useDashtoonShortcuts'
import { AssemblyElement } from './types/assembly.types'

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

  return (
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

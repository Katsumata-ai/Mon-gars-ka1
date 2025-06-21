'use client'

import React, { useCallback, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import PolotnoVerticalToolbar from './layout/PolotnoVerticalToolbar'
import RightPanel from './layout/RightPanel'
import TipTapBubbleTypeModal from './ui/TipTapBubbleTypeModal'
import TipTapBubbleLayer from './ui/TipTapBubbleLayer'
import TipTapFreeTextLayer from './ui/TipTapFreeTextLayer'
import ExportModal from './ui/ExportModal'

import { CssDotPattern } from './ui/DotPattern'
import { PolotnoProvider, usePolotnoContext } from './context/PolotnoContext'
import { CanvasProvider } from './context/CanvasContext'
import { useAssemblyStore } from './managers/StateManager'
import { BubbleType, PolotnoAssemblyAppProps } from './types/polotno.types'
import { useConsistentCursor } from './utils/CursorUtils'
import { useAssemblyInitialization } from '../../hooks/useAssemblyInitialization'
import { useCanvasStateSync } from '../../hooks/useCanvasStateSync'

// Import du SimpleCanvasEditor (compatible React 19)
import SimpleCanvasEditor from './core/SimpleCanvasEditor'

// Composant interne qui utilise le contexte Polotno
const PolotnoAssemblyAppContent: React.FC<PolotnoAssemblyAppProps> = ({
  projectId,
  currentPage = 1,
  className = ''
}) => {
  const {
    activeTool,
    bubbleCreationMode,
    bubbleTypeToCreate,
    isDirty,
    isLoading,
    setActiveTool,
    startBubbleCreation,
    cancelBubbleCreation,
    saveProject,
    exportAsImage,
    zoomLevel
  } = usePolotnoContext()

  // ✅ NOUVEAU : Hook pour curseur crosshair cohérent
  const canvasContainerRef = React.useRef<HTMLDivElement>(null)
  useConsistentCursor(activeTool, bubbleCreationMode, canvasContainerRef)

  // Utiliser le vrai système de sélection
  const { selectElement, clearSelection } = useAssemblyStore()

  // ✅ NOUVEAU : Initialiser l'assemblage avec les pages
  const {
    isInitialized,
    isLoading: isInitializingPages,
    error: initError
  } = useAssemblyInitialization({ projectId })

  // ✅ CRITIQUE : Synchroniser CanvasContext avec StateManager pour l'isolation des pages
  const syncStatus = useCanvasStateSync()

  // Debug de la synchronisation
  useEffect(() => {
    console.log('🔄 PolotnoAssemblyApp: État de synchronisation:', syncStatus)
  }, [syncStatus])

  // États locaux pour les modals
  const [bubbleTypeModalVisible, setBubbleTypeModalVisible] = useState(false)
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    element: any
    position: { x: number, y: number }
  } | null>(null)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })

  // Gestionnaires d'événements
  const handleSave = useCallback(async () => {
    try {
      await saveProject()
    } catch (error) {
      console.error('Erreur de sauvegarde:', error)
      toast.error('Erreur lors de la sauvegarde')
    }
  }, [saveProject])

  const handleExport = useCallback(async () => {
    console.log('🎯 PolotnoAssemblyApp: Ouverture modal d\'export')
    setExportModalVisible(true)
  }, [])

  const handleElementClick = useCallback((element: any) => {
    console.log('Élément cliqué:', element)

    // ✅ NOUVEAU : Vérifier si l'outil bulle est actif - PRIORITÉ ABSOLUE
    if (bubbleCreationMode && bubbleTypeToCreate) {
      console.log('🎯 PRIORITÉ BULLE: Outil bulle actif - IGNORER la sélection d\'élément')
      console.log('🎯 La création de bulle sera gérée par SimpleCanvasEditor avec priorité absolue')
      return // ✅ ARRÊTER ICI - Pas de sélection d'éléments
    }

    // ✅ CORRECTION : Mettre à jour le système de sélection (seulement si pas d'outil bulle)
    if (element && element.id) {
      console.log('🎯 PolotnoAssemblyApp: Sélection de l\'élément:', element.id)
      selectElement(element.id)
    } else {
      console.log('🧹 PolotnoAssemblyApp: Désélection')
      clearSelection()
    }
  }, [selectElement, clearSelection, bubbleCreationMode, bubbleTypeToCreate])

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (activeTool === 'select') {
      // Désélectionner si on clique sur le canvas vide
      return
    }
    console.log('Canvas cliqué:', { x, y, tool: activeTool })
  }, [activeTool])

  const handleBubbleDoubleClick = useCallback((element: any, position: { x: number, y: number }) => {
    console.log('Double-clic sur bulle:', element, position)
    // TODO: Ouvrir l'éditeur de texte intégré
  }, [])

  const handleBubbleRightClick = useCallback((element: any, position: { x: number, y: number }) => {
    setContextMenu({ element, position })
  }, [])

  // Gestionnaires pour la modal de type de bulle
  const handleBubbleModalClose = useCallback(() => {
    setBubbleTypeModalVisible(false)
  }, [])

  // Gestionnaire d'annulation supprimé - géré directement par le modal

  const handleBubbleTypeSelect = useCallback((bubbleType: BubbleType) => {
    console.log('🎯 PolotnoAssemblyApp: Type de bulle sélectionné:', bubbleType)
    setBubbleTypeModalVisible(false)
    startBubbleCreation(bubbleType)
  }, [startBubbleCreation])

  // Gestionnaires pour le menu contextuel
  const handleBubbleTypeChange = useCallback((newType: BubbleType) => {
    if (contextMenu?.element) {
      // TODO: Changer le type de bulle de l'élément sélectionné
      console.log('Changement de type de bulle:', newType)
    }
    setContextMenu(null)
  }, [contextMenu])

  const handleCloseMenus = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Gestionnaire pour l'ouverture de la modal de bulle
  const handleOpenBubbleModal = useCallback(() => {
    console.log('🎯 PolotnoAssemblyApp: Ouverture modal bulle')
    setBubbleTypeModalVisible(true)
  }, [])

  // ✅ NOUVEAU : Écouter les événements de désélection globale pour synchroniser avec useAssemblyStore
  useEffect(() => {
    const handleGlobalDeselect = (event: CustomEvent) => {
      console.log('🧹 PolotnoAssemblyApp: Désélection globale reçue:', event.detail)
      clearSelection()
    }

    const handleForceDeselectAll = (event: CustomEvent) => {
      console.log('🧹 PolotnoAssemblyApp: Désélection forcée reçue:', event.detail)
      clearSelection()
    }

    // Écouter les événements de désélection
    window.addEventListener('globalDeselect', handleGlobalDeselect as EventListener)
    window.addEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)

    return () => {
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
    }
  }, [clearSelection])

  // ✅ SUPPRIMÉ : Indicateur de chargement pour permettre l'interaction immédiate

  // Afficher une erreur si l'initialisation a échoué
  if (initError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-dark-900">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <p className="text-white text-lg mb-2">Erreur d'initialisation</p>
          <p className="text-gray-400 text-sm">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Recharger
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashtoonLayout
        className={className}
        leftToolbar={
          <PolotnoVerticalToolbar
            onSave={handleSave}
            onExport={handleExport}
            onOpenBubbleModal={handleOpenBubbleModal}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            isDirty={isDirty}
            isLoading={isLoading}
          />
        }
        centerCanvas={
          <div
            ref={canvasContainerRef}
            className="h-full w-full bg-transparent flex items-center justify-center relative canvas-interface no-scrollbar"
          >
            {/* ✨ MOTIF DE POINTS DÉCORATIFS SUBTILS */}
            <CssDotPattern
              size={1.5}
              spacing={24}
              opacity={0.15}
              color="#ffffff"
              className="absolute inset-0 z-0"
            />

            <div className="bg-black shadow-2xl rounded-lg overflow-hidden relative z-10 canvas-container">
              {/* ✨ MOTIF DE POINTS DANS LE CONTENEUR CANVAS */}
              <CssDotPattern
                size={1.5}
                spacing={24}
                opacity={0.18}
                color="#ffffff"
                className="z-0"
              />
              <div className="relative z-10">
                <SimpleCanvasEditor
                  width={1200}
                  height={1600}
                  onElementClick={handleElementClick}
                  onCanvasClick={handleCanvasClick}
                  onBubbleDoubleClick={handleBubbleDoubleClick}
                  onBubbleRightClick={handleBubbleRightClick}
                  onCanvasTransformChange={setCanvasTransform}
                  className="block"
                />
              </div>

              {/* ✅ NOUVEAU SYSTÈME TIPTAP BUBBLES */}
              <TipTapBubbleLayer
                canvasTransform={canvasTransform}
                zoomLevel={zoomLevel}
                canvasSize={{ width: 1200, height: 1600 }}
                viewport={{ width: 1200, height: 1600, centerX: 600, centerY: 800 }}
                className="absolute inset-0"
              />

              {/* ✅ NOUVEAU SYSTÈME TIPTAP TEXTE LIBRE */}
              <TipTapFreeTextLayer
                canvasTransform={canvasTransform}
                zoomLevel={zoomLevel}
                className="absolute inset-0"
              />
            </div>
          </div>
        }
        rightPanel={
          <RightPanel
            projectId={projectId}
            currentPage={currentPage}
            onPageSelect={(pageNumber) => {
              console.log('🔄 Changement de page vers:', pageNumber)
              // TODO: Implémenter le changement de page avec StateManager
            }}
            onAddPage={() => {
              console.log('➕ Ajout de nouvelle page')
              // TODO: Implémenter l'ajout de page avec StateManager
            }}
            onDeletePage={(pageNumber) => {
              console.log('🗑️ Suppression de page:', pageNumber)
              // TODO: Implémenter la suppression de page avec StateManager
            }}
          />
        }
      />

      {/* Modal de sélection du type de bulle */}
      <TipTapBubbleTypeModal
        isOpen={bubbleTypeModalVisible}
        onClose={handleBubbleModalClose}
        onSelectType={handleBubbleTypeSelect}
      />

      {/* Modal d'export */}
      <ExportModal
        projectId={projectId}
        isOpen={exportModalVisible}
        onClose={() => setExportModalVisible(false)}
      />

      {/* Menu contextuel pour bulles - À réimplémenter avec le nouveau système */}

      {/* Indicateur de mode création de bulle */}
      {bubbleCreationMode && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="font-medium">
              Cliquez pour placer votre bulle {bubbleTypeToCreate}
            </span>
            <button
              onClick={cancelBubbleCreation}
              className="ml-4 text-white/80 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}


    </>
  )
}

// Composant principal avec Providers
const PolotnoAssemblyApp: React.FC<PolotnoAssemblyAppProps> = (props) => {
  return (
    <PolotnoProvider>
      <CanvasProvider>
        <PolotnoAssemblyAppContent {...props} />
      </CanvasProvider>
    </PolotnoProvider>
  )
}

export default PolotnoAssemblyApp
export { PolotnoAssemblyApp }

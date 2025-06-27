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

  // ✅ NEW: Hook for consistent crosshair cursor
  const canvasContainerRef = React.useRef<HTMLDivElement>(null)
  useConsistentCursor(activeTool, bubbleCreationMode, canvasContainerRef as React.RefObject<HTMLElement>)

  // Utiliser le vrai système de sélection
  const { selectElement, clearSelection } = useAssemblyStore()

  // ✅ NEW: Initialize assembly with pages
  const {
    isInitialized,
    isLoading: isInitializingPages,
    error: initError
  } = useAssemblyInitialization({ projectId })

  // ✅ CRITIQUE : Synchroniser CanvasContext avec StateManager pour l'isolation des pages
  const syncStatus = useCanvasStateSync()



  // États locaux pour les modals
  const [bubbleTypeModalVisible, setBubbleTypeModalVisible] = useState(false)
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    element: any
    position: { x: number, y: number }
  } | null>(null)
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })

  // Event handlers
  const handleSave = useCallback(async () => {
    try {
      await saveProject()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Save error')
    }
  }, [saveProject])

  const handleExport = useCallback(async () => {

    setExportModalVisible(true)
  }, [])

  const handleElementClick = useCallback((element: any) => {
    console.log('Element clicked:', element)

    // ✅ NEW: Check if bubble tool is active - ABSOLUTE PRIORITY
    if (bubbleCreationMode && bubbleTypeToCreate) {
      console.log('🎯 BUBBLE PRIORITY: Bubble tool active - IGNORE element selection')
      console.log('🎯 Bubble creation will be handled by SimpleCanvasEditor with absolute priority')
      return // ✅ STOP HERE - No element selection
    }

    // ✅ CORRECTION: Update selection system (only if no bubble tool)
    if (element && element.id) {
      console.log('🎯 PolotnoAssemblyApp: Element selection:', element.id)
      selectElement(element.id)
    } else {
      console.log('🧹 PolotnoAssemblyApp: Deselection')
      clearSelection()
    }
  }, [selectElement, clearSelection, bubbleCreationMode, bubbleTypeToCreate])

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (activeTool === 'select') {
      // Deselect if clicking on empty canvas
      return
    }
    console.log('Canvas clicked:', { x, y, tool: activeTool })
  }, [activeTool])

  const handleBubbleDoubleClick = useCallback((element: any, position: { x: number, y: number }) => {
    console.log('Double-click on bubble:', element, position)
    // TODO: Open integrated text editor
  }, [])

  const handleBubbleRightClick = useCallback((element: any, position: { x: number, y: number }) => {
    setContextMenu({ element, position })
  }, [])

  // Handlers for bubble type modal
  const handleBubbleModalClose = useCallback(() => {
    setBubbleTypeModalVisible(false)
  }, [])

  // Cancel handler removed - handled directly by modal

  const handleBubbleTypeSelect = useCallback((bubbleType: BubbleType) => {
    console.log('🎯 PolotnoAssemblyApp: Bubble type selected:', bubbleType)
    setBubbleTypeModalVisible(false)
    startBubbleCreation(bubbleType)
  }, [startBubbleCreation])

  // Handlers for context menu
  const handleBubbleTypeChange = useCallback((newType: BubbleType) => {
    if (contextMenu?.element) {
      // TODO: Change bubble type of selected element
      console.log('Bubble type change:', newType)
    }
    setContextMenu(null)
  }, [contextMenu])

  const handleCloseMenus = useCallback(() => {
    setContextMenu(null)
  }, [])

  // Gestionnaire pour l'ouverture de la modal de bulle
  const handleOpenBubbleModal = useCallback(() => {

    setBubbleTypeModalVisible(true)
  }, [])

  // ✅ NEW: Listen to global deselection events to sync with useAssemblyStore
  useEffect(() => {
    const handleGlobalDeselect = (event: CustomEvent) => {

      clearSelection()
    }

    const handleForceDeselectAll = (event: CustomEvent) => {

      clearSelection()
    }

    // Listen to deselection events
    window.addEventListener('globalDeselect', handleGlobalDeselect as EventListener)
    window.addEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)

    return () => {
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
    }
  }, [clearSelection])

  // ✅ REMOVED: Loading indicator to allow immediate interaction

  // Show error if initialization failed
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
            onExport={handleExport}
            onOpenBubbleModal={handleOpenBubbleModal}
            activeTool={activeTool}
            onToolChange={setActiveTool}
            isLoading={isLoading}
          />
        }
        centerCanvas={
          <div
            ref={canvasContainerRef}
            className="h-full w-full bg-transparent flex items-center justify-center relative canvas-interface no-scrollbar"
          >
            {/* ✨ SUBTLE DECORATIVE DOT PATTERN */}
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

              {/* ✅ NEW TIPTAP BUBBLES SYSTEM */}
              <TipTapBubbleLayer
                canvasTransform={canvasTransform}
                zoomLevel={zoomLevel}
                canvasSize={{ width: 1200, height: 1600 }}
                viewport={{ width: 1200, height: 1600, centerX: 600, centerY: 800 }}
                className="absolute inset-0"
              />

              {/* ✅ NEW TIPTAP FREE TEXT SYSTEM */}
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

              // TODO: Implement page change with StateManager
            }}
            onAddPage={() => {

              // TODO: Implement page addition with StateManager
            }}
            onDeletePage={(pageNumber) => {

              // TODO: Implement page deletion with StateManager
            }}
          />
        }
      />

      {/* Bubble type selection modal */}
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

      {/* Context menu for bubbles - To be reimplemented with new system */}

      {/* Bubble creation mode indicator */}
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

// [FR-UNTRANSLATED: Composant principal avec Providers]
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

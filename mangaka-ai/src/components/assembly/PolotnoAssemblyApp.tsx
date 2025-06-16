'use client'

import React, { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import PolotnoVerticalToolbar from './layout/PolotnoVerticalToolbar'
import RightPanel from './layout/RightPanel'
import TipTapBubbleTypeModal from './ui/TipTapBubbleTypeModal'
import TipTapBubbleLayer from './ui/TipTapBubbleLayer'
import TipTapFreeTextLayer from './ui/TipTapFreeTextLayer'
import { CssDotPattern } from './ui/DotPattern'
import { PolotnoProvider, usePolotnoContext } from './context/PolotnoContext'
import { CanvasProvider } from './context/CanvasContext'
import { BubbleType, PolotnoAssemblyAppProps } from './types/polotno.types'

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

  // États locaux pour les modals
  const [bubbleTypeModalVisible, setBubbleTypeModalVisible] = useState(false)
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
    try {
      const imageData = await exportAsImage()
      // Créer un lien de téléchargement
      const link = document.createElement('a')
      link.download = `manga-page-${currentPage}.png`
      link.href = imageData
      link.click()
      toast.success('Page exportée')
    } catch (error) {
      console.error('Erreur d\'export:', error)
      toast.error('Erreur lors de l\'export')
    }
  }, [exportAsImage, currentPage])

  const handleElementClick = useCallback((element: any) => {
    console.log('Élément cliqué:', element)
  }, [])

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
          <div className="h-full w-full bg-transparent flex items-center justify-center relative canvas-interface no-scrollbar">
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
            onPageSelect={() => {}} // TODO: Implémenter avec Polotno
            onAddPage={() => {}} // TODO: Implémenter avec Polotno
            onDeletePage={() => {}} // TODO: Implémenter avec Polotno
          />
        }
      />

      {/* Modal de sélection du type de bulle */}
      <TipTapBubbleTypeModal
        isOpen={bubbleTypeModalVisible}
        onClose={handleBubbleModalClose}
        onSelectType={handleBubbleTypeSelect}
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

'use client'

import React, { useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'react-hot-toast'
import DashtoonLayout from './layout/DashtoonLayout'
import PolotnoVerticalToolbar from './layout/PolotnoVerticalToolbar'
import RightPanel from './layout/RightPanel'
import BubbleTypeModal from './ui/BubbleTypeModal'
import BubbleContextMenu from './ui/BubbleContextMenu'
import { PolotnoProvider, usePolotnoContext } from './context/PolotnoContext'
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
    exportAsImage
  } = usePolotnoContext()

  // États locaux pour les modals
  const [bubbleTypeModalVisible, setBubbleTypeModalVisible] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    element: any
    position: { x: number, y: number }
  } | null>(null)

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

  const handleBubbleModalCancel = useCallback(() => {
    setBubbleTypeModalVisible(false)
    cancelBubbleCreation()
  }, [cancelBubbleCreation])

  const handleBubbleTypeSelect = useCallback((bubbleType: BubbleType) => {
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
          <div className="h-full bg-dark-600 flex items-center justify-center p-8">
            <div className="bg-white shadow-2xl rounded-lg overflow-hidden">
              <SimpleCanvasEditor
                width={1200}
                height={1600}
                onElementClick={handleElementClick}
                onCanvasClick={handleCanvasClick}
                onBubbleDoubleClick={handleBubbleDoubleClick}
                onBubbleRightClick={handleBubbleRightClick}
                className="block"
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
      <BubbleTypeModal
        isOpen={bubbleTypeModalVisible}
        onClose={handleBubbleModalClose}
        onCancel={handleBubbleModalCancel}
        onSelectType={handleBubbleTypeSelect}
      />

      {/* Menu contextuel pour bulles */}
      <BubbleContextMenu
        isOpen={!!contextMenu}
        position={contextMenu?.position || { x: 0, y: 0 }}
        currentType={contextMenu?.element?.attrs?.bubbleType || 'speech'}
        onSelectType={handleBubbleTypeChange}
        onClose={handleCloseMenus}
      />

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

// Composant principal avec Provider Polotno
const PolotnoAssemblyApp: React.FC<PolotnoAssemblyAppProps> = (props) => {
  return (
    <PolotnoProvider>
      <PolotnoAssemblyAppContent {...props} />
    </PolotnoProvider>
  )
}

export default PolotnoAssemblyApp
export { PolotnoAssemblyApp }

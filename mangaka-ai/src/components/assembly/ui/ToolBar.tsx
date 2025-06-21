'use client'

import React from 'react'
import {
  MousePointer,
  Move,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Grid,
  ZoomIn,
  ZoomOut,
  Undo,
  Redo,
  Save,
  Download,
  Layers,
  FileText,
  Trash2
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'
import { useAssemblyStore, useCanUndo, useCanRedo, useSelectedElements } from '../managers/StateManager'
import { usePolotnoContext } from '../context/PolotnoContext'

interface ToolBarProps {
  onSave?: () => void
  onExport?: () => void
  onTogglePages?: () => void
  className?: string
}

const TOOLS = [
  { id: 'select', name: 'Sélection', icon: MousePointer, shortcut: 'V' },
  { id: 'move', name: 'Déplacer', icon: Move, shortcut: 'M' },
  { id: 'panel', name: 'Panel', icon: Square, shortcut: 'P' },
  { id: 'dialogue', name: 'Bulle', icon: Circle, shortcut: 'B' },
  { id: 'text', name: 'Texte libre', icon: Type, shortcut: 'T' }
] as const

export default function ToolBar({ onSave, onExport, onTogglePages, className }: ToolBarProps) {
  const {
    activeTool,
    setActiveTool,
    showGrid,
    toggleGrid,
    undo,
    redo,
    deleteElements,
    ui,
    toggleLayersPanel,
    toggleImageLibrary,
    saveState
  } = useAssemblyStore()

  // ✅ NOUVEAU : Utiliser les fonctions de zoom de PolotnoContext qui incluent la désélection automatique
  const { zoomLevel, zoomIn, zoomOut, resetZoom } = usePolotnoContext()

  const canUndo = useCanUndo()
  const canRedo = useCanRedo()
  const selectedElements = useSelectedElements()

  const handleToolSelect = (toolId: typeof TOOLS[number]['id']) => {
    setActiveTool(toolId)
  }

  // ✅ NOUVEAU : Utiliser les fonctions de PolotnoContext qui déclenchent la désélection automatique
  const handleZoomIn = () => {
    zoomIn()
  }

  const handleZoomOut = () => {
    zoomOut()
  }

  const handleZoomReset = () => {
    resetZoom()
  }

  const handleDeleteSelected = () => {
    if (selectedElements.length > 0) {
      const ids = selectedElements.map(el => el.id)
      deleteElements(ids)
    }
  }

  return (
    <div className={cn(
      'bg-dark-800 border-b border-dark-700 p-3 flex items-center justify-between',
      className
    )}>
      {/* Outils principaux */}
      <div className="flex items-center space-x-2">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={cn(
                'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
                'hover:scale-105 active:scale-95',
                activeTool === tool.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                  : 'text-dark-400 hover:bg-dark-700 hover:text-white'
              )}
              title={`${tool.name} (${tool.shortcut})`}
            >
              <Icon className="w-5 h-5" />
            </button>
          )
        })}

        {/* Séparateur */}
        <div className="w-px h-8 bg-dark-600 mx-2" />

        {/* Contrôles de vue */}
        <button
          onClick={toggleGrid}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            showGrid
              ? 'bg-dark-600 text-white'
              : 'text-dark-400 hover:bg-dark-700 hover:text-white'
          )}
          title="Grille (G)"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Contrôles de zoom */}
        <div className="flex items-center space-x-1 bg-dark-700 rounded-lg px-2">
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 rounded flex items-center justify-center text-dark-400 hover:bg-dark-600 hover:text-white transition-colors"
            title="Zoom - (-)"
            disabled={zoomLevel <= 25}
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            onClick={handleZoomReset}
            className="text-xs text-dark-300 px-3 py-1 hover:bg-dark-600 hover:text-white rounded transition-colors min-w-[3rem] text-center"
            title="Réinitialiser le zoom (0)"
          >
            {zoomLevel}%
          </button>

          <button
            onClick={handleZoomIn}
            className="w-8 h-8 rounded flex items-center justify-center text-dark-400 hover:bg-dark-600 hover:text-white transition-colors"
            title="Zoom + (+)"
            disabled={zoomLevel >= 400}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Actions centrales */}
      <div className="flex items-center space-x-2">
        {/* Historique */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            canUndo
              ? 'text-dark-300 hover:bg-dark-700 hover:text-white'
              : 'text-dark-600 cursor-not-allowed'
          )}
          title="Annuler (Ctrl+Z)"
        >
          <Undo className="w-5 h-5" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            canRedo
              ? 'text-dark-300 hover:bg-dark-700 hover:text-white'
              : 'text-dark-600 cursor-not-allowed'
          )}
          title="Refaire (Ctrl+Y)"
        >
          <Redo className="w-5 h-5" />
        </button>

        {/* Séparateur */}
        <div className="w-px h-8 bg-dark-600 mx-2" />

        {/* Actions sur la sélection */}
        {selectedElements.length > 0 && (
          <>
            <div className="flex items-center space-x-2 bg-dark-700 rounded-lg px-3 py-1">
              <span className="text-xs text-dark-300">
                {selectedElements.length} sélectionné{selectedElements.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={handleDeleteSelected}
                className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                title="Supprimer (Delete)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {/* Séparateur */}
            <div className="w-px h-8 bg-dark-600 mx-2" />
          </>
        )}
      </div>

      {/* Actions de droite */}
      <div className="flex items-center space-x-2">
        {/* Panneaux */}
        <button
          onClick={onTogglePages}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            'text-dark-400 hover:bg-dark-700 hover:text-white'
          )}
          title="Pages (P)"
        >
          <FileText className="w-5 h-5" />
        </button>

        <button
          onClick={toggleLayersPanel}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            ui.layersPanelVisible
              ? 'bg-dark-600 text-white'
              : 'text-dark-400 hover:bg-dark-700 hover:text-white'
          )}
          title="Couches (L)"
        >
          <Layers className="w-5 h-5" />
        </button>

        <button
          onClick={toggleImageLibrary}
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200',
            'hover:scale-105 active:scale-95',
            ui.imageLibraryVisible
              ? 'bg-dark-600 text-white'
              : 'text-dark-400 hover:bg-dark-700 hover:text-white'
          )}
          title="Bibliothèque d'images (Shift+I)"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        {/* Séparateur */}
        <div className="w-px h-8 bg-dark-600 mx-2" />

        {/* Actions de fichier */}
        <MangaButton
          onClick={onSave}
          size="sm"
          icon={<Save className="w-4 h-4" />}
          loading={saveState.isLoading}
          disabled={!saveState.isDirty}
          title="Sauvegarder (Ctrl+S)"
        >
          Sauver
        </MangaButton>

        <MangaButton
          onClick={onExport}
          size="sm"
          variant="secondary"
          icon={<Download className="w-4 h-4" />}
          title="Exporter (Ctrl+E)"
        >
          Export
        </MangaButton>
      </div>

      {/* Indicateur de sauvegarde */}
      {saveState.isDirty && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" 
             title="Modifications non sauvegardées" />
      )}
    </div>
  )
}

// Hook pour les raccourcis clavier
export function useToolBarShortcuts() {
  const { setActiveTool, toggleGrid, undo, redo } = useAssemblyStore()
  // ✅ NOUVEAU : Utiliser les fonctions de zoom de PolotnoContext qui incluent la désélection automatique
  const { zoomIn, zoomOut, resetZoom } = usePolotnoContext()

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const { ctrlKey, metaKey, shiftKey, key } = event
      const isModifier = ctrlKey || metaKey

      // Raccourcis avec modificateur
      if (isModifier) {
        switch (key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (shiftKey) {
              redo()
            } else {
              undo()
            }
            break
          case 'y':
            event.preventDefault()
            redo()
            break
          case '=':
          case '+':
            event.preventDefault()
            zoomIn()
            break
          case '-':
            event.preventDefault()
            zoomOut()
            break
          case '0':
            event.preventDefault()
            resetZoom()
            break
        }
        return
      }

      // Raccourcis d'outils
      switch (key.toLowerCase()) {
        case 'v':
          event.preventDefault()
          setActiveTool('select')
          break
        case 'm':
          event.preventDefault()
          setActiveTool('move')
          break
        case 'p':
          event.preventDefault()
          setActiveTool('panel')
          break
        case 'b':
          event.preventDefault()
          setActiveTool('dialogue')
          break
        case 't':
          event.preventDefault()
          setActiveTool('text')
          break
        case 'i':
          event.preventDefault()
          setActiveTool('image')
          break
        case 'g':
          event.preventDefault()
          toggleGrid()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setActiveTool, toggleGrid, undo, redo, zoomIn, zoomOut, resetZoom])
}

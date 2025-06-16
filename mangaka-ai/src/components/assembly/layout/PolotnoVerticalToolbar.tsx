'use client'

import React from 'react'
import {
  MousePointer2,
  Square,
  MessageCircle,
  Type,
  Image,
  Circle,
  Save,
  Download,
  HelpCircle,
  Loader2,
  Grid,
  ZoomIn,
  ZoomOut,
  Hand
} from 'lucide-react'
import { PolotnoTool } from '../types/polotno.types'
import { usePolotnoContext } from '../context/PolotnoContext'
import ShortcutsHelp from '../ui/ShortcutsHelp'

interface ToolbarButton {
  id: PolotnoTool | 'save' | 'export'
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  action?: () => void
}

interface PolotnoVerticalToolbarProps {
  activeTool: PolotnoTool
  onToolChange: (tool: PolotnoTool) => void
  onSave?: () => void
  onExport?: () => void
  onOpenBubbleModal?: () => void
  isDirty?: boolean
  isLoading?: boolean
  className?: string
}

/**
 * Barre d'outils verticale adaptée pour Polotno Studio
 * - Outils Polotno natifs
 * - Interface Dashtoon conservée
 * - Intégration avec le contexte Polotno
 */
export default function PolotnoVerticalToolbar({
  activeTool,
  onToolChange,
  onSave,
  onExport,
  onOpenBubbleModal,
  isDirty = false,
  isLoading = false,
  className = ''
}: PolotnoVerticalToolbarProps) {

  const { gridVisible, toggleGrid, zoomLevel, zoomIn, zoomOut } = usePolotnoContext()

  // Debug: Vérifier que les fonctions sont disponibles
  console.log('🔍 PolotnoVerticalToolbar: Fonctions zoom disponibles:', {
    zoomIn: typeof zoomIn,
    zoomOut: typeof zoomOut,
    zoomLevel
  })
  
  const tools: ToolbarButton[] = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Sélection',
      shortcut: 'V'
    },
    {
      id: 'rectangle',
      icon: Square,
      label: 'Panel Rectangle',
      shortcut: 'P'
    },
    {
      id: 'bubble',
      icon: MessageCircle,
      label: 'Bulle de dialogue',
      shortcut: 'B'
    },
    {
      id: 'text',
      icon: Type,
      label: 'Texte libre',
      shortcut: 'T'
    },
    {
      id: 'hand',
      icon: Hand,
      label: 'Outil Main (Pan/Zoom)',
      shortcut: 'H'
    },
    {
      id: 'grid',
      icon: Grid,
      label: 'Grille',
      shortcut: 'G'
    }
  ]

  const actions: ToolbarButton[] = [
    {
      id: 'save',
      icon: Save,
      label: 'Sauvegarder',
      shortcut: 'Ctrl+S',
      action: onSave
    },
    {
      id: 'export',
      icon: Download,
      label: 'Exporter',
      shortcut: 'Ctrl+E',
      action: onExport
    }
  ]

  const handleToolSelect = (toolId: string) => {
    console.log('🔧 Outil Polotno sélectionné:', toolId)

    if (toolId === 'save' || toolId === 'export') {
      const action = actions.find(a => a.id === toolId)?.action
      action?.()
    } else if (toolId === 'bubble') {
      // Ouvrir la modal de sélection de type de bulle
      onOpenBubbleModal?.()
    } else if (toolId === 'rectangle') {
      // Activer l'outil panel rectangle
      onToolChange('panel')
    } else if (toolId === 'hand') {
      // ✅ NOUVEAU : Désélection automatique lors de l'activation de l'outil main
      console.log('🖐️ Activation outil main - Désélection automatique de tous les éléments')

      // Émettre l'événement de désélection globale AVANT d'activer l'outil
      const globalDeselectEvent = new CustomEvent('globalDeselect', {
        detail: { source: 'hand-tool-activation' }
      })
      window.dispatchEvent(globalDeselectEvent)

      // Émettre aussi l'événement spécifique pour forcer la désélection
      const forceDeselectEvent = new CustomEvent('forceDeselectAll', {
        detail: { source: 'hand-tool-activation' }
      })
      window.dispatchEvent(forceDeselectEvent)

      // Activer l'outil main
      onToolChange('hand')

      console.log('✅ Outil main activé avec désélection complète')
    } else if (toolId === 'grid') {
      // Basculer l'affichage de la grille
      toggleGrid()
    } else {
      // Activer l'outil directement
      onToolChange(toolId as PolotnoTool)
    }
  }

  return (
    <div className={`h-full w-16 flex flex-col overflow-hidden ${className}`}>
      {/* Indicateur de statut */}
      <div className="px-2 py-2 border-b border-dark-700">
        <div className="flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
          ) : isDirty ? (
            <div className="w-2 h-2 bg-orange-500 rounded-full" title="Modifications non sauvegardées" />
          ) : (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Sauvegardé" />
          )}
        </div>
      </div>

      {/* Outils principaux */}
      <div className="flex-1 py-4">
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            let isActive = false
            
            // Logique d'activation pour les outils
            if (tool.id === 'select') {
              isActive = activeTool === 'select'
            } else if (tool.id === 'rectangle') {
              isActive = activeTool === 'panel'
            } else if (tool.id === 'bubble') {
              isActive = activeTool === 'bubble'
            } else if (tool.id === 'hand') {
              isActive = activeTool === 'hand'
            } else if (tool.id === 'grid') {
              isActive = gridVisible
            } else {
              isActive = activeTool === tool.id
            }
            
            return (
              <div key={tool.id} className="relative group">
                <button
                  onClick={() => handleToolSelect(tool.id)}
                  className={`
                    w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                    transition-all duration-200 hover:bg-dark-600
                    ${isActive 
                      ? 'bg-primary-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                  title={`${tool.label} (${tool.shortcut})`}
                  disabled={isLoading}
                >
                  <Icon size={20} />
                </button>
                
                {/* Tooltip */}
                <div className="
                  absolute left-16 top-1/2 -translate-y-1/2 z-[100]
                  bg-dark-900 text-white text-sm px-2 py-1 rounded
                  opacity-0 group-hover:opacity-100 transition-opacity
                  pointer-events-none whitespace-nowrap
                ">
                  {tool.label}
                  {tool.shortcut && (
                    <span className="ml-2 text-gray-400">({tool.shortcut})</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Contrôles de Zoom */}
      <div className="border-t border-dark-700 py-4">
        <div className="space-y-2">
          <div className="text-xs text-gray-400 text-center mb-2">Zoom</div>

          {/* Bouton Zoom In */}
          <div className="relative group">
            <button
              onClick={() => {
                console.log('🔍 Zoom In clicked')
                zoomIn()
              }}
              className="w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-white hover:bg-dark-600
                         transition-all duration-200"
              title="Zoom avant (+)"
            >
              <ZoomIn size={20} />
            </button>

            {/* Tooltip */}
            <div className="
              absolute left-16 top-1/2 -translate-y-1/2 z-[100]
              bg-dark-900 text-white text-sm px-2 py-1 rounded
              opacity-0 group-hover:opacity-100 transition-opacity
              pointer-events-none whitespace-nowrap
            ">
              Zoom avant (+)
            </div>
          </div>

          {/* Affichage du niveau de zoom */}
          <div className="text-center py-1">
            <span className="text-xs text-gray-300">{zoomLevel}%</span>
          </div>

          {/* Bouton Zoom Out */}
          <div className="relative group">
            <button
              onClick={() => {
                console.log('🔍 Zoom Out clicked')
                zoomOut()
              }}
              className="w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-white hover:bg-dark-600
                         transition-all duration-200"
              title="Zoom arrière (-)"
            >
              <ZoomOut size={20} />
            </button>

            {/* Tooltip */}
            <div className="
              absolute left-16 top-1/2 -translate-y-1/2 z-[100]
              bg-dark-900 text-white text-sm px-2 py-1 rounded
              opacity-0 group-hover:opacity-100 transition-opacity
              pointer-events-none whitespace-nowrap
            ">
              Zoom arrière (-)
            </div>
          </div>
        </div>
      </div>

      {/* Actions (Sauvegarde, Export) */}
      <div className="border-t border-dark-700 py-4">
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon
            const showIndicator = action.id === 'save' && isDirty

            return (
              <div key={action.id} className="relative group">
                <button
                  onClick={() => handleToolSelect(action.id)}
                  className={`
                    w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                    transition-all duration-200 relative
                    ${showIndicator 
                      ? 'text-orange-400 hover:text-orange-300 hover:bg-dark-600' 
                      : 'text-gray-400 hover:text-white hover:bg-dark-600'
                    }
                  `}
                  title={`${action.label} (${action.shortcut})`}
                  disabled={isLoading}
                >
                  {isLoading && action.id === 'save' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon size={20} />
                  )}
                  
                  {/* Indicateur de modifications non sauvegardées */}
                  {showIndicator && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full border-2 border-dark-800" />
                  )}
                </button>

                {/* Tooltip */}
                <div className="
                  absolute left-16 top-1/2 -translate-y-1/2 z-[100]
                  bg-dark-900 text-white text-sm px-2 py-1 rounded
                  opacity-0 group-hover:opacity-100 transition-opacity
                  pointer-events-none whitespace-nowrap
                ">
                  {action.label}
                  {action.shortcut && (
                    <span className="ml-2 text-gray-400">({action.shortcut})</span>
                  )}
                  {showIndicator && (
                    <span className="ml-2 text-orange-400">(non sauvegardé)</span>
                  )}
                </div>
              </div>
            )
          })}

          {/* Bouton d'aide */}
          <div className="relative group">
            <ShortcutsHelp className="w-12 h-12 mx-2" />
          </div>
        </div>
      </div>
    </div>
  )
}

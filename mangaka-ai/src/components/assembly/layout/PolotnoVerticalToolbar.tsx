'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  RotateCcw
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

  const { gridVisible, toggleGrid, zoomLevel, zoomIn, zoomOut, resetZoom } = usePolotnoContext()
  const [showZoomSubmenu, setShowZoomSubmenu] = useState(false)
  const submenuRef = useRef<HTMLDivElement>(null)

  // Fermer le sous-menu quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (submenuRef.current && !submenuRef.current.contains(event.target as Node)) {
        setShowZoomSubmenu(false)
      }
    }

    if (showZoomSubmenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showZoomSubmenu])
  
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
      id: 'grid',
      icon: Grid,
      label: 'Grille',
      shortcut: 'G'
    },
    {
      id: 'zoom',
      icon: ZoomIn,
      label: `Zoom (${zoomLevel}%)`,
      shortcut: '+/-'
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
    } else if (toolId === 'grid') {
      // Basculer l'affichage de la grille
      toggleGrid()
    } else if (toolId === 'zoom') {
      // Basculer l'affichage du sous-menu zoom
      setShowZoomSubmenu(!showZoomSubmenu)
    } else {
      // Activer l'outil directement
      onToolChange(toolId as PolotnoTool)
    }
  }

  return (
    <div className={`h-full flex flex-col bg-dark-800 ${className}`}>
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
            } else if (tool.id === 'grid') {
              isActive = gridVisible
            } else if (tool.id === 'zoom') {
              isActive = showZoomSubmenu
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
                  absolute left-16 top-1/2 -translate-y-1/2 z-50
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

      {/* Sous-menu Zoom */}
      {showZoomSubmenu && (
        <div ref={submenuRef} className="absolute left-16 top-0 z-50 bg-dark-800 rounded-lg p-3 shadow-lg border border-dark-600 min-w-[200px]">
          <div className="space-y-2">
            <div className="text-sm text-gray-300 font-medium mb-3">Contrôles de zoom</div>

            <button
              onClick={() => {
                zoomIn()
                setShowZoomSubmenu(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
            >
              <ZoomIn size={16} />
              <span>Zoom avant</span>
              <span className="ml-auto text-xs text-gray-400">+</span>
            </button>

            <button
              onClick={() => {
                zoomOut()
                setShowZoomSubmenu(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
            >
              <ZoomOut size={16} />
              <span>Zoom arrière</span>
              <span className="ml-auto text-xs text-gray-400">-</span>
            </button>

            <div className="border-t border-dark-600 my-2"></div>

            <div className="text-center py-1">
              <span className="text-sm text-gray-300">{zoomLevel}%</span>
            </div>

            <button
              onClick={() => {
                resetZoom()
                setShowZoomSubmenu(false)
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-700 rounded transition-colors"
            >
              <RotateCcw size={16} />
              <span>Réinitialiser</span>
              <span className="ml-auto text-xs text-gray-400">0</span>
            </button>
          </div>
        </div>
      )}

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
                  absolute left-16 top-1/2 -translate-y-1/2 z-50
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

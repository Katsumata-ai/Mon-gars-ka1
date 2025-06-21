'use client'

import React from 'react'
import {
  MousePointer2,
  Square,
  MessageCircle,
  Type,
  Grid,
  Hand,
  ZoomIn,
  ZoomOut,
  Download
} from 'lucide-react'
import { PolotnoTool } from '../types/polotno.types'
import { usePolotnoContext } from '../context/PolotnoContext'
import ShortcutsHelp from '../ui/ShortcutsHelp'

interface ToolbarButton {
  id: PolotnoTool
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  action?: () => void
}

interface PolotnoVerticalToolbarProps {
  activeTool: PolotnoTool
  onToolChange: (tool: PolotnoTool) => void
  onOpenBubbleModal?: () => void
  onExport?: () => void
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
  onOpenBubbleModal,
  onExport,
  isLoading = false,
  className = ''
}: PolotnoVerticalToolbarProps) {

  const { gridVisible, toggleGrid, zoomLevel, zoomIn, zoomOut } = usePolotnoContext()
  
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

  const handleToolSelect = (toolId: string) => {
    console.log('🔧 Outil Polotno sélectionné:', toolId)

    if (toolId === 'bubble') {
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
      {/* Outils principaux */}
      <div className="flex-1 py-1">
        <div className="space-y-0">
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
                    w-12 h-8 mx-auto rounded-md flex items-center justify-center
                    transition-all duration-200 hover:bg-dark-600
                    ${isActive
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                  disabled={isLoading}
                >
                  <Icon size={12} />
                </button>
              </div>
            )
          })}

          {/* ✅ Ligne de séparation canvas/zoom */}
          <div className="mx-auto my-1 w-8 h-px bg-dark-600"></div>

          {/* ✅ Contrôles de zoom */}
          {/* Zoom In */}
          <button
            onClick={() => {
              console.log('🔍 Toolbar: Zoom In')
              zoomIn()
            }}
            className="
              w-12 h-8 mx-auto rounded-md flex items-center justify-center
              text-gray-400 hover:text-white hover:bg-dark-600
              transition-all duration-200
            "
          >
            <ZoomIn size={12} />
          </button>

          {/* Affichage du niveau de zoom */}
          <div className="mx-auto px-1 py-0 text-center">
            <div className="
              text-[10px] text-gray-300 font-medium
              bg-dark-700/50 rounded px-1 py-0
              min-w-[40px]
            ">
              {Math.round(zoomLevel)}%
            </div>
          </div>

          {/* Zoom Out */}
          <button
            onClick={() => {
              console.log('🔍 Toolbar: Zoom Out')
              zoomOut()
            }}
            className="
              w-12 h-8 mx-auto rounded-md flex items-center justify-center
              text-gray-400 hover:text-white hover:bg-dark-600
              transition-all duration-200
            "
          >
            <ZoomOut size={12} />
          </button>

          {/* ✅ Ligne de séparation zoom/export */}
          <div className="mx-auto my-1 w-8 h-px bg-dark-600"></div>

          {/* ✅ Export séparé en bas */}
          <button
            onClick={() => {
              console.log('📤 Toolbar: Export')
              onExport?.()
            }}
            className="
              w-12 h-8 mx-auto rounded-md flex items-center justify-center
              text-gray-400 hover:text-white hover:bg-dark-600
              transition-all duration-200
            "
          >
            <Download size={12} />
          </button>
        </div>
      </div>

      {/* Bouton d'aide ultra-compact */}
      <div className="border-t border-dark-700 py-0">
        <div className="space-y-0">
          <ShortcutsHelp className="w-12 h-8 mx-auto" />
        </div>
      </div>
    </div>
  )
}

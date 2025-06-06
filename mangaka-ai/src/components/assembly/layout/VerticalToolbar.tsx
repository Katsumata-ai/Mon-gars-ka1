'use client'

import React from 'react'
import {
  MousePointer2,
  Square,
  MessageCircle,
  Type,
  ZoomIn,
  Hand,
  Save,
  Download,
  HelpCircle
} from 'lucide-react'
import { useCanvasContext } from '../context/CanvasContext'
import ShortcutsHelp from '../ui/ShortcutsHelp'

interface ToolbarButton {
  id: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  shortcut?: string
  action?: () => void
}

interface VerticalToolbarProps {
  onSave?: () => void
  onExport?: () => void
  className?: string
}

/**
 * Barre d'outils verticale gauche reproduisant l'interface Dashtoon
 * - Outils de sélection et création
 * - Icônes avec tooltips
 * - Raccourcis clavier
 */
export default function VerticalToolbar({
  onSave,
  onExport,
  className = ''
}: VerticalToolbarProps) {
  const { activeTool, setActiveTool, toggleBubbleTypeModal } = useCanvasContext()

  const tools: ToolbarButton[] = [
    {
      id: 'select',
      icon: MousePointer2,
      label: 'Sélection',
      shortcut: 'V'
    },
    {
      id: 'panel',
      icon: Square,
      label: 'Panel',
      shortcut: 'P'
    },
    {
      id: 'dialogue',
      icon: MessageCircle,
      label: 'Bulle de dialogue',
      shortcut: 'B'
    },
    {
      id: 'text',
      icon: Type,
      label: 'Texte',
      shortcut: 'T'
    },
    {
      id: 'zoom',
      icon: ZoomIn,
      label: 'Zoom',
      shortcut: 'Z'
    },
    {
      id: 'pan',
      icon: Hand,
      label: 'Déplacement',
      shortcut: 'H'
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
    console.log('🔧 Outil sélectionné:', toolId)
    console.log('🔧 Outil actuel avant:', activeTool)

    if (toolId === 'save' || toolId === 'export') {
      const action = actions.find(a => a.id === toolId)?.action
      action?.()
    } else if (toolId === 'dialogue') {
      // ✅ CORRECTION : Ouvrir directement la modal pour l'outil bulle
      console.log('💬 Ouverture modal bulle depuis toolbar')
      setActiveTool(toolId as any)
      toggleBubbleTypeModal()
    } else {
      setActiveTool(toolId as any)
      console.log('🔧 setActiveTool appelé avec:', toolId)
    }
  }

  return (
    <div className={`h-full flex flex-col bg-dark-800 ${className}`}>
      {/* Outils principaux */}
      <div className="flex-1 py-4">
        <div className="space-y-2">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id
            
            return (
              <div key={tool.id} className="relative group">
                <button
                  onClick={() => handleToolSelect(tool.id)}
                  className={`
                    w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                    transition-all duration-200 hover:bg-dark-600
                    ${isActive 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white'
                    }
                  `}
                  title={`${tool.label} (${tool.shortcut})`}
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

      {/* Actions (Sauvegarde, Export) */}
      <div className="border-t border-dark-700 py-4">
        <div className="space-y-2">
          {actions.map((action) => {
            const Icon = action.icon

            return (
              <div key={action.id} className="relative group">
                <button
                  onClick={() => handleToolSelect(action.id)}
                  className="
                    w-12 h-12 mx-2 rounded-lg flex items-center justify-center
                    text-gray-400 hover:text-white hover:bg-dark-600
                    transition-all duration-200
                  "
                  title={`${action.label} (${action.shortcut})`}
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
                  {action.label}
                  {action.shortcut && (
                    <span className="ml-2 text-gray-400">({action.shortcut})</span>
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

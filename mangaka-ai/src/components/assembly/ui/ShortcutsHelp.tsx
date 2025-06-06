'use client'

import React, { useState } from 'react'
import { HelpCircle, X, Keyboard } from 'lucide-react'
import { ShortcutUtils } from '../hooks/useDashtoonShortcuts'

interface ShortcutsHelpProps {
  className?: string
}

/**
 * Composant d'aide pour afficher les raccourcis clavier Dashtoon
 */
export default function ShortcutsHelp({ className = '' }: ShortcutsHelpProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shortcuts = ShortcutUtils.getShortcutList()

  return (
    <>
      {/* Bouton d'aide */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          p-2 text-gray-400 hover:text-white hover:bg-dark-700 
          rounded transition-colors ${className}
        `}
        title="Raccourcis clavier (F1)"
      >
        <Keyboard size={20} />
      </button>

      {/* Modal d'aide */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Contenu de la modal */}
          <div className="relative bg-dark-800 rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* En-tête */}
            <div className="flex items-center justify-between p-6 border-b border-dark-700">
              <div className="flex items-center space-x-3">
                <Keyboard className="text-red-500" size={24} />
                <h2 className="text-xl font-semibold text-white">
                  Raccourcis clavier
                </h2>
              </div>
              
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-white hover:bg-dark-700 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Section Outils */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3" />
                    Outils de création
                  </h3>
                  
                  <div className="grid gap-3">
                    {shortcuts.filter(s => ['Sélection', 'Panel', 'Bulle', 'Texte', 'Zoom', 'Déplacement'].includes(s.tool)).map((shortcut) => (
                      <div key={shortcut.tool} className="flex items-center justify-between py-2 px-3 bg-dark-700/50 rounded">
                        <div>
                          <div className="text-white font-medium">{shortcut.tool}</div>
                          <div className="text-gray-400 text-sm">{shortcut.description}</div>
                        </div>
                        <kbd className="px-2 py-1 bg-dark-600 text-gray-300 rounded text-sm font-mono">
                          {shortcut.shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Actions */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mr-3" />
                    Actions
                  </h3>
                  
                  <div className="grid gap-3">
                    {shortcuts.filter(s => ['Annuler', 'Rétablir', 'Tout sélectionner', 'Désélectionner', 'Échapper'].includes(s.tool)).map((shortcut) => (
                      <div key={shortcut.tool} className="flex items-center justify-between py-2 px-3 bg-dark-700/50 rounded">
                        <div>
                          <div className="text-white font-medium">{shortcut.tool}</div>
                          <div className="text-gray-400 text-sm">{shortcut.description}</div>
                        </div>
                        <kbd className="px-2 py-1 bg-dark-600 text-gray-300 rounded text-sm font-mono">
                          {shortcut.shortcut}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section Workflow */}
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3" />
                    Workflow Dashtoon
                  </h3>
                  
                  <div className="space-y-3 text-gray-300">
                    <div className="p-3 bg-dark-700/30 rounded">
                      <div className="font-medium text-white mb-2">1. Créer des panels</div>
                      <div className="text-sm">
                        Sélectionnez l'outil Panel (P) puis cliquez-glissez pour dessiner des rectangles
                      </div>
                    </div>
                    
                    <div className="p-3 bg-dark-700/30 rounded">
                      <div className="font-medium text-white mb-2">2. Ajouter des images</div>
                      <div className="text-sm">
                        Glissez-déposez des images depuis le panneau droit vers les panels
                      </div>
                    </div>
                    
                    <div className="p-3 bg-dark-700/30 rounded">
                      <div className="font-medium text-white mb-2">3. Ajouter des bulles</div>
                      <div className="text-sm">
                        Sélectionnez l'outil Bulle (B) puis cliquez pour placer des dialogues
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="p-4 border-t border-dark-700 bg-dark-900/50">
              <div className="text-center text-gray-400 text-sm">
                Appuyez sur <kbd className="px-1 py-0.5 bg-dark-600 rounded text-xs">F1</kbd> ou 
                <kbd className="px-1 py-0.5 bg-dark-600 rounded text-xs ml-1">?</kbd> pour afficher cette aide
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Hook pour gérer l'ouverture de l'aide avec F1
 */
export function useShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F1' || (event.key === '?' && !event.shiftKey)) {
        event.preventDefault()
        setIsOpen(true)
      }
      
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return {
    isOpen,
    setIsOpen
  }
}

'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Trash2, Square, MessageCircle, Type, Image as ImageIcon, Palette, Move, RotateCw } from 'lucide-react'
import { useCanvasContext } from '../context/CanvasContext'
import { AssemblyElement, DialogueElement, TextElement, PanelElement, ImageElement } from '../types/assembly.types'
import { UnifiedSelectionManager } from '../core/UnifiedSelectionManager'

interface SettingsPanelProps {
  className?: string
}

/**
 * Menu Paramètres unifié qui remplace le menu "Panels"
 * Détecte automatiquement le type d'élément sélectionné et affiche les paramètres appropriés
 */
export default function SettingsPanel({ className = '' }: SettingsPanelProps) {
  const { elements, removeElement, updateElement } = useCanvasContext()
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [selectedElement, setSelectedElement] = useState<AssemblyElement | null>(null)

  // Écouter les changements de sélection via UnifiedSelectionManager
  useEffect(() => {
    const selectionManager = UnifiedSelectionManager.getInstance()

    const unsubscribe = selectionManager.onSelectionChange((selectedIds: string[]) => {
      console.log('🎯 SettingsPanel: Changement de sélection:', selectedIds)

      if (selectedIds.length > 0) {
        const elementId = selectedIds[0] // Mode sélection simple
        const element = elements.find(el => el.id === elementId)

        if (element) {
          setSelectedElementId(elementId)
          setSelectedElement(element)
          console.log('✅ SettingsPanel: Élément trouvé:', element.type, elementId)
        } else {
          console.log('⚠️ SettingsPanel: Élément non trouvé dans la liste:', elementId)
          setSelectedElementId(null)
          setSelectedElement(null)
        }
      } else {
        setSelectedElementId(null)
        setSelectedElement(null)
        console.log('🧹 SettingsPanel: Sélection effacée')
      }
    })

    return unsubscribe
  }, [elements])

  // Fonction de suppression d'élément avec confirmation
  const handleDeleteElement = () => {
    if (selectedElementId && selectedElement) {
      const elementTypeName = getElementTypeName(selectedElement.type)

      if (confirm(`Êtes-vous sûr de vouloir supprimer ce ${elementTypeName.toLowerCase()} ?`)) {
        console.log('🗑️ Suppression confirmée de l\'élément:', selectedElementId)

        // Supprimer l'élément du contexte Canvas
        removeElement(selectedElementId)

        // Désélectionner après suppression via UnifiedSelectionManager
        const selectionManager = UnifiedSelectionManager.getInstance()
        selectionManager.clearSelection()

        console.log('✅ Élément supprimé et désélectionné:', selectedElementId)
      } else {
        console.log('❌ Suppression annulée par l\'utilisateur')
      }
    }
  }

  // Fonction de mise à jour d'élément
  const handleUpdateElement = (updates: Partial<AssemblyElement>) => {
    if (selectedElementId) {
      updateElement(selectedElementId, updates)
    }
  }

  // Rendu selon l'état de sélection
  if (!selectedElement) {
    return (
      <div className={`h-full flex flex-col bg-dark-800 ${className}`}>
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <Settings size={32} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm mb-2">Sélectionner un élément</p>
            <p className="text-gray-600 text-xs">
              Cliquez sur un panel, une bulle ou un texte pour voir ses paramètres
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col bg-dark-800 ${className}`}>
      {/* En-tête avec type d'élément et suppression */}
      <div className="p-4 border-b border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {getElementIcon(selectedElement.type)}
            <div className="ml-2">
              <h3 className="text-white font-medium">
                {getElementTypeName(selectedElement.type)}
              </h3>
              <p className="text-gray-400 text-xs">
                ID: {selectedElement.id.slice(-8)}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDeleteElement}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
            title="Supprimer l'élément"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Contenu des paramètres selon le type */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedElement.type === 'panel' && (
          <PanelSettings 
            element={selectedElement as PanelElement} 
            onUpdate={handleUpdateElement}
          />
        )}
        
        {selectedElement.type === 'dialogue' && (
          <DialogueSettings 
            element={selectedElement as DialogueElement} 
            onUpdate={handleUpdateElement}
          />
        )}
        
        {selectedElement.type === 'text' && (
          <TextSettings 
            element={selectedElement as TextElement} 
            onUpdate={handleUpdateElement}
          />
        )}
        
        {selectedElement.type === 'image' && (
          <ImageSettings 
            element={selectedElement as ImageElement} 
            onUpdate={handleUpdateElement}
          />
        )}
      </div>
    </div>
  )
}

// Fonction pour obtenir l'icône selon le type d'élément
function getElementIcon(type: string) {
  switch (type) {
    case 'panel':
      return <Square size={20} className="text-blue-400" />
    case 'dialogue':
      return <MessageCircle size={20} className="text-green-400" />
    case 'text':
      return <Type size={20} className="text-purple-400" />
    case 'image':
      return <ImageIcon size={20} className="text-orange-400" />
    default:
      return <Settings size={20} className="text-gray-400" />
  }
}

// Fonction pour obtenir le nom du type d'élément
function getElementTypeName(type: string): string {
  switch (type) {
    case 'panel':
      return 'Panel'
    case 'dialogue':
      return 'Bulle de dialogue'
    case 'text':
      return 'Texte libre'
    case 'image':
      return 'Image'
    default:
      return 'Élément'
  }
}

// Composant pour les paramètres de Panel
function PanelSettings({ 
  element, 
  onUpdate 
}: { 
  element: PanelElement
  onUpdate: (updates: Partial<AssemblyElement>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Move size={16} className="mr-2" />
          Position & Taille
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs">X</label>
            <input
              type="number"
              value={Math.round(element.transform.x)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, x: parseInt(e.target.value) || 0 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">Y</label>
            <input
              type="number"
              value={Math.round(element.transform.y)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, y: parseInt(e.target.value) || 0 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">Largeur</label>
            <input
              type="number"
              value={Math.round(element.transform.width)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, width: parseInt(e.target.value) || 1 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">Hauteur</label>
            <input
              type="number"
              value={Math.round(element.transform.height)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, height: parseInt(e.target.value) || 1 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
        </div>
      </div>

      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3 flex items-center">
          <Palette size={16} className="mr-2" />
          Apparence
        </h4>
        
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs">Couleur de fond</label>
            <input
              type="color"
              value={`#${element.panelStyle.backgroundColor.toString(16).padStart(6, '0')}`}
              onChange={(e) => onUpdate({
                panelStyle: { 
                  ...element.panelStyle, 
                  backgroundColor: parseInt(e.target.value.slice(1), 16) 
                }
              })}
              className="w-full h-8 bg-dark-600 rounded"
            />
          </div>
          
          <div>
            <label className="text-gray-400 text-xs">Épaisseur du contour</label>
            <input
              type="range"
              min="0"
              max="10"
              value={element.panelStyle.outlineWidth}
              onChange={(e) => onUpdate({
                panelStyle: { 
                  ...element.panelStyle, 
                  outlineWidth: parseInt(e.target.value) 
                }
              })}
              className="w-full"
            />
            <span className="text-gray-400 text-xs">{element.panelStyle.outlineWidth}px</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour les paramètres de Dialogue
function DialogueSettings({ 
  element, 
  onUpdate 
}: { 
  element: DialogueElement
  onUpdate: (updates: Partial<AssemblyElement>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Contenu</h4>
        <textarea
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full bg-dark-600 text-white text-sm p-2 rounded h-20 resize-none"
          placeholder="Texte de la bulle..."
        />
      </div>

      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Style</h4>
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs">Type de bulle</label>
            <select
              value={element.dialogueStyle.type}
              onChange={(e) => onUpdate({
                dialogueStyle: { 
                  ...element.dialogueStyle, 
                  type: e.target.value as any 
                }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            >
              <option value="speech">Parole</option>
              <option value="thought">Pensée</option>
              <option value="shout">Cri</option>
            </select>
          </div>
          
          <div>
            <label className="text-gray-400 text-xs">Taille de police</label>
            <input
              type="range"
              min="12"
              max="32"
              value={element.dialogueStyle.fontSize}
              onChange={(e) => onUpdate({
                dialogueStyle: { 
                  ...element.dialogueStyle, 
                  fontSize: parseInt(e.target.value) 
                }
              })}
              className="w-full"
            />
            <span className="text-gray-400 text-xs">{element.dialogueStyle.fontSize}px</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour les paramètres de Text
function TextSettings({ 
  element, 
  onUpdate 
}: { 
  element: TextElement
  onUpdate: (updates: Partial<AssemblyElement>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Contenu</h4>
        <textarea
          value={element.text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          className="w-full bg-dark-600 text-white text-sm p-2 rounded h-20 resize-none"
          placeholder="Votre texte..."
        />
      </div>

      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Style</h4>
        <div className="space-y-3">
          <div>
            <label className="text-gray-400 text-xs">Taille de police</label>
            <input
              type="range"
              min="12"
              max="72"
              value={element.textStyle.fontSize}
              onChange={(e) => onUpdate({
                textStyle: { 
                  ...element.textStyle, 
                  fontSize: parseInt(e.target.value) 
                }
              })}
              className="w-full"
            />
            <span className="text-gray-400 text-xs">{element.textStyle.fontSize}px</span>
          </div>
          
          <div>
            <label className="text-gray-400 text-xs">Couleur</label>
            <input
              type="color"
              value={element.textStyle.textColor}
              onChange={(e) => onUpdate({
                textStyle: { 
                  ...element.textStyle, 
                  textColor: e.target.value 
                }
              })}
              className="w-full h-8 bg-dark-600 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Composant pour les paramètres d'Image
function ImageSettings({ 
  element, 
  onUpdate 
}: { 
  element: ImageElement
  onUpdate: (updates: Partial<AssemblyElement>) => void 
}) {
  return (
    <div className="space-y-4">
      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Image</h4>
        <div className="aspect-square bg-dark-600 rounded mb-3 overflow-hidden">
          <img 
            src={element.imageData.src} 
            alt={element.imageData.alt || 'Image'}
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-gray-400 text-xs">
          {element.imageData.originalWidth} × {element.imageData.originalHeight}px
        </p>
      </div>

      <div className="bg-dark-700 rounded-lg p-4">
        <h4 className="text-white font-medium mb-3">Position & Taille</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-gray-400 text-xs">Largeur</label>
            <input
              type="number"
              value={Math.round(element.transform.width)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, width: parseInt(e.target.value) || 1 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs">Hauteur</label>
            <input
              type="number"
              value={Math.round(element.transform.height)}
              onChange={(e) => onUpdate({
                transform: { ...element.transform, height: parseInt(e.target.value) || 1 }
              })}
              className="w-full bg-dark-600 text-white text-sm p-2 rounded"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

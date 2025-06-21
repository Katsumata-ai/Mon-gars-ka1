'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Settings, Trash2, Square, MessageCircle, Type, Image as ImageIcon, Palette, RotateCw } from 'lucide-react'
import { useAssemblyStore } from '../managers/StateManager'
import { useCanvasContext } from '../context/CanvasContext'
import { AssemblyElement, DialogueElement, TextElement, PanelElement, ImageElement } from '../types/assembly.types'

interface SettingsPanelProps {
  className?: string
}

/**
 * Menu Paramètres unifié qui remplace le menu "Panels"
 * Détecte automatiquement le type d'élément sélectionné et affiche les paramètres appropriés
 */
export default function SettingsPanel({ className = '' }: SettingsPanelProps) {
  // ✅ CORRECTION : Utiliser les deux sources de données correctement
  // - Éléments depuis CanvasContext (où ils sont réellement stockés)
  // - Sélection depuis useAssemblyStore (où elle est mise à jour)
  const { elements: canvasElements, removeElement, updateElement } = useCanvasContext()
  const { selectedElementIds, clearSelection } = useAssemblyStore()

  // Calculer les éléments sélectionnés en combinant les deux sources
  const selectedElements = useMemo(() => {
    if (!selectedElementIds || selectedElementIds.length === 0) {
      return []
    }
    return canvasElements.filter(el => selectedElementIds.includes(el.id))
  }, [canvasElements, selectedElementIds])

  // Calculer l'élément sélectionné (mode sélection simple)
  const selectedElement = selectedElements.length > 0 ? selectedElements[0] : null
  const selectedElementId = selectedElement?.id || null

  // Debug pour vérifier la sélection
  useEffect(() => {
    console.log('🎯 SettingsPanel: État de sélection CORRIGÉ:', {
      canvasElementsCount: canvasElements.length,
      selectedElementIds,
      selectedElementsCount: selectedElements.length,
      selectedElement: selectedElement?.type,
      selectedElementId
    })
  }, [canvasElements, selectedElementIds, selectedElements, selectedElement, selectedElementId])

  // Fonction de suppression d'élément avec confirmation
  const handleDeleteElement = () => {
    if (selectedElementId && selectedElement) {
      const elementTypeName = getElementTypeName(selectedElement.type)

      if (confirm(`Êtes-vous sûr de vouloir supprimer ce ${elementTypeName.toLowerCase()} ?`)) {
        console.log('🗑️ Suppression confirmée de l\'élément:', selectedElementId)

        // ✅ CORRECTION : Supprimer l'élément via CanvasContext (où il est stocké)
        removeElement(selectedElementId)

        // Désélectionner après suppression
        clearSelection()

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
      <div className={`h-full flex flex-col bg-dark-800 ${className}`} data-testid="settings-panel">
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
    <div className={`h-full flex flex-col bg-dark-800 ${className}`} data-testid="settings-panel">
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


      {/* Contenu */}
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


      {/* Contenu */}
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


    </div>
  )
}

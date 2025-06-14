'use client'

// TipTapFreeTextLayer - Couche de gestion des textes libres avec TipTap
// Gère la création, l'édition et la manipulation des textes libres

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SimpleFreeText from './SimpleFreeText'
import { TextElement } from '../types/assembly.types'
import { FreeTextTool } from '../tools/FreeTextTool'
import { useCanvasContext } from '../context/CanvasContext'

interface TipTapFreeTextLayerProps {
  className?: string
}

export function TipTapFreeTextLayer({
  className = ''
}: TipTapFreeTextLayerProps) {
  const {
    elements,
    addElement,
    updateElement,
    activeTool,
    setActiveTool
  } = useCanvasContext()

  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [textModes, setTextModes] = useState<Record<string, 'reading' | 'editing' | 'manipulating'>>({})
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [freeTextTool] = useState(() => new FreeTextTool())

  // ✅ FILTRER LES TEXTES LIBRES
  const texts = useMemo(() => {
    return elements.filter((element): element is TextElement =>
      element.type === 'text'
    )
  }, [elements])

  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE CRÉATION DE TEXTE LIBRE
  useEffect(() => {
    const handleCreateFreeText = (event: CustomEvent) => {
      const { x, y } = event.detail
      console.log('🎯 TipTapFreeTextLayer: Création texte libre demandée:', { x, y })

      // Utiliser l'outil pour créer le texte
      freeTextTool.startCreation(x, y)
      const newText = freeTextTool.finishCreation()

      if (newText) {
        // Ajouter le texte au contexte
        addElement(newText)

        // Switch vers select tool
        setActiveTool('select')

        setSelectedTextId(newText.id)
        setEditingTextId(newText.id)

        // ✅ FOCUS AUTOMATIQUE SUR L'ÉDITEUR APRÈS CRÉATION (SimpleFreeText)
        setTimeout(() => {
          const textarea = document.querySelector(`[data-text-id="${newText.id}"] textarea`) as HTMLTextAreaElement
          if (textarea) {
            textarea.focus()
            textarea.select()
            console.log('🎯 TipTapFreeTextLayer: Focus appliqué sur l\'éditeur:', newText.id)
          }
        }, 100) // Moins de temps car SimpleFreeText est plus rapide

        console.log('✅ TipTapFreeTextLayer: Texte libre créé en mode édition:', newText)
      }
    }

    window.addEventListener('createTipTapFreeText', handleCreateFreeText as EventListener)

    return () => {
      window.removeEventListener('createTipTapFreeText', handleCreateFreeText as EventListener)
    }
  }, [freeTextTool, addElement, setActiveTool])

  // ✅ SYNCHRONISATION AVEC LE SYSTÈME DE SÉLECTION GLOBAL DE SIMPLECANVASEDITOR
  useEffect(() => {
    // Écouter les sélections depuis SimpleCanvasEditor
    const handleElementSelection = (event: CustomEvent) => {
      const element = event.detail
      if (element && element.id && element.id.startsWith('text_')) {
        console.log('🎯 TipTapFreeTextLayer: Texte sélectionné via système global:', element.id)
        setSelectedTextId(element.id)
      } else {
        // Autre élément sélectionné ou désélection
        setSelectedTextId(null)
      }
    }

    // Écouter les désélections globales (clic dans le vide)
    const handleGlobalDeselect = () => {
      console.log('🎯 TipTapFreeTextLayer: Désélection globale')
      setSelectedTextId(null)
      setEditingTextId(null)
    }

    // Écouter les changements de mode depuis SimpleCanvasEditor
    const handleTextModeChange = (event: CustomEvent) => {
      const { textId, newMode } = event.detail
      console.log('🎯 TipTapFreeTextLayer: Mode change:', textId, newMode)

      if (newMode === 'reading') {
        setSelectedTextId(null)
        setEditingTextId(null)
      } else if (newMode === 'editing') {
        setEditingTextId(textId)
      }
    }

    window.addEventListener('elementSelected', handleElementSelection as EventListener)
    window.addEventListener('globalDeselect', handleGlobalDeselect as EventListener)
    window.addEventListener('textModeChange', handleTextModeChange as EventListener)

    return () => {
      window.removeEventListener('elementSelected', handleElementSelection as EventListener)
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
      window.removeEventListener('textModeChange', handleTextModeChange as EventListener)
    }
  }, [])

  // ✅ ÉCOUTER LES CLICS SUR LES TEXTES
  useEffect(() => {
    const handleTextClick = (event: CustomEvent) => {
      const { textId } = event.detail
      console.log('🎯 TipTapFreeTextLayer: Texte cliqué:', textId)
      setSelectedTextId(textId)
      setTextModes(prev => ({ ...prev, [textId]: 'manipulating' }))
    }

    const handleTextSelectionChange = (event: CustomEvent) => {
      const { textId, isSelected } = event.detail
      if (isSelected) {
        setSelectedTextId(textId)
      } else if (selectedTextId === textId) {
        setSelectedTextId(null)
      }
    }

    window.addEventListener('textClicked', handleTextClick as EventListener)
    window.addEventListener('textSelectionChange', handleTextSelectionChange as EventListener)

    return () => {
      window.removeEventListener('textClicked', handleTextClick as EventListener)
      window.removeEventListener('textSelectionChange', handleTextSelectionChange as EventListener)
    }
  }, [selectedTextId])

  // ✅ GESTION DES MISES À JOUR DE TEXTE
  const handleTextUpdate = useCallback((id: string, updates: Partial<TextElement>) => {
    updateElement(id, updates)
  }, [updateElement])

  // ✅ GESTION DU DOUBLE-CLIC POUR ÉDITION
  const handleTextDoubleClick = useCallback((id: string) => {
    console.log('🎯 TipTapFreeTextLayer: Double-clic pour édition:', id)
    setTextModes(prev => ({ ...prev, [id]: 'editing' }))
    setEditingTextId(id)
    setSelectedTextId(id)
  }, [])

  // ✅ GESTIONNAIRE DE CHANGEMENT DE MODE
  const handleModeChange = useCallback((textId: string, newMode: 'reading' | 'editing' | 'manipulating') => {
    console.log('🎯 TipTapFreeTextLayer: Mode change:', textId, newMode)

    if (newMode === 'editing') {
      setEditingTextId(textId)
    } else if (newMode === 'reading') {
      setEditingTextId(null)
    }

    // Dispatcher l'événement pour SimpleCanvasEditor
    const modeChangeEvent = new CustomEvent('textModeChangeFromText', {
      detail: { textId, newMode }
    })
    window.dispatchEvent(modeChangeEvent)
  }, [setEditingTextId])

  // ✅ DÉTERMINER LE MODE D'UNE BULLE
  const getTextMode = useCallback((textId: string): 'reading' | 'editing' | 'manipulating' => {
    if (editingTextId === textId) return 'editing'
    if (selectedTextId === textId) return 'manipulating'
    return 'reading'
  }, [editingTextId, selectedTextId])

  // ✅ GESTION DES CLICS EXTÉRIEURS POUR DÉSÉLECTION (géré par SimpleCanvasEditor)
  // Supprimé car la désélection est gérée globalement par SimpleCanvasEditor

  // ✅ NETTOYAGE
  useEffect(() => {
    return () => {
      freeTextTool.destroy()
    }
  }, [freeTextTool])

  return (
    <div 
      className={`tiptap-free-text-layer ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Laisser passer les clics au canvas
        zIndex: 2000 // Entre les panels et les bulles
      }}
    >
      {texts.map(text => {
        const mode = getTextMode(text.id)

        return (
          <SimpleFreeText
            key={text.id} // ✅ PLUS BESOIN DE FORCER RE-RENDU - SimpleFreeText gère le redimensionnement
            element={text}
            mode={mode}
            onUpdate={handleTextUpdate}
            onModeChange={handleModeChange}
            onDoubleClick={handleTextDoubleClick}
            className={selectedTextId === text.id ? 'selected' : ''}
          />
        )
      })}
    </div>
  )
}

export default TipTapFreeTextLayer

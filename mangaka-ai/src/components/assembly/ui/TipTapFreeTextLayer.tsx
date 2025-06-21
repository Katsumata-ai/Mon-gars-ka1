'use client'

// TipTapFreeTextLayer - Couche de gestion des textes libres avec TipTap
// Gère la création, l'édition et la manipulation des textes libres

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import SimpleFreeText from './SimpleFreeText'
import { TextElement } from '../types/assembly.types'
import { FreeTextTool } from '../tools/FreeTextTool'
import { useCanvasContext } from '../context/CanvasContext'
import { useAssemblyStore } from '../managers/StateManager'
import { CanvasTransform } from '../core/CoordinateSystem'
// import { useCanvasTransform, useElementCreation } from '../../../hooks/useCanvasTransform' // 🚨 SUPPRIMÉ - Solution radicale

interface TipTapFreeTextLayerProps {
  canvasTransform: CanvasTransform
  zoomLevel: number
  className?: string
}

export function TipTapFreeTextLayer({
  canvasTransform,
  zoomLevel,
  className = ''
}: TipTapFreeTextLayerProps) {
  const {
    elements,
    addElement,
    updateElement,
    activeTool,
    setActiveTool
  } = useCanvasContext()

  // ✅ CRITIQUE : Accès au StateManager pour la synchronisation (comme les speech bubbles)
  const { addElement: addElementToStateManager, updateElement: updateElementInStateManager } = useAssemblyStore()

  // ✅ CRITIQUE : Wrapper pour synchroniser les mises à jour avec StateManager
  const updateElementWithSync = useCallback((id: string, updates: any) => {
    console.log('🔄 TipTapFreeTextLayer: Mise à jour texte libre avec synchronisation:', id, updates)

    // Mettre à jour dans CanvasContext
    updateElement(id, updates)

    // ✅ SYNCHRONISER avec StateManager pour la sauvegarde
    try {
      updateElementInStateManager(id, updates)
      console.log('✅ Texte libre mise à jour synchronisée avec StateManager:', id)
    } catch (error) {
      console.error('❌ Erreur de synchronisation mise à jour texte libre avec StateManager:', error)
    }
  }, [updateElement, updateElementInStateManager])

  const [selectedTextId, setSelectedTextId] = useState<string | null>(null)
  const [textModes, setTextModes] = useState<Record<string, 'reading' | 'editing' | 'manipulating'>>({})
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [freeTextTool] = useState(() => new FreeTextTool())

  // 🚨 SOLUTION RADICALE : BYPASS COMPLET - Calcul direct et simple
  const canvasScale = zoomLevel / 100
  const panX = canvasTransform.x
  const panY = canvasTransform.y

  console.log('🚨 TipTapFreeTextLayer RADICAL: Valeurs directes', {
    zoomLevel,
    canvasScale,
    panX,
    panY,
    canvasTransformProp: canvasTransform
  })

  // ✅ SUPPRIMÉ : domToCanvas plus nécessaire
  // getHTMLLayerCoordinates fournit maintenant des coordonnées canvas converties

  // ✅ FILTRER LES TEXTES LIBRES
  const texts = useMemo(() => {
    return elements.filter((element): element is TextElement =>
      element.type === 'text'
    )
  }, [elements])

  // 🔍 Debug: Vérifier la synchronisation complète (pan + zoom)
  useEffect(() => {
    console.log('🔍 TipTapFreeTextLayer: Synchronisation complète (pan + zoom)', {
      zoomLevel,
      canvasScale,
      panX: canvasTransform.x,
      panY: canvasTransform.y,
      textsCount: texts.length,
      appliedTransform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasScale})`
    })
  }, [zoomLevel, canvasScale, canvasTransform.x, canvasTransform.y, texts.length])

  // ✅ ÉCOUTER LES ÉVÉNEMENTS DE CRÉATION DE TEXTE LIBRE
  useEffect(() => {
    const handleCreateFreeText = (event: CustomEvent) => {
      const { x, y } = event.detail
      console.log('🎯 TipTapFreeTextLayer: Création texte libre demandée:', { x, y })

      // ✅ CORRECTION ZOOM : Utiliser directement les coordonnées canvas de getHTMLLayerCoordinates
      // Ces coordonnées sont déjà converties pour le zoom, pas besoin de reconversion
      const canvasCoords = { x, y }

      console.log('✅ TipTapFreeTextLayer: Coordonnées canvas directes', {
        canvasCoords,
        zoomLevel,
        canvasScale,
        note: 'Coordonnées déjà converties par getHTMLLayerCoordinates'
      })

      // Utiliser l'outil pour créer le texte avec les coordonnées canvas
      freeTextTool.startCreation(canvasCoords.x, canvasCoords.y)
      const newText = freeTextTool.finishCreation()

      if (newText) {
        // Ajouter le texte au contexte
        addElement(newText)

        // ✅ CRITIQUE : Synchroniser avec StateManager pour la sauvegarde (comme les speech bubbles)
        try {
          addElementToStateManager(newText)
          console.log('✅ Texte libre synchronisé avec StateManager:', newText.id)
        } catch (error) {
          console.error('❌ Erreur de synchronisation texte libre avec StateManager:', error)
        }

        // Switch vers select tool
        setActiveTool('select')

        setSelectedTextId(newText.id)
        setEditingTextId(newText.id)

        // ✅ NOUVEAU : Synchroniser avec le système de sélection global (comme la sélection manuelle)
        // Émettre l'événement elementSelected pour synchroniser avec SimpleCanvasEditor
        const elementSelectedEvent = new CustomEvent('elementSelected', {
          detail: { id: newText.id, type: 'text' }
        })
        window.dispatchEvent(elementSelectedEvent)

        // ✅ NOUVEAU : Créer un CanvasElement virtuel et déclencher onElementClick
        // Ceci va synchroniser avec PolotnoAssemblyApp et useAssemblyStore
        setTimeout(() => {
          const textElement = document.querySelector(`[data-text-id="${newText.id}"]`) as HTMLElement
          if (textElement) {
            const virtualElement = {
              id: newText.id,
              type: 'text',
              x: textElement.offsetLeft,
              y: textElement.offsetTop,
              width: textElement.offsetWidth,
              height: textElement.offsetHeight
            }

            // Déclencher l'événement textClicked pour synchroniser avec SimpleCanvasEditor
            const textClickEvent = new CustomEvent('textClicked', {
              detail: {
                textId: newText.id,
                clientX: 0,
                clientY: 0,
                element: textElement
              }
            })
            window.dispatchEvent(textClickEvent)

            console.log('🎯 TipTapFreeTextLayer: Sélection automatique synchronisée avec le système global:', newText.id)
          }
        }, 50) // Petit délai pour que l'élément DOM soit créé

        // ✅ FOCUS AUTOMATIQUE SUR L'ÉDITEUR APRÈS CRÉATION (SimpleFreeText)
        setTimeout(() => {
          const textarea = document.querySelector(`[data-text-id="${newText.id}"] textarea`) as HTMLTextAreaElement
          if (textarea) {
            textarea.focus()
            textarea.select()
            console.log('🎯 TipTapFreeTextLayer: Focus appliqué sur l\'éditeur:', newText.id)
          }
        }, 100) // Moins de temps car SimpleFreeText est plus rapide

        console.log('✅ TipTapFreeTextLayer: Texte libre créé en mode édition avec synchronisation globale:', newText)
      }
    }

    window.addEventListener('createTipTapFreeText', handleCreateFreeText as EventListener)

    return () => {
      window.removeEventListener('createTipTapFreeText', handleCreateFreeText as EventListener)
    }
  }, [freeTextTool, addElement, addElementToStateManager, setActiveTool, setSelectedTextId, setEditingTextId])

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

    // ✅ NOUVEAU : Écouter les désélections forcées depuis l'outil main
    const handleForceDeselectAll = (event: CustomEvent) => {
      console.log('🖐️ TipTapFreeTextLayer: Désélection forcée reçue:', event.detail)
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
    window.addEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
    window.addEventListener('textModeChange', handleTextModeChange as EventListener)

    return () => {
      window.removeEventListener('elementSelected', handleElementSelection as EventListener)
      window.removeEventListener('globalDeselect', handleGlobalDeselect as EventListener)
      window.removeEventListener('forceDeselectAll', handleForceDeselectAll as EventListener)
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

  // ✅ GESTION DES MISES À JOUR DE TEXTE avec synchronisation StateManager
  const handleTextUpdate = useCallback((id: string, updates: Partial<TextElement>) => {
    updateElementWithSync(id, updates)
  }, [updateElementWithSync])

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
      className={`tiptap-free-text-layer no-scrollbar ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Laisser passer les clics au canvas
        zIndex: 20, // ✅ Z-index réduit pour rester sous les sidebars (z-50)
        overflow: 'hidden', // ✅ ÉLIMINER SCROLLBARS
        // ✅ CORRECTION CRITIQUE : Appliquer la transformation complète comme le canvas
        // Inclure le pan (translate) ET le zoom (scale) pour synchronisation parfaite
        transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasScale})`,
        transformOrigin: 'center',
        // ✅ SUPPRESSION TRANSITION : Pour synchronisation instantanée
        transition: 'none'
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

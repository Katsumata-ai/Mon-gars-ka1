'use client'

// Composant HtmlBubble unifié avec TipTap intégré
// Remplace tous les anciens éditeurs (BubbleTextOverlay, InPlaceTextEditor, etc.)

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { DialogueElement, BubbleType } from '../types/assembly.types'
import { UnifiedCoordinateSystem } from '../core/CoordinateSystem'
import { TipTapPool } from '../core/TipTapPool'
import { LayerManager } from '../core/LayerManager'
import { BubbleManipulationHandler, HandleType } from '../core/BubbleManipulationHandler'
import './HtmlBubble.css'
import HtmlSelectionFrame from './HtmlSelectionFrame'

interface HtmlBubbleProps {
  element: DialogueElement
  coordinateSystem: UnifiedCoordinateSystem
  isSelected: boolean
  onSelect: (bubbleId: string) => void
  onEdit: (bubbleId: string) => void
  onUpdate: (bubbleId: string, updates: Partial<DialogueElement>) => void
  onStartManipulation?: (element: DialogueElement, handleType: HandleType, globalX: number, globalY: number) => void
}

/**
 * Bulle de dialogue HTML avec TipTap intégré
 * Remplace complètement le système PixiJS pour les bulles
 */
export default function HtmlBubble({
  element,
  coordinateSystem,
  isSelected,
  onSelect,
  onEdit,
  onUpdate,
  onStartManipulation
}: HtmlBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const bubbleRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)
  const layerManager = LayerManager.getInstance()

  // ✅ PHASE 2C : Gestionnaire de manipulation HTML
  const manipulationHandlerRef = useRef<BubbleManipulationHandler | null>(null)

  // ✅ CORRECTION SYNCHRONISATION : État local pour les dimensions pendant manipulation
  const [currentDimensions, setCurrentDimensions] = useState({
    x: element.transform.x,
    y: element.transform.y,
    width: element.transform.width,
    height: element.transform.height
  })

  // Synchroniser les dimensions avec l'élément
  useEffect(() => {
    setCurrentDimensions({
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width,
      height: element.transform.height
    })
  }, [element.transform.x, element.transform.y, element.transform.width, element.transform.height])

  // Initialiser le gestionnaire de manipulation avec callback de synchronisation
  if (!manipulationHandlerRef.current) {
    manipulationHandlerRef.current = new BubbleManipulationHandler((elementId, updates) => {
      // ✅ MISE À JOUR IMMÉDIATE des dimensions locales pour synchronisation
      if (updates.transform) {
        setCurrentDimensions(prev => ({
          ...prev,
          ...updates.transform
        }))
      }
      onUpdate(elementId, updates)
    })
  }

  // ✅ TIPTAP INTÉGRÉ AVEC POOL OPTIMISÉ
  const editor = useEditor({
    extensions: [StarterKit],
    content: element.text || 'Cliquez pour éditer...',
    editable: isEditing,
    onUpdate: ({ editor }) => {
      const newText = editor.getHTML()
      onUpdate(element.id, { text: newText })
    },
    onFocus: () => {
      console.log(`📝 Editor focused for bubble: ${element.id}`)
    },
    onBlur: () => {
      console.log(`📝 Editor blurred for bubble: ${element.id}`)
      setIsEditing(false)
    }
  })

  // ✅ CORRECTION BOUCLE INFINIE : Nettoyage sécurisé sans dépendances problématiques
  useEffect(() => {
    return () => {
      // Nettoyage uniquement au démontage du composant
      if (manipulationHandlerRef.current) {
        manipulationHandlerRef.current.destroy()
        manipulationHandlerRef.current = null
      }
    }
  }, []) // ✅ Pas de dépendances pour éviter les boucles

  // ✅ NETTOYAGE ÉDITEUR SÉPARÉ : Gestion spécifique de l'éditeur TipTap
  useEffect(() => {
    if (!editor) return

    return () => {
      // Délai pour éviter les conflits de destruction
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.destroy()
        }
      }, 0)
    }
  }, [editor]) // ✅ Correction : utiliser l'instance editor directement

  // ✅ SOLUTION HTML PURE : Positionnement absolu direct avec synchronisation
  const bubbleStyle = useMemo(() => {
    console.log('🎯 HtmlBubble HTML PUR - Position directe:', {
      elementId: element.id,
      position: { x: currentDimensions.x, y: currentDimensions.y },
      size: { width: currentDimensions.width, height: currentDimensions.height }
    })

    const zIndex = isSelected
      ? layerManager.assignZIndex(element.id, 'DOM_BUBBLES', 'high')
      : layerManager.assignZIndex(element.id, 'DOM_BUBBLES', 'normal')

    return {
      position: 'absolute' as const,
      left: `${currentDimensions.x}px`, // ✅ DIMENSIONS SYNCHRONISÉES
      top: `${currentDimensions.y}px`,  // ✅ DIMENSIONS SYNCHRONISÉES
      width: `${currentDimensions.width}px`,
      height: `${currentDimensions.height}px`,
      zIndex,
      pointerEvents: 'auto' as const,
      cursor: isEditing ? 'text' : 'pointer',
      transform: `rotate(${element.transform.rotation}deg)`,
      opacity: element.transform.alpha,
      transition: isEditing ? 'none' : 'all 0.2s ease-out'
    }
  }, [currentDimensions, coordinateSystem, isSelected, isEditing, layerManager, element.transform.rotation, element.transform.alpha])

  // ✅ FORMES DE BULLES OPTIMISÉES EN CSS
  const getBubbleClasses = useCallback(() => {
    const baseClasses = 'bubble-html-pure flex items-center justify-center p-3 border-2 transition-all duration-200'
    const hoverClasses = isHovered && !isEditing ? 'shadow-lg' : ''
    const editingClasses = isEditing ? 'ring-2 ring-green-500 ring-opacity-50' : ''

    // ✅ FORMES CSS SIMPLES ET EFFICACES POUR MVP
    const shapeClasses = {
      speech: 'rounded-2xl border-gray-800 bg-white shadow-md',
      thought: 'rounded-full border-gray-500 bg-white border-dashed shadow-sm',
      shout: 'rounded-lg border-red-600 bg-yellow-50 shadow-lg border-4',
      whisper: 'rounded-xl border-gray-400 bg-gray-50 shadow-sm',
      explosion: 'rounded-lg border-orange-600 bg-yellow-100 shadow-lg'
    }

    return `${baseClasses} ${shapeClasses[element.bubbleStyle.type]} ${hoverClasses} ${editingClasses}`
  }, [element.bubbleStyle.type, isHovered, isEditing])

  // ✅ GESTION DES ÉVÉNEMENTS - CONNEXION AU SYSTÈME EXISTANT
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      console.log('🎯 HtmlBubble clicked:', element.id)
      onSelect(element.id)
    }
  }, [element.id, isEditing, onSelect])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    onEdit(element.id)
    
    // Focus avec délai pour éviter les conflits
    setTimeout(() => {
      if (editor) {
        editor.commands.focus()
      }
    }, 50)
  }, [element.id, editor, onEdit])

  const handleMouseEnter = useCallback(() => {
    if (!isEditing) {
      setIsHovered(true)
    }
  }, [isEditing])

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
  }, [])

  // ✅ PHASE 2C : Gestionnaires de manipulation
  const handleManipulationStart = useCallback((handleType: HandleType, event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()

    console.log('🔧 Démarrage manipulation HTML:', {
      elementId: element.id,
      handleType: HandleType[handleType],
      position: { clientX: event.clientX, clientY: event.clientY }
    })

    manipulationHandlerRef.current?.startManipulation(
      element,
      handleType,
      event.clientX,
      event.clientY
    )
  }, [element])

  // Gestionnaire pour le déplacement de la bulle entière
  const handleBubbleMouseDown = useCallback((event: React.MouseEvent) => {
    // Seulement si on clique sur la bulle elle-même, pas sur les handles
    if (event.target === event.currentTarget || (event.target as HTMLElement).classList.contains('bubble-text')) {
      handleManipulationStart(HandleType.MOVE, event)
    }
  }, [handleManipulationStart])

  // ✅ GESTION DES RACCOURCIS CLAVIER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing) return
      
      if (e.key === 'Escape') {
        setIsEditing(false)
        if (editor) {
          editor.commands.blur()
        }
      }
    }

    if (isEditing) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isEditing, editor])

  // ✅ STYLES DE TEXTE
  const textStyle = useMemo(() => ({
    fontSize: `${element.bubbleStyle.fontSize}px`,
    fontFamily: element.bubbleStyle.fontFamily,
    color: typeof element.bubbleStyle.textColor === 'string' 
      ? element.bubbleStyle.textColor 
      : `#${element.bubbleStyle.textColor.toString(16).padStart(6, '0')}`,
    textAlign: element.bubbleStyle.textAlign as 'left' | 'center' | 'right',
    lineHeight: 1.2,
    wordBreak: 'break-word' as const
  }), [element.bubbleStyle])

  return (
    <div
      ref={bubbleRef}
      data-bubble-id={element.id}
      data-bubble-type={element.bubbleStyle.type}
      style={bubbleStyle}
      className={getBubbleClasses()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={!isEditing ? handleBubbleMouseDown : undefined}
    >
      {/* ✅ TIPTAP INTÉGRÉ DIRECTEMENT DANS LA BULLE */}
      {isEditing && editor ? (
        <EditorContent 
          ref={editorRef}
          editor={editor}
          className="bubble-editor w-full h-full flex items-center justify-center outline-none"
          style={textStyle}
        />
      ) : (
        <div 
          className="bubble-text w-full h-full flex items-center justify-center"
          style={textStyle}
          dangerouslySetInnerHTML={{ 
            __html: element.text || 'Cliquez pour éditer...' 
          }}
        />
      )}

      {/* ✅ CADRE DE SÉLECTION PARFAITEMENT SYMÉTRIQUE */}
      {isSelected && !isEditing && (
        <div
          className="absolute pointer-events-none"
          style={{
            // ✅ CORRECTION SYNCHRONISATION : Utiliser currentDimensions
            left: '-4px',
            top: '-4px',
            width: `${currentDimensions.width + 8}px`,
            height: `${currentDimensions.height + 8}px`
          }}
        >
          {/* Cadre principal - 4px d'espace uniforme */}
          <div
            className="absolute"
            style={{
              left: '2px',
              top: '2px',
              width: `${currentDimensions.width + 4}px`,
              height: `${currentDimensions.height + 4}px`,
              border: '2px solid #3b82f6',
              borderRadius: '4px',
              backgroundColor: 'transparent'
            }}
          />

          {/* Handles de redimensionnement - PARFAITEMENT SYMÉTRIQUES */}
          {/* Coins - tous positionnés avec left/top pour cohérence */}
          <div
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-nw-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: '-6px',
              top: '-6px',
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.CORNER_NW, e)}
          />
          <div
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-ne-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: `${currentDimensions.width + 4 - 6}px`,
              top: '-6px',
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.CORNER_NE, e)}
          />
          <div
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-sw-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: '-6px',
              top: `${currentDimensions.height + 4 - 6}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.CORNER_SW, e)}
          />
          <div
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 cursor-se-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: `${currentDimensions.width + 4 - 6}px`,
              top: `${currentDimensions.height + 4 - 6}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.CORNER_SE, e)}
          />

          {/* Bords - tous positionnés avec left/top pour cohérence parfaite */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-blue-500 cursor-n-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: `${(currentDimensions.width + 4) / 2 - 6}px`,
              top: '-6px',
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.EDGE_N, e)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-blue-500 cursor-s-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: `${(currentDimensions.width + 4) / 2 - 6}px`,
              top: `${currentDimensions.height + 4 - 6}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.EDGE_S, e)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-blue-500 cursor-w-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: '-6px',
              top: `${(currentDimensions.height + 4) / 2 - 6}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.EDGE_W, e)}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-blue-500 cursor-e-resize pointer-events-auto hover:scale-110 transition-transform"
            style={{
              left: `${currentDimensions.width + 4 - 6}px`,
              top: `${(currentDimensions.height + 4) / 2 - 6}px`,
              borderRadius: '2px'
            }}
            onMouseDown={(e) => handleManipulationStart(HandleType.EDGE_E, e)}
          />
        </div>
      )}
    </div>
  )
}

// ✅ COMPOSANT QUEUE DE BULLE (sera développé dans la prochaine étape)
function BubbleTail({ element, isSelected }: { element: DialogueElement; isSelected: boolean }) {
  // Implémentation de la queue SVG sera ajoutée
  return null
}

// ✅ COMPOSANT HANDLES DE MANIPULATION (sera développé dans la prochaine étape)
function BubbleManipulationHandles({ 
  element, 
  coordinateSystem 
}: { 
  element: DialogueElement; 
  coordinateSystem: UnifiedCoordinateSystem 
}) {
  // Implémentation des handles sera ajoutée
  return null
}

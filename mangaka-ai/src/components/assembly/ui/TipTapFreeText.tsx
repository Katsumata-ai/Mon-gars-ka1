'use client'

// SimpleFreeText - Composant de texte libre SANS TipTap
// Utilise textarea/div simple pour un redimensionnement efficace
// Même police et styles que les bulles, mais redimensionnable

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TextElement } from '../types/assembly.types'
import './TipTapFreeText.css'

interface TipTapFreeTextProps {
  element: TextElement
  mode: 'reading' | 'editing' | 'manipulating'
  onUpdate: (id: string, updates: Partial<TextElement>) => void
  onModeChange?: (id: string, mode: 'reading' | 'editing' | 'manipulating') => void
  onDoubleClick?: (id: string) => void
  className?: string
}

export function TipTapFreeText({
  element,
  mode,
  onUpdate,
  onModeChange,
  onDoubleClick,
  className = ''
}: TipTapFreeTextProps) {
  const textRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  // ✅ CONFIGURATION TIPTAP IDENTIQUE AUX BULLES - RECRÉÉ QUAND FONTSIZE CHANGE
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Tapez votre texte...',
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
    ],
    content: element.text || '',
    editable: mode === 'editing',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap-free-text-editor',
        'data-placeholder': 'Tapez votre texte...',
        // ✅ SUPPRIMÉ : style statique qui ne se met pas à jour - utilise maintenant styles inline directs
      },
    },
    onUpdate: ({ editor }) => {
      const newText = editor.getHTML()
      console.log('📝 TipTapFreeText onUpdate:', element.id, 'New text:', newText)
      onUpdate(element.id, { text: newText })
    },
    onFocus: () => {
      console.log(`📝 TipTapFreeText focused: ${element.id}`)
    },
    onBlur: () => {
      console.log(`📝 TipTapFreeText blurred: ${element.id}`)
      if (mode === 'editing') {
        onModeChange?.(element.id, 'reading')
      }
    }
  }, [element.textStyle.fontSize, element.textStyle.maxWidth, mode]) // ✅ RECRÉER QUAND FONTSIZE/MAXWIDTH CHANGE

  // ✅ SYNCHRONISATION DU CONTENU
  useEffect(() => {
    if (editor && editor.getHTML() !== element.text) {
      editor.commands.setContent(element.text || '', false)
    }
  }, [editor, element.text])

  // ✅ FOCUS AUTOMATIQUE EN MODE ÉDITION
  useEffect(() => {
    if (mode === 'editing' && editor) {
      setTimeout(() => {
        editor.commands.focus()
        console.log('🎯 TipTapFreeText: Focus appliqué sur l\'éditeur:', element.id)
      }, 100)
    }
  }, [mode, editor, element.id])

  // ✅ SUPPRIMÉ : L'événement personnalisé qui créait des conflits

  // ✅ NOUVEAU : Mettre à jour TOUS les styles quand fontSize/maxWidth changent
  useEffect(() => {
    const container = document.querySelector(`[data-text-id="${element.id}"]`) as HTMLElement
    if (container) {
      // Mettre à jour le conteneur
      container.style.width = `${element.textStyle.maxWidth}px`
      container.style.height = `${Math.max(element.textStyle.fontSize * 1.5, 30)}px`

      // Mettre à jour TOUS les éléments de texte dans le conteneur
      const allTextElements = container.querySelectorAll('*')
      allTextElements.forEach(el => {
        const textEl = el as HTMLElement
        textEl.style.fontSize = `${Math.max(element.textStyle.fontSize, 12)}px !important`
        textEl.style.lineHeight = '1.3 !important'
      })

      // Mettre à jour spécifiquement l'éditeur TipTap
      if (editor) {
        const editorElement = editor.view.dom as HTMLElement
        if (editorElement) {
          editorElement.style.fontSize = `${Math.max(element.textStyle.fontSize, 12)}px !important`
          editorElement.style.lineHeight = '1.3 !important'
        }
      }

      console.log('🎯 TipTapFreeText: Mise à jour complète des styles:', {
        fontSize: element.textStyle.fontSize,
        maxWidth: element.textStyle.maxWidth,
        containerWidth: container.style.width,
        containerHeight: container.style.height
      })
    }
  }, [editor, element.textStyle.fontSize, element.textStyle.maxWidth, element.id])

  // ✅ SUPPRIMÉ : Le useEffect qui forçait les dimensions et créait des conflits

  // ✅ NOUVEAU : Enregistrer le texte dans SimpleCanvasEditor pour la détection
  useEffect(() => {
    if (textRef.current) {
      const bounds = textRef.current.getBoundingClientRect()
      const registerEvent = new CustomEvent('registerTipTapText', {
        detail: {
          textId: element.id,
          element: textRef.current,
          bounds: bounds
        }
      })
      window.dispatchEvent(registerEvent)
      console.log('📝 TipTapFreeText enregistré:', element.id)

      // Cleanup au démontage
      return () => {
        const unregisterEvent = new CustomEvent('unregisterTipTapText', {
          detail: { textId: element.id }
        })
        window.dispatchEvent(unregisterEvent)
        console.log('🗑️ TipTapFreeText désenregistré:', element.id)
      }
    }
  }, [element.id])

  // ✅ GESTION DU CLIC POUR SÉLECTION (sans drag - géré par TextSelectionOverlay)
  const handleTextMouseDown = useCallback((event: React.MouseEvent) => {
    if (mode === 'editing') return // Pas de clic en mode édition

    event.preventDefault()
    event.stopPropagation()

    // ✅ SÉLECTIONNER LE TEXTE (même système que les bulles)
    const textClickEvent = new CustomEvent('textClicked', {
      detail: {
        textId: element.id,
        clientX: event.clientX,
        clientY: event.clientY,
        element: textRef.current
      }
    })
    window.dispatchEvent(textClickEvent)

    // ✅ ÉMETTRE ÉVÉNEMENT DE SÉLECTION
    const selectionEvent = new CustomEvent('textSelectionChange', {
      detail: {
        textId: element.id,
        isSelected: true
      }
    })
    window.dispatchEvent(selectionEvent)

    console.log('🎯 TipTapFreeText: Texte sélectionné:', element.id)
  }, [mode, element.id])

  const handleTextDoubleClick = useCallback((event: React.MouseEvent) => {
    if (mode !== 'reading') return

    event.stopPropagation()
    console.log('🎯 TipTapFreeText: Double-click pour édition:', element.id)

    // Passer en mode édition
    onModeChange?.(element.id, 'editing')
    onDoubleClick?.(element.id)
  }, [mode, element.id, onDoubleClick, onModeChange])

  // ✅ SUPPRIMÉ : Drag global - géré par TextSelectionOverlay comme les bulles
  // Le drag est maintenant géré par le système de sélection unifié

  // ✅ STYLES DYNAMIQUES - CONTENEUR AVEC DIMENSIONS FIXES (PAS D'AUTO-RESIZE)
  const containerStyle = {
    position: 'absolute' as const,
    left: `${element.transform.x}px`,
    top: `${element.transform.y}px`,
    // ✅ DIMENSIONS FIXES - PAS D'AUTO-ADAPTATION AU CONTENU
    width: `${element.textStyle.maxWidth}px`,
    height: `${Math.max(element.textStyle.fontSize * 1.5, 30)}px`, // Hauteur basée sur fontSize
    minWidth: '50px',
    minHeight: '20px',
    zIndex: 2000, // Au-dessus des panels mais sous les bulles
    pointerEvents: 'auto' as const,
    cursor: mode === 'editing' ? 'text' : 'grab',
    background: 'transparent',
    // ✅ CADRE VISIBLE EN MODE ÉDITION
    border: mode === 'editing' ? '2px dashed #3b82f6' : 'none',
    borderRadius: mode === 'editing' ? '4px' : '0',
    boxShadow: mode === 'editing' ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : 'none',
    // ✅ PADDING EN MODE ÉDITION POUR LE CADRE
    padding: mode === 'editing' ? '4px' : '0',
    // ✅ EMPÊCHER LE DÉBORDEMENT
    overflow: 'hidden'
  }

  const textStyle = {
    width: '100%',
    height: 'auto', // Hauteur automatique
    fontSize: `${Math.max(element.textStyle.fontSize, 12)}px !important`, // Utilise la fontSize dynamique avec !important
    fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif !important',
    fontWeight: '700 !important',
    color: '#000000 !important',
    textAlign: element.textStyle.textAlign as 'left' | 'center' | 'right',
    textShadow: '0 0 1px rgba(255, 255, 255, 0.8)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    lineHeight: '1.3 !important',
    // ✅ RETOUR À LA LIGNE AUTOMATIQUE
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const
  }

  return (
    <div
      style={containerStyle}
      className={`tiptap-free-text ${className}`}
      data-text-id={element.id}
      data-text-mode={mode}
    >
      {/* ✅ RENDU CONDITIONNEL SELON LE MODE */}
      {mode === 'editing' && editor ? (
        <EditorContent
          ref={editorRef}
          editor={editor}
          className="tiptap-free-text-editor w-full h-full outline-none"
          style={{
            width: '100%',
            height: 'auto',
            fontSize: `${Math.max(element.textStyle.fontSize, 12)}px`, // ✅ STYLE INLINE DIRECT COMME LES BULLES
            fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
            fontWeight: '700',
            color: '#000000',
            textAlign: element.textStyle.textAlign as 'left' | 'center' | 'right',
            textShadow: '0 0 1px rgba(255, 255, 255, 0.8)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            lineHeight: '1.3',
            wordWrap: 'break-word' as const,
            overflowWrap: 'break-word' as const,
            whiteSpace: 'pre-wrap' as const
          }}
        />
      ) : (
        <div
          ref={textRef}
          className="tiptap-free-text-content w-full h-full"
          onMouseDown={handleTextMouseDown}
          onDoubleClick={handleTextDoubleClick}
          style={{
            width: '100%',
            height: 'auto',
            fontSize: `${Math.max(element.textStyle.fontSize, 12)}px`, // ✅ STYLE INLINE DIRECT COMME LES BULLES
            fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
            fontWeight: '700',
            color: '#000000',
            textAlign: element.textStyle.textAlign as 'left' | 'center' | 'right',
            textShadow: '0 0 1px rgba(255, 255, 255, 0.8)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            lineHeight: '1.3',
            wordWrap: 'break-word' as const,
            overflowWrap: 'break-word' as const,
            whiteSpace: 'pre-wrap' as const
          }}
          dangerouslySetInnerHTML={{
            __html: `<div style="
              color: #000000 !important;
              font-family: 'Comic Sans MS', 'Bangers', 'Roboto', system-ui, sans-serif !important;
              font-weight: 700 !important;
              font-size: ${Math.max(element.textStyle.fontSize, 12)}px !important;
              line-height: 1.3 !important;
              text-shadow: 0 0 1px rgba(255, 255, 255, 0.8);
              background: transparent;
              border: none;
              outline: none;
              width: 100%;
              height: auto;
              word-wrap: break-word;
              overflow-wrap: break-word;
              white-space: pre-wrap;
              text-align: ${element.textStyle.textAlign};
            ">${element.text || `<span style="color: #999999; font-style: italic; font-size: ${Math.max(element.textStyle.fontSize * 0.9, 12)}px;">Tapez votre texte...</span>`}</div>`
          }}
        />
      )}
    </div>
  )
}

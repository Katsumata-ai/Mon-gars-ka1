'use client'

// TipTapBubble - Système de speech bubbles avec manipulation complète
// Architecture: TipTap + système de manipulation identique aux panels

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { DialogueElement } from '../types/assembly.types'
import { usePolotnoContext } from '../context/PolotnoContext'
// ✅ NOUVEAU : Système graphique unifié (bulle + queue intégrées)
import UnifiedBubbleShape from './UnifiedBubbleShape'

// Types pour les modes UX
export type BubbleMode = 'reading' | 'editing' | 'manipulating'

interface TipTapBubbleProps {
  element: DialogueElement
  isSelected: boolean
  mode: BubbleMode
  onUpdate: (bubbleId: string, updates: Partial<DialogueElement>) => void
  onDoubleClick?: (bubbleId: string) => void
  onModeChange?: (bubbleId: string, newMode: BubbleMode) => void
  // ✅ NOUVEAU : onModeChange pour gérer les transitions de modes
}

/**
 * Nouveau système de speech bubbles basé sur TipTap
 * Trois modes UX distincts : lecture, édition, manipulation
 */
export default function TipTapBubble({
  element,
  mode,
  onUpdate,
  onDoubleClick,
  onModeChange
}: TipTapBubbleProps) {
  const bubbleRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<any>(null)

  // ✅ NOUVEAU : Obtenir l'outil actif pour empêcher les interactions avec l'outil main
  const { activeTool } = usePolotnoContext()

  // ✅ ÉTAT POUR LE DRAG AVEC DÉLAI
  const [dragTimeout, setDragTimeout] = useState<NodeJS.Timeout | null>(null)

  // ✅ LOG DES CHANGEMENTS DE MODE
  useEffect(() => {
    console.log('🔍 TipTapBubble: Changement de mode pour', element.id, '→', mode)
  }, [mode, element.id])

  // ✅ NETTOYAGE DU TIMEOUT AU DÉMONTAGE
  useEffect(() => {
    return () => {
      if (dragTimeout) {
        clearTimeout(dragTimeout)
      }
    }
  }, [dragTimeout])

  // ✅ SUPPRIMÉ : contentSize - Plus de redimensionnement automatique

  // ✅ TIPTAP COMME CŒUR DU SYSTÈME
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configuration optimisée pour les speech bubbles
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        listItem: false,
        orderedList: false,
        bulletList: false,
      }),
      Placeholder.configure({
        placeholder: 'Tapez votre texte...',
        emptyEditorClass: 'is-editor-empty',
        emptyNodeClass: 'is-empty',
        showOnlyWhenEditable: true,
        showOnlyCurrent: true, // ✅ CORRIGÉ : Afficher seulement sur le nœud actuel
        includeChildren: false, // ✅ NOUVEAU : Ne pas inclure les enfants
      }),
    ],
    content: element.text || '',
    editable: mode === 'editing',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap-bubble-editor',
        'data-placeholder': 'Tapez votre texte...', // ✅ PLACEHOLDER ATTRIBUT
        style: `
          outline: none;
          border: none;
          padding: 8px;
          margin: 0;
          width: 100%;
          height: 100%;
          color: #000000 !important;
          font-family: 'Comic Sans MS', 'Bangers', 'Roboto', system-ui, sans-serif !important;
          font-weight: 700 !important;
          font-size: 20px !important;
          line-height: 1.3 !important;
          text-shadow: 0 0 1px rgba(255, 255, 255, 0.8);
          letter-spacing: 0.02em;
        `
      },
    },
    onUpdate: ({ editor }) => {
      // ✅ CORRECTION : Utiliser getText() au lieu de getHTML() pour éviter les balises HTML
      const newText = editor.getText()
      console.log('📝 TipTap onUpdate:', element.id, 'New text (sans HTML):', newText)
      onUpdate(element.id, { text: newText })

      // ✅ SUPPRIMÉ : Auto-redimensionnement selon le contenu
    },
    onFocus: () => {
      console.log(`📝 TipTap focused for bubble: ${element.id}`)
    },
    onBlur: () => {
      console.log(`📝 TipTap blurred for bubble: ${element.id}`)
      if (mode === 'editing') {
        // Délai pour permettre le clic sur autre chose
        setTimeout(() => {
          onModeChange?.(element.id, 'reading')
          // Dispatcher l'événement pour SimpleCanvasEditor
          const modeChangeEvent = new CustomEvent('bubbleModeChangeFromBubble', {
            detail: { bubbleId: element.id, newMode: 'reading' }
          })
          window.dispatchEvent(modeChangeEvent)
        }, 100)
      }
    },
  })

  // ✅ SUPPRIMÉ : measureContent - Plus de redimensionnement automatique basé sur le texte

  // ✅ SYNCHRONISATION DU CONTENU TIPTAP
  useEffect(() => {
    if (editor && element.text !== editor.getHTML()) {
      // Mettre à jour le contenu de l'éditeur si element.text a changé
      editor.commands.setContent(element.text || '', false)
      console.log('🔄 TipTap content synchronized:', element.id, element.text)
    }
  }, [editor, element.text])

  // ✅ NOUVEAU : Forcer la mise à jour de l'éditabilité
  useEffect(() => {
    if (editor) {
      editor.setEditable(mode === 'editing')
      console.log('🔄 TipTap editable state updated:', element.id, mode === 'editing')
    }
  }, [editor, mode, element.id])

  // ✅ NOUVEAU : Mettre à jour les styles de police dynamiquement
  useEffect(() => {
    const fontSize = Math.max(element.dialogueStyle.fontSize, 12)

    // Mettre à jour les styles CSS globaux pour cette bulle spécifique
    const styleId = `bubble-font-${element.id}`
    let style = document.getElementById(styleId) as HTMLStyleElement

    if (!style) {
      style = document.createElement('style')
      style.id = styleId
      document.head.appendChild(style)
    }

    style.textContent = `
      [data-bubble-id="${element.id}"] .tiptap-bubble-text,
      [data-bubble-id="${element.id}"] .tiptap-bubble-text *,
      [data-bubble-id="${element.id}"] .tiptap-bubble-editor,
      [data-bubble-id="${element.id}"] .tiptap-bubble-editor *,
      [data-bubble-id="${element.id}"] .ProseMirror,
      [data-bubble-id="${element.id}"] .ProseMirror * {
        font-size: ${fontSize}px !important;
      }
    `

    // Nettoyer le style quand le composant est démonté
    return () => {
      const styleToRemove = document.getElementById(styleId)
      if (styleToRemove) {
        styleToRemove.remove()
      }
    }
  }, [element.dialogueStyle.fontSize, element.id])



  // ✅ DEBUG : Vérifier l'état de l'éditeur
  useEffect(() => {
    if (editor) {
      console.log('🔍 TipTap editor state:', {
        id: element.id,
        mode,
        isEditable: editor.isEditable,
        isFocused: editor.isFocused,
        content: editor.getHTML()
      })
    }
  }, [editor, mode, element.id])

  // ✅ FOCUS AUTOMATIQUE EN MODE ÉDITION
  useEffect(() => {
    console.log('🔍 TipTapBubble: Vérification focus automatique pour', element.id, {
      mode,
      editorExists: !!editor,
      shouldFocus: mode === 'editing' && editor
    })

    if (mode === 'editing' && editor) {
      // Focus sur l'éditeur quand on passe en mode édition
      console.log('📝 TipTapBubble: Tentative de focus automatique pour:', element.id)
      setTimeout(() => {
        editor.commands.focus()
        console.log('✅ TipTapBubble: Focus automatique appliqué pour:', element.id)

        // Vérifier que le focus a bien été appliqué
        setTimeout(() => {
          console.log('🔍 TipTapBubble: Vérification post-focus:', {
            bubbleId: element.id,
            isFocused: editor.isFocused,
            isEditable: editor.isEditable
          })
        }, 50)
      }, 100)
    }
  }, [mode, editor, element.id])

  // ✅ GESTION DES RACCOURCIS CLAVIER
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === 'editing' && e.key === 'Escape') {
        e.preventDefault()
        console.log('🎯 TipTapBubble: Escape pressed, exiting edit mode')
        onModeChange?.(element.id, 'reading')
        // Dispatcher l'événement pour SimpleCanvasEditor
        const modeChangeEvent = new CustomEvent('bubbleModeChangeFromBubble', {
          detail: { bubbleId: element.id, newMode: 'reading' }
        })
        window.dispatchEvent(modeChangeEvent)
      }
    }

    if (mode === 'editing') {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mode, element.id, onModeChange])

  // ✅ SUPPRIMÉ : Le positionnement est maintenant géré par TipTapBubbleManipulator

  // ✅ SUPPRIMÉ : getBubbleClasses - Le style est maintenant géré par UnifiedBubbleShape

  // ✅ SUPPRIMÉ : textStyle et forceBlackTextStyle - Styles intégrés directement dans le div

  // ✅ NOUVEAU : Écouter les événements de changement de mode
  useEffect(() => {
    const handleModeChange = (event: CustomEvent) => {
      const { bubbleId, newMode } = event.detail
      if (bubbleId === element.id) {
        console.log('🎯 TipTapBubble: Mode change reçu:', bubbleId, newMode)
        onModeChange?.(bubbleId, newMode)

        // Si passage en mode édition, focus sur l'éditeur
        if (newMode === 'editing' && editor) {
          setTimeout(() => {
            editor.commands.focus()
            console.log('🎯 TipTapBubble: Focus sur éditeur:', bubbleId)
          }, 100)
        }
      }
    }

    window.addEventListener('bubbleModeChange', handleModeChange as EventListener)

    return () => {
      window.removeEventListener('bubbleModeChange', handleModeChange as EventListener)
    }
  }, [element.id, editor, onModeChange])

  // ✅ NOUVEAU : Enregistrer la bulle dans SimpleCanvasEditor pour la détection
  useEffect(() => {
    if (bubbleRef.current) {
      const bounds = bubbleRef.current.getBoundingClientRect()
      const registerEvent = new CustomEvent('registerTipTapBubble', {
        detail: {
          bubbleId: element.id,
          element: bubbleRef.current,
          bounds: bounds
        }
      })
      window.dispatchEvent(registerEvent)
      console.log('📝 TipTapBubble enregistré:', element.id)

      // Cleanup au démontage
      return () => {
        const unregisterEvent = new CustomEvent('unregisterTipTapBubble', {
          detail: { bubbleId: element.id }
        })
        window.dispatchEvent(unregisterEvent)
        console.log('🗑️ TipTapBubble désenregistré:', element.id)
      }
    }
  }, [element.id])

  // ✅ NOUVEAU : Mettre à jour les bounds quand la position change
  useEffect(() => {
    if (bubbleRef.current) {
      const bounds = bubbleRef.current.getBoundingClientRect()
      const updateEvent = new CustomEvent('updateTipTapBubbleBounds', {
        detail: {
          bubbleId: element.id,
          bounds: bounds
        }
      })
      window.dispatchEvent(updateEvent)
    }
  }, [element.transform.x, element.transform.y, element.transform.width, element.transform.height])

  // ✅ SUPPRIMÉ : Mesure automatique du contenu - Plus de redimensionnement automatique

  // ✅ NOUVEAU : Drag comme les panels (seulement au mouvement)
  const [isDragging, setIsDragging] = useState(false)
  const [dragState, setDragState] = useState<{
    isDragging: boolean
    startX: number
    startY: number
    startElementX: number
    startElementY: number
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0
  })

  // ✅ ENHANCED QUEUE SYSTEM
  const handleQueueUpdate = useCallback((queueConfig: any) => {
    onUpdate(element.id, {
      dialogueStyle: {
        ...element.dialogueStyle,
        queue: queueConfig
      }
    })
  }, [element.id, element.dialogueStyle, onUpdate])

  const handleBubbleMouseDown = useCallback((event: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      console.log('🖐️ TipTapBubble: Outil main actif - aucune interaction bulle')
      return // Pas d'interaction avec les bulles
    }

    if (mode === 'editing') return // Pas de drag en mode édition

    event.preventDefault()
    event.stopPropagation()

    console.log('🔍 TipTapBubble: MouseDown détecté pour', element.id, 'mode actuel:', mode)

    // ✅ SÉLECTIONNER LA BULLE D'ABORD pour synchroniser le cadre
    const bubbleClickEvent = new CustomEvent('bubbleClicked', {
      detail: {
        bubbleId: element.id,
        clientX: event.clientX,
        clientY: event.clientY,
        element: bubbleRef.current
      }
    })
    window.dispatchEvent(bubbleClickEvent)

    // ✅ ÉMETTRE ÉVÉNEMENT DE SÉLECTION
    const selectionEvent = new CustomEvent('bubbleSelectionChange', {
      detail: {
        bubbleId: element.id,
        isSelected: true
      }
    })
    window.dispatchEvent(selectionEvent)

    // ✅ NOUVEAU : Préparer le drag mais ne pas l'activer (comme les panels/textes)
    setDragState({
      isDragging: false,
      startX: event.clientX,
      startY: event.clientY,
      startElementX: element.transform.x,
      startElementY: element.transform.y
    })

    console.log('🔍 TipTapBubble: MouseDown préparé pour', element.id)
  }, [mode, element.id, element.transform.x, element.transform.y, activeTool])

  const handleBubbleDoubleClick = useCallback((event: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      console.log('🖐️ TipTapBubble: Outil main actif - aucun double-clic bulle')
      return // Pas d'interaction avec les bulles
    }

    console.log('🔍 TipTapBubble: Double-click détecté!', {
      bubbleId: element.id,
      currentMode: mode,
      canEdit: mode === 'reading' || mode === 'manipulating',
      onDoubleClickExists: !!onDoubleClick,
      event: event.type
    })

    // ✅ PERMETTRE LE DOUBLE-CLIC EN MODE READING OU MANIPULATING
    if (mode !== 'reading' && mode !== 'manipulating') {
      console.log('❌ TipTapBubble: Double-click ignoré - mode incorrect:', mode, '(doit être "reading" ou "manipulating")')
      return
    }

    event.stopPropagation()
    console.log('✅ TipTapBubble: Double-click traité, appel onDoubleClick pour:', element.id)

    if (onDoubleClick) {
      onDoubleClick(element.id)
      console.log('✅ TipTapBubble: onDoubleClick appelé avec succès')
    } else {
      console.error('❌ TipTapBubble: onDoubleClick est undefined!')
    }
  }, [mode, element.id, onDoubleClick, activeTool])

  // ✅ GESTION DU DRAG GLOBAL SIMPLIFIÉ (comme les textes)
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Commencer le drag seulement si on a bougé de plus de 5 pixels
      if (!dragState.isDragging) {
        const deltaX = Math.abs(event.clientX - dragState.startX)
        const deltaY = Math.abs(event.clientY - dragState.startY)

        if (deltaX > 5 || deltaY > 5) {
          setDragState(prev => ({ ...prev, isDragging: true }))
          setIsDragging(true)
          onModeChange?.(element.id, 'manipulating')
          console.log('🎯 TipTapBubble: Drag start:', element.id)
        }
        return
      }

      // Continuer le drag
      const deltaX = event.clientX - dragState.startX
      const deltaY = event.clientY - dragState.startY

      const newX = dragState.startElementX + deltaX
      const newY = dragState.startElementY + deltaY

      onUpdate(element.id, {
        transform: {
          ...element.transform,
          x: newX,
          y: newY
        }
      })

      // ✅ NOTIFIER LE SYSTÈME DE SÉLECTION DU CHANGEMENT DE POSITION
      const updateEvent = new CustomEvent('bubblePositionUpdate', {
        detail: {
          bubbleId: element.id,
          x: newX,
          y: newY
        }
      })
      window.dispatchEvent(updateEvent)
    }

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        setIsDragging(false)
        console.log('🎯 TipTapBubble: Drag terminé:', element.id)
      }

      setDragState({
        isDragging: false,
        startX: 0,
        startY: 0,
        startElementX: 0,
        startElementY: 0
      })
    }

    // Écouter les événements globaux seulement si on a commencé un mousedown
    if (dragState.startX !== 0 || dragState.startY !== 0) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragState, element.id, element.transform, onUpdate, onModeChange])

  // ✅ FORCER LES STYLES CSS GLOBAUX + JAVASCRIPT POUR LA COULEUR
  useEffect(() => {
    const styleId = 'force-bubble-text-color'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        /* ✅ STYLES OPTIMISÉS POUR COMICS - ULTRA AGRESSIF */
        .tiptap-bubble-text, .tiptap-bubble-text *,
        .tiptap-bubble-text p, .tiptap-bubble-text span,
        .tiptap-bubble-editor, .tiptap-bubble-editor *,
        .ProseMirror, .ProseMirror *, .ProseMirror p {
          color: #000000 !important;
          font-family: 'Comic Sans MS', 'Bangers', 'Roboto', system-ui, sans-serif !important;
          font-weight: 700 !important;
          font-size: 20px !important;
          line-height: 1.3 !important;
          text-shadow: 0 0 1px rgba(255, 255, 255, 0.8) !important;
          caret-color: #000000 !important;
        }

        /* Styles spécifiques par type */
        [data-bubble-type="shout"] .tiptap-bubble-text,
        [data-bubble-type="shout"] .tiptap-bubble-text *,
        [data-bubble-type="shout"] .ProseMirror * {
          font-weight: 900 !important;
          font-size: 22px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          text-shadow: 0 0 2px rgba(255, 255, 255, 0.9) !important;
        }

        [data-bubble-type="thought"] .tiptap-bubble-text,
        [data-bubble-type="thought"] .tiptap-bubble-text *,
        [data-bubble-type="thought"] .ProseMirror * {
          font-style: italic !important;
          font-weight: 600 !important;
          font-size: 19px !important;
        }

        [data-bubble-type="whisper"] .tiptap-bubble-text,
        [data-bubble-type="whisper"] .tiptap-bubble-text *,
        [data-bubble-type="whisper"] .ProseMirror * {
          font-size: 18px !important;
          font-weight: 600 !important;
          opacity: 0.9 !important;
        }

        /* ✅ OVERRIDE TAILWIND ET AUTRES CSS - ULTRA AGRESSIF */
        [data-bubble-id] *,
        [data-bubble-id] p,
        [data-bubble-id] span,
        [data-bubble-id] div,
        .tiptap-bubble-text p,
        .tiptap-bubble-text span,
        .tiptap-bubble-text div {
          color: #000000 !important;
        }

        /* ✅ OVERRIDE SPÉCIFIQUE POUR BODY COLOR */
        body .tiptap-bubble-text *,
        body [data-bubble-id] * {
          color: #000000 !important;
        }

        /* ✅ CURSEURS PAR MODE */
        .bubble-reading-mode { cursor: pointer !important; }
        .bubble-manipulation-mode { cursor: grab !important; }
        .bubble-dragging { cursor: grabbing !important; }
        .bubble-editing-mode { cursor: text !important; }
      `
      document.head.appendChild(style)
    }

    // ✅ JAVASCRIPT FORCE BRUTE POUR COULEUR
    const forceBlackText = () => {
      const bubbleTexts = document.querySelectorAll('.tiptap-bubble-text, [data-bubble-id]')
      bubbleTexts.forEach(element => {
        const allElements = element.querySelectorAll('*')
        allElements.forEach(el => {
          if (el instanceof HTMLElement) {
            el.style.color = '#000000'
          }
        })
        if (element instanceof HTMLElement) {
          element.style.color = '#000000'
        }
      })
    }

    // Forcer immédiatement
    forceBlackText()

    // Forcer toutes les 100ms pour s'assurer
    const interval = setInterval(forceBlackText, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      {/* ✅ SUPPRIMÉ : styled-jsx qui causait des problèmes de couleur */}

      <div
        data-bubble-id={element.id}
        style={{
          position: 'absolute',
          left: element.transform.x,
          top: element.transform.y,
          width: element.transform.width,
          height: element.transform.height,
          zIndex: 3000, // ✅ FORCÉ : Bulles toujours au-dessus de tout (panels ~100-500)
          pointerEvents: 'auto' // ✅ PERMETTRE LES CLICS
        }}
      >
      {/* ✅ SYSTÈME GRAPHIQUE UNIFIÉ - Bulle + Queue intégrées comme une seule forme */}
      <UnifiedBubbleShape
        width={element.transform.width}
        height={element.transform.height}
        queueConfig={element.dialogueStyle.queue || {
          angle: element.dialogueStyle.tailAngleDegrees || 225,
          length: element.dialogueStyle.tailLength || 40,
          thickness: 16,
          style: 'triangle',
          seamlessConnection: true,
          isManipulating: false,
          showHandles: false,
          snapToCardinal: false,
          curvature: 0.3,
          tapering: 0.8
        }}
        isSelected={mode === 'manipulating'}
        onQueueUpdate={handleQueueUpdate}
        bubbleStyle={element.dialogueStyle}
        bubbleId={element.id}
      />

      {/* Contenu de la bulle - Rendu au-dessus de la forme SVG unifiée */}
      <div
        ref={bubbleRef}
        data-bubble-id={element.id}
        data-bubble-type={element.dialogueStyle.type}
        data-bubble-mode={mode}
        className={`tiptap-bubble-content bubble-${mode}-mode ${isDragging ? 'bubble-dragging' : ''}`}
        // ✅ SUPPRIMÉ : onMouseEnter/Leave - pas d'animations de survol
        onMouseDown={handleBubbleMouseDown}
        onDoubleClick={handleBubbleDoubleClick}
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          zIndex: 2, // Au-dessus de la forme SVG
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          // ✅ PAS DE BACKGROUND - La forme est rendue par UnifiedBubbleShape
          background: 'transparent',
          border: 'none',
          // ✅ STYLES DE TEXTE OPTIMISÉS POUR COMICS
          fontSize: `${Math.max(element.dialogueStyle.fontSize, 20)}px`, // Minimum 20px
          fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
          fontWeight: '700',
          color: '#000000',
          textAlign: element.dialogueStyle.textAlign as any,
          textShadow: '0 0 1px rgba(255, 255, 255, 0.8)'
          // ✅ CURSOR géré par les classes CSS
        }}
      >
        {/* ✅ RENDU CONDITIONNEL SELON LE MODE */}
        {mode === 'editing' && editor ? (
          <EditorContent
            ref={editorRef}
            editor={editor}
            className="tiptap-bubble-editor w-full h-full flex items-center justify-center outline-none p-2"
            style={{
              fontSize: `${Math.max(element.dialogueStyle.fontSize, 20)}px`,
              fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
              fontWeight: element.dialogueStyle.type === 'shout' ? '900' :
                         element.dialogueStyle.type === 'thought' ? '600' : '700',
              color: '#000000',
              textAlign: element.dialogueStyle.textAlign as 'left' | 'center' | 'right',
              lineHeight: 1.3,
              wordBreak: 'break-word' as const,
              letterSpacing: element.dialogueStyle.type === 'shout' ? '0.05em' : '0.02em',
              textTransform: element.dialogueStyle.type === 'shout' ? 'uppercase' as const : 'none',
              fontStyle: element.dialogueStyle.type === 'thought' ? 'italic' : 'normal',
              textShadow: element.dialogueStyle.type === 'shout' ?
                         '0 0 2px rgba(255, 255, 255, 0.9)' : '0 0 1px rgba(255, 255, 255, 0.8)',
              maxWidth: '100%',
              maxHeight: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
          />
        ) : (
          <div
            className="tiptap-bubble-text w-full h-full flex items-center justify-center p-2"
            style={{
              fontSize: `${Math.max(element.dialogueStyle.fontSize, 20)}px`,
              fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
              fontWeight: element.dialogueStyle.type === 'shout' ? '900' :
                         element.dialogueStyle.type === 'thought' ? '600' : '700',
              color: '#000000',
              textAlign: element.dialogueStyle.textAlign as 'left' | 'center' | 'right',
              lineHeight: 1.3,
              wordBreak: 'break-word' as const,
              letterSpacing: element.dialogueStyle.type === 'shout' ? '0.05em' : '0.02em',
              textTransform: element.dialogueStyle.type === 'shout' ? 'uppercase' as const : 'none',
              fontStyle: element.dialogueStyle.type === 'thought' ? 'italic' : 'normal',
              textShadow: element.dialogueStyle.type === 'shout' ?
                         '0 0 2px rgba(255, 255, 255, 0.9)' : '0 0 1px rgba(255, 255, 255, 0.8)',
              caretColor: '#000000',
              maxWidth: '100%',
              maxHeight: '100%',
              wordWrap: 'break-word',
              overflowWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{
              __html: `<p style="
                color: #000000 !important;
                margin: 0;
                padding: 0;
                font-family: 'Comic Sans MS', 'Bangers', 'Roboto', system-ui, sans-serif !important;
                font-weight: ${element.dialogueStyle.type === 'shout' ? '900' :
                              element.dialogueStyle.type === 'thought' ? '600' : '700'} !important;
                font-size: ${Math.max(element.dialogueStyle.fontSize, 20)}px !important;
                line-height: 1.3 !important;
                text-shadow: ${element.dialogueStyle.type === 'shout' ?
                             '0 0 2px rgba(255, 255, 255, 0.9)' : '0 0 1px rgba(255, 255, 255, 0.8)'};
                letter-spacing: ${element.dialogueStyle.type === 'shout' ? '0.05em' : '0.02em'};
                text-transform: ${element.dialogueStyle.type === 'shout' ? 'uppercase' : 'none'};
                font-style: ${element.dialogueStyle.type === 'thought' ? 'italic' : 'normal'};
              ">${element.text || 'Double-cliquez pour éditer...'}</p>`
            }}
          />
        )}
      </div>
    </div>
    </>
  )
}

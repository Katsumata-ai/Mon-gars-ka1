'use client'

// TipTapUnifiedEditor - Éditeur TipTap intégré directement dans le container Konva
// AUCUN overlay externe, édition 100% unifiée dans la speech bubble

import React, { useEffect, useRef, useCallback, useState } from 'react'
import ReactDOM from 'react-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { DialogueElement } from '../types/assembly.types'

interface TipTapUnifiedEditorProps {
  element: DialogueElement
  isEditing: boolean
  onUpdate: (elementId: string, updates: Partial<DialogueElement>) => void
  onFinishEdit: () => void
  konvaContainer: HTMLElement
  bubblePosition: { x: number; y: number; width: number; height: number }
  stageScale: number
}

export default function TipTapUnifiedEditor({
  element,
  isEditing,
  onUpdate,
  onFinishEdit,
  konvaContainer,
  bubblePosition,
  stageScale
}: TipTapUnifiedEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // ✅ CONFIGURATION TIPTAP OPTIMISÉE
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Désactiver les fonctionnalités non nécessaires pour les speech bubbles
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
      }),
    ],
    content: element.text || '',
    immediatelyRender: false,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        class: 'tiptap-unified-editor',
        style: 'outline: none; border: none; padding: 0; margin: 0;'
      },
    },
    onUpdate: ({ editor }) => {
      const newText = editor.getText()
      onUpdate(element.id, { text: newText })
    },
    onBlur: () => {
      onFinishEdit()
    },
  })

  // ✅ CRÉATION ET POSITIONNEMENT DU CONTAINER
  const createEditorContainer = useCallback(() => {
    if (!konvaContainer || !isEditing) return

    // Créer le container de l'éditeur
    const container = document.createElement('div')
    container.className = 'tiptap-unified-container'
    
    // ✅ POSITIONNEMENT PIXEL-PERFECT RELATIF AU CONTAINER KONVA
    const padding = 8
    container.style.cssText = `
      position: absolute;
      left: ${bubblePosition.x + padding}px;
      top: ${bubblePosition.y + padding}px;
      width: ${bubblePosition.width - (padding * 2)}px;
      min-height: ${Math.max(40, bubblePosition.height - (padding * 2))}px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      border: 2px solid #3b82f6;
      border-radius: 6px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: ${element.dialogueStyle.fontFamily};
      font-size: ${element.dialogueStyle.fontSize * stageScale}px;
      color: ${typeof element.dialogueStyle.textColor === 'string' 
        ? element.dialogueStyle.textColor 
        : `#${element.dialogueStyle.textColor.toString(16).padStart(6, '0')}`};
      text-align: ${element.dialogueStyle.textAlign};
      line-height: 1.4;
      overflow: hidden;
      resize: none;
      transition: all 0.2s ease;
    `

    // Ajouter au container Konva
    konvaContainer.appendChild(container)
    editorContainerRef.current = container
    setIsInitialized(true)

    return container
  }, [konvaContainer, isEditing, bubblePosition, stageScale, element])

  // ✅ RESIZEOBSERVER POUR AUTO-REDIMENSIONNEMENT
  const setupResizeObserver = useCallback(() => {
    if (!editorContainerRef.current) return

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect
        const minBubbleHeight = 60
        const padding = 20
        const newBubbleHeight = Math.max(minBubbleHeight, (height / stageScale) + padding)
        
        // ✅ ADAPTATION INTELLIGENTE de la bulle au contenu
        onUpdate(element.id, {
          transform: {
            ...element.transform,
            height: newBubbleHeight
          }
        })
      }
    })

    resizeObserverRef.current.observe(editorContainerRef.current)
  }, [element.id, onUpdate, stageScale])

  // ✅ INITIALISATION QUAND L'ÉDITION COMMENCE
  useEffect(() => {
    if (isEditing && !isInitialized) {
      const container = createEditorContainer()
      if (container && editor) {
        // Attendre que le DOM soit prêt
        setTimeout(() => {
          setupResizeObserver()
          editor.commands.focus()
          editor.commands.selectAll()
        }, 50)
      }
    }
  }, [isEditing, isInitialized, createEditorContainer, setupResizeObserver, editor])

  // ✅ NETTOYAGE QUAND L'ÉDITION SE TERMINE
  useEffect(() => {
    if (!isEditing && isInitialized) {
      // Nettoyer le ResizeObserver
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }

      // Supprimer le container de l'éditeur
      if (editorContainerRef.current && konvaContainer.contains(editorContainerRef.current)) {
        konvaContainer.removeChild(editorContainerRef.current)
      }
      
      editorContainerRef.current = null
      setIsInitialized(false)
    }
  }, [isEditing, isInitialized, konvaContainer])

  // ✅ GESTION DES ÉVÉNEMENTS CLAVIER
  useEffect(() => {
    if (!isEditing || !editor) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onFinishEdit()
      }
      // Enter sans Shift pour valider
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        onFinishEdit()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, editor, onFinishEdit])

  // ✅ NETTOYAGE FINAL
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
      }
      if (editorContainerRef.current && konvaContainer?.contains(editorContainerRef.current)) {
        konvaContainer.removeChild(editorContainerRef.current)
      }
    }
  }, [konvaContainer])

  // ✅ RENDU CONDITIONNEL
  if (!isEditing || !isInitialized || !editorContainerRef.current) {
    return null
  }

  // ✅ PORTAL VERS LE CONTAINER CRÉÉ
  return (
    <>
      {editorContainerRef.current && (
        <div ref={editorContainerRef}>
          <EditorContent editor={editor} />
        </div>
      )}
    </>
  )
}

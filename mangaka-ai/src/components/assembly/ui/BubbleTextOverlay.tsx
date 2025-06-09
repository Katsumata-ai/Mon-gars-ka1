'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DialogueElement } from '@/types/assembly'

interface BubbleTextOverlayProps {
  element: DialogueElement
  isEditing: boolean
  onTextChange: (text: string) => void
  onFinishEditing: () => void
  onStartEditing: () => void
  canvasTransform: {
    x: number
    y: number
    scale: number
  }
}

export default function BubbleTextOverlay({
  element,
  isEditing,
  onTextChange,
  onFinishEditing,
  onStartEditing,
  canvasTransform
}: BubbleTextOverlayProps) {
  const [text, setText] = useState(element.text || 'Nouveau texte...')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textDisplayRef = useRef<HTMLDivElement>(null)

  // ✅ CALCULER LA POSITION EXACTE POUR INTÉGRATION PARFAITE
  const bubbleRect = {
    left: canvasTransform.x + (element.transform.x * canvasTransform.scale),
    top: canvasTransform.y + (element.transform.y * canvasTransform.scale),
    width: element.transform.width * canvasTransform.scale,
    height: element.transform.height * canvasTransform.scale
  }

  // ✅ ZONE DE TEXTE CENTRÉE DANS LA BULLE (PADDING POUR ÉVITER LES BORDURES)
  const textAreaRect = {
    left: bubbleRect.left + (10 * canvasTransform.scale),
    top: bubbleRect.top + (10 * canvasTransform.scale),
    width: bubbleRect.width - (20 * canvasTransform.scale),
    height: bubbleRect.height - (20 * canvasTransform.scale)
  }

  // ✅ SYNCHRONISATION DU TEXTE AVEC L'ÉLÉMENT
  useEffect(() => {
    setText(element.text || 'Nouveau texte...')
  }, [element.text])

  // ✅ FOCUS AUTOMATIQUE QUAND L'ÉDITION COMMENCE
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      console.log('🔤 BubbleTextOverlay: Focus automatique')
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [isEditing])

  // ✅ GESTION DU CHANGEMENT DE TEXTE
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onTextChange(newText)
  }

  // ✅ GESTION DES RACCOURCIS CLAVIER
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation() // Empêcher la propagation vers PixiJS
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onFinishEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setText(element.text || 'Nouveau texte...')
      onTextChange(element.text || 'Nouveau texte...')
      onFinishEditing()
    }
  }

  // ✅ GESTION DU DOUBLE-CLIC POUR COMMENCER L'ÉDITION
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      console.log('🔤 BubbleTextOverlay: Double-clic détecté - début édition')
      onStartEditing()
    }
  }

  // ✅ STYLE DU TEXTE ADAPTATIF POUR INTÉGRATION PARFAITE
  const textStyle = {
    fontSize: `${Math.max(12, (element.bubbleStyle?.fontSize || 14) * canvasTransform.scale)}px`,
    fontFamily: element.bubbleStyle?.fontFamily || 'Arial',
    textAlign: element.bubbleStyle?.textAlign || 'center' as const,
    color: element.bubbleStyle?.textColor || '#000000',
    lineHeight: 1.4,
    wordWrap: 'break-word' as const,
    overflow: 'hidden' as const
  }

  return (
    <>
      {/* ✅ ZONE DE TEXTE AFFICHAGE - TOUJOURS VISIBLE */}
      {!isEditing && (
        <div
          className="absolute pointer-events-auto cursor-text"
          style={{
            left: textAreaRect.left,
            top: textAreaRect.top,
            width: textAreaRect.width,
            height: textAreaRect.height,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ...textStyle
          }}
          onDoubleClick={handleDoubleClick}
        >
          {text}
        </div>
      )}

      {/* ✅ ZONE D'ÉDITION - PARFAITEMENT INTÉGRÉE DANS LA BULLE */}
      {isEditing && (
        <div
          className="absolute pointer-events-auto"
          style={{
            left: textAreaRect.left,
            top: textAreaRect.top,
            width: textAreaRect.width,
            height: textAreaRect.height,
            zIndex: 1001
          }}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none outline-none border-2 border-green-500 rounded shadow-lg"
            style={{
              ...textStyle,
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              padding: '6px',
              boxSizing: 'border-box',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}
          />
        </div>
      )}
    </>
  )
}

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DialogueElement } from '@/types/assembly'

interface IntegratedBubbleTextEditorProps {
  element: DialogueElement
  isEditing: boolean
  onTextChange: (text: string) => void
  onFinishEditing: () => void
  onStartEditing: () => void
  pixiContainer: any // Container PixiJS de la bulle
}

export default function IntegratedBubbleTextEditor({
  element,
  isEditing,
  onTextChange,
  onFinishEditing,
  onStartEditing,
  pixiContainer: _pixiContainer // Paramètre gardé pour compatibilité mais non utilisé
}: IntegratedBubbleTextEditorProps) {
  const [text, setText] = useState(element.text || 'Nouveau texte...')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // ✅ SYNCHRONISATION AVEC L'ÉLÉMENT
  useEffect(() => {
    setText(element.text || 'Nouveau texte...')
  }, [element.text])

  // ✅ POSITIONNEMENT SIMPLE ET FIABLE DANS LA BULLE
  useEffect(() => {
    if (!containerRef.current) return

    const updatePosition = () => {
      if (!containerRef.current) return

      try {
        // ✅ MÉTHODE SIMPLE : Utiliser directement les coordonnées de l'élément
        const canvas = document.querySelector('canvas')
        if (!canvas) {
          console.error('❌ Canvas non trouvé')
          return
        }

        const canvasRect = canvas.getBoundingClientRect()

        // Position de la bulle = position canvas + position élément
        const bubbleX = canvasRect.left + element.transform.x
        const bubbleY = canvasRect.top + element.transform.y

        // Zone de texte avec padding à l'intérieur de la bulle
        const padding = 12
        const textX = bubbleX + padding
        const textY = bubbleY + padding
        const textWidth = Math.max(50, element.transform.width - (padding * 2))
        const textHeight = Math.max(30, element.transform.height - (padding * 2))

        // Appliquer la position
        containerRef.current.style.left = `${textX}px`
        containerRef.current.style.top = `${textY}px`
        containerRef.current.style.width = `${textWidth}px`
        containerRef.current.style.height = `${textHeight}px`

        console.log('📍 Position calculée:', {
          canvasRect: { left: canvasRect.left, top: canvasRect.top },
          elementPos: { x: element.transform.x, y: element.transform.y },
          bubblePos: { x: bubbleX, y: bubbleY },
          textPos: { x: textX, y: textY, width: textWidth, height: textHeight }
        })

      } catch (error) {
        console.error('❌ Erreur positionnement:', error)
      }
    }

    // Mise à jour initiale
    updatePosition()

    // Mise à jour continue pendant l'édition
    let intervalId: NodeJS.Timeout | undefined
    if (isEditing) {
      intervalId = setInterval(updatePosition, 16) // ~60fps
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [element.transform, isEditing])

  // ✅ FOCUS AUTOMATIQUE
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus()
        textareaRef.current?.select()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  // ✅ GESTION DU TEXTE
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onTextChange(newText)
  }

  // ✅ RACCOURCIS CLAVIER
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()
    
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

  // ✅ DOUBLE-CLIC POUR ÉDITION
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isEditing) {
      onStartEditing()
    }
  }

  // ✅ STYLE ADAPTATIF
  const textStyle = {
    fontSize: `${element.bubbleStyle?.fontSize || 14}px`,
    fontFamily: element.bubbleStyle?.fontFamily || 'Arial',
    textAlign: element.bubbleStyle?.textAlign || 'center' as const,
    color: element.bubbleStyle?.textColor || '#000000',
    lineHeight: 1.4
  }

  return (
    <div
      ref={containerRef}
      className="fixed pointer-events-auto"
      style={{
        zIndex: 9999,
        position: 'fixed',
        pointerEvents: isEditing ? 'auto' : 'none', // Éviter l'interférence quand pas en édition
        backgroundColor: isEditing ? 'rgba(255, 0, 0, 0.1)' : 'transparent' // Debug: fond rouge léger en édition
      }}
    >
      {isEditing ? (
        // ✅ MODE ÉDITION - INTÉGRÉ DANS LA BULLE
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className="w-full h-full resize-none outline-none border-4 border-green-500 rounded shadow-lg"
          style={{
            ...textStyle,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            padding: '8px',
            boxSizing: 'border-box',
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s ease',
            minHeight: '100%',
            fontWeight: 'normal',
            zIndex: 9999
          }}
          placeholder="Tapez votre texte..."
          autoFocus
        />
      ) : (
        // ✅ MODE AFFICHAGE - INVISIBLE MAIS CLIQUABLE
        <div
          onDoubleClick={handleDoubleClick}
          className="w-full h-full cursor-text flex items-center justify-center"
          style={{
            ...textStyle,
            wordWrap: 'break-word',
            overflow: 'hidden',
            pointerEvents: 'auto',
            backgroundColor: 'transparent',
            userSelect: 'none'
          }}
        >
          {/* Zone invisible pour le double-clic */}
        </div>
      )}
    </div>
  )
}

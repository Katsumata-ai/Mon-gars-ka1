'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DialogueElement } from '@/types/assembly'

interface InPlaceTextEditorProps {
  element: DialogueElement
  isEditing: boolean
  onTextChange: (text: string) => void
  onFinishEditing: () => void
}

export default function InPlaceTextEditor({
  element,
  isEditing,
  onTextChange,
  onFinishEditing
}: InPlaceTextEditorProps) {
  const [text, setText] = useState(element.text || 'Nouveau texte...')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ✅ FOCUS AUTOMATIQUE ET SÉLECTION DU TEXTE
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      console.log('🔤 InPlaceTextEditor: Focus et sélection du texte')
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

  // ✅ CALCULER LA POSITION ABSOLUE SUR LE CANVAS
  const bubbleRect = {
    left: element.transform.x,
    top: element.transform.y,
    width: element.transform.width,
    height: element.transform.height
  }

  if (!isEditing) return null

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        left: bubbleRect.left,
        top: bubbleRect.top,
        width: bubbleRect.width,
        height: bubbleRect.height
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        className="w-full h-full p-2 bg-white border-2 border-green-500 rounded resize-none outline-none"
        style={{
          fontSize: element.bubbleStyle?.fontSize || '14px',
          fontFamily: element.bubbleStyle?.fontFamily || 'Arial',
          textAlign: element.bubbleStyle?.textAlign || 'center',
          lineHeight: 1.4
        }}
      />
    </div>
  )
}

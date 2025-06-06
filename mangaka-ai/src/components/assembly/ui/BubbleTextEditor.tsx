'use client'

import React, { useState, useRef, useEffect } from 'react'
import { DialogueElement } from '../types/assembly.types'
import { cn } from '@/lib/utils'

interface BubbleTextEditorProps {
  element: DialogueElement
  isEditing: boolean
  position: { x: number, y: number }
  onTextChange: (text: string) => void
  onFinishEditing: () => void
  className?: string
}

export default function BubbleTextEditor({
  element,
  isEditing,
  position,
  onTextChange,
  onFinishEditing,
  className
}: BubbleTextEditorProps) {
  const [text, setText] = useState(element.text)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus automatique quand l'édition commence
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.select()
    }
  }, [isEditing])

  // Ajuster la hauteur automatiquement
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [text])

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setText(newText)
    onTextChange(newText)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onFinishEditing()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setText(element.text) // Restaurer le texte original
      onTextChange(element.text)
      onFinishEditing()
    }
  }

  const handleBlur = () => {
    onFinishEditing()
  }

  if (!isEditing) return null

  return (
    <div 
      className={cn(
        'fixed z-50 bg-white rounded-lg border-2 border-primary-500 shadow-2xl',
        'min-w-[120px] max-w-[300px]',
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        width: Math.max(element.transform.width, 120),
        transform: 'translate(-50%, -50%)'
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Tapez votre texte..."
        className={cn(
          'w-full p-3 bg-transparent border-none outline-none resize-none',
          'text-black text-center',
          'placeholder:text-gray-400'
        )}
        style={{
          fontSize: element.bubbleStyle.fontSize,
          fontFamily: element.bubbleStyle.fontFamily,
          textAlign: element.bubbleStyle.textAlign,
          minHeight: '40px'
        }}
      />
      
      {/* Instructions */}
      <div className="px-3 py-2 bg-gray-50 border-t text-xs text-gray-500 text-center">
        <span className="font-medium">Entrée</span> pour valider • <span className="font-medium">Échap</span> pour annuler
      </div>
    </div>
  )
}

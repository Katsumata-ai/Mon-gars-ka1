'use client'

// SimpleFreeText - Composant de texte libre SANS TipTap
// Utilise textarea/div simple pour un redimensionnement efficace
// Même police et styles que les bulles, mais redimensionnable

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TextElement } from '../types/assembly.types'

interface SimpleFreeTextProps {
  element: TextElement
  mode: 'reading' | 'editing' | 'manipulating'
  onUpdate: (elementId: string, updates: Partial<TextElement>) => void
  onModeChange?: (elementId: string, newMode: 'reading' | 'editing' | 'manipulating') => void
  onDoubleClick?: (elementId: string) => void
  className?: string
}

export default function SimpleFreeText({
  element,
  mode,
  onUpdate,
  onDoubleClick,
  onModeChange,
  className = ''
}: SimpleFreeTextProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [textValue, setTextValue] = useState(element.text || '')

  // ✅ SYNCHRONISATION DU CONTENU
  useEffect(() => {
    setTextValue(element.text || '')
  }, [element.text])

  // ✅ FOCUS AUTOMATIQUE EN MODE ÉDITION - PLUS AGRESSIF
  useEffect(() => {
    if (mode === 'editing' && textareaRef.current) {
      // Délai pour s'assurer que le DOM est prêt
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.select()
          console.log('🎯 SimpleFreeText: Focus forcé sur textarea:', element.id)
        }
      }, 50)

      return () => clearTimeout(timer)
    }
  }, [mode, element.id])

  // ✅ GESTIONNAIRE DE CHANGEMENT DE TEXTE
  const handleTextChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = event.target.value
    setTextValue(newText)
    onUpdate(element.id, { text: newText })
  }, [element.id, onUpdate])

  // ✅ GESTIONNAIRE DE BLUR (SORTIE D'ÉDITION)
  const handleTextBlur = useCallback(() => {
    if (mode === 'editing') {
      onModeChange?.(element.id, 'reading')
    }
  }, [mode, element.id, onModeChange])

  // ✅ GESTIONNAIRE DE CLIC SIMPLE (SÉLECTION)
  const handleTextMouseDown = useCallback((event: React.MouseEvent) => {
    if (mode !== 'reading') return

    event.stopPropagation()
    
    // Émettre l'événement de sélection pour SimpleCanvasEditor
    const selectionEvent = new CustomEvent('textClicked', {
      detail: {
        textId: element.id,
        clientX: event.clientX,
        clientY: event.clientY,
        element: event.currentTarget
      }
    })
    window.dispatchEvent(selectionEvent)
  }, [mode, element.id])

  // ✅ GESTIONNAIRE DE DOUBLE-CLIC (ÉDITION)
  const handleTextDoubleClick = useCallback((event: React.MouseEvent) => {
    if (mode !== 'reading') return

    event.stopPropagation()
    onModeChange?.(element.id, 'editing')
    onDoubleClick?.(element.id)
  }, [mode, element.id, onDoubleClick, onModeChange])

  // ✅ STYLES DYNAMIQUES - CONTENEUR AVEC DIMENSIONS FIXES
  const containerStyle = {
    position: 'absolute' as const,
    left: `${element.transform.x}px`,
    top: `${element.transform.y}px`,
    width: `${element.textStyle.maxWidth + 20}px`, // ✅ PLUS LARGE POUR ÉVITER LA SCROLLBAR
    height: `${Math.max(element.textStyle.fontSize * 2.5, 50)}px`, // ✅ PLUS HAUT POUR LE CONFORT
    minWidth: '50px',
    minHeight: '20px',
    zIndex: 2000,
    pointerEvents: 'auto' as const,
    cursor: mode === 'editing' ? 'text' : 'grab',
    background: 'transparent',
    border: mode === 'editing' ? '2px solid #3b82f6' : 'none',
    borderRadius: mode === 'editing' ? '4px' : '0',
    boxShadow: mode === 'editing' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    padding: mode === 'editing' ? '10px' : '0', // ✅ PLUS DE PADDING POUR ÉVITER LA SCROLLBAR
    overflow: 'hidden'
  }

  // ✅ STYLES DE TEXTE DYNAMIQUES - SE METTENT À JOUR AUTOMATIQUEMENT
  const textStyle = {
    width: '100%',
    height: '100%',
    fontSize: `${Math.max(element.textStyle.fontSize, 12)}px`, // ✅ REDIMENSIONNEMENT DIRECT
    fontFamily: 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif',
    fontWeight: '700',
    color: '#000000',
    textAlign: element.textStyle.textAlign as 'left' | 'center' | 'right',
    textShadow: '0 0 1px rgba(255, 255, 255, 0.8)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    lineHeight: '1.3',
    resize: 'none' as const,
    wordWrap: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    padding: '0',
    margin: '0'
  }

  return (
    <div
      style={containerStyle}
      className={`simple-free-text ${className}`}
      data-text-id={element.id}
      data-text-mode={mode}
    >
      {/* ✅ RENDU CONDITIONNEL SELON LE MODE */}
      {mode === 'editing' ? (
        <textarea
          ref={textareaRef}
          value={textValue}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          placeholder="Tapez votre texte..."
          style={textStyle}
          className="simple-free-text-editor"
        />
      ) : (
        <div
          ref={textRef}
          className="simple-free-text-content"
          onMouseDown={handleTextMouseDown}
          onDoubleClick={handleTextDoubleClick}
          style={textStyle}
        >
          {textValue || (
            <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
              Tapez votre texte...
            </span>
          )}
        </div>
      )}
    </div>
  )
}

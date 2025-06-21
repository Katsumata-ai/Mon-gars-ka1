'use client'

// SimpleFreeText - Composant de texte libre SANS TipTap
// Utilise textarea/div simple pour un redimensionnement efficace
// Même police et styles que les bulles, mais redimensionnable

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { TextElement } from '../types/assembly.types'
import { usePolotnoContext } from '../context/PolotnoContext'

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

  // ✅ NOUVEAU : Obtenir l'outil actif pour empêcher les interactions avec l'outil main
  const { activeTool } = usePolotnoContext()

  // ✅ NOUVEAU : États pour le drag (système simplifié comme les panels)
  const [isDragging, setIsDragging] = useState(false)

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



  // ✅ GESTIONNAIRES DE DRAG PERSONNALISÉ (système simplifié)
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

  // Gestionnaire mousedown - commence le drag seulement si on bouge
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      console.log('🖐️ SimpleFreeText: Outil main actif - aucune interaction texte')
      return // Pas d'interaction avec les textes
    }

    if (mode === 'editing') return

    event.preventDefault()
    event.stopPropagation()

    // Sélectionner d'abord
    const selectionEvent = new CustomEvent('textClicked', {
      detail: {
        textId: element.id,
        clientX: event.clientX,
        clientY: event.clientY,
        element: event.currentTarget
      }
    })
    window.dispatchEvent(selectionEvent)

    // Préparer le drag mais ne pas l'activer encore
    setDragState({
      isDragging: false,
      startX: event.clientX,
      startY: event.clientY,
      startElementX: element.transform.x,
      startElementY: element.transform.y
    })

    console.log('🔍 SimpleFreeText: MouseDown préparé pour', element.id)
  }, [mode, element.id, element.transform.x, element.transform.y, activeTool])

  // ✅ GESTIONNAIRE DE DOUBLE-CLIC (ÉDITION)
  const handleTextDoubleClick = useCallback((event: React.MouseEvent) => {
    // ✅ NOUVEAU : Empêcher toute interaction si l'outil main est actif
    if (activeTool === 'hand') {
      console.log('🖐️ SimpleFreeText: Outil main actif - aucun double-clic texte')
      return // Pas d'interaction avec les textes
    }

    console.log('🔍 SimpleFreeText: Double-click détecté!', {
      textId: element.id,
      currentMode: mode,
      canEdit: mode === 'reading' || mode === 'manipulating'
    })

    // ✅ PERMETTRE LE DOUBLE-CLIC EN MODE READING OU MANIPULATING
    if (mode !== 'reading' && mode !== 'manipulating') {
      console.log('❌ SimpleFreeText: Double-click ignoré - mode incorrect:', mode)
      return
    }

    event.stopPropagation()
    console.log('✅ SimpleFreeText: Double-click traité, passage en mode édition pour:', element.id)

    onModeChange?.(element.id, 'editing')
    onDoubleClick?.(element.id)
  }, [mode, element.id, onDoubleClick, onModeChange, activeTool])

  // ✅ GESTION DU DRAG GLOBAL SIMPLIFIÉ
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
          console.log('🎯 SimpleFreeText: Drag start:', element.id)
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

      // ✅ NOUVEAU : Notifier le système de sélection pour synchroniser le cadre
      const positionUpdateEvent = new CustomEvent('textPositionUpdate', {
        detail: {
          textId: element.id,
          x: newX,
          y: newY
        }
      })
      window.dispatchEvent(positionUpdateEvent)
    }

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        setIsDragging(false)
        console.log('🎯 SimpleFreeText: Drag terminé:', element.id)
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
  }, [dragState, element.id, element.transform, onUpdate, onModeChange, setIsDragging])

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
    cursor: mode === 'editing' ? 'text' : isDragging ? 'grabbing' : 'grab',
    background: 'transparent',
    border: mode === 'editing' ? '2px solid #3b82f6' : 'none',
    borderRadius: mode === 'editing' ? '4px' : '0',
    boxShadow: mode === 'editing' ? '0 0 0 2px rgba(59, 130, 246, 0.2)' : 'none',
    padding: mode === 'editing' ? '10px' : '0', // ✅ PLUS DE PADDING POUR ÉVITER LA SCROLLBAR
    overflow: 'hidden',
    // ✅ EMPÊCHER LA SÉLECTION DE TEXTE PENDANT LE DRAG
    userSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    WebkitUserSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    MozUserSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    msUserSelect: mode === 'editing' ? 'text' as const : 'none' as const
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
    margin: '0',
    // ✅ EMPÊCHER LA SÉLECTION DE TEXTE EN MODE LECTURE/MANIPULATION
    userSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    WebkitUserSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    MozUserSelect: mode === 'editing' ? 'text' as const : 'none' as const,
    msUserSelect: mode === 'editing' ? 'text' as const : 'none' as const
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
          onMouseDown={handleMouseDown}
          onDoubleClick={handleTextDoubleClick}
          style={textStyle}
        >
          {textValue || (
            // ✅ CORRIGÉ : Placeholder seulement visible en mode manipulating (quand sélectionné)
            mode === 'manipulating' && (
              <span style={{ opacity: 0.5, fontStyle: 'italic' }}>
                Tapez votre texte...
              </span>
            )
          )}
        </div>
      )}
    </div>
  )
}

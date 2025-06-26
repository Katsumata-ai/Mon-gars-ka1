// components/save/SaveButton.tsx - Bouton Save Global Rouge
'use client'

import React, { useEffect } from 'react'
import { Save, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'

interface SaveButtonProps {
  className?: string
  showTimestamp?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'compact' | 'full'
}

export default function SaveButton({
  className = '',
  showTimestamp = true,
  size = 'md',
  variant = 'full'
}: SaveButtonProps) {
  const {
    hasUnsavedChanges,
    isSaving,
    lastSavedToDb,
    error,
    saveToDatabase
  } = useProjectStore()

  const handleSave = async () => {
    try {
      await saveToDatabase()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }

  // Raccourci clavier Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!isSaving && hasUnsavedChanges) {
          handleSave()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSaving, hasUnsavedChanges])

  const formatSaveTime = (date: Date | null) => {
    if (!date) return 'Jamais sauvegardé'

    // S'assurer que c'est un objet Date valide
    const dateObj = date instanceof Date ? date : new Date(date)

    // Vérifier que la date est valide
    if (isNaN(dateObj.getTime())) return 'Date invalide'

    return dateObj.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getButtonState = () => {
    if (error) return 'error'
    if (isSaving) return 'saving'
    if (!hasUnsavedChanges) return 'saved'
    return 'unsaved'
  }

  const buttonState = getButtonState()

  const stateConfig = {
    unsaved: {
      bg: 'bg-red-600 hover:bg-red-500',
      text: 'text-white',
      icon: Save,
      label: 'Save'
    },
    saving: {
      bg: 'bg-blue-600',
      text: 'text-white',
      icon: Clock,
      label: 'Saving...'
    },
    saved: {
      bg: 'bg-green-600 hover:bg-green-500',
      text: 'text-white',
      icon: CheckCircle,
      label: 'Saved'
    },
    error: {
      bg: 'bg-red-700 hover:bg-red-600',
      text: 'text-white',
      icon: AlertCircle,
      label: 'Error'
    }
  }

  const config = stateConfig[buttonState]
  const Icon = config.icon

  // Tailles
  const sizeConfig = {
    sm: {
      padding: 'px-3 py-1.5',
      text: 'text-sm',
      icon: 'w-3 h-3',
      spacing: 'space-x-1.5'
    },
    md: {
      padding: 'px-4 py-2',
      text: 'text-sm',
      icon: 'w-4 h-4',
      spacing: 'space-x-2'
    },
    lg: {
      padding: 'px-6 py-3',
      text: 'text-base',
      icon: 'w-5 h-5',
      spacing: 'space-x-3'
    }
  }

  const sizeStyles = sizeConfig[size]

  return (
    <button
      onClick={handleSave}
      disabled={isSaving || (!hasUnsavedChanges && !error)}
      className={`
        relative flex items-center ${sizeStyles.spacing} ${sizeStyles.padding} rounded-lg font-semibold
        transition-all duration-200 shadow-lg hover:shadow-xl
        ${config.bg} ${config.text} ${sizeStyles.text}
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
        ${className}
      `}
      title={`${config.label} - ${formatSaveTime(lastSavedToDb)}`}
    >
      {/* Indicateur changements non sauvegardés */}
      {hasUnsavedChanges && buttonState !== 'saving' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
      )}

      {/* Icône avec animation */}
      <Icon className={`${sizeStyles.icon} ${isSaving ? 'animate-spin' : ''}`} />

      {/* Texte principal */}
      {variant === 'full' && (
        <span>{config.label}</span>
      )}

      {/* Timestamp */}
      {showTimestamp && variant === 'full' && (
        <span className="text-xs opacity-75 font-mono hidden lg:inline">
          {formatSaveTime(lastSavedToDb)}
        </span>
      )}

      {/* Raccourci clavier */}
      {variant === 'full' && (
        <span className="text-xs opacity-50 hidden xl:inline">
          Ctrl+S
        </span>
      )}
    </button>
  )
}

// Hook pour utilisation simplifiée
export const useSaveButton = () => {
  const { hasUnsavedChanges, isSaving, saveToDatabase } = useProjectStore()

  return {
    hasUnsavedChanges,
    isSaving,
    canSave: hasUnsavedChanges && !isSaving,
    save: saveToDatabase
  }
}

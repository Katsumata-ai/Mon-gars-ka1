'use client'

import { useState } from 'react'

interface SaveButtonProps {
  className?: string
}

export default function SaveButton({ className = '' }: SaveButtonProps) {
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Ici on pourrait ajouter la logique de sauvegarde
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  return (
    <button 
      onClick={handleSave}
      disabled={isSaving}
      className={`bg-primary-500 hover:bg-primary-600 disabled:bg-primary-400 text-white px-8 py-3 rounded-lg transition-colors ${className}`}
    >
      {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
    </button>
  )
}

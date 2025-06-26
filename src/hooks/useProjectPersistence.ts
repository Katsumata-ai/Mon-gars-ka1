// hooks/useProjectPersistence.ts - Hook pour la persistance du projet
'use client'

import { useEffect } from 'react'
import { useProjectStore } from '@/stores/projectStore'
import { useAuth } from '@/hooks/useAuth'

interface UseProjectPersistenceProps {
  projectId: string
}

export function useProjectPersistence({ projectId }: UseProjectPersistenceProps) {
  const { user } = useAuth()
  const { 
    initializeProject, 
    loadFromDatabase, 
    scriptData,
    hasUnsavedChanges,
    isSaving,
    isLoading,
    error
  } = useProjectStore()

  // Initialisation du projet
  useEffect(() => {
    const initProject = async () => {
      if (!user || !projectId) return

      try {
        // Initialiser le store avec les IDs
        initializeProject(projectId, user.id)
        
        // Charger les données existantes
        await loadFromDatabase()
      } catch (error) {
        console.error('Erreur initialisation projet:', error)
      }
    }

    initProject()
  }, [projectId, user, initializeProject, loadFromDatabase])

  return {
    // État
    isReady: !!user && !!projectId,
    hasUnsavedChanges,
    isSaving,
    isLoading,
    error,
    
    // Données
    scriptData,
    
    // Métadonnées
    projectId,
    userId: user?.id
  }
}

// Hook pour initialiser l'assemblage avec les pages du projet
'use client'

import { useEffect, useState } from 'react'
import { useAssemblyStore } from '@/components/assembly/managers/StateManager'

interface UseAssemblyInitializationProps {
  projectId: string
}

export function useAssemblyInitialization({ projectId }: UseAssemblyInitializationProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagesCount, setPagesCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(false) // Prévenir les doubles exécutions

  useEffect(() => {
    const initializeAssembly = async () => {
      if (!projectId || isInitialized || isInitializing) {
        setIsLoading(false)
        return
      }

      try {
        setIsInitializing(true)
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/projects/${projectId}/pages`)

        if (response.ok) {
          const data = await response.json()

          if (data.success && data.pages && data.pages.length > 0) {
            // Charger les pages dans le StateManager depuis la DB
            const { loadPagesFromDB, setCurrentPage } = useAssemblyStore.getState()
            await loadPagesFromDB(data.pages)

            setPagesCount(data.pages.length)

            // Sélectionner la première page
            const firstPage = data.pages[0]
            setCurrentPage(firstPage.id)
          } else {
            // Créer la première page si aucune n'existe
            const { addPage, setCurrentPage } = useAssemblyStore.getState()
            const newPageId = await addPage(projectId, 'Page 1')
            setPagesCount(1)
            setCurrentPage(newPageId)
          }
        } else {
          // Créer une page par défaut en cas d'erreur API
          const { addPage, setCurrentPage } = useAssemblyStore.getState()
          const newPageId = await addPage(projectId, 'Page 1')
          setPagesCount(1)
          setCurrentPage(newPageId)
        }

        setIsInitialized(true)

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'assemblage:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')

        // En cas d'erreur, essayer de créer une page par défaut
        try {
          const { addPage, setCurrentPage } = useAssemblyStore.getState()
          const newPageId = await addPage(projectId, 'Page 1')
          setCurrentPage(newPageId)
          setPagesCount(1)
          setIsInitialized(true)
        } catch (fallbackError) {
          console.error('Erreur lors de la création de la page de fallback:', fallbackError)
        }
      } finally {
        setIsLoading(false)
        setIsInitializing(false)
      }
    }

    // Exécuter seulement une fois par projectId
    initializeAssembly()
  }, [projectId]) // Dépendance uniquement sur projectId

  return {
    isInitialized,
    isLoading,
    error,
    pagesCount // ✅ CORRECTION : Utiliser l'état local stable
  }
}

// Hook simplifié pour vérifier si l'assemblage est prêt
export function useAssemblyReady(projectId: string) {
  const { isInitialized, isLoading } = useAssemblyInitialization({ projectId })
  const { pages, currentPageId } = useAssemblyStore()

  const isReady = isInitialized && !isLoading && Object.keys(pages).length > 0 && currentPageId

  return {
    isReady,
    isLoading,
    hasPages: Object.keys(pages).length > 0,
    currentPageId
  }
}

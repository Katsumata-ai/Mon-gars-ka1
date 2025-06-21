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
  const [pagesCount, setPagesCount] = useState(0) // ✅ CORRECTION : État local pour éviter la boucle

  useEffect(() => {
    const initializeAssembly = async () => {
      if (!projectId) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        console.log('🚀 Initialisation de l\'assemblage pour le projet:', projectId)

        // ✅ CORRECTION : Toujours vérifier la base de données d'abord
        console.log('📡 Chargement des pages depuis la base de données...')

        const response = await fetch(`/api/projects/${projectId}/pages`)

        if (response.ok) {
          const data = await response.json()
          console.log('📄 Pages chargées depuis la DB:', data)

          if (data.success && data.pages && data.pages.length > 0) {
            // ✅ IMPLÉMENTÉ : Charger les pages dans le StateManager depuis la DB
            console.log('📥 Chargement des pages dans le StateManager...')

            // Charger chaque page depuis la DB dans le StateManager
            const { loadPagesFromDB, setCurrentPage } = useAssemblyStore.getState()
            await loadPagesFromDB(data.pages)

            console.log('✅ Pages chargées dans le StateManager:', data.pages.length)
            setPagesCount(data.pages.length) // ✅ CORRECTION : Mettre à jour l'état local

            // Sélectionner la première page
            const firstPage = data.pages[0]
            console.log('🔄 Sélection de la première page:', firstPage.id)
            setCurrentPage(firstPage.id)
          } else {
            // ✅ GARANTIE : Toujours avoir au moins une page
            console.log('📝 Aucune page trouvée, création de la première page obligatoire...')

            const { addPage, setCurrentPage } = useAssemblyStore.getState()
            const newPageId = await addPage(projectId, 'Page 1')
            console.log('✅ Première page créée avec ID:', newPageId)
            setPagesCount(1) // ✅ CORRECTION : Mettre à jour l'état local

            setCurrentPage(newPageId)
          }
        } else {
          // ✅ FALLBACK : Créer une page par défaut en cas d'erreur API
          console.warn('⚠️ Erreur API, création d\'une page par défaut obligatoire')

          const { addPage, setCurrentPage } = useAssemblyStore.getState()
          const newPageId = await addPage(projectId, 'Page 1')
          console.log('✅ Page par défaut créée avec ID:', newPageId)
          setPagesCount(1) // ✅ CORRECTION : Mettre à jour l'état local
          setCurrentPage(newPageId)
        }

        setIsInitialized(true)
        console.log('✅ Initialisation de l\'assemblage terminée')

      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de l\'assemblage:', error)
        setError(error instanceof Error ? error.message : 'Erreur inconnue')

        // En cas d'erreur, essayer de créer une page par défaut
        try {
          const { addPage, setCurrentPage } = useAssemblyStore.getState()
          const newPageId = await addPage(projectId, 'Page 1')
          setCurrentPage(newPageId)
          setPagesCount(1) // ✅ CORRECTION : Mettre à jour l'état local
          setIsInitialized(true)
        } catch (fallbackError) {
          console.error('❌ Erreur lors de la création de la page de fallback:', fallbackError)
        }
      } finally {
        setIsLoading(false)
      }
    }

    // ✅ CORRECTION CRITIQUE : Exécuter seulement une fois par projectId
    if (!isInitialized && projectId) {
      initializeAssembly()
    }
  }, [projectId, isInitialized]) // ✅ SUPPRIMÉ toutes les dépendances du StateManager

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

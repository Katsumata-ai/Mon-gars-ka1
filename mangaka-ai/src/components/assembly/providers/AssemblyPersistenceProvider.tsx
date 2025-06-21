// Provider pour gérer la persistance de l'état assemblage entre les menus
'use client'

import React, { createContext, useContext, useEffect, useRef } from 'react'
import { useAssemblyPersistence } from '@/hooks/useAssemblyPersistence'

interface AssemblyPersistenceContextType {
  saveState: () => void
  restoreState: () => void
  hasPersistedState: boolean
  lastSaved?: number
}

const AssemblyPersistenceContext = createContext<AssemblyPersistenceContextType | null>(null)

interface AssemblyPersistenceProviderProps {
  children: React.ReactNode
  projectId: string
  isAssemblyActive: boolean
}

export function AssemblyPersistenceProvider({
  children,
  projectId,
  isAssemblyActive
}: AssemblyPersistenceProviderProps) {
  const {
    saveState,
    restoreState,
    hasPersistedState,
    lastSaved
  } = useAssemblyPersistence({ projectId, isAssemblyActive })

  const previousActiveState = useRef(isAssemblyActive)

  // Gérer les transitions entre actif/inactif
  useEffect(() => {
    const wasActive = previousActiveState.current
    const isNowActive = isAssemblyActive

    if (wasActive && !isNowActive) {
      // On quitte l'assemblage - sauvegarder
      console.log('🔄 Sauvegarde état assemblage (sortie)')
      saveState()
    } else if (!wasActive && isNowActive) {
      // On entre dans l'assemblage - restaurer
      console.log('🔄 Restauration état assemblage (entrée)')
      restoreState()
    }

    previousActiveState.current = isAssemblyActive
  }, [isAssemblyActive, saveState, restoreState])

  // Sauvegarder avant le déchargement de la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAssemblyActive) {
        saveState()
      }
    }

    const handleVisibilityChange = () => {
      if (document.hidden && isAssemblyActive) {
        saveState()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isAssemblyActive, saveState])

  const contextValue: AssemblyPersistenceContextType = {
    saveState,
    restoreState,
    hasPersistedState,
    lastSaved
  }

  return (
    <AssemblyPersistenceContext.Provider value={contextValue}>
      {children}
    </AssemblyPersistenceContext.Provider>
  )
}

// Hook pour utiliser le contexte de persistance
export function useAssemblyPersistenceContext() {
  const context = useContext(AssemblyPersistenceContext)
  
  if (!context) {
    throw new Error(
      'useAssemblyPersistenceContext must be used within an AssemblyPersistenceProvider'
    )
  }
  
  return context
}

// HOC pour wrapper automatiquement les composants assemblage
export function withAssemblyPersistence<P extends object>(
  Component: React.ComponentType<P>,
  projectId: string
) {
  return function WrappedComponent(props: P & { isActive?: boolean }) {
    const { isActive = true, ...restProps } = props

    return (
      <AssemblyPersistenceProvider
        projectId={projectId}
        isAssemblyActive={isActive}
      >
        <Component {...(restProps as P)} />
      </AssemblyPersistenceProvider>
    )
  }
}

// Hook pour détecter les changements d'onglet
export function useTabChangeDetection(onTabChange: (isAssemblyActive: boolean) => void) {
  useEffect(() => {
    const handleHashChange = () => {
      const isAssemblyActive = window.location.hash.includes('assembly') || 
                              window.location.pathname.includes('assembly')
      onTabChange(isAssemblyActive)
    }

    const handlePopState = () => {
      const isAssemblyActive = window.location.hash.includes('assembly') || 
                              window.location.pathname.includes('assembly')
      onTabChange(isAssemblyActive)
    }

    // Écouter les changements d'URL
    window.addEventListener('hashchange', handleHashChange)
    window.addEventListener('popstate', handlePopState)

    // Détecter les changements via l'API History
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(history, args)
      handleHashChange()
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args)
      handleHashChange()
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
      window.removeEventListener('popstate', handlePopState)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [onTabChange])
}

// Composant utilitaire pour afficher l'état de persistance
export function AssemblyPersistenceIndicator() {
  const { hasPersistedState, lastSaved } = useAssemblyPersistenceContext()

  if (!hasPersistedState) {
    return null
  }

  const lastSavedDate = lastSaved ? new Date(lastSaved) : null

  return (
    <div className="fixed bottom-4 right-4 bg-dark-800 text-white px-3 py-2 rounded-lg shadow-lg text-sm z-50">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span>État sauvegardé</span>
        {lastSavedDate && (
          <span className="text-gray-400">
            {lastSavedDate.toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}

// Optimiseur de performance pour les changements de page
'use client'

import React, { createContext, useContext, useCallback, useRef, useMemo } from 'react'
import { useAssemblyStore } from '../managers/StateManager'

interface PageChangeOptimizerContextType {
  preloadPage: (pageId: string) => Promise<void>
  isPagePreloaded: (pageId: string) => boolean
  clearPreloadCache: () => void
  getPageChangeMetrics: () => PageChangeMetrics
}

interface PageChangeMetrics {
  averageChangeTime: number
  totalChanges: number
  cacheHitRate: number
  lastChangeTime: number
}

const PageChangeOptimizerContext = createContext<PageChangeOptimizerContextType | null>(null)

interface PageChangeOptimizerProviderProps {
  children: React.ReactNode
  maxCacheSize?: number
  preloadAdjacentPages?: boolean
}

export function PageChangeOptimizerProvider({
  children,
  maxCacheSize = 10,
  preloadAdjacentPages = true
}: PageChangeOptimizerProviderProps) {
  const { pages, currentPageId } = useAssemblyStore()
  
  // Cache des pages préchargées
  const preloadCache = useRef<Map<string, any>>(new Map())
  
  // Métriques de performance
  const metrics = useRef<PageChangeMetrics>({
    averageChangeTime: 0,
    totalChanges: 0,
    cacheHitRate: 0,
    lastChangeTime: 0
  })
  
  // Historique des temps de changement
  const changeTimesHistory = useRef<number[]>([])

  // Précharger une page
  const preloadPage = useCallback(async (pageId: string) => {
    if (preloadCache.current.has(pageId)) {
      return // Déjà en cache
    }

    try {
      const startTime = performance.now()
      
      // Simuler le chargement de la page (en production, cela ferait un appel API)
      const page = pages[pageId]
      if (page) {
        // Précharger les éléments de la page
        const preloadedData = {
          elements: [...page.content.stage.children],
          metadata: { ...page.metadata },
          timestamp: Date.now()
        }
        
        // Ajouter au cache avec gestion de la taille maximale
        if (preloadCache.current.size >= maxCacheSize) {
          // Supprimer l'entrée la plus ancienne
          const oldestKey = preloadCache.current.keys().next().value
          preloadCache.current.delete(oldestKey)
        }
        
        preloadCache.current.set(pageId, preloadedData)
        
        const loadTime = performance.now() - startTime
        console.log(`📦 Page ${pageId} préchargée en ${loadTime.toFixed(2)}ms`)
      }
    } catch (error) {
      // Erreur silencieuse
    }
  }, [pages, maxCacheSize])

  // Vérifier si une page est préchargée
  const isPagePreloaded = useCallback((pageId: string) => {
    return preloadCache.current.has(pageId)
  }, [])

  // Nettoyer le cache
  const clearPreloadCache = useCallback(() => {
    preloadCache.current.clear()
  }, [])

  // Obtenir les métriques de performance
  const getPageChangeMetrics = useCallback(() => {
    return { ...metrics.current }
  }, [])

  // Précharger les pages adjacentes automatiquement
  React.useEffect(() => {
    if (!preloadAdjacentPages || !currentPageId) return

    const currentPageNumber = pages[currentPageId]?.pageNumber
    if (typeof currentPageNumber !== 'number') return

    // Trouver les pages adjacentes
    const adjacentPages = Object.values(pages).filter(page => {
      const diff = Math.abs(page.pageNumber - currentPageNumber)
      return diff === 1 && page.pageId !== currentPageId
    })

    // Précharger les pages adjacentes
    adjacentPages.forEach(page => {
      if (!isPagePreloaded(page.pageId)) {
        preloadPage(page.pageId)
      }
    })
  }, [currentPageId, pages, preloadAdjacentPages, preloadPage, isPagePreloaded])

  // Mesurer les performances des changements de page
  const measurePageChange = useCallback((startTime: number) => {
    const changeTime = performance.now() - startTime
    
    // Mettre à jour l'historique
    changeTimesHistory.current.push(changeTime)
    if (changeTimesHistory.current.length > 100) {
      changeTimesHistory.current.shift() // Garder seulement les 100 derniers
    }
    
    // Calculer les métriques
    const totalChanges = changeTimesHistory.current.length
    const averageChangeTime = changeTimesHistory.current.reduce((a, b) => a + b, 0) / totalChanges
    
    metrics.current = {
      averageChangeTime,
      totalChanges,
      cacheHitRate: (preloadCache.current.size / Math.max(totalChanges, 1)) * 100,
      lastChangeTime: changeTime
    }
    
    console.log(`⚡ Changement de page en ${changeTime.toFixed(2)}ms (moyenne: ${averageChangeTime.toFixed(2)}ms)`)
  }, [])

  // Hook personnalisé pour optimiser les changements de page
  const optimizedSetCurrentPage = useCallback((pageId: string) => {
    const startTime = performance.now()
    
    // Vérifier si la page est en cache
    const isPreloaded = preloadCache.current.has(pageId)
    
    if (isPreloaded) {
      console.log('🚀 Utilisation du cache pour la page:', pageId)
      // Utiliser les données en cache pour un chargement plus rapide
      const cachedData = preloadCache.current.get(pageId)
      // Appliquer les données en cache (implémentation spécifique au StateManager)
    }
    
    // Effectuer le changement de page normal
    const { setCurrentPage } = useAssemblyStore.getState()
    setCurrentPage(pageId)
    
    // Mesurer la performance
    measurePageChange(startTime)
    
    // Précharger les pages adjacentes après le changement
    setTimeout(() => {
      if (preloadAdjacentPages) {
        const currentPageNumber = pages[pageId]?.pageNumber
        if (typeof currentPageNumber === 'number') {
          Object.values(pages).forEach(page => {
            const diff = Math.abs(page.pageNumber - currentPageNumber)
            if (diff === 1 && !isPagePreloaded(page.pageId)) {
              preloadPage(page.pageId)
            }
          })
        }
      }
    }, 100) // Délai pour ne pas bloquer l'UI
  }, [pages, preloadAdjacentPages, measurePageChange, preloadPage, isPagePreloaded])

  // Nettoyer le cache périodiquement
  React.useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now()
      const maxAge = 5 * 60 * 1000 // 5 minutes
      
      for (const [pageId, data] of preloadCache.current.entries()) {
        if (now - data.timestamp > maxAge) {
          preloadCache.current.delete(pageId)
        }
      }
    }, 60000) // Nettoyer toutes les minutes

    return () => clearInterval(cleanupInterval)
  }, [])

  const contextValue: PageChangeOptimizerContextType = {
    preloadPage,
    isPagePreloaded,
    clearPreloadCache,
    getPageChangeMetrics
  }

  return (
    <PageChangeOptimizerContext.Provider value={contextValue}>
      {children}
    </PageChangeOptimizerContext.Provider>
  )
}

// Hook pour utiliser l'optimiseur
export function usePageChangeOptimizer() {
  const context = useContext(PageChangeOptimizerContext)
  
  if (!context) {
    throw new Error(
      'usePageChangeOptimizer must be used within a PageChangeOptimizerProvider'
    )
  }
  
  return context
}

// Composant pour afficher les métriques de performance
export function PerformanceMetrics() {
  const { getPageChangeMetrics } = usePageChangeOptimizer()
  const [metrics, setMetrics] = React.useState<PageChangeMetrics | null>(null)

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(getPageChangeMetrics())
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 1000)

    return () => clearInterval(interval)
  }, [getPageChangeMetrics])

  if (!metrics || metrics.totalChanges === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 bg-dark-800 text-white p-3 rounded-lg shadow-lg text-xs z-50">
      <h4 className="font-semibold mb-2">Performance Pages</h4>
      <div className="space-y-1">
        <div>Temps moyen: {metrics.averageChangeTime.toFixed(1)}ms</div>
        <div>Dernier: {metrics.lastChangeTime.toFixed(1)}ms</div>
        <div>Total: {metrics.totalChanges}</div>
        <div>Cache: {metrics.cacheHitRate.toFixed(1)}%</div>
      </div>
    </div>
  )
}

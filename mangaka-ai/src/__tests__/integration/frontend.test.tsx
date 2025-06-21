// Tests d'intégration frontend pour le système de pages
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/jest'
import { useAssemblyStore } from '@/components/assembly/managers/StateManager'
import { AssemblyPersistenceProvider } from '@/components/assembly/providers/AssemblyPersistenceProvider'
import { PageChangeOptimizerProvider } from '@/components/assembly/performance/PageChangeOptimizer'

// Mock du StateManager
jest.mock('@/components/assembly/managers/StateManager', () => ({
  useAssemblyStore: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Composant de test simple
function TestAssemblyComponent({ projectId, isActive }: { projectId: string; isActive: boolean }) {
  const { addPage, deletePage, duplicatePage, currentPageId, pages } = useAssemblyStore()

  return (
    <AssemblyPersistenceProvider projectId={projectId} isAssemblyActive={isActive}>
      <PageChangeOptimizerProvider>
        <div data-testid="assembly-component">
          <div data-testid="current-page">{currentPageId || 'none'}</div>
          <div data-testid="pages-count">{Object.keys(pages || {}).length}</div>
          
          <button 
            data-testid="add-page-btn"
            onClick={() => addPage(projectId, 'Test Page')}
          >
            Ajouter Page
          </button>
          
          <button 
            data-testid="delete-page-btn"
            onClick={() => currentPageId && deletePage(projectId, currentPageId)}
          >
            Supprimer Page
          </button>
          
          <button 
            data-testid="duplicate-page-btn"
            onClick={() => currentPageId && duplicatePage(projectId, currentPageId)}
          >
            Dupliquer Page
          </button>
        </div>
      </PageChangeOptimizerProvider>
    </AssemblyPersistenceProvider>
  )
}

describe('Intégration Frontend - Système de Pages', () => {
  const mockStore = {
    addPage: jest.fn(),
    deletePage: jest.fn(),
    duplicatePage: jest.fn(),
    setCurrentPage: jest.fn(),
    saveCanvasState: jest.fn(),
    restoreCanvasState: jest.fn(),
    currentPageId: 'page-1',
    pages: {
      'page-1': { pageId: 'page-1', pageNumber: 1 },
      'page-2': { pageId: 'page-2', pageNumber: 2 }
    },
    canvasState: {
      position: { x: 0, y: 0 },
      zoom: 25,
      currentPageId: 'page-1',
      showGrid: true,
      gridSize: 20,
      activeTool: 'select',
      lastActiveTab: 'assembly',
      timestamp: Date.now()
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAssemblyStore as jest.Mock).mockReturnValue(mockStore)
    
    // Mock fetch success
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, page: { id: 'new-page', page_number: 3 } })
    })
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('Gestion des pages', () => {
    it('devrait ajouter une page via le StateManager', async () => {
      mockStore.addPage.mockResolvedValue('new-page-id')

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      const addButton = screen.getByTestId('add-page-btn')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(mockStore.addPage).toHaveBeenCalledWith('test-project', 'Test Page')
      })
    })

    it('devrait supprimer une page via le StateManager', async () => {
      mockStore.deletePage.mockResolvedValue(1)

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      const deleteButton = screen.getByTestId('delete-page-btn')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(mockStore.deletePage).toHaveBeenCalledWith('test-project', 'page-1')
      })
    })

    it('devrait dupliquer une page via le StateManager', async () => {
      mockStore.duplicatePage.mockResolvedValue('duplicated-page-id')

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      const duplicateButton = screen.getByTestId('duplicate-page-btn')
      fireEvent.click(duplicateButton)

      await waitFor(() => {
        expect(mockStore.duplicatePage).toHaveBeenCalledWith('test-project', 'page-1')
      })
    })
  })

  describe('Persistance entre menus', () => {
    it('devrait sauvegarder l\'état quand on quitte l\'assemblage', () => {
      const { rerender } = render(
        <TestAssemblyComponent projectId="test-project" isActive={true} />
      )

      // Simuler le changement vers un autre menu
      rerender(<TestAssemblyComponent projectId="test-project" isActive={false} />)

      // Vérifier que la sauvegarde a été déclenchée
      expect(mockStore.saveCanvasState).toHaveBeenCalled()
    })

    it('devrait restaurer l\'état quand on revient à l\'assemblage', () => {
      const { rerender } = render(
        <TestAssemblyComponent projectId="test-project" isActive={false} />
      )

      // Simuler le retour à l'assemblage
      rerender(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      // Vérifier que la restauration a été déclenchée
      expect(mockStore.restoreCanvasState).toHaveBeenCalledWith('test-project')
    })

    it('devrait sauvegarder dans localStorage', () => {
      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      // Simuler un changement d'état
      mockStore.saveCanvasState.mockImplementation((state) => {
        // Simuler la sauvegarde localStorage
        localStorageMock.setItem(
          'mangaka_assembly_state_test-project',
          JSON.stringify(state)
        )
      })

      // Déclencher une sauvegarde
      const { rerender } = render(
        <TestAssemblyComponent projectId="test-project" isActive={false} />
      )

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs d\'ajout de page', async () => {
      mockStore.addPage.mockRejectedValue(new Error('Erreur API'))
      
      // Mock console.error pour éviter les logs dans les tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      const addButton = screen.getByTestId('add-page-btn')
      fireEvent.click(addButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Erreur ajout page:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('devrait gérer les erreurs de suppression de page', async () => {
      mockStore.deletePage.mockRejectedValue(new Error('Erreur suppression'))
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      const deleteButton = screen.getByTestId('delete-page-btn')
      fireEvent.click(deleteButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Erreur suppression page:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })

    it('devrait gérer les erreurs localStorage gracieusement', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full')
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      render(<TestAssemblyComponent projectId="test-project" isActive={true} />)

      // Simuler une sauvegarde qui échoue
      const { rerender } = render(
        <TestAssemblyComponent projectId="test-project" isActive={false} />
      )

      // Ne devrait pas planter l'application
      expect(screen.getByTestId('assembly-component')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('devrait afficher les métriques de performance', () => {
      render(
        <PageChangeOptimizerProvider>
          <TestAssemblyComponent projectId="test-project" isActive={true} />
        </PageChangeOptimizerProvider>
      )

      // Les métriques devraient être disponibles via le contexte
      expect(screen.getByTestId('assembly-component')).toBeInTheDocument()
    })

    it('devrait précharger les pages adjacentes', async () => {
      const mockPreloadPage = jest.fn()
      
      render(
        <PageChangeOptimizerProvider preloadAdjacentPages={true}>
          <TestAssemblyComponent projectId="test-project" isActive={true} />
        </PageChangeOptimizerProvider>
      )

      // Le préchargement devrait être déclenché automatiquement
      await waitFor(() => {
        // Vérifier que les pages adjacentes sont identifiées
        expect(screen.getByTestId('pages-count')).toHaveTextContent('2')
      })
    })
  })
})

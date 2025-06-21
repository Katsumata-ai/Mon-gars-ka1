// Tests d'intégration pour le ProjectStore étendu avec assemblage
import { describe, it, expect, beforeEach, afterEach } from '@jest/jest'
import { renderHook, act } from '@testing-library/react'
import { useProjectStore } from '@/stores/projectStore'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('ProjectStore - Intégration Assemblage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Réinitialiser le store
    useProjectStore.getState().initializeProject('test-project', 'test-user', 'Test Project')
  })

  afterEach(() => {
    localStorageMock.clear()
  })

  describe('Gestion de l\'état canvas', () => {
    it('devrait sauvegarder l\'état canvas dans localStorage', () => {
      const { result } = renderHook(() => useProjectStore())

      const canvasState = {
        position: { x: 100, y: 200 },
        zoom: 50,
        currentPageId: 'page-1',
        showGrid: true,
        gridSize: 20,
        activeTool: 'panel',
        lastActiveTab: 'assembly',
        timestamp: Date.now()
      }

      act(() => {
        result.current.saveAssemblyCanvasState(canvasState)
      })

      // Vérifier que l'état est sauvegardé dans le store
      expect(result.current.assemblyData.canvasState).toEqual(canvasState)

      // Vérifier que localStorage.setItem a été appelé
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mangaka_assembly_canvas_test-project',
        JSON.stringify(canvasState)
      )
    })

    it('devrait restaurer l\'état canvas depuis localStorage', () => {
      const { result } = renderHook(() => useProjectStore())

      const savedCanvasState = {
        position: { x: 150, y: 250 },
        zoom: 75,
        currentPageId: 'page-2',
        showGrid: false,
        gridSize: 30,
        activeTool: 'text',
        lastActiveTab: 'assembly',
        timestamp: Date.now() - 1000
      }

      // Mock du localStorage
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedCanvasState))

      let restoredState
      act(() => {
        restoredState = result.current.restoreAssemblyCanvasState()
      })

      // Vérifier que l'état est restauré
      expect(restoredState).toEqual(savedCanvasState)
      expect(result.current.assemblyData.canvasState).toEqual(savedCanvasState)

      // Vérifier que localStorage.getItem a été appelé
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        'mangaka_assembly_canvas_test-project'
      )
    })

    it('devrait gérer les erreurs de localStorage gracieusement', () => {
      const { result } = renderHook(() => useProjectStore())

      // Simuler une erreur localStorage
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage full')
      })

      const canvasState = {
        position: { x: 0, y: 0 },
        zoom: 25,
        currentPageId: null,
        showGrid: true,
        gridSize: 20,
        activeTool: 'select',
        lastActiveTab: 'assembly',
        timestamp: Date.now()
      }

      // Ne devrait pas lever d'exception
      expect(() => {
        act(() => {
          result.current.saveAssemblyCanvasState(canvasState)
        })
      }).not.toThrow()

      // L'état devrait quand même être sauvegardé dans le store
      expect(result.current.assemblyData.canvasState).toEqual(canvasState)
    })
  })

  describe('Sauvegarde globale avec assemblage', () => {
    it('devrait inclure l\'état canvas dans la sauvegarde globale', async () => {
      const { result } = renderHook(() => useProjectStore())

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      const canvasState = {
        position: { x: 300, y: 400 },
        zoom: 100,
        currentPageId: 'page-3',
        showGrid: true,
        gridSize: 25,
        activeTool: 'bubble',
        lastActiveTab: 'assembly',
        timestamp: Date.now()
      }

      // Sauvegarder l'état canvas
      act(() => {
        result.current.saveAssemblyCanvasState(canvasState)
      })

      // Déclencher la sauvegarde globale
      await act(async () => {
        await result.current.saveToDatabase()
      })

      // Vérifier que fetch a été appelé avec les bonnes données
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/projects/test-project/save-all',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(JSON.stringify(canvasState))
        })
      )
    })

    it('devrait utiliser un état canvas par défaut si aucun n\'est défini', async () => {
      const { result } = renderHook(() => useProjectStore())

      // Mock fetch
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })

      // Déclencher la sauvegarde globale sans état canvas
      await act(async () => {
        await result.current.saveToDatabase()
      })

      // Vérifier que fetch a été appelé avec un état par défaut
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
      const requestBody = JSON.parse(fetchCall[1].body)
      
      expect(requestBody.assemblyData.canvasState).toEqual({
        position: { x: 0, y: 0 },
        zoom: 25,
        currentPageId: null,
        showGrid: true,
        gridSize: 20,
        activeTool: 'select',
        lastActiveTab: 'assembly',
        timestamp: expect.any(Number)
      })
    })
  })

  describe('Persistance entre sessions', () => {
    it('devrait maintenir l\'état canvas entre les rechargements', () => {
      const { result: result1 } = renderHook(() => useProjectStore())

      const originalCanvasState = {
        position: { x: 500, y: 600 },
        zoom: 150,
        currentPageId: 'page-4',
        showGrid: false,
        gridSize: 15,
        activeTool: 'image',
        lastActiveTab: 'assembly',
        timestamp: Date.now()
      }

      // Sauvegarder l'état
      act(() => {
        result1.current.saveAssemblyCanvasState(originalCanvasState)
      })

      // Simuler un nouveau rendu (rechargement)
      const { result: result2 } = renderHook(() => useProjectStore())
      
      // Initialiser le nouveau store
      act(() => {
        result2.current.initializeProject('test-project', 'test-user', 'Test Project')
      })

      // Mock localStorage pour retourner l'état sauvegardé
      localStorageMock.getItem.mockReturnValue(JSON.stringify(originalCanvasState))

      // Restaurer l'état
      let restoredState
      act(() => {
        restoredState = result2.current.restoreAssemblyCanvasState()
      })

      // Vérifier que l'état est identique
      expect(restoredState).toEqual(originalCanvasState)
      expect(result2.current.assemblyData.canvasState).toEqual(originalCanvasState)
    })
  })

  describe('Gestion des erreurs', () => {
    it('devrait gérer les données localStorage corrompues', () => {
      const { result } = renderHook(() => useProjectStore())

      // Mock localStorage avec des données corrompues
      localStorageMock.getItem.mockReturnValue('invalid json')

      let restoredState
      act(() => {
        restoredState = result.current.restoreAssemblyCanvasState()
      })

      // Devrait retourner null sans lever d'exception
      expect(restoredState).toBeNull()
      expect(result.current.assemblyData.canvasState).toBeUndefined()
    })

    it('devrait gérer l\'absence de localStorage', () => {
      const { result } = renderHook(() => useProjectStore())

      // Simuler l'absence de localStorage
      const originalLocalStorage = window.localStorage
      delete (window as any).localStorage

      const canvasState = {
        position: { x: 0, y: 0 },
        zoom: 25,
        currentPageId: null,
        showGrid: true,
        gridSize: 20,
        activeTool: 'select',
        lastActiveTab: 'assembly',
        timestamp: Date.now()
      }

      // Ne devrait pas lever d'exception
      expect(() => {
        act(() => {
          result.current.saveAssemblyCanvasState(canvasState)
        })
      }).not.toThrow()

      // Restaurer localStorage
      window.localStorage = originalLocalStorage
    })
  })
})

// Tests unitaires pour les API routes de gestion des pages
import { describe, it, expect, beforeEach, afterEach } from '@jest/jest'
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase)
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve(mockSupabase))
}))

describe('API Routes - Gestion des Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/projects/[id]/pages/duplicate', () => {
    it('devrait dupliquer une page avec succès', async () => {
      // Mock des données
      const sourcePage = {
        id: 'page-1',
        project_id: 'project-1',
        page_number: 1,
        title: 'Page 1',
        content: { stage: { children: [] } },
        metadata: { version: '1.0' },
        status: 'draft'
      }

      const allPages = [{ page_number: 1 }, { page_number: 2 }]
      
      const newPage = {
        ...sourcePage,
        id: 'page-3',
        page_number: 3,
        title: 'Page 1 (Copie)'
      }

      // Configuration des mocks
      mockSupabase.single.mockResolvedValueOnce({ data: sourcePage, error: null })
      mockSupabase.order.mockResolvedValueOnce({ data: allPages, error: null })
      mockSupabase.single.mockResolvedValueOnce({ data: newPage, error: null })
      mockSupabase.update.mockResolvedValueOnce({ error: null })

      // Import dynamique de la route
      const { POST } = await import('@/app/api/projects/[id]/pages/duplicate/route')

      // Création de la requête mock
      const { req } = createMocks({
        method: 'POST',
        body: { sourcePageId: 'page-1' }
      })

      const request = new NextRequest(req.url || 'http://localhost', {
        method: 'POST',
        body: JSON.stringify({ sourcePageId: 'page-1' })
      })

      const params = Promise.resolve({ id: 'project-1' })

      // Exécution
      const response = await POST(request, { params })
      const result = await response.json()

      // Vérifications
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.page.title).toBe('Page 1 (Copie)')
      expect(result.page.page_number).toBe(3)
    })

    it('devrait retourner une erreur si la page source n\'existe pas', async () => {
      mockSupabase.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found' } })

      const { POST } = await import('@/app/api/projects/[id]/pages/duplicate/route')

      const { req } = createMocks({
        method: 'POST',
        body: { sourcePageId: 'page-inexistante' }
      })

      const request = new NextRequest(req.url || 'http://localhost', {
        method: 'POST',
        body: JSON.stringify({ sourcePageId: 'page-inexistante' })
      })

      const params = Promise.resolve({ id: 'project-1' })
      const response = await POST(request, { params })
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Page source non trouvée')
    })
  })

  describe('DELETE /api/projects/[id]/pages/[pageId]', () => {
    it('devrait supprimer une page et renuméroter les autres', async () => {
      const pageToDelete = { page_number: 2 }
      const allPages = [{ id: 'page-1' }, { id: 'page-2' }, { id: 'page-3' }]

      mockSupabase.single.mockResolvedValueOnce({ data: pageToDelete, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: allPages, error: null })
      mockSupabase.delete.mockResolvedValueOnce({ error: null })
      mockSupabase.rpc.mockResolvedValueOnce({ error: null })
      mockSupabase.update.mockResolvedValueOnce({ error: null })

      const { DELETE } = await import('@/app/api/projects/[id]/pages/[pageId]/route')

      const { req } = createMocks({ method: 'DELETE' })
      const request = new NextRequest(req.url || 'http://localhost', { method: 'DELETE' })
      const params = Promise.resolve({ id: 'project-1', pageId: 'page-2' })

      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.deletedPageNumber).toBe(2)
      expect(result.newPagesCount).toBe(2)
    })

    it('devrait empêcher la suppression de la dernière page', async () => {
      const pageToDelete = { page_number: 1 }
      const allPages = [{ id: 'page-1' }] // Une seule page

      mockSupabase.single.mockResolvedValueOnce({ data: pageToDelete, error: null })
      mockSupabase.select.mockResolvedValueOnce({ data: allPages, error: null })

      const { DELETE } = await import('@/app/api/projects/[id]/pages/[pageId]/route')

      const { req } = createMocks({ method: 'DELETE' })
      const request = new NextRequest(req.url || 'http://localhost', { method: 'DELETE' })
      const params = Promise.resolve({ id: 'project-1', pageId: 'page-1' })

      const response = await DELETE(request, { params })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de supprimer la dernière page')
    })
  })

  describe('PUT /api/projects/[id]/pages/reorder', () => {
    it('devrait réorganiser les pages avec succès', async () => {
      const existingPages = [
        { id: 'page-1', page_number: 1 },
        { id: 'page-2', page_number: 2 },
        { id: 'page-3', page_number: 3 }
      ]

      const pageOrders = [
        { pageId: 'page-3', newPageNumber: 1 },
        { pageId: 'page-1', newPageNumber: 2 },
        { pageId: 'page-2', newPageNumber: 3 }
      ]

      mockSupabase.in.mockResolvedValueOnce({ data: existingPages, error: null })
      mockSupabase.rpc.mockResolvedValueOnce({ error: null })
      mockSupabase.update.mockResolvedValueOnce({ error: null })

      const { PUT } = await import('@/app/api/projects/[id]/pages/reorder/route')

      const { req } = createMocks({
        method: 'PUT',
        body: { pageOrders }
      })

      const request = new NextRequest(req.url || 'http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ pageOrders })
      })

      const params = Promise.resolve({ id: 'project-1' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.reorderedPages).toBe(3)
    })

    it('devrait rejeter une numérotation non séquentielle', async () => {
      const pageOrders = [
        { pageId: 'page-1', newPageNumber: 1 },
        { pageId: 'page-2', newPageNumber: 3 }, // Saut dans la numérotation
        { pageId: 'page-3', newPageNumber: 4 }
      ]

      const { PUT } = await import('@/app/api/projects/[id]/pages/reorder/route')

      const { req } = createMocks({
        method: 'PUT',
        body: { pageOrders }
      })

      const request = new NextRequest(req.url || 'http://localhost', {
        method: 'PUT',
        body: JSON.stringify({ pageOrders })
      })

      const params = Promise.resolve({ id: 'project-1' })
      const response = await PUT(request, { params })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Numérotation invalide - doit être séquentielle')
    })
  })
})

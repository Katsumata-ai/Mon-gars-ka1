'use client'

// Panneau de test pour le système d'export
// À utiliser en développement pour valider les fonctionnalités

import React, { useState } from 'react'
import { Download, TestTube, FileImage, FileText, Play, CheckCircle, XCircle } from 'lucide-react'
import { ExportManager, downloadBlob } from '@/services/ExportManager'
import { useAssemblyStore } from '../managers/StateManager'
import { toast } from 'react-hot-toast'

interface TestResult {
  name: string
  status: 'pending' | 'running' | 'success' | 'error'
  message?: string
  duration?: number
}

export default function ExportTestPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const { pages, currentPageId } = useAssemblyStore()

  const updateTestResult = (name: string, status: TestResult['status'], message?: string, duration?: number) => {
    setTestResults(prev => prev.map(test => 
      test.name === name 
        ? { ...test, status, message, duration }
        : test
    ))
  }

  const runTests = async () => {
    if (!currentPageId) {
      toast.error('Aucune page sélectionnée')
      return
    }

    const currentPage = pages[currentPageId]
    if (!currentPage) {
      toast.error('Page courante introuvable')
      return
    }

    setIsRunning(true)
    setTestResults([
      { name: 'Récupération des pages', status: 'pending' },
      { name: 'Export PNG', status: 'pending' },
      { name: 'Export PDF', status: 'pending' },
      { name: 'Validation des fichiers', status: 'pending' }
    ])

    const exportManager = new ExportManager()
    const projectId = currentPage.projectId

    try {
      // Test 1: Récupération des pages
      updateTestResult('Récupération des pages', 'running')
      const startTime1 = Date.now()
      
      const pagesData = await exportManager.fetchAllPages(projectId)
      const duration1 = Date.now() - startTime1
      
      if (pagesData.length > 0) {
        updateTestResult('Récupération des pages', 'success', `${pagesData.length} pages trouvées`, duration1)
      } else {
        updateTestResult('Récupération des pages', 'error', 'Aucune page trouvée')
        return
      }

      // Test 2: Export PNG
      updateTestResult('Export PNG', 'running')
      const startTime2 = Date.now()
      
      const pngBlob = await exportManager.exportPages({
        projectId,
        format: 'png',
        quality: 0.8,
        resolution: 1,
        pageIds: [currentPageId],
        onProgress: (progress) => {
          updateTestResult('Export PNG', 'running', `${progress.step}: ${Math.round((progress.current / progress.total) * 100)}%`)
        }
      })
      
      const duration2 = Date.now() - startTime2
      const sizeMB = (pngBlob.size / (1024 * 1024)).toFixed(2)
      updateTestResult('Export PNG', 'success', `${sizeMB} MB généré`, duration2)

      // Télécharger pour test
      downloadBlob(pngBlob, `test-export-${Date.now()}.png`)

      // Test 3: Export PDF
      updateTestResult('Export PDF', 'running')
      const startTime3 = Date.now()
      
      const pdfBlob = await exportManager.exportPages({
        projectId,
        format: 'pdf',
        quality: 0.8,
        resolution: 1,
        pageIds: [currentPageId],
        onProgress: (progress) => {
          updateTestResult('Export PDF', 'running', `${progress.step}: ${Math.round((progress.current / progress.total) * 100)}%`)
        }
      })
      
      const duration3 = Date.now() - startTime3
      const pdfSizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(2)
      updateTestResult('Export PDF', 'success', `${pdfSizeMB} MB généré`, duration3)

      // Télécharger pour test
      downloadBlob(pdfBlob, `test-export-${Date.now()}.pdf`)

      // Test 4: Validation
      updateTestResult('Validation des fichiers', 'running')
      
      const validationMessages = []
      if (pngBlob.size > 0) validationMessages.push('PNG valide')
      if (pdfBlob.size > 0) validationMessages.push('PDF valide')
      if (pngBlob.type === 'image/png') validationMessages.push('Type PNG correct')
      if (pdfBlob.type === 'application/pdf') validationMessages.push('Type PDF correct')
      
      updateTestResult('Validation des fichiers', 'success', validationMessages.join(', '))

      toast.success('Tous les tests d\'export réussis !')

    } catch (error) {
      console.error('Erreur test export:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      
      // Marquer le test en cours comme échoué
      setTestResults(prev => prev.map(test => 
        test.status === 'running' 
          ? { ...test, status: 'error', message: errorMessage }
          : test
      ))
      
      toast.error(`Erreur test export: ${errorMessage}`)
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
    }
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Ouvrir le panneau de test d'export"
      >
        <TestTube className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border w-96 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium">Test Export</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Info */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            <div>Pages disponibles: {Object.keys(pages).length}</div>
            <div>Page courante: {currentPageId ? 'Sélectionnée' : 'Aucune'}</div>
          </div>
        </div>

        {/* Bouton de test */}
        <button
          onClick={runTests}
          disabled={isRunning || !currentPageId}
          className="w-full mb-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          <Play className="w-4 h-4" />
          <span>{isRunning ? 'Tests en cours...' : 'Lancer les tests'}</span>
        </button>

        {/* Résultats */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Résultats:</h4>
            {testResults.map((test, index) => (
              <div key={index} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                {getStatusIcon(test.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{test.name}</div>
                  {test.message && (
                    <div className="text-xs text-gray-600 mt-1">{test.message}</div>
                  )}
                  {test.duration && (
                    <div className="text-xs text-gray-500 mt-1">{test.duration}ms</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions rapides */}
        <div className="mt-4 pt-4 border-t">
          <div className="text-xs text-gray-500 mb-2">Actions rapides:</div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (currentPageId) {
                  const currentPage = pages[currentPageId]
                  if (currentPage) {
                    const exportManager = new ExportManager()
                    exportManager.exportPages({
                      projectId: currentPage.projectId,
                      format: 'png',
                      quality: 0.9,
                      resolution: 2,
                      pageIds: [currentPageId]
                    }).then(blob => {
                      downloadBlob(blob, `quick-export-${Date.now()}.png`)
                      toast.success('Export PNG rapide réussi')
                    }).catch(error => {
                      toast.error(`Erreur export: ${error.message}`)
                    })
                  }
                }
              }}
              disabled={!currentPageId}
              className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700 disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              <FileImage className="w-3 h-3" />
              <span>PNG</span>
            </button>
            <button
              onClick={() => {
                if (currentPageId) {
                  const currentPage = pages[currentPageId]
                  if (currentPage) {
                    const exportManager = new ExportManager()
                    exportManager.exportPages({
                      projectId: currentPage.projectId,
                      format: 'pdf',
                      quality: 0.9,
                      resolution: 2,
                      pageIds: [currentPageId]
                    }).then(blob => {
                      downloadBlob(blob, `quick-export-${Date.now()}.pdf`)
                      toast.success('Export PDF rapide réussi')
                    }).catch(error => {
                      toast.error(`Erreur export: ${error.message}`)
                    })
                  }
                }
              }}
              disabled={!currentPageId}
              className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700 disabled:opacity-50 flex items-center justify-center space-x-1"
            >
              <FileText className="w-3 h-3" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

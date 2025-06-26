'use client'

import React, { useEffect, useState } from 'react'
import { usePolotnoContext } from '../context/PolotnoContext'

interface TestResult {
  test: string
  success: boolean
  message: string
}

/**
 * Composant de test pour vérifier le système de désélection automatique lors du zoom
 */
export default function ZoomDeselectionTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { zoomIn, zoomOut, resetZoom, zoomLevel } = usePolotnoContext()

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 ZoomDeselectionTest: Début des tests de désélection automatique')
      setIsRunning(true)
      setTestResults([])

      // Test 1: Vérifier que zoomIn déclenche la désélection
      const test1Start = performance.now()
      try {
        let deselectEventReceived = false
        let forceDeselectEventReceived = false

        const globalDeselectHandler = (event: CustomEvent) => {
          if (event.detail.source === 'zoom-operation') {
            deselectEventReceived = true
          }
        }

        const forceDeselectHandler = (event: CustomEvent) => {
          if (event.detail.source === 'zoom-operation') {
            forceDeselectEventReceived = true
          }
        }

        window.addEventListener('globalDeselect', globalDeselectHandler)
        window.addEventListener('forceDeselectAll', forceDeselectHandler)

        // Déclencher zoomIn
        zoomIn()
        
        // Attendre un frame pour que les événements soient traités
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        const test1Latency = performance.now() - test1Start
        const test1Success = deselectEventReceived && forceDeselectEventReceived
        
        const test1Result = {
          test: 'ZoomIn déclenche désélection',
          success: test1Success,
          message: test1Success 
            ? `Événements de désélection déclenchés en ${test1Latency.toFixed(2)}ms`
            : `Échec: globalDeselect=${deselectEventReceived}, forceDeselect=${forceDeselectEventReceived}`
        }
        setTestResults(prev => [...prev, test1Result])

        window.removeEventListener('globalDeselect', globalDeselectHandler)
        window.removeEventListener('forceDeselectAll', forceDeselectHandler)
      } catch (error) {
        const test1Result = {
          test: 'ZoomIn déclenche désélection',
          success: false,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }
        setTestResults(prev => [...prev, test1Result])
      }

      // Test 2: Vérifier que zoomOut déclenche la désélection
      const test2Start = performance.now()
      try {
        let deselectEventReceived = false

        const globalDeselectHandler = (event: CustomEvent) => {
          if (event.detail.source === 'zoom-operation') {
            deselectEventReceived = true
          }
        }

        window.addEventListener('globalDeselect', globalDeselectHandler)

        // Déclencher zoomOut
        zoomOut()
        
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        const test2Latency = performance.now() - test2Start
        const test2Success = deselectEventReceived
        
        const test2Result = {
          test: 'ZoomOut déclenche désélection',
          success: test2Success,
          message: test2Success 
            ? `Désélection déclenchée en ${test2Latency.toFixed(2)}ms`
            : `Échec: événement globalDeselect non reçu`
        }
        setTestResults(prev => [...prev, test2Result])

        window.removeEventListener('globalDeselect', globalDeselectHandler)
      } catch (error) {
        const test2Result = {
          test: 'ZoomOut déclenche désélection',
          success: false,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }
        setTestResults(prev => [...prev, test2Result])
      }

      // Test 3: Vérifier que resetZoom déclenche la désélection
      const test3Start = performance.now()
      try {
        let deselectEventReceived = false

        const globalDeselectHandler = (event: CustomEvent) => {
          if (event.detail.source === 'zoom-operation') {
            deselectEventReceived = true
          }
        }

        window.addEventListener('globalDeselect', globalDeselectHandler)

        // Déclencher resetZoom
        resetZoom()
        
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        const test3Latency = performance.now() - test3Start
        const test3Success = deselectEventReceived
        
        const test3Result = {
          test: 'ResetZoom déclenche désélection',
          success: test3Success,
          message: test3Success 
            ? `Désélection déclenchée en ${test3Latency.toFixed(2)}ms`
            : `Échec: événement globalDeselect non reçu`
        }
        setTestResults(prev => [...prev, test3Result])

        window.removeEventListener('globalDeselect', globalDeselectHandler)
      } catch (error) {
        const test3Result = {
          test: 'ResetZoom déclenche désélection',
          success: false,
          message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        }
        setTestResults(prev => [...prev, test3Result])
      }

      console.log('🧪 ZoomDeselectionTest: Tests terminés')
      setIsRunning(false)
    }

    // Lancer les tests automatiquement au montage
    runTests()
  }, [zoomIn, zoomOut, resetZoom])

  const successCount = testResults.filter(result => result.success).length
  const totalTests = testResults.length

  return (
    <div className="fixed top-4 right-4 bg-dark-800 border border-dark-600 rounded-lg p-4 max-w-md z-[9999]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Test Désélection Zoom</h3>
        <div className="text-xs text-gray-400">
          Zoom: {zoomLevel}%
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-300">Tests en cours...</span>
        </div>
      )}

      {!isRunning && testResults.length > 0 && (
        <div className="mb-3">
          <div className="text-sm text-gray-300 mb-2">
            Résultats: {successCount}/{totalTests} réussis
          </div>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs">
                <div className={`font-medium ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                  {result.success ? '✅' : '❌'} {result.test}
                </div>
                <div className="text-gray-400 ml-4">
                  {result.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        [FR-UNTRANSLATED: Ce composant teste automatiquement que les opérations de zoom déclenchent la désélection.]
      </div>
    </div>
  )
}

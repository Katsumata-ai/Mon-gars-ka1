'use client'

import React, { useEffect, useState } from 'react'
import { usePolotnoContext } from '../context/PolotnoContext'

interface CursorTestResult {
  test: string
  success: boolean
  message: string
  timestamp: number
}

/**
 * Composant de test pour vérifier le comportement cohérent du curseur crosshair
 */
export default function ConsistentCursorTest() {
  const [testResults, setTestResults] = useState<CursorTestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentCursor, setCurrentCursor] = useState<string>('default')
  const { activeTool, bubbleCreationMode, bubbleTypeToCreate } = usePolotnoContext()

  const addTestResult = (test: string, success: boolean, message: string) => {
    const result: CursorTestResult = {
      test,
      success,
      message,
      timestamp: Date.now()
    }
    setTestResults(prev => [...prev, result])
    console.log(`🖱️ ConsistentCursorTest: ${success ? '✅' : '❌'} ${test} - ${message}`)
  }

  // Surveiller le curseur actuel
  useEffect(() => {
    const updateCursor = () => {
      const canvasContainer = document.querySelector('.canvas-interface') as HTMLElement
      if (canvasContainer) {
        const computedStyle = window.getComputedStyle(canvasContainer)
        setCurrentCursor(computedStyle.cursor)
      }
    }

    updateCursor()
    const interval = setInterval(updateCursor, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const runTests = async () => {
      console.log('🖱️ ConsistentCursorTest: Début des tests de curseur cohérent')
      setIsRunning(true)
      setTestResults([])

      // Test 1: Vérifier que le curseur crosshair est appliqué pour l'outil texte
      try {
        const isTextTool = activeTool === 'text'
        const hasCorrectCursor = currentCursor.includes('crosshair') || currentCursor === 'crosshair'
        
        if (isTextTool) {
          addTestResult(
            'Curseur crosshair outil texte',
            hasCorrectCursor,
            hasCorrectCursor 
              ? `Curseur crosshair appliqué: ${currentCursor}`
              : `Curseur incorrect: ${currentCursor}, attendu: crosshair`
          )
        } else {
          addTestResult(
            'Curseur crosshair outil texte',
            true,
            'Outil texte non actif - test non applicable'
          )
        }
      } catch (error) {
        addTestResult(
          'Curseur crosshair outil texte',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 2: Vérifier que le curseur crosshair est appliqué pour l'outil bulle
      try {
        const isBubbleTool = activeTool === 'bubble' || bubbleCreationMode
        const hasCorrectCursor = currentCursor.includes('crosshair') || currentCursor === 'crosshair'
        
        if (isBubbleTool) {
          addTestResult(
            'Curseur crosshair outil bulle',
            hasCorrectCursor,
            hasCorrectCursor 
              ? `Curseur crosshair appliqué: ${currentCursor}`
              : `Curseur incorrect: ${currentCursor}, attendu: crosshair`
          )
        } else {
          addTestResult(
            'Curseur crosshair outil bulle',
            true,
            'Outil bulle non actif - test non applicable'
          )
        }
      } catch (error) {
        addTestResult(
          'Curseur crosshair outil bulle',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 3: Vérifier que les styles CSS sont appliqués
      try {
        const styleElement = document.getElementById('consistent-cursor-styles')
        const hasStyles = styleElement !== null
        
        addTestResult(
          'Styles CSS curseur',
          hasStyles,
          hasStyles 
            ? 'Styles CSS pour curseur cohérent trouvés'
            : 'Styles CSS pour curseur cohérent manquants'
        )
      } catch (error) {
        addTestResult(
          'Styles CSS curseur',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 4: Vérifier que la classe force-crosshair-cursor est appliquée
      try {
        const canvasContainer = document.querySelector('.canvas-interface') as HTMLElement
        const hasClass = canvasContainer?.classList.contains('force-crosshair-cursor')
        const shouldHaveClass = activeTool === 'text' || activeTool === 'bubble' || bubbleCreationMode
        
        if (shouldHaveClass) {
          addTestResult(
            'Classe CSS force-crosshair',
            hasClass || false,
            hasClass 
              ? 'Classe force-crosshair-cursor appliquée'
              : 'Classe force-crosshair-cursor manquante'
          )
        } else {
          addTestResult(
            'Classe CSS force-crosshair',
            !hasClass,
            !hasClass 
              ? 'Classe force-crosshair-cursor correctement absente'
              : 'Classe force-crosshair-cursor ne devrait pas être présente'
          )
        }
      } catch (error) {
        addTestResult(
          'Classe CSS force-crosshair',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 5: Vérifier que les éléments enfants héritent du curseur
      try {
        const panelElements = document.querySelectorAll('[data-panel-id]')
        const bubbleElements = document.querySelectorAll('[data-bubble-id]')
        const textElements = document.querySelectorAll('[data-text-id]')
        
        let inheritanceCorrect = true
        let checkedElements = 0
        
        const shouldHaveCrosshair = activeTool === 'text' || activeTool === 'bubble' || bubbleCreationMode
        
        if (shouldHaveCrosshair) {
          // Vérifier quelques éléments
          const elementsToCheck = [
            ...Array.from(panelElements).slice(0, 2),
            ...Array.from(bubbleElements).slice(0, 2),
            ...Array.from(textElements).slice(0, 2)
          ]
          
          elementsToCheck.forEach(element => {
            const computedStyle = window.getComputedStyle(element as HTMLElement)
            if (!computedStyle.cursor.includes('crosshair')) {
              inheritanceCorrect = false
            }
            checkedElements++
          })
        }
        
        addTestResult(
          'Héritage curseur éléments',
          inheritanceCorrect,
          shouldHaveCrosshair 
            ? `${checkedElements} éléments vérifiés - héritage ${inheritanceCorrect ? 'correct' : 'incorrect'}`
            : 'Outils de création non actifs - test non applicable'
        )
      } catch (error) {
        addTestResult(
          'Héritage curseur éléments',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      console.log('🖱️ ConsistentCursorTest: Tests terminés')
      setIsRunning(false)
    }

    // Lancer les tests automatiquement quand l'état change
    runTests()
  }, [activeTool, bubbleCreationMode, bubbleTypeToCreate, currentCursor])

  const successCount = testResults.filter(result => result.success).length
  const totalTests = testResults.length

  return (
    <div className="fixed bottom-4 right-4 bg-dark-800 border border-dark-600 rounded-lg p-4 max-w-md z-[9999]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Test Curseur Cohérent</h3>
        <div className="text-xs text-gray-400">
          Curseur: {currentCursor}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Outil: {activeTool} | 
        Bulle: {bubbleCreationMode ? 'Actif' : 'Inactif'} | 
        Type: {bubbleTypeToCreate || 'Aucun'}
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
          <div className="space-y-2 max-h-48 overflow-y-auto">
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
        Ce composant teste que le curseur crosshair reste cohérent pour les outils bulle et texte.
      </div>
    </div>
  )
}

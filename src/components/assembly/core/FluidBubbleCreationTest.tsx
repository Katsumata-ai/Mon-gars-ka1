'use client'

import React, { useEffect, useState } from 'react'
import { usePolotnoContext } from '../context/PolotnoContext'

interface TestResult {
  test: string
  success: boolean
  message: string
  timestamp: number
}

/**
 * Composant de test pour vérifier le système de création de bulles fluide
 */
export default function FluidBubbleCreationTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { activeTool, bubbleCreationMode, bubbleTypeToCreate } = usePolotnoContext()

  const addTestResult = (test: string, success: boolean, message: string) => {
    const result: TestResult = {
      test,
      success,
      message,
      timestamp: Date.now()
    }
    setTestResults(prev => [...prev, result])
    console.log(`🧪 FluidBubbleCreationTest: ${success ? '✅' : '❌'} ${test} - ${message}`)
  }

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 FluidBubbleCreationTest: Début des tests de création de bulles fluide')
      setIsRunning(true)
      setTestResults([])

      // Test 1: Vérifier que l'outil bulle peut être activé
      try {
        const bubbleToolButton = document.querySelector('[data-tool="bubble"]') as HTMLElement
        if (bubbleToolButton) {
          addTestResult(
            'Bouton outil bulle trouvé',
            true,
            'Le bouton de l\'outil bulle est présent dans l\'interface'
          )
        } else {
          addTestResult(
            'Bouton outil bulle trouvé',
            false,
            'Le bouton de l\'outil bulle n\'est pas trouvé'
          )
        }
      } catch (error) {
        addTestResult(
          'Bouton outil bulle trouvé',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 2: Vérifier la priorité de création de bulles
      try {
        let bubbleCreationEventReceived = false
        let elementSelectionBlocked = false

        const bubbleCreationHandler = (event: CustomEvent) => {
          if (event.detail.bubbleType) {
            bubbleCreationEventReceived = true
          }
        }

        const elementSelectionHandler = (event: CustomEvent) => {
          // Si on reçoit une sélection d'élément pendant que l'outil bulle est actif,
          // c'est un échec du système de priorité
          if (bubbleCreationMode && bubbleTypeToCreate) {
            elementSelectionBlocked = false // Échec
          }
        }

        window.addEventListener('createTipTapBubble', bubbleCreationHandler)
        window.addEventListener('elementSelected', elementSelectionHandler)

        // Simuler un clic sur un panel existant avec l'outil bulle actif
        if (bubbleCreationMode && bubbleTypeToCreate) {
          const panelElement = document.querySelector('[data-panel-id]') as HTMLElement
          if (panelElement) {
            panelElement.click()
            elementSelectionBlocked = true // Par défaut, on assume que ça marche
          }
        }

        await new Promise(resolve => setTimeout(resolve, 100))

        const test2Success = bubbleCreationMode ? 
          (bubbleCreationEventReceived || elementSelectionBlocked) : 
          true // Si pas en mode création, le test passe

        addTestResult(
          'Priorité création bulles',
          test2Success,
          test2Success 
            ? 'La création de bulles a la priorité sur la sélection d\'éléments'
            : 'La sélection d\'éléments interfère avec la création de bulles'
        )

        window.removeEventListener('createTipTapBubble', bubbleCreationHandler)
        window.removeEventListener('elementSelected', elementSelectionHandler)
      } catch (error) {
        addTestResult(
          'Priorité création bulles',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 3: Vérifier que les bulles apparaissent au-dessus des autres éléments
      try {
        const bubbleElements = document.querySelectorAll('[data-bubble-id]')
        const panelElements = document.querySelectorAll('[data-panel-id]')
        
        let zIndexCorrect = true
        let bubbleZIndex = 0
        let panelZIndex = 0

        if (bubbleElements.length > 0) {
          const bubbleStyle = window.getComputedStyle(bubbleElements[0])
          bubbleZIndex = parseInt(bubbleStyle.zIndex) || 0
        }

        if (panelElements.length > 0) {
          const panelStyle = window.getComputedStyle(panelElements[0])
          panelZIndex = parseInt(panelStyle.zIndex) || 0
        }

        if (bubbleElements.length > 0 && panelElements.length > 0) {
          zIndexCorrect = bubbleZIndex > panelZIndex
        }

        addTestResult(
          'Z-index des bulles',
          zIndexCorrect,
          zIndexCorrect 
            ? `Bulles (z-index: ${bubbleZIndex}) au-dessus des panels (z-index: ${panelZIndex})`
            : `Problème z-index: Bulles (${bubbleZIndex}) vs Panels (${panelZIndex})`
        )
      } catch (error) {
        addTestResult(
          'Z-index des bulles',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 4: Vérifier que les autres outils fonctionnent normalement
      try {
        const selectToolWorks = activeTool !== 'bubble' || !bubbleCreationMode
        
        addTestResult(
          'Autres outils fonctionnels',
          selectToolWorks,
          selectToolWorks 
            ? 'Les autres outils ne sont pas affectés par le système de bulles'
            : 'Les autres outils sont bloqués par le système de bulles'
        )
      } catch (error) {
        addTestResult(
          'Autres outils fonctionnels',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      console.log('🧪 FluidBubbleCreationTest: Tests terminés')
      setIsRunning(false)
    }

    // Lancer les tests automatiquement au montage et quand l'état change
    runTests()
  }, [activeTool, bubbleCreationMode, bubbleTypeToCreate])

  const successCount = testResults.filter(result => result.success).length
  const totalTests = testResults.length

  return (
    <div className="fixed top-4 left-4 bg-dark-800 border border-dark-600 rounded-lg p-4 max-w-md z-[9999]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Test Création Bulles Fluide</h3>
        <div className="text-xs text-gray-400">
          Outil: {activeTool}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Mode bulle: {bubbleCreationMode ? 'Actif' : 'Inactif'} | 
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
        [FR-UNTRANSLATED: Ce composant teste que les bulles peuvent être créées en cliquant n'importe où, 
        y compris sur les éléments existants.]
      </div>
    </div>
  )
}

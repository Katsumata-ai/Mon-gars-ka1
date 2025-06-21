'use client'

import React, { useEffect, useState } from 'react'
import { usePolotnoContext } from '../context/PolotnoContext'
import { useAssemblyStore } from '../managers/StateManager'
import { useCanvasContext } from '../context/CanvasContext'

interface TestResult {
  test: string
  success: boolean
  message: string
  timestamp: number
}

/**
 * Composant de test pour vérifier la synchronisation de la sélection automatique
 * entre la création d'éléments et le panneau Settings
 */
export default function AutoSelectionSyncTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const { activeTool, bubbleCreationMode, bubbleTypeToCreate } = usePolotnoContext()
  const { selectedElementIds } = useAssemblyStore()
  const { elements } = useCanvasContext()

  const addTestResult = (test: string, success: boolean, message: string) => {
    const result: TestResult = {
      test,
      success,
      message,
      timestamp: Date.now()
    }
    setTestResults(prev => [...prev, result])
    console.log(`🧪 AutoSelectionSyncTest: ${success ? '✅' : '❌'} ${test} - ${message}`)
  }

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 AutoSelectionSyncTest: Début des tests de synchronisation de sélection automatique')
      setIsRunning(true)
      setTestResults([])

      // Test 1: Vérifier que les éléments créés sont dans CanvasContext
      try {
        const textElements = elements.filter(el => el.type === 'text')
        const bubbleElements = elements.filter(el => el.type === 'dialogue')
        
        addTestResult(
          'Éléments dans CanvasContext',
          textElements.length > 0 || bubbleElements.length > 0,
          `${textElements.length} textes, ${bubbleElements.length} bulles trouvés`
        )
      } catch (error) {
        addTestResult(
          'Éléments dans CanvasContext',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 2: Vérifier que selectedElementIds est synchronisé
      try {
        const hasSelection = selectedElementIds.length > 0
        const selectedElement = hasSelection ? elements.find(el => el.id === selectedElementIds[0]) : null
        
        addTestResult(
          'Synchronisation selectedElementIds',
          hasSelection ? selectedElement !== undefined : true,
          hasSelection 
            ? `Élément sélectionné: ${selectedElement?.type} (${selectedElementIds[0]})`
            : 'Aucune sélection (normal si aucun élément créé récemment)'
        )
      } catch (error) {
        addTestResult(
          'Synchronisation selectedElementIds',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 3: Vérifier les événements de sélection
      try {
        let elementSelectedEventReceived = false
        let textClickedEventReceived = false
        let bubbleClickedEventReceived = false

        const elementSelectedHandler = (event: Event) => {
          const customEvent = event as CustomEvent
          if (customEvent.detail && customEvent.detail.id) {
            elementSelectedEventReceived = true
          }
        }

        const textClickedHandler = (event: Event) => {
          const customEvent = event as CustomEvent
          if (customEvent.detail && customEvent.detail.textId) {
            textClickedEventReceived = true
          }
        }

        const bubbleClickedHandler = (event: Event) => {
          const customEvent = event as CustomEvent
          if (customEvent.detail && customEvent.detail.bubbleId) {
            bubbleClickedEventReceived = true
          }
        }

        window.addEventListener('elementSelected', elementSelectedHandler)
        window.addEventListener('textClicked', textClickedHandler)
        window.addEventListener('bubbleClicked', bubbleClickedHandler)

        // Attendre un peu pour capturer les événements
        await new Promise(resolve => setTimeout(resolve, 200))

        const eventsWorking = elementSelectedEventReceived || textClickedEventReceived || bubbleClickedEventReceived

        addTestResult(
          'Événements de sélection',
          eventsWorking,
          eventsWorking 
            ? `Événements détectés: elementSelected=${elementSelectedEventReceived}, textClicked=${textClickedEventReceived}, bubbleClicked=${bubbleClickedEventReceived}`
            : 'Aucun événement de sélection détecté (normal si aucun élément créé récemment)'
        )

        window.removeEventListener('elementSelected', elementSelectedHandler)
        window.removeEventListener('textClicked', textClickedHandler)
        window.removeEventListener('bubbleClicked', bubbleClickedHandler)
      } catch (error) {
        addTestResult(
          'Événements de sélection',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 4: Vérifier que le panneau Settings peut détecter la sélection
      try {
        const settingsPanel = document.querySelector('[data-testid="settings-panel"]') as HTMLElement
        const hasSettingsContent = settingsPanel && !settingsPanel.textContent?.includes('Sélectionner un élément')
        
        addTestResult(
          'Détection par Settings Panel',
          selectedElementIds.length === 0 || hasSettingsContent,
          selectedElementIds.length > 0 
            ? (hasSettingsContent ? 'Settings Panel affiche les contrôles d\'élément' : 'Settings Panel n\'affiche pas les contrôles')
            : 'Aucune sélection à tester'
        )
      } catch (error) {
        addTestResult(
          'Détection par Settings Panel',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      // Test 5: Vérifier la cohérence entre les systèmes
      try {
        const textElements = elements.filter(el => el.type === 'text')
        const bubbleElements = elements.filter(el => el.type === 'dialogue')
        const totalElements = textElements.length + bubbleElements.length
        
        const hasElements = totalElements > 0
        const hasSelection = selectedElementIds.length > 0
        const selectionMatchesElements = hasSelection ? elements.some(el => el.id === selectedElementIds[0]) : true
        
        const isConsistent = !hasElements || selectionMatchesElements
        
        addTestResult(
          'Cohérence des systèmes',
          isConsistent,
          isConsistent 
            ? `${totalElements} éléments, ${selectedElementIds.length} sélectionnés - Cohérent`
            : `Incohérence: ${totalElements} éléments mais sélection invalide`
        )
      } catch (error) {
        addTestResult(
          'Cohérence des systèmes',
          false,
          `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
        )
      }

      console.log('🧪 AutoSelectionSyncTest: Tests terminés')
      setIsRunning(false)
    }

    // Lancer les tests automatiquement quand l'état change
    runTests()
  }, [activeTool, bubbleCreationMode, bubbleTypeToCreate, selectedElementIds, elements])

  const successCount = testResults.filter(result => result.success).length
  const totalTests = testResults.length

  return (
    <div className="fixed bottom-4 left-4 bg-dark-800 border border-dark-600 rounded-lg p-4 max-w-md z-[9999]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-medium">Test Sync Sélection Auto</h3>
        <div className="text-xs text-gray-400">
          Sélectionnés: {selectedElementIds.length}
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Éléments: {elements.length} | 
        Outil: {activeTool} | 
        Bulle: {bubbleCreationMode ? 'Actif' : 'Inactif'}
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
        Ce composant teste que la sélection automatique après création 
        est synchronisée avec le panneau Settings.
      </div>
    </div>
  )
}

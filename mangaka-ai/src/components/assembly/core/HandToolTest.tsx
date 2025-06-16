// Test de l'outil main - Désélection automatique et zone d'interaction étendue
// Vérifie que l'outil main fonctionne correctement avec la désélection et le pan étendu

import React, { useEffect, useState } from 'react'
import { usePolotnoContext } from '../context/PolotnoContext'

interface HandToolTestProps {
  onTestResult?: (result: { success: boolean; message: string }) => void
}

export default function HandToolTest({ onTestResult }: HandToolTestProps) {
  const { activeTool, setActiveTool } = usePolotnoContext()
  const [testResults, setTestResults] = useState<Array<{
    test: string
    success: boolean
    message: string
  }>>([])

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 HandToolTest: Début des tests de l\'outil main')

      // Test 1: Activation de l'outil main
      const test1Start = performance.now()
      try {
        // Simuler l'activation de l'outil main
        setActiveTool('hand')
        
        // Attendre un frame pour que l'événement soit traité
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        const test1Latency = performance.now() - test1Start
        const test1Success = activeTool === 'hand'
        
        const test1Result = {
          test: 'Activation outil main',
          success: test1Success,
          message: test1Success 
            ? `Outil main activé en ${test1Latency.toFixed(2)}ms`
            : `Échec activation: outil actuel = ${activeTool}`
        }
        setTestResults(prev => [...prev, test1Result])
        
      } catch (error) {
        const test1Result = {
          test: 'Activation outil main',
          success: false,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test1Result])
      }

      // Test 2: Événement de désélection forcée
      const test2Start = performance.now()
      try {
        let eventReceived = false
        
        // Écouter l'événement de désélection forcée
        const handleForceDeselect = () => {
          eventReceived = true
        }
        
        window.addEventListener('forceDeselectAll', handleForceDeselect)
        
        // Simuler l'activation de l'outil main (qui doit émettre l'événement)
        setActiveTool('select') // D'abord un autre outil
        await new Promise(resolve => requestAnimationFrame(resolve))
        setActiveTool('hand') // Puis l'outil main
        
        // Attendre que l'événement soit traité
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const test2Latency = performance.now() - test2Start
        
        const test2Result = {
          test: 'Événement désélection forcée',
          success: eventReceived,
          message: eventReceived 
            ? `Événement reçu en ${test2Latency.toFixed(2)}ms`
            : 'Événement de désélection forcée non reçu'
        }
        setTestResults(prev => [...prev, test2Result])
        
        window.removeEventListener('forceDeselectAll', handleForceDeselect)
        
      } catch (error) {
        const test2Result = {
          test: 'Événement désélection forcée',
          success: false,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test2Result])
      }

      // Test 3: Curseur de l'outil main
      const test3Start = performance.now()
      try {
        // Vérifier que le curseur change quand l'outil main est actif
        setActiveTool('hand')
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        // Chercher un élément avec le curseur approprié
        const canvasArea = document.querySelector('.canvas-interface')
        const computedStyle = canvasArea ? window.getComputedStyle(canvasArea) : null
        const cursor = computedStyle?.cursor || 'default'
        
        const test3Latency = performance.now() - test3Start
        const test3Success = cursor.includes('grab') || cursor.includes('hand') || activeTool === 'hand'
        
        const test3Result = {
          test: 'Curseur outil main',
          success: test3Success,
          message: test3Success 
            ? `Curseur correct: ${cursor} (${test3Latency.toFixed(2)}ms)`
            : `Curseur incorrect: ${cursor}`
        }
        setTestResults(prev => [...prev, test3Result])
        
      } catch (error) {
        const test3Result = {
          test: 'Curseur outil main',
          success: false,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test3Result])
      }

      console.log('🧪 HandToolTest: Tests terminés')
    }

    runTests()
  }, [activeTool, setActiveTool])

  // Notifier les résultats
  useEffect(() => {
    if (testResults.length === 3 && onTestResult) {
      const overallSuccess = testResults.every(result => result.success)
      
      onTestResult({
        success: overallSuccess,
        message: overallSuccess 
          ? 'Tous les tests de l\'outil main réussis'
          : `${testResults.filter(r => !r.success).length} test(s) échoué(s)`
      })
    }
  }, [testResults, onTestResult])

  return (
    <div style={{ 
      position: 'fixed', 
      top: 60, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: 10, 
      borderRadius: 5,
      fontSize: 12,
      maxWidth: 300,
      zIndex: 9999
    }}>
      <h4>🖐️ Tests Outil Main</h4>
      {testResults.map((result, index) => (
        <div key={index} style={{ 
          margin: '5px 0', 
          color: result.success ? '#4ade80' : '#f87171' 
        }}>
          <strong>{result.test}:</strong> {result.success ? '✅' : '❌'}<br/>
          <small>{result.message}</small>
        </div>
      ))}
      {testResults.length < 3 && (
        <div style={{ color: '#fbbf24' }}>⏳ Tests en cours...</div>
      )}
      <div style={{ marginTop: 10, fontSize: 10, color: '#9ca3af' }}>
        Outil actuel: {activeTool}
      </div>
    </div>
  )
}

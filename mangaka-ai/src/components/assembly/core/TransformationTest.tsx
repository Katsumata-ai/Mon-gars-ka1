// Test de synchronisation du gestionnaire de transformation unifié
// Vérifie que les bulles TipTap et les panels se synchronisent parfaitement

import React, { useEffect, useState } from 'react'
import { transformManager } from './UnifiedTransformManager'

interface TransformationTestProps {
  onTestResult?: (result: { success: boolean; latency: number; message: string }) => void
}

export default function TransformationTest({ onTestResult }: TransformationTestProps) {
  const [testResults, setTestResults] = useState<Array<{
    test: string
    success: boolean
    latency: number
    message: string
  }>>([])

  useEffect(() => {
    const runTests = async () => {
      console.log('🧪 TransformationTest: Début des tests de synchronisation')

      // Test 1: Enregistrement et désenregistrement
      const test1Start = performance.now()
      try {
        const mockElement = document.createElement('div')
        transformManager.registerHTMLTarget('test-element', mockElement)
        transformManager.unregisterTarget('test-element')
        
        const test1Latency = performance.now() - test1Start
        const test1Result = {
          test: 'Enregistrement/Désenregistrement',
          success: true,
          latency: test1Latency,
          message: `Enregistrement réussi en ${test1Latency.toFixed(2)}ms`
        }
        setTestResults(prev => [...prev, test1Result])
        
      } catch (error) {
        const test1Result = {
          test: 'Enregistrement/Désenregistrement',
          success: false,
          latency: performance.now() - test1Start,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test1Result])
      }

      // Test 2: Application de transformation
      const test2Start = performance.now()
      try {
        const mockElement = document.createElement('div')
        document.body.appendChild(mockElement)
        
        transformManager.registerHTMLTarget('test-transform', mockElement)
        
        const testTransform = { x: 100, y: 50, scale: 1.5 }
        transformManager.updateTransform(testTransform, 'TransformationTest')
        
        // Attendre un frame pour que la transformation soit appliquée
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        const appliedTransform = mockElement.style.transform
        const expectedTransform = `translate(100px, 50px) scale(1.5)`
        
        const test2Latency = performance.now() - test2Start
        const test2Success = appliedTransform === expectedTransform
        
        const test2Result = {
          test: 'Application de transformation',
          success: test2Success,
          latency: test2Latency,
          message: test2Success 
            ? `Transformation appliquée correctement en ${test2Latency.toFixed(2)}ms`
            : `Transformation incorrecte: attendu "${expectedTransform}", reçu "${appliedTransform}"`
        }
        setTestResults(prev => [...prev, test2Result])
        
        // Nettoyage
        transformManager.unregisterTarget('test-transform')
        document.body.removeChild(mockElement)
        
      } catch (error) {
        const test2Result = {
          test: 'Application de transformation',
          success: false,
          latency: performance.now() - test2Start,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test2Result])
      }

      // Test 3: Performance avec multiples éléments
      const test3Start = performance.now()
      try {
        const elements: HTMLElement[] = []
        
        // Créer 10 éléments de test
        for (let i = 0; i < 10; i++) {
          const element = document.createElement('div')
          document.body.appendChild(element)
          elements.push(element)
          transformManager.registerHTMLTarget(`test-perf-${i}`, element)
        }
        
        // Appliquer 100 transformations
        for (let i = 0; i < 100; i++) {
          const transform = { x: i, y: i, scale: 1 + i * 0.01 }
          transformManager.updateTransform(transform, 'PerformanceTest')
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
        
        const test3Latency = performance.now() - test3Start
        const avgLatencyPerTransform = test3Latency / 100
        
        const test3Result = {
          test: 'Performance (100 transformations)',
          success: avgLatencyPerTransform < 5, // Moins de 5ms par transformation
          latency: test3Latency,
          message: `${avgLatencyPerTransform.toFixed(2)}ms par transformation (${test3Latency.toFixed(2)}ms total)`
        }
        setTestResults(prev => [...prev, test3Result])
        
        // Nettoyage
        elements.forEach((element, i) => {
          transformManager.unregisterTarget(`test-perf-${i}`)
          document.body.removeChild(element)
        })
        
      } catch (error) {
        const test3Result = {
          test: 'Performance (100 transformations)',
          success: false,
          latency: performance.now() - test3Start,
          message: `Erreur: ${error}`
        }
        setTestResults(prev => [...prev, test3Result])
      }

      console.log('🧪 TransformationTest: Tests terminés')
    }

    runTests()
  }, [])

  // Notifier les résultats
  useEffect(() => {
    if (testResults.length === 3 && onTestResult) {
      const overallSuccess = testResults.every(result => result.success)
      const totalLatency = testResults.reduce((sum, result) => sum + result.latency, 0)
      
      onTestResult({
        success: overallSuccess,
        latency: totalLatency,
        message: overallSuccess 
          ? `Tous les tests réussis (${totalLatency.toFixed(2)}ms total)`
          : `${testResults.filter(r => !r.success).length} test(s) échoué(s)`
      })
    }
  }, [testResults, onTestResult])

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: 10, 
      borderRadius: 5,
      fontSize: 12,
      maxWidth: 300,
      zIndex: 9999
    }}>
      <h4>🧪 Tests de Synchronisation</h4>
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
    </div>
  )
}

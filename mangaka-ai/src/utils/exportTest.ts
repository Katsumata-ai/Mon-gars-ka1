// Test utilitaire pour vérifier le système d'export
// À utiliser dans la console du navigateur pour tester

import { ExportManager } from '../services/ExportManager'
import type { ExportOptions } from '../types/export.types'

export async function testExport(projectId: string) {
  console.log('🧪 Test d\'export démarré pour le projet:', projectId)
  
  try {
    const exportManager = new ExportManager()
    
    // Test 1: Récupération des pages
    console.log('📄 Test 1: Récupération des pages...')
    const pages = await exportManager.fetchAllPages(projectId)
    console.log('✅ Pages récupérées:', pages.length, pages)
    
    if (pages.length === 0) {
      console.warn('⚠️ Aucune page trouvée pour ce projet')
      return
    }
    
    // Test 2: Export PNG d'une page
    console.log('🖼️ Test 2: Export PNG de la première page...')
    const pngOptions: ExportOptions = {
      projectId,
      format: 'png',
      quality: 0.8,
      resolution: 1,
      pageIds: [pages[0].id],
      onProgress: (progress) => {
        console.log(`📊 Progression PNG: ${progress.step} - ${Math.round((progress.current / progress.total) * 100)}%`)
      }
    }
    
    const pngBlob = await exportManager.exportPages(pngOptions)
    console.log('✅ Export PNG réussi:', pngBlob.size, 'bytes')
    
    // Télécharger automatiquement pour test
    const url = URL.createObjectURL(pngBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `test-export-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
    
    // Test 3: Export PDF multi-pages (si plusieurs pages)
    if (pages.length > 1) {
      console.log('📚 Test 3: Export PDF multi-pages...')
      const pdfOptions: ExportOptions = {
        projectId,
        format: 'pdf',
        quality: 0.8,
        resolution: 1,
        onProgress: (progress) => {
          console.log(`📊 Progression PDF: ${progress.step} - ${Math.round((progress.current / progress.total) * 100)}%`)
        }
      }
      
      const pdfBlob = await exportManager.exportPages(pdfOptions)
      console.log('✅ Export PDF réussi:', pdfBlob.size, 'bytes')
      
      // Télécharger automatiquement pour test
      const pdfUrl = URL.createObjectURL(pdfBlob)
      const pdfA = document.createElement('a')
      pdfA.href = pdfUrl
      pdfA.download = `test-export-${Date.now()}.pdf`
      pdfA.click()
      URL.revokeObjectURL(pdfUrl)
    }
    
    console.log('🎉 Tous les tests d\'export réussis !')
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'export:', error)
  }
}

// Fonction pour tester depuis la console
export function runExportTest() {
  // Essayer de récupérer le projectId depuis l'URL ou le store
  const url = window.location.pathname
  const projectIdMatch = url.match(/\/project\/([^\/]+)/)
  
  if (projectIdMatch) {
    const projectId = projectIdMatch[1]
    console.log('🎯 Project ID détecté:', projectId)
    testExport(projectId)
  } else {
    console.error('❌ Impossible de détecter le project ID depuis l\'URL')
    console.log('💡 Utilisez: testExport("votre-project-id")')
  }
}

// Exposer globalement pour les tests
if (typeof window !== 'undefined') {
  (window as any).testExport = testExport
  (window as any).runExportTest = runExportTest
}

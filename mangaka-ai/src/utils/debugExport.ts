// Utilitaires de debug pour le système d'export
// À utiliser dans la console pour diagnostiquer les problèmes

import { ExportManager } from '../services/ExportManager'

export async function debugPageData(projectId: string) {
  console.log('🔍 Debug - Analyse des données de page pour:', projectId)
  
  try {
    const exportManager = new ExportManager()
    const pages = await exportManager.fetchAllPages(projectId)
    
    console.log('📄 Pages trouvées:', pages.length)
    
    pages.forEach((page, index) => {
      console.log(`\n📄 Page ${index + 1} (${page.id}):`)
      console.log('  - Numéro:', page.number)
      console.log('  - Titre:', page.title)
      console.log('  - Dernière modification:', page.lastModified)
      
      const elements = page.content?.stage?.children || []
      console.log('  - Éléments:', elements.length)
      
      elements.forEach((el, elIndex) => {
        console.log(`    🔸 Élément ${elIndex + 1}:`)
        console.log('      - Type:', el.type)
        console.log('      - ID:', el.id)
        console.log('      - Transform:', el.transform)
        
        if (el.type === 'panel') {
          const panel = el as any
          console.log('      - Panel Style:', panel.panelStyle)
          console.log('      - Image URL:', panel.imageUrl)
          console.log('      - Image Data:', panel.imageData)
        }
        
        if (el.type === 'dialogue') {
          const bubble = el as any
          console.log('      - Dialogue Style:', bubble.dialogueStyle)
          console.log('      - Text:', bubble.text)
          console.log('      - Content:', bubble.content)
        }
        
        if (el.type === 'text') {
          const text = el as any
          console.log('      - Text Style:', text.textStyle)
          console.log('      - Text:', text.text)
          console.log('      - Content:', text.content)
        }
      })
    })
    
    return pages
  } catch (error) {
    console.error('❌ Erreur debug:', error)
    return null
  }
}

export async function debugSingleElement(projectId: string, elementType: 'panel' | 'dialogue' | 'text') {
  console.log(`🔍 Debug - Analyse des éléments ${elementType} pour:`, projectId)
  
  try {
    const exportManager = new ExportManager()
    const pages = await exportManager.fetchAllPages(projectId)
    
    const allElements = pages.flatMap(page => 
      (page.content?.stage?.children || []).filter(el => el.type === elementType)
    )
    
    console.log(`📊 ${elementType} trouvés:`, allElements.length)
    
    allElements.forEach((el, index) => {
      console.log(`\n🔸 ${elementType} ${index + 1}:`)
      console.log('  - ID:', el.id)
      console.log('  - Transform:', el.transform)
      console.log('  - Données complètes:', el)
    })
    
    return allElements
  } catch (error) {
    console.error('❌ Erreur debug:', error)
    return []
  }
}

export function debugCanvasRendering() {
  console.log('🎨 Debug - Test de rendu Canvas')
  
  // Créer un canvas de test
  const canvas = document.createElement('canvas')
  canvas.width = 400
  canvas.height = 300
  const ctx = canvas.getContext('2d')!
  
  // Test de base
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(10, 10, 100, 50)
  
  ctx.strokeStyle = '#0000ff'
  ctx.lineWidth = 2
  ctx.strokeRect(120, 10, 100, 50)
  
  ctx.fillStyle = '#000000'
  ctx.font = '16px Arial'
  ctx.fillText('Test Canvas', 10, 100)
  
  // Ajouter au DOM temporairement
  canvas.style.position = 'fixed'
  canvas.style.top = '10px'
  canvas.style.right = '10px'
  canvas.style.zIndex = '9999'
  canvas.style.border = '2px solid red'
  document.body.appendChild(canvas)
  
  console.log('✅ Canvas de test ajouté en haut à droite')
  
  // Supprimer après 5 secondes
  setTimeout(() => {
    document.body.removeChild(canvas)
    console.log('🗑️ Canvas de test supprimé')
  }, 5000)
  
  return canvas
}

export async function debugImageLoading(imageUrl: string) {
  console.log('🖼️ Debug - Test de chargement d\'image:', imageUrl)
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      console.log('✅ Image chargée avec succès:', {
        url: imageUrl,
        width: img.width,
        height: img.height,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight
      })
      resolve(img)
    }
    
    img.onerror = (error) => {
      console.error('❌ Erreur chargement image:', error)
      reject(error)
    }
    
    // Test avec CORS
    img.crossOrigin = 'anonymous'
    img.src = imageUrl
  })
}

export function debugElementStructure(element: any) {
  console.log('🔍 Debug - Structure d\'élément détaillée:')
  console.log('Type:', element.type)
  console.log('ID:', element.id)
  console.log('Transform:', element.transform)
  
  // Analyser toutes les propriétés
  const properties = Object.keys(element)
  console.log('Propriétés disponibles:', properties)
  
  properties.forEach(prop => {
    const value = element[prop]
    if (typeof value === 'object' && value !== null) {
      console.log(`${prop}:`, value)
    } else {
      console.log(`${prop}:`, value)
    }
  })
  
  return element
}

// Exposer globalement pour les tests
if (typeof window !== 'undefined') {
  (window as any).debugPageData = debugPageData
  (window as any).debugSingleElement = debugSingleElement
  (window as any).debugCanvasRendering = debugCanvasRendering
  (window as any).debugImageLoading = debugImageLoading
  (window as any).debugElementStructure = debugElementStructure
}

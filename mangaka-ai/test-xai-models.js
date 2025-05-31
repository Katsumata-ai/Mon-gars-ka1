// Test pour lister les modèles xAI disponibles
const XAI_API_KEY = 'xai-ESW5kaC8nEioVXaCE1kgnvqQ3XdytDqYobHMWGPTaJHBc1aJH0Cz740hGpBXH7tC0Wg5QtAIJH2Vg098'

async function listModels() {
  console.log('🔍 Récupération de la liste des modèles xAI...')
  
  try {
    const response = await fetch('https://api.x.ai/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    console.log('📡 Statut de la réponse:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API xAI:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Modèles disponibles:', JSON.stringify(result, null, 2))
    
    // Filtrer les modèles d'image
    if (result.data) {
      const imageModels = result.data.filter(model => 
        model.id.includes('image') || 
        model.id.includes('vision') || 
        model.id.includes('grok-vision') ||
        model.id.includes('flux')
      )
      
      console.log('\n🖼️ Modèles d\'image trouvés:')
      imageModels.forEach(model => {
        console.log(`   - ${model.id}: ${model.object || 'N/A'}`)
      })
    }
    
    return true
  } catch (error) {
    console.error('💥 Erreur lors de la récupération des modèles:', error)
    return false
  }
}

async function listImageModels() {
  console.log('🖼️ Récupération des modèles de génération d\'images...')
  
  try {
    const response = await fetch('https://api.x.ai/v1/images/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      }
    })

    console.log('📡 Statut de la réponse:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API xAI:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Modèles d\'images disponibles:', JSON.stringify(result, null, 2))
    return true
  } catch (error) {
    console.error('💥 Erreur lors de la récupération des modèles d\'images:', error)
    return false
  }
}

async function testWithFlux() {
  console.log('🧪 Test avec le modèle flux-1-schnell...')
  
  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'flux-1-schnell',
        prompt: 'manga style character, anime art, detailed character design'
      }),
    })

    console.log('📡 Statut de la réponse:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API xAI:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Réponse avec flux-1-schnell:', JSON.stringify(result, null, 2))
    return true
  } catch (error) {
    console.error('💥 Erreur lors du test avec flux:', error)
    return false
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests de modèles xAI\n')
  
  await listModels()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await listImageModels()
  console.log('\n' + '='.repeat(50) + '\n')
  
  await testWithFlux()
  console.log('\n' + '='.repeat(50))
}

runTests()

// Test simple de l'intégration xAI API
const XAI_API_KEY = 'xai-ESW5kaC8nEioVXaCE1kgnvqQ3XdytDqYobHMWGPTaJHBc1aJH0Cz740hGpBXH7tC0Wg5QtAIJH2Vg098'

async function testXaiAPI() {
  console.log('🧪 Test de l\'intégration xAI API...')

  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-vision-beta',
        prompt: 'manga style character, anime art, detailed character design, clean lines, cel shading, professional illustration, full body portrait, heroic protagonist, determined expression, confident pose, brave warrior, high quality, detailed, sharp, professional, 4k resolution, masterpiece, consistent art style, manga aesthetic, anime style, vibrant colors'
      }),
    })

    console.log('📡 Statut de la réponse:', response.status)
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur API xAI:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Réponse API xAI:', JSON.stringify(result, null, 2))

    if (result.data && result.data[0] && result.data[0].url) {
      console.log('🖼️ URL de l\'image générée:', result.data[0].url)
      return true
    } else {
      console.error('❌ Format de réponse invalide')
      return false
    }
  } catch (error) {
    console.error('💥 Erreur lors du test xAI:', error)
    return false
  }
}

// Test de l'endpoint local
async function testLocalEndpoint() {
  console.log('🧪 Test de l\'endpoint local /api/generate-image...')

  try {
    const response = await fetch('http://localhost:3001/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'héros manga déterminé',
        type: 'character',
        optimizePrompt: true,
        metadata: {
          name: 'Test Hero',
          style: 'shonen',
          traits: ['courageux', 'déterminé'],
          archetype: 'hero'
        }
      }),
    })

    console.log('📡 Statut de la réponse locale:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur endpoint local:', response.status, errorText)
      return false
    }

    const result = await response.json()
    console.log('✅ Réponse endpoint local:', JSON.stringify(result, null, 2))
    return true
  } catch (error) {
    console.error('💥 Erreur lors du test local:', error)
    return false
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Démarrage des tests d\'intégration xAI\n')

  const xaiTest = await testXaiAPI()
  console.log('\n' + '='.repeat(50) + '\n')

  const localTest = await testLocalEndpoint()

  console.log('\n' + '='.repeat(50))
  console.log('📊 Résultats des tests:')
  console.log(`   xAI API directe: ${xaiTest ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
  console.log(`   Endpoint local: ${localTest ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
  console.log('='.repeat(50))
}

runTests()

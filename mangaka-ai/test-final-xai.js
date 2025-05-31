// Test final de l'intégration xAI avec le bon modèle
const XAI_API_KEY = 'xai-ESW5kaC8nEioVXaCE1kgnvqQ3XdytDqYobHMWGPTaJHBc1aJH0Cz740hGpBXH7tC0Wg5QtAIJH2Vg098'

async function testXaiImageGeneration() {
  console.log('🧪 Test de génération d\'image avec grok-2-image-1212...')
  
  try {
    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-image-1212',
        prompt: 'manga style character, anime art, detailed character design, clean lines, cel shading, professional illustration, heroic protagonist, determined expression, confident pose, brave warrior'
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

// Exécuter le test
async function runTest() {
  console.log('🚀 Test final de l\'intégration xAI\n')
  
  const success = await testXaiImageGeneration()
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 Résultat du test:')
  console.log(`   xAI API: ${success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`)
  console.log('='.repeat(50))
  
  if (success) {
    console.log('\n🎉 L\'intégration xAI fonctionne correctement !')
    console.log('🔧 Vous pouvez maintenant tester l\'interface dans le navigateur.')
  }
}

runTest()

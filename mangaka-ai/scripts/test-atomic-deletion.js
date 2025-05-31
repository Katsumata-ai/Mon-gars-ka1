/**
 * Script de test pour la suppression atomique d'images
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Lire le fichier .env.local manuellement
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const lines = envContent.split('\n')
    const env = {}
    
    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return env
  } catch (error) {
    console.error('❌ Impossible de lire .env.local:', error.message)
    return {}
  }
}

const env = loadEnvFile()

// Configuration Supabase
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variables d\'environnement Supabase manquantes')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

/**
 * Teste la suppression atomique d'une image
 */
async function testAtomicDeletion() {
  console.log('🧪 Test de la suppression atomique d\'images')
  console.log('=' .repeat(60))

  try {
    // Étape 1: Lister quelques images de test
    console.log('📋 Récupération des images de test...')
    
    const { data: characters, error: charError } = await supabase
      .from('character_images')
      .select('id, project_id, image_url, metadata')
      .limit(3)

    if (charError) {
      console.error('❌ Erreur récupération personnages:', charError)
      return
    }

    const { data: decors, error: decorError } = await supabase
      .from('decor_images')
      .select('id, project_id, image_url, metadata')
      .limit(3)

    if (decorError) {
      console.error('❌ Erreur récupération décors:', decorError)
      return
    }

    console.log(`📊 Trouvé ${characters?.length || 0} personnages et ${decors?.length || 0} décors`)

    // Étape 2: Afficher les images disponibles
    if (characters && characters.length > 0) {
      console.log('\n👥 Personnages disponibles:')
      characters.forEach((char, index) => {
        console.log(`   ${index + 1}. ID: ${char.id}`)
        console.log(`      Project: ${char.project_id}`)
        console.log(`      URL: ${char.image_url?.substring(0, 50)}...`)
        console.log(`      Storage Path: ${char.metadata?.storage_path || 'Non défini'}`)
      })
    }

    if (decors && decors.length > 0) {
      console.log('\n🏞️ Décors disponibles:')
      decors.forEach((decor, index) => {
        console.log(`   ${index + 1}. ID: ${decor.id}`)
        console.log(`      Project: ${decor.project_id}`)
        console.log(`      URL: ${decor.image_url?.substring(0, 50)}...`)
        console.log(`      Storage Path: ${decor.metadata?.storage_path || 'Non défini'}`)
      })
    }

    // Étape 3: Test de l'API de suppression (simulation)
    console.log('\n🧪 Test de l\'API de suppression (simulation)')
    
    if (characters && characters.length > 0) {
      const testCharacter = characters[0]
      console.log(`\n📋 Test suppression personnage: ${testCharacter.id}`)
      
      // Simulation d'appel API
      const apiUrl = `http://localhost:3002/api/projects/${testCharacter.project_id}/characters/${testCharacter.id}`
      console.log(`🔗 URL API: ${apiUrl}`)
      console.log('ℹ️ Pour tester réellement, utilisez:')
      console.log(`   curl -X DELETE "${apiUrl}"`)
    }

    if (decors && decors.length > 0) {
      const testDecor = decors[0]
      console.log(`\n📋 Test suppression décor: ${testDecor.id}`)
      
      // Simulation d'appel API
      const apiUrl = `http://localhost:3002/api/projects/${testDecor.project_id}/decors/${testDecor.id}`
      console.log(`🔗 URL API: ${apiUrl}`)
      console.log('ℹ️ Pour tester réellement, utilisez:')
      console.log(`   curl -X DELETE "${apiUrl}"`)
    }

    console.log('\n✅ Test de simulation terminé')
    console.log('⚠️ Aucune suppression réelle n\'a été effectuée')

  } catch (error) {
    console.error('🚨 Erreur lors du test:', error)
  }
}

/**
 * Vérifie l'intégrité des données (images orphelines)
 */
async function checkDataIntegrity() {
  console.log('\n🔍 Vérification de l\'intégrité des données')
  console.log('-' .repeat(40))

  try {
    // Vérifier les images sans storage_path
    const { data: charactersWithoutPath, error: charError } = await supabase
      .from('character_images')
      .select('id, metadata')
      .is('metadata->storage_path', null)

    const { data: decorsWithoutPath, error: decorError } = await supabase
      .from('decor_images')
      .select('id, metadata')
      .is('metadata->storage_path', null)

    if (charError || decorError) {
      console.error('❌ Erreur lors de la vérification:', charError || decorError)
      return
    }

    console.log(`📊 Images sans storage_path:`)
    console.log(`   - Personnages: ${charactersWithoutPath?.length || 0}`)
    console.log(`   - Décors: ${decorsWithoutPath?.length || 0}`)

    if ((charactersWithoutPath?.length || 0) > 0 || (decorsWithoutPath?.length || 0) > 0) {
      console.log('⚠️ Des images sans storage_path ont été trouvées')
      console.log('   Ces images pourraient être des anciennes données ou des échecs d\'upload')
    } else {
      console.log('✅ Toutes les images ont un storage_path défini')
    }

  } catch (error) {
    console.error('🚨 Erreur lors de la vérification d\'intégrité:', error)
  }
}

// Exécuter les tests
async function main() {
  await testAtomicDeletion()
  await checkDataIntegrity()
  
  console.log('\n🎉 Tests terminés!')
  console.log('\n📝 Instructions pour tester la suppression réelle:')
  console.log('1. Utilisez l\'interface web pour supprimer une image')
  console.log('2. Vérifiez les logs du serveur pour voir la suppression atomique')
  console.log('3. Vérifiez que l\'image a disparu de la galerie ET du Storage')
}

main().catch(error => {
  console.error('🚨 Erreur fatale lors des tests:', error)
  process.exit(1)
})

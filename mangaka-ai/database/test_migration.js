/**
 * Script de test pour vérifier l'état avant migration
 * Vérifie les données existantes et la faisabilité de la migration
 */

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!')
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testMigration() {
  console.log('🔍 Test de faisabilité de la migration...\n')

  try {
    // 1. Vérifier la connexion à Supabase
    console.log('📡 Test de connexion à Supabase...')
    const { data: testData, error: testError } = await supabase
      .from('generated_images')
      .select('count')
      .limit(1)

    if (testError) {
      console.error('❌ Erreur de connexion:', testError.message)
      return false
    }
    console.log('✅ Connexion Supabase réussie')

    // 2. Analyser les données existantes
    console.log('\n📊 Analyse des données existantes...')
    const { data: allImages, error: fetchError } = await supabase
      .from('generated_images')
      .select('id, image_type, user_id, project_id, created_at, metadata')

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération des données:', fetchError.message)
      return false
    }

    const totalImages = allImages.length
    const characterImages = allImages.filter(img => img.image_type === 'character')
    const decorImages = allImages.filter(img => img.image_type === 'background')
    const otherImages = allImages.filter(img => !['character', 'background'].includes(img.image_type))

    console.log(`📈 Statistiques des données:`)
    console.log(`   - Total d'images: ${totalImages}`)
    console.log(`   - Images de personnages: ${characterImages.length}`)
    console.log(`   - Images de décors: ${decorImages.length}`)
    console.log(`   - Autres types: ${otherImages.length}`)

    if (otherImages.length > 0) {
      console.log(`⚠️  Types d'images non standard trouvés:`)
      const uniqueTypes = [...new Set(otherImages.map(img => img.image_type))]
      uniqueTypes.forEach(type => {
        const count = otherImages.filter(img => img.image_type === type).length
        console.log(`     - ${type}: ${count} images`)
      })
    }

    // 3. Vérifier l'intégrité des données
    console.log('\n🔍 Vérification de l\'intégrité des données...')
    
    const imagesWithoutUserId = allImages.filter(img => !img.user_id)
    const imagesWithoutProjectId = allImages.filter(img => !img.project_id)
    const imagesWithoutId = allImages.filter(img => !img.id)

    console.log(`🔒 Vérifications d'intégrité:`)
    console.log(`   - Images sans user_id: ${imagesWithoutUserId.length}`)
    console.log(`   - Images sans project_id: ${imagesWithoutProjectId.length}`)
    console.log(`   - Images sans id: ${imagesWithoutId.length}`)

    // 4. Analyser les métadonnées
    console.log('\n📋 Analyse des métadonnées...')
    
    const charactersWithMetadata = characterImages.filter(img => 
      img.metadata && Object.keys(img.metadata).length > 0
    )
    const decorsWithMetadata = decorImages.filter(img => 
      img.metadata && Object.keys(img.metadata).length > 0
    )

    console.log(`🏷️  Métadonnées:`)
    console.log(`   - Personnages avec métadonnées: ${charactersWithMetadata.length}/${characterImages.length}`)
    console.log(`   - Décors avec métadonnées: ${decorsWithMetadata.length}/${decorImages.length}`)

    // 5. Vérifier si les nouvelles tables existent déjà
    console.log('\n🏗️  Vérification des tables existantes...')
    
    const { data: characterTableExists } = await supabase
      .from('character_images')
      .select('count')
      .limit(1)
      .maybeSingle()

    const { data: decorTableExists } = await supabase
      .from('decor_images')
      .select('count')
      .limit(1)
      .maybeSingle()

    if (characterTableExists !== null) {
      console.log('⚠️  La table character_images existe déjà')
      const { count: charCount } = await supabase
        .from('character_images')
        .select('*', { count: 'exact', head: true })
      console.log(`   - Contient ${charCount} enregistrements`)
    } else {
      console.log('✅ La table character_images n\'existe pas encore')
    }

    if (decorTableExists !== null) {
      console.log('⚠️  La table decor_images existe déjà')
      const { count: decorCount } = await supabase
        .from('decor_images')
        .select('*', { count: 'exact', head: true })
      console.log(`   - Contient ${decorCount} enregistrements`)
    } else {
      console.log('✅ La table decor_images n\'existe pas encore')
    }

    // 6. Résumé et recommandations
    console.log('\n📋 RÉSUMÉ ET RECOMMANDATIONS:')
    
    if (totalImages === 0) {
      console.log('ℹ️  Aucune donnée à migrer - migration sûre')
    } else {
      console.log(`✅ ${totalImages} images prêtes pour la migration`)
      console.log(`   - ${characterImages.length} personnages → character_images`)
      console.log(`   - ${decorImages.length} décors → decor_images`)
    }

    if (imagesWithoutUserId.length > 0 || imagesWithoutProjectId.length > 0) {
      console.log('⚠️  ATTENTION: Données incomplètes détectées')
      console.log('   - Vérifiez les contraintes avant migration')
    }

    if (otherImages.length > 0) {
      console.log('⚠️  ATTENTION: Types d\'images non standard')
      console.log('   - Ces images ne seront pas migrées')
    }

    console.log('\n🚀 La migration peut être exécutée avec: npm run migrate')
    return true

  } catch (error) {
    console.error('\n💥 ERREUR LORS DU TEST:')
    console.error(error.message)
    return false
  }
}

// Exécuter le test
testMigration().then(success => {
  if (success) {
    console.log('\n✅ Test terminé avec succès')
    process.exit(0)
  } else {
    console.log('\n❌ Test échoué')
    process.exit(1)
  }
}).catch(error => {
  console.error('Erreur inattendue:', error)
  process.exit(1)
})

/**
 * Script de migration pour séparer les images en tables spécialisées
 * Exécute la migration de generated_images vers character_images et decor_images
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement Supabase manquantes!')
  console.error('Assurez-vous que NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définies')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🚀 Début de la migration des tables d\'images...\n')

  try {
    // 1. Lire et exécuter le script de création des tables
    console.log('📋 Étape 1: Création des nouvelles tables...')
    const createTablesSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '001_create_specialized_image_tables.sql'),
      'utf8'
    )

    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    })

    if (createError) {
      console.error('❌ Erreur lors de la création des tables:', createError)
      throw createError
    }
    console.log('✅ Tables créées avec succès!')

    // 2. Vérifier l'état avant migration
    console.log('\n📊 Étape 2: Vérification des données existantes...')
    const { data: beforeStats, error: beforeError } = await supabase
      .from('generated_images')
      .select('image_type')

    if (beforeError) {
      console.error('❌ Erreur lors de la vérification:', beforeError)
      throw beforeError
    }

    const characterCount = beforeStats.filter(img => img.image_type === 'character').length
    const decorCount = beforeStats.filter(img => img.image_type === 'background').length
    const totalCount = beforeStats.length

    console.log(`📈 Données trouvées:`)
    console.log(`   - Total: ${totalCount}`)
    console.log(`   - Personnages: ${characterCount}`)
    console.log(`   - Décors: ${decorCount}`)

    // 3. Exécuter la migration des données
    console.log('\n🔄 Étape 3: Migration des données...')
    const migrateDataSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', '002_migrate_existing_data.sql'),
      'utf8'
    )

    const { error: migrateError } = await supabase.rpc('exec_sql', { 
      sql: migrateDataSQL 
    })

    if (migrateError) {
      console.error('❌ Erreur lors de la migration:', migrateError)
      throw migrateError
    }
    console.log('✅ Migration des données terminée!')

    // 4. Vérification post-migration
    console.log('\n🔍 Étape 4: Vérification post-migration...')
    
    const { data: characterImages, error: charError } = await supabase
      .from('character_images')
      .select('id')
    
    const { data: decorImages, error: decorError } = await supabase
      .from('decor_images')
      .select('id')

    if (charError || decorError) {
      console.error('❌ Erreur lors de la vérification:', charError || decorError)
      throw charError || decorError
    }

    const migratedCharacters = characterImages.length
    const migratedDecors = decorImages.length

    console.log(`📊 Résultats de la migration:`)
    console.log(`   - Personnages migrés: ${migratedCharacters}/${characterCount}`)
    console.log(`   - Décors migrés: ${migratedDecors}/${decorCount}`)

    // Vérifier l'intégrité
    if (migratedCharacters !== characterCount) {
      throw new Error(`Erreur de migration des personnages: ${migratedCharacters}/${characterCount}`)
    }
    if (migratedDecors !== decorCount) {
      throw new Error(`Erreur de migration des décors: ${migratedDecors}/${decorCount}`)
    }

    console.log('\n🎉 MIGRATION RÉUSSIE!')
    console.log('✅ Toutes les données ont été migrées correctement')
    console.log('✅ Les nouvelles tables sont prêtes à être utilisées')
    console.log('\n📝 Prochaines étapes:')
    console.log('   1. Mettre à jour les APIs pour utiliser les nouvelles tables')
    console.log('   2. Tester les fonctionnalités')
    console.log('   3. Supprimer l\'ancienne table generated_images (après validation)')

  } catch (error) {
    console.error('\n💥 ERREUR LORS DE LA MIGRATION:')
    console.error(error.message)
    console.error('\n🔧 Actions recommandées:')
    console.error('   1. Vérifier les logs ci-dessus')
    console.error('   2. Corriger le problème')
    console.error('   3. Relancer la migration')
    process.exit(1)
  }
}

// Fonction helper pour exécuter du SQL brut
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  })
  
  if (error && !error.message.includes('already exists')) {
    console.error('Erreur lors de la création de la fonction exec_sql:', error)
  }
}

// Exécuter la migration
async function main() {
  await createExecSqlFunction()
  await runMigration()
}

main().catch(console.error)

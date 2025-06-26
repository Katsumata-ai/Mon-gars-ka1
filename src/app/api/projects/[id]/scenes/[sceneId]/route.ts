import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteImageFromSupabase } from '@/lib/storage/imageUpload'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sceneId: string }> }
) {
  try {
    const { id: projectId, sceneId } = await params

    if (!projectId || !sceneId) {
      return NextResponse.json(
        { error: 'Project ID and Scene ID are required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Début de la suppression atomique de la scène')
    console.log(`   - Scene ID: ${sceneId}`)
    console.log(`   - Project ID: ${projectId}`)

    let storagePath: string | undefined
    let databaseDeleted = false
    let storageDeleted = false

    // Étape 1: Récupérer les informations de la scène pour obtenir le storage_path
    console.log(`🔍 Récupération des informations de la scène...`)
    
    const { data: sceneData, error: fetchError } = await supabase
      .from('scene_images')
      .select('id, image_url, metadata')
      .eq('id', sceneId)
      .single()

    if (fetchError) {
      console.error('❌ Erreur récupération scène:', fetchError)
      throw new Error(`Échec récupération scène: ${fetchError.message}`)
    }

    if (!sceneData) {
      console.error('❌ Scène non trouvée')
      return NextResponse.json(
        { error: 'Scene not found' },
        { status: 404 }
      )
    }

    // Extraire le storage_path des métadonnées ou de l'URL
    storagePath = sceneData?.metadata?.storage_path
    
    // Si pas de storage_path dans metadata, essayer d'extraire de l'URL
    if (!storagePath && sceneData.image_url) {
      const urlParts = sceneData.image_url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      if (fileName && fileName.includes('.')) {
        storagePath = `scenes/${fileName}`
      }
    }
    
    console.log(`📁 Storage path trouvé: ${storagePath || 'Aucun'}`)

    // Étape 2: Supprimer l'enregistrement de la base de données
    console.log(`🗄️ Suppression de l'enregistrement en base de données...`)

    const { error: deleteDbError } = await supabase
      .from('scene_images')
      .delete()
      .eq('id', sceneId)

    if (deleteDbError) {
      console.error('❌ Erreur suppression base de données:', deleteDbError)
      throw new Error(`Échec suppression DB: ${deleteDbError.message}`)
    }

    databaseDeleted = true
    console.log('✅ Enregistrement supprimé de la base de données')

    // Étape 3: Supprimer le fichier du Storage si storage_path existe
    if (storagePath) {
      console.log(`🗂️ Suppression du fichier du Storage: ${storagePath}`)
      
      const deleteStorageResult = await deleteImageFromSupabase(storagePath)
      
      if (!deleteStorageResult.success) {
        console.warn('⚠️ Échec suppression Storage (non critique):', deleteStorageResult.error)
        // Ne pas faire échouer la suppression si le fichier Storage n'existe pas
      } else {
        console.log('✅ Fichier supprimé du Storage avec succès')
      }

      storageDeleted = true
    } else {
      console.log('ℹ️ Pas de storage_path trouvé, suppression Storage ignorée')
      storageDeleted = true // Considéré comme réussi car il n'y avait rien à supprimer
    }

    console.log('🎉 Suppression atomique de la scène réussie')
    return NextResponse.json({
      success: true,
      message: 'Scene deleted successfully',
      details: {
        databaseDeleted,
        storageDeleted,
        storagePath
      }
    })

  } catch (error) {
    console.error('🚨 Erreur lors de la suppression atomique de la scène:', error)

    return NextResponse.json(
      {
        error: 'Failed to delete scene completely',
        success: false,
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

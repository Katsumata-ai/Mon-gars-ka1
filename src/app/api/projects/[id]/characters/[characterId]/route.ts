import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteImageAtomic } from '@/lib/storage/imageUpload'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { id: projectId, characterId } = await params

    if (!projectId || !characterId) {
      return NextResponse.json(
        { error: 'Project ID and Character ID are required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Début de la suppression atomique du personnage')
    console.log(`   - Character ID: ${characterId}`)
    console.log(`   - Project ID: ${projectId}`)

    // Suppression atomique (base de données + storage)
    const deleteResult = await deleteImageAtomic(characterId, 'character', projectId)

    if (!deleteResult.success) {
      console.error('❌ Échec de la suppression atomique:', deleteResult.error)
      console.error('📊 Détails:', deleteResult.details)

      return NextResponse.json(
        {
          error: 'Failed to delete character completely',
          success: false,
          details: deleteResult.error,
          partialDeletion: deleteResult.details
        },
        { status: 500 }
      )
    }

    console.log('✅ Suppression atomique réussie')
    console.log('📊 Détails:', deleteResult.details)

    return NextResponse.json(
      {
        success: true,
        message: 'Character deleted successfully',
        details: {
          databaseDeleted: deleteResult.details?.databaseDeleted,
          storageDeleted: deleteResult.details?.storageDeleted,
          storagePath: deleteResult.details?.storagePath
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('🚨 Erreur critique dans DELETE /api/projects/[id]/characters/[characterId]:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        success: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; characterId: string }> }
) {
  try {
    const { id: projectId, characterId } = await params

    if (!projectId || !characterId) {
      return NextResponse.json(
        { error: 'Project ID and Character ID are required' },
        { status: 400 }
      )
    }

    // Récupérer les détails du personnage depuis la table spécialisée
    const { data: character, error } = await supabase
      .from('character_images')
      .select('*')
      .eq('id', characterId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Error fetching character:', error)
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, character },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/characters/[characterId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

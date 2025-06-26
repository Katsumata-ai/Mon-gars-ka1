import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteImageAtomic } from '@/lib/storage/imageUpload'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; decorId: string }> }
) {
  try {
    const { id: projectId, decorId } = await params

    if (!projectId || !decorId) {
      return NextResponse.json(
        { error: 'Project ID and Decor ID are required' },
        { status: 400 }
      )
    }

    console.log('🗑️ Début de la suppression atomique du décor')
    console.log(`   - Decor ID: ${decorId}`)
    console.log(`   - Project ID: ${projectId}`)

    // Suppression atomique (base de données + storage)
    const deleteResult = await deleteImageAtomic(decorId, 'decor', projectId)

    if (!deleteResult.success) {
      console.error('❌ Échec de la suppression atomique:', deleteResult.error)
      console.error('📊 Détails:', deleteResult.details)

      return NextResponse.json(
        {
          error: 'Failed to delete decor completely',
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
        message: 'Decor deleted successfully',
        details: {
          databaseDeleted: deleteResult.details?.databaseDeleted,
          storageDeleted: deleteResult.details?.storageDeleted,
          storagePath: deleteResult.details?.storagePath
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('🚨 Erreur critique dans DELETE /api/projects/[id]/decors/[decorId]:', error)
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
  { params }: { params: Promise<{ id: string; decorId: string }> }
) {
  try {
    const { id: projectId, decorId } = await params

    if (!projectId || !decorId) {
      return NextResponse.json(
        { error: 'Project ID and Decor ID are required' },
        { status: 400 }
      )
    }

    // Récupérer les détails du décor depuis la table spécialisée
    const { data: decor, error } = await supabase
      .from('decor_images')
      .select('*')
      .eq('id', decorId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Error fetching decor:', error)
      return NextResponse.json(
        { error: 'Decor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { success: true, decor },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in GET /api/projects/[id]/decors/[decorId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



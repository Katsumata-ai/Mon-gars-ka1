import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; characterId: string } }
) {
  try {
    const { id: projectId, characterId } = params

    if (!projectId || !characterId) {
      return NextResponse.json(
        { error: 'Project ID and Character ID are required' },
        { status: 400 }
      )
    }

    // Supprimer le personnage de la base de données spécialisée
    const { error: deleteError } = await supabase
      .from('character_images')
      .delete()
      .eq('id', characterId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Error deleting character:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete character' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Character deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/characters/[characterId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; characterId: string } }
) {
  try {
    const { id: projectId, characterId } = params

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

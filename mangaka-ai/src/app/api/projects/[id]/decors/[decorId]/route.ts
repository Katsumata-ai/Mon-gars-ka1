import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; decorId: string } }
) {
  try {
    const { id: projectId, decorId } = params

    if (!projectId || !decorId) {
      return NextResponse.json(
        { error: 'Project ID and Decor ID are required' },
        { status: 400 }
      )
    }

    // Supprimer le décor de la base de données spécialisée
    const { error: deleteError } = await supabase
      .from('decor_images')
      .delete()
      .eq('id', decorId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Error deleting decor:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete decor' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Decor deleted successfully' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/decors/[decorId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; decorId: string } }
) {
  try {
    const { id: projectId, decorId } = params

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



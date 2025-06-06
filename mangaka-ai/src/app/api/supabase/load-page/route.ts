// API Route pour charger une page d'assemblage
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const projectId = searchParams.get('projectId')

    if (!pageId || !projectId) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Charger la page
    const { data: page, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .single()

    if (error) {
      console.error('Erreur chargement page:', error)
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      page
    })

  } catch (error) {
    console.error('Erreur API load-page:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

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

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Vérifier que l'utilisateur a accès au projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { success: false, error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

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

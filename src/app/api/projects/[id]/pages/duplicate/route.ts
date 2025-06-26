// API Route pour dupliquer une page d'assemblage
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    const body = await request.json()
    const { sourcePageId } = body

    if (!sourcePageId) {
      return NextResponse.json(
        { success: false, error: 'ID de page source manquant' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Récupérer la page source
    const { data: sourcePage, error: fetchError } = await supabase
      .from('pages')
      .select('*')
      .eq('id', sourcePageId)
      .eq('project_id', projectId)
      .single()

    if (fetchError || !sourcePage) {
      return NextResponse.json(
        { success: false, error: 'Page source non trouvée' },
        { status: 404 }
      )
    }

    // 2. Calculer le nouveau numéro de page
    const { data: allPages, error: countError } = await supabase
      .from('pages')
      .select('page_number')
      .eq('project_id', projectId)
      .order('page_number', { ascending: true })

    if (countError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors du calcul du numéro de page' },
        { status: 500 }
      )
    }

    const newPageNumber = (allPages?.length || 0) + 1

    // 3. Créer la page dupliquée
    const duplicatedPage = {
      project_id: projectId,
      page_number: newPageNumber,
      title: `${sourcePage.title} (Copie)`,
      content: sourcePage.content, // Copie complète du contenu
      metadata: {
        ...sourcePage.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      status: sourcePage.status
    }

    const { data: newPage, error: createError } = await supabase
      .from('pages')
      .insert(duplicatedPage)
      .select()
      .single()

    if (createError) {
      console.error('Erreur création page dupliquée:', createError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la duplication' },
        { status: 500 }
      )
    }

    // 4. Mettre à jour le compteur de pages du projet
    const { error: updateProjectError } = await supabase
      .from('projects')
      .update({ 
        pages_count: newPageNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateProjectError) {
      console.warn('Erreur mise à jour compteur pages:', updateProjectError)
    }

    return NextResponse.json({
      success: true,
      page: newPage,
      message: 'Page dupliquée avec succès'
    })

  } catch (error) {
    console.error('Erreur API duplicate-page:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

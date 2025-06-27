import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// PUT /api/projects/[id]/pages/renumber - Renuméroter une page spécifique
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    const { pageId, newPageNumber } = await request.json()

    if (!pageId || !newPageNumber) {
      return NextResponse.json(
        { error: 'pageId et newPageNumber sont requis' },
        { status: 400 }
      )
    }

    if (typeof newPageNumber !== 'number' || newPageNumber <= 0) {
      return NextResponse.json(
        { error: 'newPageNumber doit être un nombre positif' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier que l'utilisateur a accès au projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou accès refusé' },
        { status: 404 }
      )
    }

    // Vérifier que la page appartient au projet
    const { data: page, error: pageError } = await supabase
      .from('pages')
      .select('id, page_number')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .single()

    if (pageError || !page) {
      return NextResponse.json(
        { error: 'Page non trouvée dans ce projet' },
        { status: 404 }
      )
    }

    console.log('🔄 API Renumber: Renumérotation page', pageId, 'vers', newPageNumber)

    // Appeler la fonction SQL de renumérotation
    const { data: result, error: renumberError } = await supabase
      .rpc('update_page_number', {
        p_page_id: pageId,
        p_new_page_number: newPageNumber
      })

    if (renumberError) {
      console.error('❌ Erreur renumérotation SQL:', renumberError)
      return NextResponse.json(
        { error: 'Erreur lors de la renumérotation', details: renumberError.message },
        { status: 500 }
      )
    }

    if (!result.success) {
      console.error('❌ Renumérotation échouée:', result.error)
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    console.log('✅ Renumérotation réussie:', result.message)

    // Récupérer la liste mise à jour des pages
    const { data: updatedPages, error: pagesError } = await supabase
      .rpc('get_pages_with_numbers', { p_project_id: projectId })

    if (pagesError) {
      console.error('❌ Erreur récupération pages:', pagesError)
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      action: result.action,
      pageId: result.page_id,
      oldNumber: result.old_number,
      newNumber: result.new_number,
      swappedWith: result.swapped_with || null,
      updatedPages: updatedPages || []
    })

  } catch (error) {
    console.error('❌ Erreur API renumber:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/pages/renumber - Renumérotation en lot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    const { updates } = await request.json()

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: 'updates doit être un tableau' },
        { status: 400 }
      )
    }

    // Valider le format des mises à jour
    for (const update of updates) {
      if (!update.pageId || typeof update.newNumber !== 'number' || update.newNumber <= 0) {
        return NextResponse.json(
          { error: 'Chaque mise à jour doit avoir pageId et newNumber valides' },
          { status: 400 }
        )
      }
    }

    const supabase = await createClient()

    // Vérifier que l'utilisateur a accès au projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou accès refusé' },
        { status: 404 }
      )
    }

    console.log('🔄 API Batch Renumber:', updates.length, 'pages à renuméroter')

    // Convertir au format attendu par la fonction SQL
    const sqlUpdates = updates.map(update => ({
      page_id: update.pageId,
      new_number: update.newNumber
    }))

    // Appeler la fonction SQL de renumérotation en lot
    const { data: result, error: renumberError } = await supabase
      .rpc('batch_update_page_numbers', {
        p_updates: sqlUpdates
      })

    if (renumberError) {
      console.error('❌ Erreur renumérotation en lot SQL:', renumberError)
      return NextResponse.json(
        { error: 'Erreur lors de la renumérotation en lot', details: renumberError.message },
        { status: 500 }
      )
    }

    if (!result.success) {
      console.error('❌ Renumérotation en lot échouée:', result.error)
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 400 }
      )
    }

    console.log('✅ Renumérotation en lot réussie:', result.message)

    // Récupérer la liste mise à jour des pages
    const { data: updatedPages, error: pagesError } = await supabase
      .rpc('get_pages_with_numbers', { p_project_id: projectId })

    if (pagesError) {
      console.error('❌ Erreur récupération pages:', pagesError)
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      results: result.results,
      updatedPages: updatedPages || []
    })

  } catch (error) {
    console.error('❌ Erreur API batch renumber:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/pages/renumber/validate - Valider la numérotation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id

    const supabase = await createClient()

    // Vérifier que l'utilisateur a accès au projet
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Projet non trouvé ou accès refusé' },
        { status: 404 }
      )
    }

    // Valider la numérotation
    const { data: validation, error: validationError } = await supabase
      .rpc('validate_project_page_numbering', { p_project_id: projectId })

    if (validationError) {
      console.error('❌ Erreur validation numérotation:', validationError)
      return NextResponse.json(
        { error: 'Erreur lors de la validation', details: validationError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(validation)

  } catch (error) {
    console.error('❌ Erreur API validation:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

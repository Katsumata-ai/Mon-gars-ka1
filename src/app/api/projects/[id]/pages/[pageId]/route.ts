// API Route pour supprimer une page d'assemblage avec renumérotation intelligente
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    const pageId = resolvedParams.pageId

    const supabase = await createClient()

    // 1. Vérifier que la page existe et récupérer son numéro
    const { data: pageToDelete, error: fetchError } = await supabase
      .from('pages')
      .select('page_number')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .single()

    if (fetchError || !pageToDelete) {
      return NextResponse.json(
        { success: false, error: 'Page non trouvée' },
        { status: 404 }
      )
    }

    // 2. Vérifier qu'il reste au moins une page
    const { data: allPages, error: countError } = await supabase
      .from('pages')
      .select('id')
      .eq('project_id', projectId)

    if (countError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    if (allPages && allPages.length <= 1) {
      return NextResponse.json(
        { success: false, error: 'Impossible de supprimer la dernière page' },
        { status: 400 }
      )
    }

    const deletedPageNumber = pageToDelete.page_number

    // 3. Supprimer la page
    const { error: deleteError } = await supabase
      .from('pages')
      .delete()
      .eq('id', pageId)
      .eq('project_id', projectId)

    if (deleteError) {
      console.error('Erreur suppression page:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    // 4. Renumérotation intelligente : décrémenter toutes les pages après celle supprimée
    const { error: renumberError } = await supabase.rpc('renumber_pages_after_deletion', {
      p_project_id: projectId,
      p_deleted_page_number: deletedPageNumber
    })

    if (renumberError) {
      console.warn('Erreur renumérotation:', renumberError)
      // Fallback : renumérotation manuelle
      await fallbackRenumbering(supabase, projectId)
    }

    // 5. Mettre à jour le compteur de pages du projet
    const newPagesCount = (allPages?.length || 1) - 1
    const { error: updateProjectError } = await supabase
      .from('projects')
      .update({ 
        pages_count: newPagesCount,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)

    if (updateProjectError) {
      console.warn('Erreur mise à jour compteur pages:', updateProjectError)
    }

    return NextResponse.json({
      success: true,
      deletedPageNumber,
      newPagesCount,
      message: 'Page supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur API delete-page:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction de fallback pour la renumérotation manuelle
async function fallbackRenumbering(supabase: any, projectId: string) {
  try {
    // Récupérer toutes les pages triées par numéro
    const { data: pages, error } = await supabase
      .from('pages')
      .select('id, page_number')
      .eq('project_id', projectId)
      .order('page_number', { ascending: true })

    if (error || !pages) return

    // Renuméroter séquentiellement
    for (let i = 0; i < pages.length; i++) {
      const newNumber = i + 1
      if (pages[i].page_number !== newNumber) {
        await supabase
          .from('pages')
          .update({ page_number: newNumber })
          .eq('id', pages[i].id)
      }
    }
  } catch (error) {
    console.error('Erreur fallback renumérotation:', error)
  }
}

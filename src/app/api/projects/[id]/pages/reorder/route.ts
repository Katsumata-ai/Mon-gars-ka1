// API Route pour réorganiser l'ordre des pages
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ReorderRequest {
  pageOrders: Array<{
    pageId: string
    newPageNumber: number
  }>
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const projectId = resolvedParams.id
    const body: ReorderRequest = await request.json()
    const { pageOrders } = body

    if (!pageOrders || !Array.isArray(pageOrders) || pageOrders.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Données de réorganisation manquantes' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // 1. Valider que toutes les pages appartiennent au projet
    const pageIds = pageOrders.map(p => p.pageId)
    const { data: existingPages, error: validateError } = await supabase
      .from('pages')
      .select('id, page_number')
      .eq('project_id', projectId)
      .in('id', pageIds)

    if (validateError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la validation' },
        { status: 500 }
      )
    }

    if (!existingPages || existingPages.length !== pageOrders.length) {
      return NextResponse.json(
        { success: false, error: 'Certaines pages n\'existent pas' },
        { status: 400 }
      )
    }

    // 2. Valider la séquence de numérotation (doit être 1, 2, 3, ...)
    const sortedOrders = [...pageOrders].sort((a, b) => a.newPageNumber - b.newPageNumber)
    for (let i = 0; i < sortedOrders.length; i++) {
      if (sortedOrders[i].newPageNumber !== i + 1) {
        return NextResponse.json(
          { success: false, error: 'Numérotation invalide - doit être séquentielle' },
          { status: 400 }
        )
      }
    }

    // 3. Effectuer la réorganisation en transaction
    const updates = pageOrders.map(({ pageId, newPageNumber }) => ({
      id: pageId,
      page_number: newPageNumber,
      updated_at: new Date().toISOString()
    }))

    // Utiliser une transaction pour garantir la cohérence
    const { error: updateError } = await supabase.rpc('reorder_pages_transaction', {
      p_project_id: projectId,
      p_updates: updates
    })

    if (updateError) {
      console.warn('Erreur transaction renumérotation:', updateError)
      // Fallback : mise à jour séquentielle
      await fallbackReordering(supabase, projectId, pageOrders)
    }

    // 4. Mettre à jour le timestamp du projet
    const { error: updateProjectError } = await supabase
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId)

    if (updateProjectError) {
      console.warn('Erreur mise à jour projet:', updateProjectError)
    }

    return NextResponse.json({
      success: true,
      reorderedPages: pageOrders.length,
      message: 'Pages réorganisées avec succès'
    })

  } catch (error) {
    console.error('Erreur API reorder-pages:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction de fallback pour la réorganisation
async function fallbackReordering(
  supabase: any, 
  projectId: string, 
  pageOrders: Array<{ pageId: string; newPageNumber: number }>
) {
  try {
    // Mettre à jour chaque page individuellement
    for (const { pageId, newPageNumber } of pageOrders) {
      await supabase
        .from('pages')
        .update({ 
          page_number: newPageNumber,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .eq('project_id', projectId)
    }
  } catch (error) {
    console.error('Erreur fallback réorganisation:', error)
    throw error
  }
}

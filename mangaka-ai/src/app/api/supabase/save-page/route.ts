// API Route pour sauvegarder une page d'assemblage avec MCP Supabase
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { pageId, projectId, content, status } = await request.json()

    if (!pageId || !projectId || !content) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier si la page existe déjà
    const { data: existingPage } = await supabase
      .from('pages')
      .select('id')
      .eq('id', pageId)
      .eq('project_id', projectId)
      .single()

    if (existingPage) {
      // Mettre à jour la page existante
      const { error } = await supabase
        .from('pages')
        .update({
          content,
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', pageId)
        .eq('project_id', projectId)

      if (error) {
        console.error('Erreur mise à jour page:', error)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la mise à jour' },
          { status: 500 }
        )
      }
    } else {
      // Calculer le prochain numéro de page disponible
      const { data: maxPageData } = await supabase
        .from('pages')
        .select('page_number')
        .eq('project_id', projectId)
        .order('page_number', { ascending: false })
        .limit(1)

      const nextPageNumber = maxPageData && maxPageData.length > 0
        ? maxPageData[0].page_number + 1
        : 1

      console.log('📄 Création nouvelle page:', { pageId, projectId, nextPageNumber })

      // Créer une nouvelle page avec le bon numéro
      const { error } = await supabase
        .from('pages')
        .insert({
          id: pageId,
          project_id: projectId,
          title: `Page ${nextPageNumber}`,
          page_number: nextPageNumber,
          content,
          status
        })

      if (error) {
        console.error('Erreur création page:', error)
        return NextResponse.json(
          { success: false, error: 'Erreur lors de la création' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Page sauvegardée avec succès'
    })

  } catch (error) {
    console.error('Erreur API save-page:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

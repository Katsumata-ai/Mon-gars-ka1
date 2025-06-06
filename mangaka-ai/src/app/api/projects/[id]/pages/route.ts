import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Interface pour les métadonnées de page
interface PageMetadata {
  id: string
  page_number: number
  title: string
  content: any
  thumbnail_url?: string
  created_at: string
  updated_at: string
}

// GET /api/projects/[id]/pages - Récupérer toutes les pages d'un projet
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const supabase = await createClient()

    // Récupérer les pages depuis Supabase
    const { data: pages, error } = await supabase
      .from('pages')
      .select('*')
      .eq('project_id', projectId)
      .order('page_number', { ascending: true })

    if (error) {
      console.error('Erreur récupération pages:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la récupération des pages'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pages: pages || []
    })

  } catch (error) {
    console.error('Erreur récupération pages:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération des pages' 
      },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/pages - Créer une nouvelle page
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const { page_number, title } = body
    const supabase = await createClient()

    // Créer la nouvelle page dans Supabase
    const { data: newPage, error } = await supabase
      .from('pages')
      .insert({
        project_id: projectId,
        page_number,
        title: title || `Page ${page_number}`,
        content: {
          stage: {
            children: []
          }
        },
        status: 'empty'
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur création page:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la création de la page'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      page: newPage
    })

  } catch (error) {
    console.error('Erreur création page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la création de la page'
      },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/pages - Supprimer une page
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const { searchParams } = new URL(request.url)
    const pageNumber = searchParams.get('page_number')

    if (!pageNumber) {
      return NextResponse.json(
        {
          success: false,
          error: 'page_number requis'
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Supprimer la page
    const { error } = await supabase
      .from('pages')
      .delete()
      .eq('project_id', projectId)
      .eq('page_number', parseInt(pageNumber))

    if (error) {
      console.error('Erreur suppression page:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la suppression de la page'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Page supprimée avec succès'
    })

  } catch (error) {
    console.error('Erreur suppression page:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la suppression de la page'
      },
      { status: 500 }
    )
  }
}

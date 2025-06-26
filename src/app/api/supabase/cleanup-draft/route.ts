// API Route pour nettoyer les drafts temporaires
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(request: NextRequest) {
  try {
    const { pageId, userId, sessionId } = await request.json()

    if (!pageId || !userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Supprimer le draft
    const { error } = await supabase
      .from('page_drafts')
      .delete()
      .eq('page_id', pageId)
      .eq('user_id', userId)
      .eq('session_id', sessionId)

    if (error) {
      console.error('Erreur suppression draft:', error)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Draft nettoyé avec succès'
    })

  } catch (error) {
    console.error('Erreur API cleanup-draft:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

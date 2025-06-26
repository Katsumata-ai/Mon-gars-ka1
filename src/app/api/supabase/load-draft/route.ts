// API Route pour charger un draft temporaire
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageId = searchParams.get('pageId')
    const userId = searchParams.get('userId')
    const sessionId = searchParams.get('sessionId')

    if (!pageId || !userId || !sessionId) {
      return NextResponse.json(
        { success: false, error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Charger le draft non expiré
    const { data: draft, error } = await supabase
      .from('page_drafts')
      .select('*')
      .eq('page_id', pageId)
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !draft) {
      return NextResponse.json({
        success: false,
        message: 'Aucun draft trouvé'
      })
    }

    return NextResponse.json({
      success: true,
      draft
    })

  } catch (error) {
    console.error('Erreur API load-draft:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

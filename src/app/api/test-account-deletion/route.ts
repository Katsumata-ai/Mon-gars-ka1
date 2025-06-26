import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { action, email, password } = await req.json()

    if (action === 'create_test_user') {
      // Créer un utilisateur de test
      const supabase = await createClient()
      
      const { data, error } = await supabase.auth.signUp({
        email: email || 'test-deletion@mangaka-test.com',
        password: password || 'TestPassword123!'
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: 'Utilisateur de test créé',
        user: { id: data.user?.id, email: data.user?.email }
      })
    }

    if (action === 'check_user_exists') {
      // Vérifier si un utilisateur existe
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const { data: users, error } = await supabaseAdmin
        .from('auth.users')
        .select('id, email, created_at')
        .eq('email', email)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({
        exists: users && users.length > 0,
        users: users || []
      })
    }

    if (action === 'cleanup_test_users') {
      // Nettoyer tous les utilisateurs de test
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      // Supprimer les utilisateurs de test
      const { data: testUsers } = await supabaseAdmin
        .from('auth.users')
        .select('id, email')
        .or('email.ilike.%test%,email.ilike.%demo%')

      let deletedCount = 0
      if (testUsers) {
        for (const user of testUsers) {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
          if (!error) {
            deletedCount++
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `${deletedCount} utilisateurs de test supprimés`
      })
    }

    return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 })

  } catch (error) {
    console.error('Erreur test:', error)
    return NextResponse.json({ 
      error: 'Erreur interne',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

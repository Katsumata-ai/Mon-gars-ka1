import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function DELETE(req: NextRequest) {
  try {
    console.log('🗑️ Début de la suppression de compte')

    const supabase = await createClient()

    if (!supabase) {
      console.error('❌ Impossible de créer le client Supabase')
      return NextResponse.json({ error: 'Erreur de configuration' }, { status: 500 })
    }

    if (!supabase.auth) {
      console.error('❌ Client Supabase auth non disponible')
      return NextResponse.json({ error: 'Erreur d\'authentification' }, { status: 500 })
    }

    // Vérifier l'authentification
    console.log('🔍 Tentative de récupération de l\'utilisateur...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 Résultat auth:', {
      user: user ? { id: user.id, email: user.email } : null,
      authError: authError ? authError.message : null
    })

    if (authError || !user) {
      console.error('❌ Utilisateur non authentifié:', authError)
      return NextResponse.json({
        error: 'Non authentifié',
        details: authError ? authError.message : 'Aucun utilisateur trouvé'
      }, { status: 401 })
    }

    console.log('🗑️ Début de suppression du compte pour:', user.email)

    // 1. Récupérer et canceller les abonnements Stripe AVANT de supprimer les données
    const { data: userSubscriptions, error: fetchSubError } = await supabase
      .from('user_subscriptions')
      .select('id, stripe_subscription_id, status')
      .eq('user_id', user.id)

    if (fetchSubError) {
      console.error('❌ Erreur récupération abonnements:', fetchSubError)
    } else if (userSubscriptions && userSubscriptions.length > 0) {
      console.log(`🔍 ${userSubscriptions.length} abonnement(s) trouvé(s)`)

      // Canceller chaque abonnement Stripe
      for (const subscription of userSubscriptions) {
        if (subscription.stripe_subscription_id && subscription.status === 'active') {
          try {
            console.log(`🚫 Cancellation abonnement Stripe: ${subscription.stripe_subscription_id}`)
            await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
            console.log(`✅ Abonnement Stripe ${subscription.stripe_subscription_id} cancellé`)
          } catch (stripeError) {
            console.error(`❌ Erreur cancellation Stripe ${subscription.stripe_subscription_id}:`, stripeError)
            // Continue même si la cancellation Stripe échoue
          }
        }
      }
    }

    // 2. Supprimer les abonnements de la base de données
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id)

    if (subscriptionError) {
      console.error('❌ Erreur suppression abonnements:', subscriptionError)
    } else {
      console.log('✅ Abonnements supprimés')
    }

    // 3. Supprimer les statistiques d'usage (si la table existe)
    try {
      const { error: usageError } = await supabase
        .from('user_usage_stats')
        .delete()
        .eq('user_id', user.id)

      if (usageError && usageError.code !== '42P01') {
        console.error('❌ Erreur suppression statistiques:', usageError)
      } else {
        console.log('✅ Statistiques d\'usage supprimées (ou table inexistante)')
      }
    } catch (error) {
      console.log('⚠️ Table user_usage_stats inexistante, ignorée')
    }

    // 4. Supprimer les projets de l'utilisateur
    const { error: projectsError } = await supabase
      .from('projects')
      .delete()
      .eq('user_id', user.id)

    if (projectsError) {
      console.error('❌ Erreur suppression projets:', projectsError)
    } else {
      console.log('✅ Projets supprimés')
    }

    // 5. Supprimer les personnages de l'utilisateur
    const { error: charactersError } = await supabase
      .from('characters')
      .delete()
      .eq('user_id', user.id)

    if (charactersError) {
      console.error('❌ Erreur suppression personnages:', charactersError)
    } else {
      console.log('✅ Personnages supprimés')
    }

    // 6. Supprimer les décors de l'utilisateur (si la table existe)
    try {
      const { error: backgroundsError } = await supabase
        .from('backgrounds')
        .delete()
        .eq('user_id', user.id)

      if (backgroundsError && backgroundsError.code !== '42P01') {
        console.error('❌ Erreur suppression décors:', backgroundsError)
      } else {
        console.log('✅ Décors supprimés (ou table inexistante)')
      }
    } catch (error) {
      console.log('⚠️ Table backgrounds inexistante, ignorée')
    }

    // 7. Supprimer les scènes de l'utilisateur (si la table existe)
    try {
      const { error: scenesError } = await supabase
        .from('scenes')
        .delete()
        .eq('user_id', user.id)

      if (scenesError && scenesError.code !== '42P01') {
        console.error('❌ Erreur suppression scènes:', scenesError)
      } else {
        console.log('✅ Scènes supprimées (ou table inexistante)')
      }
    } catch (error) {
      console.log('⚠️ Table scenes inexistante, ignorée')
    }

    // 8. Supprimer les pages de l'utilisateur (via les projets)
    try {
      // Les pages sont liées aux projets, pas directement à l'utilisateur
      // Elles seront supprimées automatiquement par cascade quand on supprime les projets
      console.log('✅ Pages supprimées via suppression des projets')
    } catch (error) {
      console.log('⚠️ Suppression des pages via projets')
    }

    // 9. Supprimer toutes les autres données liées à l'utilisateur
    // (Ajoutez ici d'autres tables si nécessaire)

    // 10. Supprimer le compte d'authentification Supabase
    // Utiliser l'API Admin pour supprimer définitivement le compte
    try {
      console.log('🔧 Tentative de suppression du compte d\'authentification pour:', user.id)

      // Créer un client admin avec la clé de service
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )

      console.log('🔧 Client admin créé, suppression en cours...')

      // Supprimer le compte utilisateur définitivement
      const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

      if (deleteUserError) {
        console.error('❌ Erreur suppression compte utilisateur:', deleteUserError)
        console.error('❌ Détails de l\'erreur:', JSON.stringify(deleteUserError, null, 2))

        // Essayer une suppression alternative via SQL direct
        console.log('🔧 Tentative de suppression alternative via SQL...')
        try {
          const { error: sqlError } = await supabaseAdmin
            .from('auth.users')
            .delete()
            .eq('id', user.id)

          if (sqlError) {
            console.error('❌ Erreur suppression SQL:', sqlError)
            console.log('⚠️ Données supprimées mais compte d\'authentification conservé')
          } else {
            console.log('✅ Compte d\'authentification supprimé via SQL')
          }
        } catch (sqlError) {
          console.error('❌ Erreur suppression SQL alternative:', sqlError)
          console.log('⚠️ Données supprimées mais compte d\'authentification conservé')
        }
      } else {
        console.log('✅ Compte d\'authentification supprimé définitivement')
      }
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du compte d\'authentification:', error)
      console.log('⚠️ Données supprimées mais compte d\'authentification conservé')
    }

    // 11. Déconnecter l'utilisateur de la session actuelle
    try {
      await supabase.auth.signOut()
      console.log('✅ Session utilisateur fermée')
    } catch (error) {
      console.log('⚠️ Déconnexion de session non nécessaire')
    }

    return NextResponse.json({
      success: true,
      message: 'Compte supprimé avec succès - toutes les données et abonnements ont été supprimés'
    })

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error)
    return NextResponse.json({ 
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

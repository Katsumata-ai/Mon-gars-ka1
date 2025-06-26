import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API de succès après paiement Stripe
 * Simule le webhook et redirige vers la thank you page
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('session_id')
    const plan = searchParams.get('plan')
    const isTest = searchParams.get('test') === 'true'

    console.log('🎉 Paiement réussi:', { sessionId, plan, isTest })

    if (!sessionId) {
      console.error('❌ Session ID manquant')
      return NextResponse.redirect(new URL('/dashboard?error=missing_session', req.url))
    }

    // Récupérer l'utilisateur actuel
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('❌ Utilisateur non authentifié:', authError)
      return NextResponse.redirect(new URL('/dashboard?error=not_authenticated', req.url))
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Simuler la création de l'abonnement (comme le ferait un webhook)
    await simulateWebhookSubscription(user.id, user.email, sessionId, plan)

    // Rediriger vers la thank you page
    const thankYouUrl = new URL('/thank-you', req.url)
    thankYouUrl.searchParams.set('session_id', sessionId)
    thankYouUrl.searchParams.set('plan', plan || 'yearly')
    if (isTest) {
      thankYouUrl.searchParams.set('test', 'true')
    }

    console.log('🔗 Redirection vers thank you page:', thankYouUrl.toString())
    return NextResponse.redirect(thankYouUrl)

  } catch (error) {
    console.error('❌ Erreur dans success handler:', error)
    return NextResponse.redirect(new URL('/dashboard?error=processing_failed', req.url))
  }
}

/**
 * Simule la création d'un abonnement comme le ferait un webhook Stripe
 */
async function simulateWebhookSubscription(
  userId: string, 
  userEmail: string, 
  sessionId: string, 
  plan: string | null
) {
  try {
    console.log('🧪 Simulation webhook pour:', { userId, userEmail, sessionId, plan })

    const supabase = await createClient()

    // 1. Récupérer le plan de test
    const { data: planData, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .eq('name', 'Mangaka Senior Test Plan')
      .single()

    if (planError || !planData) {
      console.error('❌ Plan de test non trouvé:', planError)
      throw new Error('Test plan not found')
    }

    console.log('✅ Plan trouvé:', planData)

    // 2. Vérifier si un abonnement existe déjà pour cet utilisateur
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingSubscription) {
      console.log('✅ Abonnement existant trouvé, pas de création nécessaire')
      return
    }

    // 3. Créer l'abonnement
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: `sub_test_${sessionId.slice(-10)}`,
      stripe_customer_id: `cus_test_${userId.slice(-10)}`,
      plan_id: planData.id,
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // +1 an
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .insert(subscriptionData)
      .select()
      .single()

    if (subError) {
      console.error('❌ Erreur création abonnement:', subError)
      throw new Error('Failed to create subscription')
    }

    console.log('✅ Abonnement créé avec succès:', subscription.id)

    // 4. Vérifier que la jointure fonctionne
    const { data: verifySubscription, error: verifyError } = await supabase
      .from('user_subscriptions')
      .select(`
        id, 
        status, 
        subscription_plans!inner(
          id,
          name,
          features
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (verifyError) {
      console.error('❌ Erreur vérification jointure:', verifyError)
    } else {
      console.log('✅ Jointure vérifiée:', verifySubscription)
    }

  } catch (error) {
    console.error('❌ Erreur simulation webhook:', error)
    throw error
  }
}

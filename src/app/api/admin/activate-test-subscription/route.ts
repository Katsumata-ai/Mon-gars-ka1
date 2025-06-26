import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()
    
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🧪 Activating test subscription for user:', user.id)

    // 1. Créer les plans de test s'ils n'existent pas
    const testPlans = [
      {
        name: 'Mangaka Senior Test Monthly',
        stripe_product_id: 'prod_test_monthly',
        stripe_price_id: 'price_test_monthly',
        price_amount: 100,
        currency: 'eur',
        billing_interval: 'month',
        features: ['unlimited_generation', 'unlimited_characters', 'unlimited_backgrounds', 'unlimited_scenes', 'unlimited_pages', 'unlimited_projects'],
        is_active: true
      }
    ]

    // Insérer ou mettre à jour le plan
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .upsert(testPlans[0], { onConflict: 'stripe_product_id' })
      .select()
      .single()

    if (planError) {
      console.error('❌ Error creating plan:', planError)
      return NextResponse.json(
        { error: 'Failed to create plan', details: planError },
        { status: 500 }
      )
    }

    console.log('✅ Plan created/updated:', plan.id)

    // 2. Supprimer les anciens abonnements
    await supabase
      .from('user_subscriptions')
      .delete()
      .eq('user_id', user.id)

    // 3. Créer le nouvel abonnement
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        stripe_customer_id: `cus_test_${user.id}`,
        stripe_subscription_id: `sub_test_${sessionId}`,
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        cancel_at_period_end: false
      })
      .select()
      .single()

    if (subscriptionError) {
      console.error('❌ Error creating subscription:', subscriptionError)
      return NextResponse.json(
        { error: 'Failed to create subscription', details: subscriptionError },
        { status: 500 }
      )
    }

    console.log('✅ Subscription created:', subscription.id)

    // 4. Créer les crédits illimités
    const creditTypes = ['character_generation', 'background_generation', 'scene_generation', 'page_generation', 'project_creation']
    
    for (const creditType of creditTypes) {
      await supabase
        .from('user_credits')
        .upsert({
          user_id: user.id,
          credit_type: creditType,
          amount: -1, // -1 = illimité
          used: 0
        }, { onConflict: 'user_id,credit_type' })
    }

    console.log('✅ Credits updated to unlimited')

    return NextResponse.json({
      success: true,
      message: 'Test subscription activated successfully',
      subscription: subscription,
      plan: plan
    })

  } catch (error) {
    console.error('❌ Error in activate-test-subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}

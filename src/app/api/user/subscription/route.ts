import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification avec cache
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Récupérer l'abonnement avec les détails du plan et les crédits en parallèle
    const [subscriptionResult, creditsResult] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          stripe_subscription_id,
          stripe_customer_id,
          plan_id
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'incomplete', 'canceled'])
        .order('created_at', { ascending: false })
        .limit(1),

      supabase
        .from('user_credits')
        .select('credits_remaining, credits_total, last_reset_date')
        .eq('user_id', user.id)
        .single()
    ])

    const { data: subscription, error: subError } = subscriptionResult
    const { data: credits, error: creditsError } = creditsResult

    if (subError) {
      console.error('Error fetching subscription:', subError)
      // Ne pas retourner d'erreur, continuer avec un plan gratuit
    }

    if (creditsError && creditsError.code !== 'PGRST116') {
      console.error('Error fetching credits:', creditsError)
    }

    // Déterminer le plan actuel
    let currentPlan = 'junior' // Plan par défaut
    let planFeatures: string[] = ['basic_generation', 'limited_export']
    let hasActiveSubscription = false

    // 🎨 EXCEPTION FONDATEUR : Accès premium gratuit pour le fondateur
    if (user.email === 'nefziamenallah2007@gmail.com') {
      currentPlan = 'senior'
      planFeatures = ['unlimited_generation', 'unlimited_characters', 'unlimited_backgrounds', 'unlimited_scenes', 'unlimited_pages', 'unlimited_projects', 'unlimited_export', 'advanced_tools', 'hd_export', 'priority_support']
      hasActiveSubscription = true
    }

    // Vérifier les abonnements payants seulement si ce n'est pas le fondateur
    if (!hasActiveSubscription && subscription && subscription.length > 0) {
      const userSubscription = subscription[0]

      console.log('🔍 Subscription found:', {
        subscriptionId: userSubscription.id,
        status: userSubscription.status,
        planId: userSubscription.plan_id,
        currentPeriodEnd: userSubscription.current_period_end
      })

      // Récupérer les données du plan séparément
      console.log('🔍 Fetching plan with ID:', userSubscription.plan_id)

      const { data: planData, error: planError } = await supabase
        .from('subscription_plans')
        .select('id, name, features, billing_interval, price_amount')
        .eq('id', userSubscription.plan_id)
        .single()

      console.log('📊 Plan query result:', { planData, planError })

      if (planError) {
        console.error('❌ Error fetching plan data:', planError)

        // Essayons sans .single() pour voir s'il y a plusieurs résultats
        const { data: allPlans, error: allPlansError } = await supabase
          .from('subscription_plans')
          .select('id, name, features, billing_interval, price_amount')
          .eq('id', userSubscription.plan_id)

        console.log('🔍 All plans query:', { allPlans, allPlansError })
      } else {
        console.log('✅ Plan data found:', planData)
      }

      const planName = planData?.name

      // Vérifier si l'abonnement est encore actif (pas expiré)
      // Accepter 'active' et 'incomplete' (en attente de paiement) comme valides
      const isActive = (userSubscription.status === 'active' || userSubscription.status === 'incomplete') &&
        (userSubscription.current_period_end === null || new Date(userSubscription.current_period_end) > new Date())

      console.log('🔍 Subscription validation:', {
        isActive,
        planName,
        status: userSubscription.status,
        periodEnd: userSubscription.current_period_end,
        now: new Date().toISOString()
      })

      if (isActive && planName && (planName.includes('Senior') || planName.includes('Pro'))) {
        currentPlan = 'senior'
        planFeatures = planData?.features || ['unlimited_generation', 'unlimited_characters', 'unlimited_backgrounds', 'unlimited_scenes', 'unlimited_pages', 'unlimited_projects', 'unlimited_export', 'advanced_tools', 'hd_export', 'priority_support']
        hasActiveSubscription = true

        console.log('✅ Premium subscription activated:', {
          planName,
          features: planFeatures,
          currentPlan
        })
      } else {
        console.log('❌ Subscription not active or invalid plan:', {
          isActive,
          planName,
          status: userSubscription.status,
          periodEnd: userSubscription.current_period_end
        })
      }
    }

    const response = NextResponse.json({
      subscription: subscription?.[0] || null,
      credits: credits || { credits_remaining: 10, credits_total: 10, last_reset_date: new Date() },
      currentPlan,
      features: planFeatures,
      hasActiveSubscription,
      planName: currentPlan === 'senior' ? 'Mangaka Senior' : 'Mangaka Junior'
    })

    // Headers de cache pour optimiser les performances
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
    response.headers.set('X-Response-Time', Date.now().toString())

    return response

  } catch (error) {
    console.error('Error in subscription API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, amount } = await req.json()
    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (action === 'use_credit') {
      // Utiliser un crédit via le système unifié
      const creditAmount = amount || 1

      // Incrémenter l'usage mensuel
      const { error: updateError } = await supabase
        .rpc('increment_user_usage', {
          p_user_id: user.id,
          p_usage_type: 'monthly_generations',
          p_amount: creditAmount
        })

      if (updateError) {
        console.error('Error updating usage:', updateError)
        return NextResponse.json(
          { error: 'Failed to update usage' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'Credit used successfully'
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in subscription POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

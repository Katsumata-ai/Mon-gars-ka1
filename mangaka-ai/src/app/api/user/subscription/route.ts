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

    // Récupérer l'abonnement et les crédits en parallèle pour optimiser les performances
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
          subscription_plans (
            name,
            features,
            billing_interval,
            price_amount
          )
        `)
        .eq('user_id', user.id)
        .in('status', ['active', 'canceled'])
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

    if (subscription && subscription.length > 0) {
      const userSubscription = subscription[0]
      const subscriptionPlan = userSubscription.subscription_plans as any
      const planName = subscriptionPlan?.name

      // Vérifier si l'abonnement est encore actif (pas expiré)
      const isActive = userSubscription.status === 'active' &&
        (!userSubscription.current_period_end || new Date(userSubscription.current_period_end) > new Date())

      if (isActive && planName && (planName.includes('Senior') || planName.includes('Pro'))) {
        currentPlan = 'senior'
        planFeatures = subscriptionPlan?.features || ['unlimited_generation', 'unlimited_characters', 'unlimited_backgrounds', 'unlimited_scenes', 'unlimited_pages', 'unlimited_projects', 'unlimited_export', 'advanced_tools', 'hd_export', 'priority_support']
        hasActiveSubscription = true
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
      // Utiliser un crédit - version simplifiée
      const { data: currentCredits, error: fetchError } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .single()

      if (fetchError) {
        console.error('Error fetching credits:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch credits' },
          { status: 500 }
        )
      }

      const creditAmount = amount || 1
      if (currentCredits.credits_remaining < creditAmount) {
        return NextResponse.json({
          success: false,
          message: 'Insufficient credits'
        })
      }

      // Décrémenter les crédits
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          credits_remaining: currentCredits.credits_remaining - creditAmount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Error updating credits:', updateError)
        return NextResponse.json(
          { error: 'Failed to update credits' },
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

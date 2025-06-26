import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API de test pour diagnostiquer le système d'abonnements
 * Accessible uniquement en mode développement
 */
export async function GET(req: NextRequest) {
  // Sécurité: seulement en développement
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const supabase = await createClient()
    
    // 1. Tester la nouvelle requête avec jointure
    console.log('🧪 Test de la requête d\'abonnement corrigée...')
    
    const { data: subscriptions, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        id, 
        user_id,
        status, 
        current_period_start, 
        current_period_end, 
        cancel_at_period_end, 
        stripe_subscription_id, 
        stripe_customer_id, 
        plan_id,
        subscription_plans!inner(
          id,
          name,
          features,
          billing_interval,
          price_amount
        )
      `)
      .in('status', ['active', 'incomplete', 'canceled'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (subError) {
      console.error('❌ Erreur requête abonnements:', subError)
      return NextResponse.json({ 
        error: 'Subscription query failed', 
        details: subError 
      }, { status: 500 })
    }

    // 2. Analyser les données
    const analysisResults = subscriptions.map(sub => {
      const planData = Array.isArray(sub.subscription_plans) 
        ? sub.subscription_plans[0] 
        : sub.subscription_plans

      const isActive = (sub.status === 'active' || sub.status === 'incomplete') &&
        (sub.current_period_end === null || new Date(sub.current_period_end) > new Date())

      return {
        subscriptionId: sub.id,
        userId: sub.user_id,
        status: sub.status,
        isActive,
        planId: sub.plan_id,
        planName: planData?.name || 'NULL ❌',
        planFeatures: planData?.features || 'NULL ❌',
        hasValidPlan: !!(planData && planData.name),
        periodEnd: sub.current_period_end,
        stripeSubId: sub.stripe_subscription_id
      }
    })

    // 3. Statistiques
    const stats = {
      totalSubscriptions: subscriptions.length,
      activeSubscriptions: analysisResults.filter(s => s.isActive).length,
      subscriptionsWithValidPlan: analysisResults.filter(s => s.hasValidPlan).length,
      subscriptionsWithMissingPlan: analysisResults.filter(s => !s.hasValidPlan).length
    }

    // 4. Vérifier les plans disponibles
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)

    if (plansError) {
      console.error('❌ Erreur requête plans:', plansError)
    }

    // 5. Test spécifique pour le fondateur
    const { data: founderUser } = await supabase.auth.admin.listUsers()
    const founder = founderUser.users.find(u => u.email === 'nefziamenallah2007@gmail.com')
    
    let founderTest = null
    if (founder) {
      const { data: founderSubs } = await supabase
        .from('user_subscriptions')
        .select(`
          id, 
          status, 
          subscription_plans!inner(name, features)
        `)
        .eq('user_id', founder.id)
        .in('status', ['active', 'incomplete'])
        
      founderTest = {
        founderId: founder.id,
        founderEmail: founder.email,
        hasActiveSubscription: founderSubs && founderSubs.length > 0,
        subscriptionDetails: founderSubs?.[0] || null
      }
    }

    // 6. Test de l'API d'abonnement pour le fondateur
    let founderApiTest = null
    if (founder) {
      try {
        // Simuler l'appel API pour le fondateur
        const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(founder.id)
        
        if (!authError && user) {
          // Récupérer l'abonnement avec la nouvelle logique
          const [subscriptionResult] = await Promise.all([
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
                plan_id,
                subscription_plans!inner(
                  id,
                  name,
                  features,
                  billing_interval,
                  price_amount
                )
              `)
              .eq('user_id', user.id)
              .in('status', ['active', 'incomplete', 'canceled'])
              .order('created_at', { ascending: false })
              .limit(1)
          ])

          const subscription = subscriptionResult.data
          let currentPlan = 'junior'
          let hasActiveSubscription = false

          // Exception fondateur
          if (user.email === 'nefziamenallah2007@gmail.com') {
            currentPlan = 'senior'
            hasActiveSubscription = true
          }

          // Vérifier abonnement payant
          if (!hasActiveSubscription && subscription && subscription.length > 0) {
            const userSubscription = subscription[0]
            const planData = Array.isArray(userSubscription.subscription_plans) 
              ? userSubscription.subscription_plans[0] 
              : userSubscription.subscription_plans
            const planName = planData?.name

            const isActive = (userSubscription.status === 'active' || userSubscription.status === 'incomplete') &&
              (userSubscription.current_period_end === null || new Date(userSubscription.current_period_end) > new Date())

            if (isActive && planName && (planName.includes('Senior') || planName.includes('Pro'))) {
              currentPlan = 'senior'
              hasActiveSubscription = true
            }
          }

          founderApiTest = {
            userId: user.id,
            email: user.email,
            currentPlan,
            hasActiveSubscription,
            subscriptionData: subscription?.[0] || null,
            planData: subscription?.[0]?.subscription_plans || null
          }
        }
      } catch (error) {
        founderApiTest = { error: error.message }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      subscriptions: analysisResults,
      availablePlans: plans || [],
      founderTest,
      founderApiTest,
      diagnostics: {
        joinQueryWorking: subError === null,
        plansQueryWorking: plansError === null,
        criticalIssues: analysisResults.filter(s => s.isActive && !s.hasValidPlan)
      }
    })

  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error)
    return NextResponse.json({ 
      error: 'Diagnostic failed', 
      details: error.message 
    }, { status: 500 })
  }
}

/**
 * POST pour forcer la synchronisation d'un abonnement spécifique
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const { userId, subscriptionId } = await req.json()
    
    if (!userId && !subscriptionId) {
      return NextResponse.json({ 
        error: 'userId or subscriptionId required' 
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Forcer la mise à jour des données d'abonnement
    let query = supabase
      .from('user_subscriptions')
      .select(`
        id, 
        user_id,
        status, 
        plan_id,
        subscription_plans!inner(name, features)
      `)

    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('id', subscriptionId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription data refreshed',
      data
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Sync failed', 
      details: error.message 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function POST(req: NextRequest) {
  try {
    const { subscriptionId, cancelAtPeriodEnd = true } = await req.json()

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Vérifier que l'abonnement appartient à l'utilisateur
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', user.id)
      .eq('id', subscriptionId)
      .single()

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Subscription is not active' },
        { status: 400 }
      )
    }

    // Vérifier si c'est un abonnement de test
    const isTestSubscription = subscription.stripe_subscription_id.startsWith('sub_test_')

    let stripeSubscription: any = null

    if (isTestSubscription) {
      // Pour les abonnements de test, simuler la réponse Stripe
      stripeSubscription = {
        id: subscription.stripe_subscription_id,
        cancel_at_period_end: cancelAtPeriodEnd,
        current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 jours
      }

      console.log('🧪 Test subscription cancellation simulated:', {
        subscriptionId: subscription.stripe_subscription_id,
        cancelAtPeriodEnd
      })
    } else {
      // Pour les vrais abonnements, utiliser l'API Stripe
      try {
        stripeSubscription = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: cancelAtPeriodEnd,
          }
        )
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError)
        throw new Error('Failed to update subscription in Stripe')
      }
    }

    // Mettre à jour dans Supabase
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: cancelAtPeriodEnd,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)

    if (updateError) {
      console.error('Error updating subscription in database:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: cancelAtPeriodEnd 
        ? 'Votre abonnement sera annulé à la fin de la période de facturation actuelle'
        : 'Annulation de l\'abonnement annulée',
      subscription: {
        id: subscriptionId,
        cancel_at_period_end: cancelAtPeriodEnd,
        current_period_end: stripeSubscription.current_period_end
      }
    })

  } catch (error) {
    console.error('Error canceling subscription:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

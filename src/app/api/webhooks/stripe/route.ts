import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: any) {
    console.error('⚠️ Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent, supabase)
        break

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      default:
        console.log(`🤷‍♀️ Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('✅ Payment succeeded:', paymentIntent.id)

  // Récupérer les métadonnées utilisateur
  const userId = paymentIntent.metadata?.user_id
  if (!userId) {
    console.error('❌ No user_id in payment intent metadata')
    return
  }

  // Enregistrer le paiement
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      stripe_charge_id: paymentIntent.latest_charge,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'succeeded',
      payment_method: paymentIntent.payment_method_types[0],
      metadata: paymentIntent.metadata
    })

  if (paymentError) {
    console.error('❌ Error saving payment:', paymentError)
  }

  // Si c'est un achat one-time, activer les fonctionnalités
  const planId = paymentIntent.metadata?.plan_id
  if (planId) {
    await activateUserPlan(userId, planId, supabase)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent, supabase: any) {
  console.log('❌ Payment failed:', paymentIntent.id)

  const userId = paymentIntent.metadata?.user_id
  if (!userId) return

  // Enregistrer l'échec du paiement
  const { error } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: 'failed',
      metadata: paymentIntent.metadata
    })

  if (error) {
    console.error('❌ Error saving failed payment:', error)
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, supabase: any) {
  console.log('🆕 Subscription created:', subscription.id)

  const customerId = subscription.customer as string
  const userId = subscription.metadata?.user_id

  if (!userId) {
    console.error('❌ No user_id in subscription metadata')
    return
  }

  // Récupérer le plan correspondant
  const priceId = subscription.items.data[0]?.price.id
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single()

  if (!plan) {
    console.error('❌ Plan not found for price:', priceId)
    return
  }

  // Créer l'abonnement utilisateur
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: plan.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    })

  if (error) {
    console.error('❌ Error creating user subscription:', error)
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, supabase: any) {
  console.log('🔄 Subscription updated:', subscription.id)

  // Mettre à jour l'abonnement
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, supabase: any) {
  console.log('🗑️ Subscription deleted:', subscription.id)

  // Marquer l'abonnement comme annulé
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date()
    })
    .eq('stripe_subscription_id', subscription.id)

  if (error) {
    console.error('❌ Error canceling subscription:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, supabase: any) {
  console.log('💰 Invoice payment succeeded:', invoice.id)
  // Logique pour les paiements de facture réussis
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, supabase: any) {
  console.log('💸 Invoice payment failed:', invoice.id)
  // Logique pour les échecs de paiement de facture
}

async function activateUserPlan(userId: string, planId: string, supabase: any) {
  // Activer le plan pour l'utilisateur (pour les achats one-time)
  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .single()

  if (!plan) return

  // Créer un "abonnement" one-time (valide 30 jours)
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 30)

  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      current_period_start: new Date(),
      current_period_end: endDate
    })

  if (error) {
    console.error('❌ Error activating user plan:', error)
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, supabase: any) {
  console.log('🎯 Checkout session completed:', session.id)

  if (session.mode === 'subscription' && session.subscription) {
    console.log('💳 Subscription checkout completed, subscription will be handled by customer.subscription.created')
    // L'abonnement sera géré par l'événement customer.subscription.created
    return
  }

  if (session.mode === 'payment') {
    console.log('💰 One-time payment completed')

    const userId = session.metadata?.user_id
    const planId = session.metadata?.plan_id

    if (!userId || !planId) {
      console.error('❌ Missing user_id or plan_id in session metadata')
      return
    }

    // Activer le plan pour l'utilisateur (paiement unique)
    await activateUserPlan(userId, planId, supabase)
  }
}

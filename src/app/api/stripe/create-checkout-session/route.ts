import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

// Initialiser Stripe avec la clé secrète de production
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export async function GET(request: NextRequest) {
  console.log('🚀 Début de create-checkout-session')
  try {
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url)
    const plan = searchParams.get('plan') || 'yearly'
    console.log('📋 Plan demandé:', plan)

    // Vérifier les clés Stripe
    console.log('🔑 Clé Stripe disponible:', !!process.env.STRIPE_SECRET_KEY)
    console.log('🔑 Clé publique disponible:', !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

    // Vérifier l'authentification et récupérer l'utilisateur
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Erreur d\'authentification:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - User must be logged in' },
        { status: 401 }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.email)

    // Utiliser les prix configurés de production
    const priceId = plan === 'monthly'
      ? STRIPE_CONFIG.prices.monthly.id
      : STRIPE_CONFIG.prices.yearly.id

    if (!priceId) {
      console.log('❌ Plan invalide:', plan)
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      )
    }

    console.log('💰 Prix sélectionné:', priceId)

    // Create Stripe checkout session
    console.log('🏗️ Création de la session Stripe...')
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${request.headers.get('origin') || 'https://mangaka-ai.vercel.app'}/thank-you?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`,
      cancel_url: `${request.headers.get('origin') || 'https://mangaka-ai.vercel.app'}/dashboard?canceled=true`,
      metadata: {
        mode: 'production',
        plan: plan,
        user_id: user.id, // IMPORTANT: Add user ID for webhooks
      },
      // Use logged-in user's email
      customer_email: user.email || 'test@mangaka-ai.com',
      allow_promotion_codes: true,
    })

    console.log('✅ Session Stripe créée:', session.id)
    console.log('🔗 URL de redirection:', session.url)

    // Rediriger directement vers Stripe Checkout
    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

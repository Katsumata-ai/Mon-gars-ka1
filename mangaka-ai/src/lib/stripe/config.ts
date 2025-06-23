// 🎨 MANGAKA AI - Configuration Stripe
export const STRIPE_CONFIG = {
  // Clés API
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // Produits et prix Stripe (IDs créés via MCP)
  products: {
    seniorMonthly: {
      id: 'prod_SY1Ks2LInmwzOj',
      name: 'Mangaka Senior Monthly',
      priceId: 'price_1RcvI2CAB3oSopcYsW7xt2PL',
      amount: 2500, // 25€ en centimes
      paymentLink: 'https://buy.stripe.com/4gM6oG8pJ4X7bsp2II6Vq02'
    },
    seniorAnnual: {
      id: 'prod_SY1Ks2LInmwzOj',
      name: 'Mangaka Senior Annual',
      priceId: 'price_1RcvI9CAB3oSopcYVV5qDC1d',
      amount: 8000, // 80€ en centimes
      paymentLink: 'https://buy.stripe.com/5kQ4gy5dx9dneEB1EE6Vq03'
    }
  },

  // Plans tarifaires pour l'interface
  plans: [
    {
      id: 'junior',
      name: 'Mangaka Junior',
      price: { monthly: 0, yearly: 0 },
      description: 'Parfait pour découvrir la création manga',
      features: [
        { name: 'Personnages limités', included: true },
        { name: 'Décors limités', included: true },
        { name: 'Scènes limitées', included: true },
        { name: 'Pages limitées', included: true },
        { name: 'Projets limités', included: true },
        { name: 'Export limité', included: true }
      ],
      highlight: false,
      paymentLink: null
    },
    {
      id: 'senior',
      name: 'Mangaka Senior',
      price: { monthly: 25, yearly: 80 },
      description: 'Pour les créateurs manga sérieux',
      features: [
        { name: 'Personnages illimités', included: true, highlight: 'illimités' },
        { name: 'Décors illimités', included: true, highlight: 'illimités' },
        { name: 'Scènes illimitées', included: true, highlight: 'illimitées' },
        { name: 'Pages illimitées', included: true, highlight: 'illimitées' },
        { name: 'Projets illimités', included: true, highlight: 'illimités' },
        { name: 'Export illimité', included: true, highlight: 'illimité' }
      ],
      highlight: true,
      badge: 'Populaire',
      paymentLinks: {
        monthly: 'https://buy.stripe.com/4gM6oG8pJ4X7bsp2II6Vq02',
        yearly: 'https://buy.stripe.com/5kQ4gy5dx9dneEB1EE6Vq03'
      },
      stripeProductId: 'prod_SY1Ks2LInmwzOj',
      stripePriceIds: {
        monthly: 'price_1RcvI2CAB3oSopcYsW7xt2PL',
        yearly: 'price_1RcvI9CAB3oSopcYVV5qDC1d'
      }
    }
  ],

  // Configuration des fonctionnalités par plan
  features: {
    junior: [
      'basic_generation',
      'limited_export'
    ],
    senior: [
      'unlimited_generation',
      'unlimited_characters',
      'unlimited_backgrounds',
      'unlimited_scenes',
      'unlimited_pages',
      'unlimited_projects',
      'unlimited_export',
      'advanced_tools',
      'hd_export',
      'priority_support'
    ]
  },

  // Limites par plan
  limits: {
    junior: {
      generations_per_month: 10,
      projects: 3,
      export_quality: 'low'
    },
    senior: {
      generations_per_month: -1, // illimité
      projects: -1, // illimité
      export_quality: 'high'
    }
  }
}

// Types TypeScript
export interface StripePlan {
  id: string
  name: string
  price: { monthly: number; yearly: number }
  description: string
  features: Array<{
    name: string
    included: boolean
    highlight?: string
  }>
  highlight?: boolean
  badge?: string
  paymentLink?: string | null
  paymentLinks?: {
    monthly: string
    yearly: string
  }
  stripeProductId?: string
  stripePriceId?: string
  stripePriceIds?: {
    monthly: string
    yearly: string
  }
}

export interface StripeProduct {
  id: string
  name: string
  priceId: string
  amount: number
  paymentLink: string
}

// Utilitaires
export function getPlanById(planId: string): StripePlan | undefined {
  return STRIPE_CONFIG.plans.find(plan => plan.id === planId)
}

export function getProductById(productId: string): StripeProduct | undefined {
  return Object.values(STRIPE_CONFIG.products).find(product => product.id === productId)
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

export function hasFeature(planId: string, feature: string): boolean {
  const planFeatures = STRIPE_CONFIG.features[planId as keyof typeof STRIPE_CONFIG.features]
  return planFeatures?.includes(feature) || false
}

export function getPlanLimits(planId: string) {
  return STRIPE_CONFIG.limits[planId as keyof typeof STRIPE_CONFIG.limits] || STRIPE_CONFIG.limits.junior
}

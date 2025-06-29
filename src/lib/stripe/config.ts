// 🎨 MANGAKA AI - Stripe Configuration
export const STRIPE_CONFIG = {
  // API Keys
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // Product & Pricing - PRODUCTION MODE
  product: {
    id: 'prod_SY1Ks2LInmwzOj',
    name: 'Mangaka Senior',
    description: 'Premium plan for serious manga creators - Unlimited generation, advanced tools, high-quality export'
  },

  prices: {
    monthly: {
      // Nouveaux prix 2025 - Mensuel 5€
      id: 'price_1Rf5ydCAB3oSopcYe8Sp9Jok',
      amount: 500, // 5€ in cents
      currency: 'eur',
      interval: 'month',
      type: 'recurring'
    },
    yearly: {
      // Nouveaux prix 2025 - Annuel 30€ (50% de réduction vs mensuel)
      id: 'price_1Rf5zZCAB3oSopcYoyVx9aY8',
      amount: 3000, // 30€ in cents (save 30€/year vs monthly)
      currency: 'eur',
      interval: 'year',
      type: 'recurring'
    }
  },

  // Payment Links - PRODUCTION MODE (Recurring subscriptions)
  paymentLinks: {
    monthly: '/api/stripe/create-checkout-session?plan=monthly',
    yearly: '/api/stripe/create-checkout-session?plan=yearly'
  },

  // Pricing Plans for UI
  plans: [
    {
      id: 'junior',
      name: 'Mangaka Junior',
      price: { monthly: 0, yearly: 0 },
      description: 'Perfect for discovering manga creation',
      features: [
        { name: '2 characters', included: true },
        { name: '2 backgrounds', included: true },
        { name: '1 scene', included: true },
        { name: '1 page', included: true },
        { name: '1 export', included: true },
        { name: '1 project', included: true }
      ],
      highlight: false,
      paymentLinks: null
    },
    {
      id: 'senior',
      name: 'Mangaka Senior',
      price: { monthly: 5, yearly: 30 },
      description: 'For serious manga creators',
      features: [
        { name: 'Unlimited characters', included: true, highlight: 'unlimited' },
        { name: 'Unlimited backgrounds', included: true, highlight: 'unlimited' },
        { name: 'Unlimited scenes', included: true, highlight: 'unlimited' },
        { name: 'Unlimited pages', included: true, highlight: 'unlimited' },
        { name: 'Unlimited projects', included: true, highlight: 'unlimited' },
        { name: 'Unlimited export', included: true, highlight: 'unlimited' }
      ],
      highlight: true,
      paymentLinks: {
        monthly: '/api/stripe/create-checkout-session?plan=monthly',
        yearly: '/api/stripe/create-checkout-session?plan=yearly'
      }
    }
  ],

  // Feature Configuration by Plan
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

  // Usage Limits by Plan
  limits: {
    junior: {
      generations_per_month: 10,
      projects: 3,
      export_quality: 'low'
    },
    senior: {
      generations_per_month: -1, // unlimited
      projects: -1, // unlimited
      export_quality: 'high'
    }
  }
}

// TypeScript Types
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
  highlight: boolean
  paymentLinks?: {
    monthly: string
    yearly: string
  } | null
}

// Utility Functions
export function getSeniorPlan(): StripePlan | undefined {
  return STRIPE_CONFIG.plans.find(plan => plan.id === 'senior')
}

export function getPaymentLink(interval: 'monthly' | 'yearly'): string | null {
  return STRIPE_CONFIG.paymentLinks[interval] || null
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
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

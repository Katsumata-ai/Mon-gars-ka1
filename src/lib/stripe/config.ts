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
    // EUR Prices (Europe)
    eur: {
      monthly: {
        id: 'price_1Rf5ydCAB3oSopcYe8Sp9Jok',
        amount: 500, // 5€ in cents
        currency: 'eur',
        interval: 'month',
        type: 'recurring'
      },
      yearly: {
        id: 'price_1Rf5zZCAB3oSopcYoyVx9aY8',
        amount: 3000, // 30€ in cents
        currency: 'eur',
        interval: 'year',
        type: 'recurring'
      }
    },
    // USD Prices (US, Canada, etc.)
    usd: {
      monthly: {
        id: 'price_1RfBIYCAB3oSopcYAjnPItIK', // Prix mensuel USD $5.99
        amount: 599, // $5.99 in cents
        currency: 'usd',
        interval: 'month',
        type: 'recurring'
      },
      yearly: {
        id: 'price_1RfBXkCAB3oSopcYuvk5VlgH', // Prix annuel USD $35.99
        amount: 3599, // $35.99 in cents
        currency: 'usd',
        interval: 'year',
        type: 'recurring'
      }
    }
  },

  // Payment Links - PRODUCTION MODE (Recurring subscriptions)
  paymentLinks: {
    eur: {
      monthly: '/api/stripe/create-checkout-session?plan=monthly&currency=eur&price_id=price_1Rf5ydCAB3oSopcYe8Sp9Jok',
      yearly: '/api/stripe/create-checkout-session?plan=yearly&currency=eur&price_id=price_1Rf5zZCAB3oSopcYoyVx9aY8'
    },
    usd: {
      monthly: '/api/stripe/create-checkout-session?plan=monthly&currency=usd&price_id=price_1RfBIYCAB3oSopcYAjnPItIK',
      yearly: '/api/stripe/create-checkout-session?plan=yearly&currency=usd&price_id=price_1RfBXkCAB3oSopcYuvk5VlgH'
    }
  },

  // Pricing Plans for UI
  plans: [
    {
      id: 'junior',
      name: 'Mangaka Junior',
      price: {
        eur: { monthly: 0, yearly: 0 },
        usd: { monthly: 0, yearly: 0 }
      },
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
      price: {
        eur: { monthly: 5, yearly: 30 },
        usd: { monthly: 5.99, yearly: 35.99 }
      },
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
        eur: {
          monthly: '/api/stripe/create-checkout-session?plan=monthly&currency=eur&price_id=price_1Rf5ydCAB3oSopcYe8Sp9Jok',
          yearly: '/api/stripe/create-checkout-session?plan=yearly&currency=eur&price_id=price_1Rf5zZCAB3oSopcYoyVx9aY8'
        },
        usd: {
          monthly: '/api/stripe/create-checkout-session?plan=monthly&currency=usd&price_id=price_1RfBIYCAB3oSopcYAjnPItIK',
          yearly: '/api/stripe/create-checkout-session?plan=yearly&currency=usd&price_id=price_1RfBXkCAB3oSopcYuvk5VlgH'
        }
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
  price: {
    eur: { monthly: number; yearly: number }
    usd: { monthly: number; yearly: number }
  } | { monthly: number; yearly: number } // Support ancien format
  description: string
  features: Array<{
    name: string
    included: boolean
    highlight?: string
  }>
  highlight: boolean
  paymentLinks?: {
    eur: {
      monthly: string
      yearly: string
    }
    usd: {
      monthly: string
      yearly: string
    }
  } | null
}

// Utility Functions
export function getSeniorPlan(): StripePlan | undefined {
  return STRIPE_CONFIG.plans.find(plan => plan.id === 'senior')
}

// Détection automatique de la devise selon la localisation
export function detectUserCurrency(): 'eur' | 'usd' {
  if (typeof window === 'undefined') return 'eur' // SSR fallback

  // Détection par timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const usTimezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu'
  ]

  if (usTimezones.some(tz => timezone.includes(tz.split('/')[1]))) {
    return 'usd'
  }

  // Détection par langue du navigateur
  const language = navigator.language || navigator.languages?.[0] || 'en-US'
  if (language.startsWith('en-US') || language.startsWith('en-CA')) {
    return 'usd'
  }

  return 'eur' // Défaut Europe
}

// Obtenir les prix selon la devise
export function getPricesByCurrency(currency: 'eur' | 'usd' = 'eur') {
  return STRIPE_CONFIG.prices[currency]
}

export function getPaymentLink(interval: 'monthly' | 'yearly', currency: 'eur' | 'usd' = 'eur'): string | null {
  return STRIPE_CONFIG.paymentLinks[currency]?.[interval] || null
}

export function getCheckoutUrl(
  interval: 'monthly' | 'yearly',
  currency: 'eur' | 'usd' = 'eur',
  returnUrl: string = '/'
): string {
  const baseUrl = getPaymentLink(interval, currency)
  if (!baseUrl) {
    throw new Error(`No payment link found for ${interval} ${currency}`)
  }

  const encodedReturnUrl = encodeURIComponent(returnUrl)
  return `${baseUrl}&return_url=${encodedReturnUrl}`
}

export function formatPrice(amount: number, currency: string = 'EUR'): string {
  const locale = currency === 'USD' ? 'en-US' : 'fr-FR'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Formater le prix selon la devise détectée
export function formatPriceAuto(amount: number): string {
  const currency = detectUserCurrency()
  const currencyCode = currency === 'usd' ? 'USD' : 'EUR'
  return formatPrice(amount, currencyCode)
}

export function hasFeature(planId: string, feature: string): boolean {
  const planFeatures = STRIPE_CONFIG.features[planId as keyof typeof STRIPE_CONFIG.features]
  return planFeatures?.includes(feature) || false
}

export function getPlanLimits(planId: string) {
  return STRIPE_CONFIG.limits[planId as keyof typeof STRIPE_CONFIG.limits] || STRIPE_CONFIG.limits.junior
}

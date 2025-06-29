'use client'

import { useEffect, useState } from 'react'
import { User, CreditCard, Shield, Crown, Star, Zap, Mail, ExternalLink, MessageSquare, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useSubscriptionSafe } from '@/hooks/useSubscriptionSafe'
import DeleteAccountButton from '@/components/settings/DeleteAccountButton'
import UpgradeButtons from '@/components/settings/UpgradeButtons'
import SubscriptionDetails from '@/components/settings/SubscriptionDetails'
import { useCurrency } from '@/hooks/useCurrency'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'
import { STRIPE_CONFIG } from '@/lib/stripe/config'

interface SettingsContentProps {
  user: {
    id: string
    email: string
  }
}

export default function SettingsContent({ user }: SettingsContentProps) {
  const {
    subscription,
    currentPlan,
    hasActiveSubscription,
    loading,
    error,
    fetchSubscription
  } = useSubscriptionSafe()
  const { currency, setCurrency, formatPrice, formatSavings } = useCurrency()

  // Helper function to get price based on currency
  const getPrice = (interval: 'monthly' | 'yearly') => {
    const seniorPlan = STRIPE_CONFIG.plans.find(p => p.id === 'senior')
    if (!seniorPlan) return 0

    if (seniorPlan.price.eur && seniorPlan.price.usd) {
      return seniorPlan.price[currency][interval]
    } else {
      return seniorPlan.price[interval]
    }
  }

  const [cancelLoading, setCancelLoading] = useState(false)

  const handleCancelSubscription = async (subscriptionId: string, cancel: boolean) => {
    try {
      setCancelLoading(true)
      
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId,
          cancelAtPeriodEnd: cancel
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update subscription')
      }

      const data = await response.json()
      
      // Rafraîchir les données d'abonnement
      await fetchSubscription()
      
      // Afficher un message de succès (vous pourriez utiliser un toast ici)
      console.log(data.message)
      
    } catch (error) {
      console.error('Error updating subscription:', error)
      throw error
    } finally {
      setCancelLoading(false)
    }
  }

  const isPro = currentPlan === 'senior'
  const planName = isPro ? 'Mangaka Senior' : 'Mangaka Junior'

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-dark-200">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Profile</h2>
          </div>

          <div className="max-w-md">
            <div>
              <label className="block text-sm font-medium text-dark-200 mb-2">
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-dark-700 text-dark-300 px-4 py-2 rounded-lg border border-dark-600"
              />
              <p className="text-xs text-dark-400 mt-1">
                Email cannot be modified for security reasons
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <CreditCard className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Subscription</h2>
          </div>

          {loading ? (
            <div className="animate-pulse">
              <div className="h-6 bg-dark-600 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-dark-600 rounded w-1/2"></div>
                <div className="h-4 bg-dark-600 rounded w-2/3"></div>
              </div>
            </div>
          ) : error ? (
            <div className="text-red-400 p-4 bg-red-500/10 rounded-lg">
              Error loading subscription information
            </div>
          ) : (
            <>
              {/* Plan actuel */}
              <div className="mb-6">
                <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
                  <p className="text-dark-300 text-sm mb-2">Your current subscription plan:</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {isPro ? (
                        <Crown className="w-6 h-6 text-yellow-500" />
                      ) : (
                        <Star className="w-6 h-6 text-gray-400" />
                      )}
                      <div>
                        <h3 className="text-white font-semibold text-lg">{planName}</h3>
                        <p className="text-dark-300 text-sm">
                          {isPro
                            ? 'Full access to all premium features'
                            : 'Limited access to basic features'
                          }
                        </p>
                      </div>
                    </div>
                    {isPro && (
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                        ⭐ PREMIUM
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription details for premium users */}
              {hasActiveSubscription && subscription ? (
                <SubscriptionDetails
                  subscription={subscription}
                  onCancelSubscription={handleCancelSubscription}
                  loading={cancelLoading}
                />
              ) : (
                /* Upsell section for free users */
                <div className="bg-gradient-to-r from-primary-500/10 to-yellow-500/10 border border-primary-500/20 rounded-xl p-6 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Upgrade to Mangaka Senior</h3>
                      <p className="text-dark-200">Unlock your full creative potential</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Characters <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold shadow-lg">unlimited</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Backgrounds <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold shadow-lg">unlimited</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Scenes <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold shadow-lg">unlimited</span></span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Pages <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold shadow-lg">unlimited</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Export <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full font-bold shadow-lg">unlimited</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-white">{formatPrice(getPrice('monthly'))}</span>
                        <span className="text-dark-300">/month</span>
                      </div>
                      <p className="text-sm text-dark-300">or {formatPrice(getPrice('yearly'))}/year (🎉 Special launch offer - save {formatSavings(getPrice('monthly'), getPrice('yearly'))})</p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {/* Currency Toggle positioned above CTA buttons */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Currency:</span>
                        <CurrencyToggle
                          currency={currency}
                          onCurrencyChange={setCurrency}
                          size="xs"
                          variant="subtle"
                        />
                      </div>
                      <UpgradeButtons key={currency} />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact & Support */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <MessageSquare className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Contact & Support</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Link
              href="/contact"
              className="flex items-center space-x-3 p-4 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors group"
            >
              <Mail className="w-5 h-5 text-primary-400 group-hover:text-primary-300" />
              <div>
                <h3 className="text-white font-medium">Contact Us</h3>
                <p className="text-dark-300 text-sm">Technical support and questions</p>
              </div>
              <ExternalLink className="w-4 h-4 text-dark-400 group-hover:text-primary-400 ml-auto" />
            </Link>

            <div className="flex items-center space-x-3 p-4 bg-dark-700/50 rounded-lg">
              <HelpCircle className="w-5 h-5 text-dark-400" />
              <div>
                <h3 className="text-dark-300 font-medium">Help Center</h3>
                <p className="text-dark-400 text-sm">Coming soon</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>

          <div className="space-y-4">
            <Link
              href="/forgot-password"
              className="inline-flex items-center w-full md:w-auto bg-dark-700 hover:bg-dark-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <span>Change Password</span>
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
            <DeleteAccountButton className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors ml-0 md:ml-4" />
          </div>
        </div>


      </div>
    </div>
  )
}

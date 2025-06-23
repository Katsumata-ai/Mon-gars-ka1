'use client'

import { useEffect, useState } from 'react'
import { User, CreditCard, Shield, Crown, Star, Zap, Mail, ExternalLink, MessageSquare, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { useSubscription } from '@/hooks/useStripe'
import DeleteAccountButton from '@/components/settings/DeleteAccountButton'
import UpgradeButtons from '@/components/settings/UpgradeButtons'
import SubscriptionDetails from '@/components/settings/SubscriptionDetails'

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
  } = useSubscription()

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
        <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
        <p className="text-dark-200">
          Gérez votre compte et vos préférences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Profil</h2>
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
                L'email ne peut pas être modifié pour des raisons de sécurité
              </p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <CreditCard className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Abonnement</h2>
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
              Erreur lors du chargement des informations d'abonnement
            </div>
          ) : (
            <>
              {/* Plan actuel */}
              <div className="mb-6">
                <div className="bg-dark-700/50 rounded-lg p-4 border border-dark-600">
                  <p className="text-dark-300 text-sm mb-2">Votre plan de souscription actuel :</p>
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
                            ? 'Accès complet à toutes les fonctionnalités premium'
                            : 'Accès limité aux fonctionnalités de base'
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

              {/* Détails de l'abonnement pour les utilisateurs premium */}
              {hasActiveSubscription && subscription ? (
                <SubscriptionDetails
                  subscription={subscription}
                  onCancelSubscription={handleCancelSubscription}
                  loading={cancelLoading}
                />
              ) : (
                /* Section upsell pour les utilisateurs gratuits */
                <div className="bg-gradient-to-r from-primary-500/10 to-yellow-500/10 border border-primary-500/20 rounded-xl p-6 mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Crown className="w-8 h-8 text-yellow-500" />
                    <div>
                      <h3 className="text-xl font-bold text-white">Passez à Mangaka Senior</h3>
                      <p className="text-dark-200">Débloquez tout le potentiel de votre créativité</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Personnages <span className="bg-yellow-400 text-black px-1 rounded">illimités</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Décors <span className="bg-yellow-400 text-black px-1 rounded">illimités</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Crown className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Scènes <span className="bg-yellow-400 text-black px-1 rounded">illimitées</span></span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Pages <span className="bg-yellow-400 text-black px-1 rounded">illimitées</span></span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4 text-primary-400" />
                        <span className="text-white text-sm">Export <span className="bg-yellow-400 text-black px-1 rounded">illimité</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-bold text-white">25€</span>
                        <span className="text-dark-300">/mois</span>
                      </div>
                      <p className="text-sm text-dark-300">ou 80€/an (🎉 Offre spéciale de lancement - économisez 220€)</p>
                    </div>
                    <UpgradeButtons />
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
                <h3 className="text-white font-medium">Nous contacter</h3>
                <p className="text-dark-300 text-sm">Support technique et questions</p>
              </div>
              <ExternalLink className="w-4 h-4 text-dark-400 group-hover:text-primary-400 ml-auto" />
            </Link>

            <div className="flex items-center space-x-3 p-4 bg-dark-700/50 rounded-lg">
              <HelpCircle className="w-5 h-5 text-dark-400" />
              <div>
                <h3 className="text-dark-300 font-medium">Centre d'aide</h3>
                <p className="text-dark-400 text-sm">Bientôt disponible</p>
              </div>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="w-6 h-6 text-primary-400" />
            <h2 className="text-xl font-semibold text-white">Sécurité</h2>
          </div>

          <div className="space-y-4">
            <Link
              href="/forgot-password"
              className="inline-flex items-center w-full md:w-auto bg-dark-700 hover:bg-dark-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              <span>Changer le mot de passe</span>
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
            <DeleteAccountButton className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors ml-0 md:ml-4" />
          </div>
        </div>


      </div>
    </div>
  )
}

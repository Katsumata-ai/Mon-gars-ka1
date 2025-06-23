'use client'

import { useState } from 'react'
import { Crown, Calendar, CreditCard, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface SubscriptionDetailsProps {
  subscription: {
    id: string
    status: string
    current_period_end: string
    cancel_at_period_end: boolean
    subscription_plans: {
      name: string
      features: string[]
    }
  }
  onCancelSubscription: (subscriptionId: string, cancel: boolean) => Promise<void>
  loading?: boolean
}

export default function SubscriptionDetails({ 
  subscription, 
  onCancelSubscription, 
  loading = false 
}: SubscriptionDetailsProps) {
  const [canceling, setCanceling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getBillingType = (planName: string) => {
    if (planName.includes('Monthly') || planName.includes('Mensuel')) return 'Mensuel'
    if (planName.includes('Annual') || planName.includes('Annuel')) return 'Annuel'
    return 'Mensuel'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500'
      case 'canceled': return 'text-red-500'
      case 'past_due': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'canceled': return 'Annulé'
      case 'past_due': return 'En retard'
      case 'incomplete': return 'Incomplet'
      default: return status
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCanceling(true)
      await onCancelSubscription(subscription.id, true)
      setShowCancelConfirm(false)
    } catch (error) {
      console.error('Error canceling subscription:', error)
    } finally {
      setCanceling(false)
    }
  }

  const handleReactivateSubscription = async () => {
    try {
      setCanceling(true)
      await onCancelSubscription(subscription.id, false)
    } catch (error) {
      console.error('Error reactivating subscription:', error)
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="animate-pulse">
          <div className="h-6 bg-dark-600 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-dark-600 rounded w-1/2"></div>
            <div className="h-4 bg-dark-600 rounded w-2/3"></div>
            <div className="h-4 bg-dark-600 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
      <div className="flex items-center space-x-3 mb-6">
        <Crown className="w-6 h-6 text-yellow-500" />
        <h3 className="text-xl font-semibold text-white">Détails de l'abonnement</h3>
      </div>

      <div className="space-y-4">
        {/* Plan actuel */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">{subscription.subscription_plans.name}</h4>
            <p className="text-dark-300 text-sm">Facturation {getBillingType(subscription.subscription_plans.name).toLowerCase()}</p>
          </div>
          <div className={`flex items-center space-x-2 ${getStatusColor(subscription.status)}`}>
            {subscription.status === 'active' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{getStatusText(subscription.status)}</span>
          </div>
        </div>

        {/* Date de fin de période */}
        <div className="flex items-center space-x-3 p-4 bg-dark-700 rounded-lg">
          <Calendar className="w-5 h-5 text-primary-400" />
          <div>
            <p className="text-white font-medium">
              {subscription.cancel_at_period_end ? 'Expire le' : 'Renouvellement le'}
            </p>
            <p className="text-dark-300 text-sm">{formatDate(subscription.current_period_end)}</p>
          </div>
        </div>

        {/* Avertissement d'annulation */}
        {subscription.cancel_at_period_end && (
          <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-medium">Abonnement en cours d'annulation</p>
              <p className="text-yellow-400 text-sm">
                Votre abonnement sera annulé le {formatDate(subscription.current_period_end)}. 
                Vous conserverez l'accès aux fonctionnalités premium jusqu'à cette date.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 border-t border-dark-600">
          {subscription.cancel_at_period_end ? (
            <button
              onClick={handleReactivateSubscription}
              disabled={canceling}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg transition-colors font-medium"
            >
              {canceling ? 'Réactivation...' : 'Réactiver l\'abonnement'}
            </button>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => window.open('https://billing.stripe.com/p/login/test_your_portal_link', '_blank')}
                className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-5 h-5" />
                <span>Gérer la facturation</span>
              </button>
              
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-transparent hover:bg-red-600/10 text-red-400 hover:text-red-300 px-6 py-2 rounded-lg transition-colors border border-red-600/20 hover:border-red-500/40"
                >
                  Annuler l'abonnement
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès 
                    aux fonctionnalités premium jusqu'à la fin de votre période de facturation.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      {canceling ? 'Annulation...' : 'Confirmer l\'annulation'}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 bg-dark-600 hover:bg-dark-500 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

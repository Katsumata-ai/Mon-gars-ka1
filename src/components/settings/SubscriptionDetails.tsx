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
    } | null
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
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  const getBillingType = (planName: string) => {
    if (planName.includes('Monthly') || planName.includes('Mensuel')) return 'Monthly'
    if (planName.includes('Annual') || planName.includes('Annuel')) return 'Annual'
    return 'Monthly'
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
      case 'active': return 'Active'
      case 'canceled': return 'Canceled'
      case 'past_due': return 'Past Due'
      case 'incomplete': return 'Incomplete'
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
        <h3 className="text-xl font-semibold text-white">Subscription Details</h3>
      </div>

      <div className="space-y-4">
        {/* Plan actuel */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-medium">{subscription.subscription_plans?.name || 'Mangaka Senior'}</h4>
            <p className="text-dark-300 text-sm">{getBillingType(subscription.subscription_plans?.name || 'Mangaka Senior')} billing</p>
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
              {subscription.cancel_at_period_end ? 'Expires on' : 'Renews on'}
            </p>
            <p className="text-dark-300 text-sm">{formatDate(subscription.current_period_end)}</p>
          </div>
        </div>

        {/* Cancellation warning */}
        {subscription.cancel_at_period_end && (
          <div className="flex items-start space-x-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-yellow-500 font-medium">Subscription being canceled</p>
              <p className="text-yellow-400 text-sm">
                Your subscription will be canceled on {formatDate(subscription.current_period_end)}.
                You will retain access to premium features until this date.
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
            <div className="flex justify-center">
              {!showCancelConfirm ? (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="w-full bg-transparent hover:bg-red-600/10 text-red-400 hover:text-red-300 px-6 py-2 rounded-lg transition-colors border border-red-600/20 hover:border-red-500/40"
                >
                  Cancel Subscription
                </button>
              ) : (
                <div className="space-y-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">
                    Are you sure you want to cancel your subscription? You will retain access
                    to premium features until the end of your billing period.
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
                      Cancel
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

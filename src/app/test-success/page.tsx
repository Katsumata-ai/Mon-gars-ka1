'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowLeft, CreditCard, Sparkles } from 'lucide-react'

export default function TestSuccessPage() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isTest, setIsTest] = useState(false)

  useEffect(() => {
    const session = searchParams.get('session_id')
    const test = searchParams.get('test')
    // const plan = searchParams.get('plan') || 'monthly' // Plus utilisé en production

    setSessionId(session)
    setIsTest(test === 'true')

    // En production, l'activation se fait via les vrais webhooks Stripe
    // Plus besoin de simulation
  }, [searchParams])

  // Fonction de simulation supprimée - En production, Stripe envoie des webhooks réels

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-6">
          Payment Successful!
        </h1>

        {/* Test Mode Banner */}
        {isTest && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <CreditCard className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-400 font-medium">Test Mode</span>
            </div>
            <p className="text-blue-300 text-sm">
              This was a test payment. No real money was charged.
            </p>
          </div>
        )}



        {/* Success Message */}
        <div className="text-dark-300 mb-8">
          <p className="text-lg mb-4">
            Thank you for joining Mangaka Senior!
          </p>
          <p className="text-sm">
            Your premium subscription is now active.
          </p>
        </div>

        {/* Features List */}
        <div className="bg-gradient-to-r from-primary-500/10 to-yellow-500/10 border border-primary-500/20 rounded-lg p-6 mb-8">
          <h3 className="text-white font-semibold mb-4 text-lg">You now have access to:</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-dark-200">Characters ∞</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-dark-200">Backgrounds ∞</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-dark-200">Scenes ∞</span>
            </div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary-400" />
              <span className="text-dark-200">Projects ∞</span>
            </div>
          </div>
        </div>

        {/* Single CTA Button */}
        <Link
          href="/dashboard"
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-4 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center text-lg"
        >
          <span className="text-white">Start Creating</span>
        </Link>

        {/* Test Mode Footer */}
        {isTest && (
          <div className="mt-6 pt-4 border-t border-dark-700">
            <p className="text-xs text-dark-500">
              🧪 Test Mode - Stripe Development Configuration
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

export const dynamic = 'force-dynamic'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function PaymentCanceledContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('return_url') || '/dashboard'

  useEffect(() => {
    // Rediriger automatiquement après 3 secondes vers l'URL de retour
    const timer = setTimeout(() => {
      router.push(returnUrl)
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, returnUrl])

  const handleGoBack = () => {
    // Rediriger vers l'URL de retour spécifiée
    router.push(returnUrl)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-dark-800 p-8 rounded-xl manga-border">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-4 text-white">Payment Canceled</h1>
          
          <p className="text-dark-200 mb-6">
            Your payment has been canceled. No charges were made to your account.
          </p>
          
          <p className="text-sm text-dark-300 mb-6">
            You will be redirected back automatically in a few seconds...
          </p>
          
          <div className="space-y-3">
            <button
              onClick={handleGoBack}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go Back
            </button>
            
            <Link
              href="/dashboard"
              className="block w-full bg-dark-700 hover:bg-dark-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go to Dashboard
            </Link>
            
            <Link
              href="/"
              className="block text-primary-500 hover:text-primary-400 text-sm"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentCanceledPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-800 p-8 rounded-xl manga-border">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-white">Loading...</h1>
            <p className="text-dark-200">Please wait...</p>
          </div>
        </div>
      </div>
    }>
      <PaymentCanceledContent />
    </Suspense>
  )
}

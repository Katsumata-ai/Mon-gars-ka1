'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

function ThankYouContent() {
  const searchParams = useSearchParams()
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const session = searchParams?.get('session_id') || null
    setSessionId(session)
  }, [searchParams])

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-dark-800 rounded-xl p-8 border border-dark-700 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-10 h-10 text-white" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          Payment Successful!
        </h1>

        {/* Success Message */}
        <div className="mb-6">
          <p className="text-gray-300 mb-2">
            Thank you for joining Mangaka Senior!
          </p>
          <p className="text-gray-300">
            Your premium subscription is now active.
          </p>
        </div>

        {/* Features */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            You now have access to:
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              <span>Characters ∞</span>
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              <span>Backgrounds ∞</span>
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              <span>Scenes ∞</span>
            </div>
            <div className="flex items-center text-green-400">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              <span>Projects ∞</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <Link 
          href="/dashboard"
          className="inline-block w-full bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
        >
          Start Creating
        </Link>

        {/* Session Info (for debugging) */}
        {sessionId && (
          <p className="text-xs text-gray-500 mt-4">
            Session: {sessionId.slice(-8)}
          </p>
        )}
      </div>
    </div>
  )
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ThankYouContent />
    </Suspense>
  )
}

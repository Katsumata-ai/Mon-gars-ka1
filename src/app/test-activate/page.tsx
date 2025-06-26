'use client'

import { useState } from 'react'

export default function TestActivatePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const activateSubscription = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/activate-test-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'cs_test_b1yFWWN7iuLb1mzYolsfy8TitIuOUjHD2xk2bbwXMU9OqX07lLeYyRWyqV'
        })
      })

      const data = await response.json()
      setResult(data)
      console.log('Activation result:', data)
    } catch (error) {
      console.error('Error:', error)
      setResult({ error: 'Failed to activate subscription' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center">Test Subscription Activation</h1>
        
        <button
          onClick={activateSubscription}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded"
        >
          {loading ? 'Activating...' : 'Activate Test Subscription'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-bold mb-2">Result:</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-4 text-center">
          <a href="/dashboard" className="text-blue-500 hover:underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}

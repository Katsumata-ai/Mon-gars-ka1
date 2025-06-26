'use client'

import { useState } from 'react'

export default function TestWebhookPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const simulateWebhook = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: 'cs_test_b12UUYmbztpKE7safh9r9SahfPCfk7djNDeUOIBupfsMKHU7P8QVB4BGsw',
          userEmail: 'test-stripe-validation@mangaka-test.com'
        })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Webhook Simulation</h1>
      
      <button
        onClick={simulateWebhook}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Simulating...' : 'Simulate Webhook'}
      </button>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

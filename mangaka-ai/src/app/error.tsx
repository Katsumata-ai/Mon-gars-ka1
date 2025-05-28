'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="max-w-md w-full mx-auto p-6 bg-dark-800 rounded-lg border border-dark-700">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 text-primary-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            Oups ! Une erreur s'est produite
          </h2>
          <p className="text-dark-400 mb-6">
            Nous nous excusons pour ce problème. Notre équipe a été notifiée et travaille sur une solution.
          </p>
          <div className="space-y-3">
            <button
              onClick={reset}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Réessayer
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full border border-dark-600 text-dark-300 hover:bg-dark-700 py-2 px-4 rounded-lg transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-dark-400 hover:text-dark-300">
                Détails de l'erreur (développement)
              </summary>
              <pre className="mt-2 text-xs text-red-400 bg-dark-900 p-3 rounded overflow-auto">
                {error.message}
                {error.stack && (
                  <>
                    {'\n\n'}
                    {error.stack}
                  </>
                )}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}

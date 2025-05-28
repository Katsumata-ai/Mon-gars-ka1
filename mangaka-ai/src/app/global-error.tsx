'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
          <div className="max-w-md w-full mx-auto p-6 bg-gray-800 rounded-lg border border-gray-700">
            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
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
                Erreur Critique
              </h2>
              <p className="text-gray-400 mb-6">
                Une erreur critique s'est produite. Veuillez recharger la page.
              </p>
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors"
                >
                  Réessayer
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full border border-gray-600 text-gray-300 hover:bg-gray-700 py-2 px-4 rounded-lg transition-colors"
                >
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

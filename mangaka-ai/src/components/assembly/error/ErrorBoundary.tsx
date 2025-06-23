// Système de gestion des erreurs pour l'assemblage
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  retryCount: number
}

export class AssemblyErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Appeler le callback d'erreur si fourni
    this.props.onError?.(error, errorInfo)

    // Envoyer l'erreur au service de monitoring
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // En production, envoyer à un service de monitoring (Sentry, LogRocket, etc.)
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }

      // Sauvegarder localement pour debug en développement seulement
      if (process.env.NODE_ENV === 'development' && typeof localStorage !== 'undefined') {
        const existingErrors = JSON.parse(localStorage.getItem('assembly_errors') || '[]')
        existingErrors.push(errorReport)

        // Garder seulement les 10 dernières erreurs
        if (existingErrors.length > 10) {
          existingErrors.shift()
        }

        localStorage.setItem('assembly_errors', JSON.stringify(existingErrors))
      }
    } catch (reportingError) {
      // Erreur silencieuse en production
    }
  }

  private handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/projects'
  }

  render() {
    if (this.state.hasError) {
      // Utiliser le fallback personnalisé si fourni
      if (this.props.fallback) {
        return this.props.fallback
      }

      const { error, retryCount } = this.state
      const canRetry = retryCount < this.maxRetries

      return (
        <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
          <div className="bg-dark-800 rounded-lg shadow-xl p-8 max-w-2xl w-full">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Oups ! Une erreur s'est produite
                </h1>
                <p className="text-gray-400">
                  L'assemblage a rencontré un problème inattendu
                </p>
              </div>
            </div>

            {/* Détails de l'erreur */}
            <div className="bg-dark-700 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Détails de l'erreur
              </h3>
              <p className="text-red-400 font-mono text-sm mb-2">
                {error?.message || 'Erreur inconnue'}
              </p>
              {error?.stack && (
                <details className="mt-2">
                  <summary className="text-gray-400 cursor-pointer hover:text-white">
                    Stack trace (pour les développeurs)
                  </summary>
                  <pre className="text-xs text-gray-500 mt-2 overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>

            {/* Informations de retry */}
            {retryCount > 0 && (
              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
                <p className="text-yellow-400">
                  Tentative {retryCount} sur {this.maxRetries}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {canRetry && (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Réessayer</span>
                </button>
              )}

              <button
                onClick={this.handleReset}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Réinitialiser</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Recharger la page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>Retour aux projets</span>
              </button>
            </div>

            {/* Conseils */}
            <div className="mt-6 p-4 bg-dark-700 rounded-lg">
              <h4 className="text-white font-semibold mb-2">Que faire ?</h4>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Essayez de recharger la page</li>
                <li>• Vérifiez votre connexion internet</li>
                <li>• Sauvegardez votre travail si possible</li>
                <li>• Contactez le support si le problème persiste</li>
              </ul>
            </div>

            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-6 p-4 bg-dark-700 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Bug className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-yellow-400 font-semibold">Mode développement</h4>
                </div>
                <p className="text-xs text-gray-500">
                  Retry count: {retryCount}/{this.maxRetries}
                </p>
                <p className="text-xs text-gray-500">
                  Timestamp: {new Date().toISOString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook pour utiliser l'error boundary de manière programmatique
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)

  const reportError = React.useCallback((error: Error, context?: string) => {
    // En développement, relancer l'erreur pour déclencher l'error boundary
    if (process.env.NODE_ENV === 'development') {
      setError(error)
    }

    // En production, envoyer au service de monitoring
    try {
      const errorReport = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        url: window.location.href
      }

      // Service de monitoring intégré en production
    } catch (reportingError) {
      // Erreur silencieuse en production
    }
  }, [])

  // Relancer l'erreur pour déclencher l'error boundary
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { reportError }
}

// Composant wrapper pour faciliter l'utilisation
export function WithErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <AssemblyErrorBoundary fallback={fallback}>
      {children}
    </AssemblyErrorBoundary>
  )
}

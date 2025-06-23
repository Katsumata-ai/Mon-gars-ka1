'use client'

import { useSearchParams } from 'next/navigation'
import { AlertCircle, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/navigation/Navigation'

export default function AuthCodeErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  const getErrorMessage = () => {
    if (errorCode === 'otp_expired') {
      return {
        title: 'Lien Expiré',
        message: 'Le lien de réinitialisation de mot de passe a expiré. Veuillez demander un nouveau lien.',
        action: 'Demander un nouveau lien',
        actionUrl: '/forgot-password'
      }
    }
    
    if (error === 'access_denied') {
      return {
        title: 'Accès Refusé',
        message: 'Le lien d\'authentification est invalide ou a été utilisé. Veuillez réessayer.',
        action: 'Réessayer',
        actionUrl: '/forgot-password'
      }
    }

    return {
      title: 'Erreur d\'Authentification',
      message: 'Une erreur est survenue lors de la vérification du lien. Veuillez réessayer.',
      action: 'Retour à l\'accueil',
      actionUrl: '/'
    }
  }

  const errorInfo = getErrorMessage()

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation variant="landing" />
      
      <div className="pt-20 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            
            <h1 className="text-2xl font-bold text-white mb-4 font-comic">
              {errorInfo.title}
            </h1>
            
            <p className="text-slate-300 mb-6 leading-relaxed">
              {errorInfo.message}
            </p>
            
            {errorDescription && (
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400">
                  <strong>Détails techniques :</strong><br />
                  {decodeURIComponent(errorDescription)}
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <Link
                href={errorInfo.actionUrl}
                className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
              >
                {errorInfo.action}
              </Link>
              
              <Link
                href="/login"
                className="block w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Retour à la connexion</span>
              </Link>
            </div>
          </div>

          {/* Aide supplémentaire */}
          <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Besoin d'aide ?</h3>
            <p className="text-slate-300 text-sm mb-4">
              Si vous continuez à rencontrer des problèmes avec la réinitialisation de votre mot de passe, notre équipe peut vous aider.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 font-bold text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contacter le support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

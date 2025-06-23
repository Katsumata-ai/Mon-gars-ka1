'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Key } from 'lucide-react'
import Link from 'next/link'
import Navigation from '@/components/navigation/Navigation'
import { createClient } from '@/lib/supabase/client'

interface FormState {
  email: string
  error: string
  isLoading: boolean
  isSuccess: boolean
}

export default function ForgotPasswordPage() {
  const [formState, setFormState] = useState<FormState>({
    email: '',
    error: '',
    isLoading: false,
    isSuccess: false
  })

  const supabase = createClient()

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formState.email.trim()) {
      setFormState(prev => ({ ...prev, error: 'L\'adresse email est requise' }))
      return
    }

    if (!validateEmail(formState.email)) {
      setFormState(prev => ({ ...prev, error: 'Format d\'email invalide' }))
      return
    }

    setFormState(prev => ({ ...prev, isLoading: true, error: '' }))

    try {
      // Envoyer l'email de réinitialisation via Supabase Auth
      const { error } = await supabase.auth.resetPasswordForEmail(formState.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        throw error
      }

      setFormState(prev => ({ ...prev, isSuccess: true, isLoading: false }))
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'
      
      if (error.message?.includes('rate limit')) {
        errorMessage = 'Trop de tentatives. Veuillez attendre avant de réessayer.'
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'Cette adresse email n\'est pas valide.'
      } else if (error.message?.includes('not found')) {
        // Pour des raisons de sécurité, on ne révèle pas si l'email existe ou non
        errorMessage = 'Si cette adresse email est associée à un compte, vous recevrez un email de réinitialisation.'
      }
      
      setFormState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }

  const handleEmailChange = (email: string) => {
    setFormState(prev => ({ ...prev, email, error: '' }))
  }

  if (formState.isSuccess) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation variant="landing" />
        
        <div className="pt-20 pb-16">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
              
              <h1 className="text-2xl font-bold text-white mb-4 font-comic">
                Email Envoyé !
              </h1>
              
              <p className="text-slate-300 mb-6 leading-relaxed">
                Si cette adresse email est associée à un compte MANGAKA AI, vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
              </p>
              
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400">
                  <strong>Vérifiez votre boîte de réception</strong><br />
                  L'email peut prendre quelques minutes à arriver. N'oubliez pas de vérifier vos spams.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
                >
                  Retour à la connexion
                </Link>
                
                <button
                  onClick={() => setFormState({ email: '', error: '', isLoading: false, isSuccess: false })}
                  className="block w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
                >
                  Renvoyer un email
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation variant="landing" />
      
      <div className="pt-20 pb-16">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4 font-comic">
              MOT DE PASSE OUBLIÉ
            </h1>
            
            <p className="text-slate-300">
              Entrez votre adresse email pour recevoir un lien de réinitialisation de votre mot de passe.
            </p>
          </div>

          {/* Formulaire */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formState.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-sm">{formState.error}</p>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    id="email"
                    value={formState.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      formState.error 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="votre@email.com"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={formState.isLoading}
                className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white py-3 px-6 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
              >
                {formState.isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Envoyer le lien de réinitialisation</span>
                  </>
                )}
              </button>
            </form>

            {/* Liens de navigation */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex flex-col space-y-3 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Retour à la connexion</span>
                </Link>
                
                <div className="text-slate-500">
                  Pas encore de compte ?{' '}
                  <Link href="/signup" className="text-red-400 hover:text-red-300 font-bold">
                    Créer un compte
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Informations supplémentaires */}
          <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Besoin d'aide ?</h3>
            <p className="text-slate-300 text-sm mb-4">
              Si vous ne recevez pas l'email de réinitialisation ou si vous rencontrez des problèmes, n'hésitez pas à nous contacter.
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

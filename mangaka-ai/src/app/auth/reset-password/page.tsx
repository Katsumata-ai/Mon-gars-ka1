'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import Navigation from '@/components/navigation/Navigation'
import { createClient } from '@/lib/supabase/client'

interface FormState {
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  error: string
  isLoading: boolean
  isSuccess: boolean
}

export default function ResetPasswordPage() {
  const [formState, setFormState] = useState<FormState>({
    password: '',
    confirmPassword: '',
    showPassword: false,
    showConfirmPassword: false,
    error: '',
    isLoading: false,
    isSuccess: false
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    // Vérifier s'il y a une erreur dans l'URL
    const error = searchParams.get('error')
    const sessionStatus = searchParams.get('session')

    if (error === 'invalid_token') {
      setFormState(prev => ({
        ...prev,
        error: 'Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.'
      }))
      return
    }

    // Vérifier si l'utilisateur a une session valide
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        setFormState(prev => ({
          ...prev,
          error: 'Session expirée. Veuillez demander un nouveau lien de réinitialisation.'
        }))
      } else {
        // Session valide - l'utilisateur peut changer son mot de passe
        console.log('Session valide pour reset password:', session.user.email)
      }
    }

    // Toujours vérifier la session, même si sessionStatus=valid
    checkSession()
  }, [searchParams, supabase.auth])

  const validatePassword = (password: string): string[] => {
    const errors: string[] = []
    
    if (password.length < 8) {
      errors.push('Au moins 8 caractères')
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Au moins une majuscule')
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Au moins une minuscule')
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Au moins un chiffre')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formState.password) {
      setFormState(prev => ({ ...prev, error: 'Le mot de passe est requis' }))
      return
    }

    const passwordErrors = validatePassword(formState.password)
    if (passwordErrors.length > 0) {
      setFormState(prev => ({ 
        ...prev, 
        error: `Le mot de passe doit contenir : ${passwordErrors.join(', ')}` 
      }))
      return
    }

    if (formState.password !== formState.confirmPassword) {
      setFormState(prev => ({ ...prev, error: 'Les mots de passe ne correspondent pas' }))
      return
    }

    setFormState(prev => ({ ...prev, isLoading: true, error: '' }))

    try {
      // Mettre à jour le mot de passe via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: formState.password
      })

      if (error) {
        throw error
      }

      setFormState(prev => ({ ...prev, isSuccess: true, isLoading: false }))
      
      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        router.push('/login?message=password-updated')
      }, 3000)
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error)
      
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.'
      
      if (error.message?.includes('session_not_found')) {
        errorMessage = 'Session expirée. Veuillez demander un nouveau lien de réinitialisation.'
      } else if (error.message?.includes('weak_password')) {
        errorMessage = 'Le mot de passe est trop faible. Veuillez choisir un mot de passe plus sécurisé.'
      }
      
      setFormState(prev => ({ ...prev, error: errorMessage, isLoading: false }))
    }
  }

  const updateFormField = (field: keyof FormState, value: any) => {
    setFormState(prev => ({ ...prev, [field]: value, error: '' }))
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
                Mot de Passe Mis à Jour !
              </h1>
              
              <p className="text-slate-300 mb-6">
                Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
              </p>
              
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div className="bg-red-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
              
              <p className="text-sm text-slate-400">
                Redirection automatique en cours...
              </p>
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
              <Lock className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4 font-comic">
              NOUVEAU MOT DE PASSE
            </h1>
            
            <p className="text-slate-300">
              Choisissez un nouveau mot de passe sécurisé pour votre compte MANGAKA AI.
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
                <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={formState.showPassword ? 'text' : 'password'}
                    id="password"
                    value={formState.password}
                    onChange={(e) => updateFormField('password', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Votre nouveau mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => updateFormField('showPassword', !formState.showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {formState.showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre.
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-bold text-white mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={formState.showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={formState.confirmPassword}
                    onChange={(e) => updateFormField('confirmPassword', e.target.value)}
                    className="w-full pl-12 pr-12 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Confirmez votre mot de passe"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => updateFormField('showConfirmPassword', !formState.showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {formState.showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
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
                    <span>Mise à jour...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Mettre à jour le mot de passe</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

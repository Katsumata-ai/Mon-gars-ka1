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
      setFormState(prev => ({ ...prev, error: 'Email address is required' }))
      return
    }

    if (!validateEmail(formState.email)) {
      setFormState(prev => ({ ...prev, error: 'Invalid email format' }))
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
      console.error('Error sending email:', error)

      let errorMessage = 'An error occurred. Please try again.'

      if (error.message?.includes('rate limit')) {
        errorMessage = 'Too many attempts. Please wait before trying again.'
      } else if (error.message?.includes('invalid email')) {
        errorMessage = 'This email address is not valid.'
      } else if (error.message?.includes('not found')) {
        // For security reasons, we don't reveal if the email exists or not
        errorMessage = 'If this email address is associated with an account, you will receive a reset email.'
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
                Email Sent!
              </h1>

              <p className="text-slate-300 mb-6 leading-relaxed">
                If this email address is associated with a MANGAKA AI account, you will receive an email with instructions to reset your password.
              </p>

              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-400">
                  <strong>Check your inbox</strong><br />
                  The email may take a few minutes to arrive. Don't forget to check your spam folder.
                </p>
              </div>
              
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
                >
                  Back to login
                </Link>

                <button
                  onClick={() => setFormState({ email: '', error: '', isLoading: false, isSuccess: false })}
                  className="block w-full bg-slate-700 hover:bg-slate-600 text-white py-3 px-6 rounded-lg font-bold transition-colors"
                >
                  Send another email
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
              FORGOT PASSWORD
            </h1>

            <p className="text-slate-300">
              Enter your email address to receive a password reset link.
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
                  Email address
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
                    placeholder="your@email.com"
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
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Send reset link</span>
                  </>
                )}
              </button>
            </form>

            {/* Navigation links */}
            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="flex flex-col space-y-3 text-center">
                <Link
                  href="/login"
                  className="flex items-center justify-center space-x-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to login</span>
                </Link>

                <div className="text-slate-500">
                  Don't have an account yet?{' '}
                  <Link href="/signup" className="text-red-400 hover:text-red-300 font-bold">
                    Create account
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Additional information */}
          <div className="mt-8 bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Need help?</h3>
            <p className="text-slate-300 text-sm mb-4">
              If you don't receive the reset email or encounter any problems, feel free to contact us.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center space-x-2 text-red-400 hover:text-red-300 font-bold text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact support</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'


export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-dark-800 p-8 rounded-xl manga-border">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Vérifiez votre email</h1>
            <p className="text-dark-200 mb-6">
              Nous avons envoyé un lien de confirmation à <strong>{email}</strong>.
              Cliquez sur le lien pour activer votre compte.
            </p>
            <Link
              href="/login"
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-500 font-display">
            MANGAKA AI
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Créer un compte</h1>
          <p className="text-dark-200">
            Rejoignez MANGAKA AI et créez vos premiers manga
          </p>
        </div>

        <div className="bg-dark-800 p-8 rounded-xl manga-border">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Création du compte...' : 'Créer mon compte'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium">
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-6 text-xs text-dark-400 text-center">
            En créant un compte, vous acceptez nos{' '}
            <Link href="/terms" className="text-primary-500 hover:text-primary-400">
              Conditions d&apos;utilisation
            </Link>{' '}
            et notre{' '}
            <Link href="/privacy" className="text-primary-500 hover:text-primary-400">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

// Disable static generation for this page
export const dynamic = 'force-dynamic'


export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Récupérer le paramètre de redirection au chargement
  useEffect(() => {
    const redirect = searchParams?.get('redirect')
    if (redirect) {
      setRedirectUrl(decodeURIComponent(redirect))
    }
  }, [searchParams])

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        console.error('Supabase Error:', error)

        // Gestion spécifique des erreurs courantes
        if (error.message.includes('Database error saving new user')) {
          setError('Database error. Please try again in a few moments.')
        } else if (error.message.includes('User already registered')) {
          setError('This email is already in use. Try logging in.')
        } else {
          setError(`Registration error: ${error.message}`)
        }
      } else if (data.user) {
        // Avec mailer_autoconfirm: true, l'utilisateur est automatiquement connecté
        if (data.session) {
          // Utilisateur connecté immédiatement
          if (redirectUrl) {
            // Si on a une URL de redirection (checkout Stripe), l'ouvrir dans un nouvel onglet
            window.open(redirectUrl, '_blank')
            // Puis rediriger vers le dashboard
            router.push('/dashboard')
          } else {
            // Redirection normale vers le dashboard
            router.push('/dashboard')
          }
          router.refresh()
        } else {
          // Email de confirmation envoyé
          setSuccess(true)
        }
      } else {
        setError('No user created')
      }
    } catch (err) {
      console.error('Complete error:', err)
      setError(`Technical error: ${err instanceof Error ? err.message : 'Unknown error'}`)
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
              className="inline-block bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors !text-white"
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
          <h1 className="text-2xl font-bold mt-6 mb-2">Create Account</h1>
          <p className="text-dark-200">
            Join MANGAKA AI and create your first manga
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
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-500 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dark-400 hover:text-primary-500 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Creating account...' : 'Create my account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Already have an account?{' '}
              <Link href="/login" className="text-primary-500 hover:text-primary-400 font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-xs text-dark-400 text-center">
            By creating an account, you accept our{' '}
            <Link href="/terms" className="text-primary-500 hover:text-primary-400 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-500 hover:text-primary-400 underline">
              Privacy Policy
            </Link>
            .{' '}
            <Link href="/contact" className="text-primary-500 hover:text-primary-400">
              Contact us
            </Link>{' '}
            for more information.
          </div>
        </div>
      </div>
    </div>
  )
}

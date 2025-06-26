'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

// Disable static generation for this page
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        // Redirection vers le dashboard après connexion réussie
        const redirectTo = new URLSearchParams(window.location.search).get('redirect')

        if (redirectTo && redirectTo.startsWith('https://buy.stripe.com/')) {
          // Si c'est un lien Stripe, l'ouvrir dans un nouvel onglet
          window.open(decodeURIComponent(redirectTo), '_blank')
          // Puis rediriger vers le dashboard
          router.push('/dashboard')
        } else {
          // Redirection normale
          router.push(redirectTo || '/dashboard')
        }
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-primary-500 font-display">
            MANGAKA AI
          </Link>
          <h1 className="text-2xl font-bold mt-6 mb-2">Sign In</h1>
          <p className="text-dark-200">
            Sign in to access your manga creations
          </p>
        </div>

        <div className="bg-dark-800 p-8 rounded-xl manga-border">
          <form onSubmit={handleLogin} className="space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="text-primary-500 hover:text-primary-400 font-medium">
                Create account
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/forgot-password" className="text-sm text-dark-400 hover:text-primary-500">
              Forgot password?
            </Link>
          </div>

          <div className="mt-6 text-xs text-dark-400 text-center">
            By using our service, you agree to our{' '}
            <Link href="/terms" className="text-primary-500 hover:text-primary-400 underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary-500 hover:text-primary-400 underline">
              Privacy Policy
            </Link>
            .
          </div>
        </div>
      </div>
    </div>
  )
}

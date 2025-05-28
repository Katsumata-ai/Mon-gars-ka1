'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface NavigationProps {
  variant?: 'landing' | 'app'
  currentPage?: string
}

export default function Navigation({ variant = 'landing', currentPage }: NavigationProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Get initial user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    getUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  // Landing page navigation
  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-primary-500 font-display">
                MANGAKA AI
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#features" className="text-dark-200 hover:text-primary-500 transition-colors">
                Fonctionnalités
              </Link>
              <Link href="#pricing" className="text-dark-200 hover:text-primary-500 transition-colors">
                Tarifs
              </Link>

              {loading ? (
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-8 bg-dark-700 rounded animate-pulse"></div>
                  <div className="w-32 h-10 bg-dark-700 rounded animate-pulse"></div>
                </div>
              ) : user ? (
                // Authenticated user navigation
                <div className="flex items-center space-x-6">
                  <Link
                    href="/dashboard"
                    className="text-dark-200 hover:text-primary-500 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/generate"
                    className="text-dark-200 hover:text-primary-500 transition-colors"
                  >
                    Générer
                  </Link>
                  <Link
                    href="/scene-creator"
                    className="text-dark-200 hover:text-primary-500 transition-colors"
                  >
                    Créer Scènes
                  </Link>
                  <Link
                    href="/page-editor"
                    className="text-dark-200 hover:text-primary-500 transition-colors"
                  >
                    Éditeur Pages
                  </Link>
                  <Link
                    href="/script-editor"
                    className="text-dark-200 hover:text-primary-500 transition-colors"
                  >
                    Script Editor
                  </Link>

                  <div className="flex items-center space-x-4">
                    <span className="text-dark-200 text-sm">
                      {user.email}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              ) : (
                // Non-authenticated user navigation
                <>
                  <Link href="/login" className="text-dark-200 hover:text-primary-500 transition-colors">
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    Commencer Gratuitement
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-dark-200 hover:text-primary-500 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-dark-800 rounded-lg mt-2">
                <Link
                  href="#features"
                  className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Fonctionnalités
                </Link>
                <Link
                  href="#pricing"
                  className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Tarifs
                </Link>

                {loading ? (
                  <div className="px-3 py-2">
                    <div className="w-full h-8 bg-dark-700 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/generate"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Générer
                    </Link>
                    <Link
                      href="/scene-creator"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Créer Scènes
                    </Link>
                    <Link
                      href="/page-editor"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Éditeur Pages
                    </Link>
                    <Link
                      href="/script-editor"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Script Editor
                    </Link>
                    <div className="px-3 py-2 text-dark-400 text-sm border-t border-dark-600 mt-2">
                      {user.email}
                    </div>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setMobileMenuOpen(false)
                      }}
                      className="block w-full text-left px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                    >
                      Déconnexion
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block px-3 py-2 text-dark-200 hover:text-primary-500 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Connexion
                    </Link>
                    <Link
                      href="/signup"
                      className="block px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Commencer Gratuitement
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    )
  }

  // App navigation (for dashboard, generate, etc.)
  return (
    <nav className="bg-dark-800 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-2xl font-bold text-primary-500 font-display">
            MANGAKA AI
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/dashboard"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'dashboard' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'projects' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Mes Projets
            </Link>
            <Link
              href="/generate"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'generate' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Générer
            </Link>
            <Link
              href="/scene-creator"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'scene-creator' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Créer Scènes
            </Link>
            <Link
              href="/page-editor"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'page-editor' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Éditeur Pages
            </Link>
            <Link
              href="/script-editor"
              className={`text-dark-200 hover:text-primary-500 transition-colors ${
                currentPage === 'script-editor' ? 'text-primary-500 font-medium' : ''
              }`}
            >
              Script Editor
            </Link>

            <div className="flex items-center space-x-4">
              {user && (
                <span className="text-dark-200 text-sm">
                  {user.email}
                </span>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-4 py-2 rounded-lg transition-colors text-sm"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

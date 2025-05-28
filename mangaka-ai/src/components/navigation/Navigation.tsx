'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ClientOnly from '@/components/common/ClientOnly'
import { User, Settings, LogOut } from 'lucide-react'

interface NavigationProps {
  variant?: 'landing' | 'app'
  currentPage?: string
}

export default function Navigation({ variant = 'landing', currentPage }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, loading, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
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

              <ClientOnly fallback={
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-8 bg-dark-700 rounded animate-pulse"></div>
                  <div className="w-32 h-10 bg-dark-700 rounded animate-pulse"></div>
                </div>
              }>
                {loading ? (
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-8 bg-dark-700 rounded animate-pulse"></div>
                    <div className="w-32 h-10 bg-dark-700 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                // Authenticated user - only Dashboard and Settings
                <div className="flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-primary-400 transition-colors"
                  >
                    Dashboard
                  </Link>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 transition-colors"
                    >
                      <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-sm text-dark-200">{user.email?.split('@')[0]}</span>
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2 z-50">
                        <Link
                          href="/settings"
                          className="flex items-center space-x-2 px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4" />
                          <span>Paramètres</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setUserMenuOpen(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    )}
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
              </ClientOnly>
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

            <div className="flex items-center space-x-4">
              {/* Upsell Button */}
              <button className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 text-sm font-medium">
                Upgrade Pro
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {user && (
                    <span className="text-sm text-dark-200">{user.email?.split('@')[0]}</span>
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg border border-dark-700 py-2 z-50">
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

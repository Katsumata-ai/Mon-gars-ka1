'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/useAuth'
import { useSubscriptionSafe } from '@/hooks/useSubscriptionSafe'
import ClientOnly from '@/components/common/ClientOnly'
import AuthSafeWrapper from '@/components/common/AuthSafeWrapper'
import { User, Settings, LogOut, LayoutDashboard } from 'lucide-react'

// Import dynamique pour éviter le chargement de Stripe pour les utilisateurs non connectés
const PremiumUpgradeModal = dynamic(
  () => import('@/components/upselling/PremiumUpgradeModal').then(mod => ({ default: mod.PremiumUpgradeModal })),
  { ssr: false }
)

interface NavigationProps {
  variant?: 'landing' | 'app'
  currentPage?: string
  hideAnchors?: boolean
}

export default function Navigation({ variant = 'landing', currentPage, hideAnchors = false }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const { user, loading, signOut } = useAuth()
  const { hasActiveSubscription } = useSubscriptionSafe()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  // Landing page navigation
  if (variant === 'landing') {
    return (
      <nav className="fixed top-0 w-full z-50 bg-dark-900/80 backdrop-blur-sm border-b border-dark-700" suppressHydrationWarning>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
          <div className="flex justify-between items-center h-16" suppressHydrationWarning>
            <div className="flex items-center" suppressHydrationWarning>
              <Link href="/" className="text-2xl font-bold text-red-500 font-logo tracking-wider">
                MANGAKA AI
              </Link>
            </div>

            {/* Desktop Navigation - Centered anchor links */}
            {!hideAnchors && (
              <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2" suppressHydrationWarning>
                <Link href="#features" className="text-dark-200 hover:text-primary-500 transition-colors">
                  Features
                </Link>
                <Link href="#pricing" className="text-dark-200 hover:text-primary-500 transition-colors">
                  Pricing
                </Link>
                <Link href="#faq" className="text-dark-200 hover:text-primary-500 transition-colors">
                  FAQ
                </Link>
              </div>
            )}

            {/* Desktop Auth/User Menu */}
            <div className="hidden md:flex items-center space-x-8" suppressHydrationWarning>

              <AuthSafeWrapper fallback={
                <div className="flex items-center space-x-4" suppressHydrationWarning>
                  <div className="w-20 h-8 bg-dark-700 rounded animate-pulse"></div>
                  <div className="w-32 h-10 bg-dark-700 rounded animate-pulse"></div>
                </div>
              }>
                {loading ? (
                  <div className="flex items-center space-x-4" suppressHydrationWarning>
                    <div className="w-20 h-8 bg-dark-700 rounded animate-pulse"></div>
                    <div className="w-32 h-10 bg-dark-700 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                // Authenticated user - only Dashboard and Settings
                <div className="flex items-center space-x-4" suppressHydrationWarning>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-medium text-dark-200 hover:text-primary-400 transition-colors flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
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
                          <span>Settings</span>
                        </Link>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setUserMenuOpen(false)
                          }}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Non-authenticated user navigation
                <div className="flex items-center space-x-4">
                  <Link href="/login" className="text-dark-200 hover:text-primary-500 transition-colors">
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors !text-white"
                  >
                    Start Free
                  </Link>
                </div>
              )}
              </AuthSafeWrapper>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden" suppressHydrationWarning>
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
              <div className="px-3 pt-3 pb-4 space-y-2 bg-dark-800 rounded-lg mt-2 shadow-lg">
                <Link
                  href="#features"
                  className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </Link>
                <Link
                  href="#pricing"
                  className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </Link>
                <Link
                  href="#faq"
                  className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  FAQ
                </Link>

                {loading ? (
                  <div className="px-4 py-3">
                    <div className="w-full h-8 bg-dark-700 rounded animate-pulse"></div>
                  </div>
                ) : user ? (
                  // Connected user - Same logic as desktop: only Dashboard and user menu
                  <>
                    <div className="border-t border-dark-600 pt-2 mt-2">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium flex items-center gap-2"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>

                      {/* Mobile user menu */}
                      <div className="mt-2 pt-2 border-t border-dark-600">
                        <Link
                          href="/settings"
                          className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Settings
                        </Link>
                        <div className="px-4 py-2 text-dark-400 text-sm">
                          {user.email}
                        </div>
                        <button
                          onClick={() => {
                            handleSignOut()
                            setMobileMenuOpen(false)
                          }}
                          className="block w-full text-left px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="border-t border-dark-600 pt-2 mt-2">
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-dark-200 hover:text-primary-500 hover:bg-dark-700 rounded-lg transition-colors text-lg font-medium"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-3 mt-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors text-center text-lg !text-white"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Start Free
                      </Link>
                    </div>
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
    <>
    <nav className="bg-gradient-to-r from-dark-900 via-dark-800 to-dark-900 border-b border-dark-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo simple et intégré */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold text-red-500 font-logo tracking-wider">
              MANGAKA AI
            </span>
          </Link>

          <div className="flex items-center space-x-6">

            <div className="flex items-center space-x-4">
              {/* Upsell Button - Masqué pour les utilisateurs premium */}
              {!hasActiveSubscription && (
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  Upgrade Pro
                </button>
              )}

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 transition-colors"
                  suppressHydrationWarning
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center" suppressHydrationWarning>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {user && (
                    <span className="text-sm text-dark-200" suppressHydrationWarning>{user.email?.split('@')[0]}</span>
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
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setUserMenuOpen(false)
                      }}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-dark-200 hover:bg-dark-700 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Premium Upgrade Modal */}
    <PremiumUpgradeModal
      isOpen={showUpgradeModal}
      onClose={() => setShowUpgradeModal(false)}
      limitType="general"
    />
    </>
  )
}

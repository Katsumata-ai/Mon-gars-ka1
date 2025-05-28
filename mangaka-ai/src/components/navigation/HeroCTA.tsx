'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import ClientOnly from '@/components/common/ClientOnly'

export default function HeroCTA() {
  const { user, loading } = useAuth()

  return (
    <ClientOnly fallback={
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <div className="w-64 h-14 bg-dark-700 rounded-lg animate-pulse"></div>
        <div className="w-48 h-14 bg-dark-700 rounded-lg animate-pulse"></div>
      </div>
    }>
      {loading ? (
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="w-64 h-14 bg-dark-700 rounded-lg animate-pulse"></div>
          <div className="w-48 h-14 bg-dark-700 rounded-lg animate-pulse"></div>
        </div>
      ) : user ? (
        // User is authenticated - show app-focused CTAs
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/generate"
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 manga-shadow-lg"
          >
            Commencer à créer
          </Link>
          <Link
            href="/dashboard"
            className="border border-dark-700 hover:border-primary-500 text-dark-100 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Voir mes projets
          </Link>
        </div>
      ) : (
        // User is not authenticated - show signup CTAs
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/signup"
            className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 manga-shadow-lg"
          >
            Créer mon premier manga
          </Link>
          <Link
            href="#demo"
            className="border border-dark-700 hover:border-primary-500 text-dark-100 px-8 py-4 rounded-lg font-medium text-lg transition-colors"
          >
            Voir la démo
          </Link>
        </div>
      )}
    </ClientOnly>
  )
}

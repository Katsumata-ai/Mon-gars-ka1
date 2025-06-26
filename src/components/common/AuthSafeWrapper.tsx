'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import ClientOnly from './ClientOnly'

interface AuthSafeWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  loadingComponent?: ReactNode
}

/**
 * Wrapper qui s'assure que les composants utilisant l'authentification
 * ne causent pas d'erreurs d'hydratation
 */
export default function AuthSafeWrapper({ 
  children, 
  fallback,
  loadingComponent 
}: AuthSafeWrapperProps) {
  const { loading, initialized } = useAuth()

  const defaultLoadingComponent = (
    <div className="flex items-center justify-center p-4" suppressHydrationWarning>
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <ClientOnly fallback={fallback || defaultLoadingComponent}>
      {loading || !initialized ? (
        loadingComponent || defaultLoadingComponent
      ) : (
        <div suppressHydrationWarning>
          {children}
        </div>
      )}
    </ClientOnly>
  )
}

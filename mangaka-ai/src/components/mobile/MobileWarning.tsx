'use client'

import { useState, useEffect } from 'react'
import { Monitor, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileWarningProps {
  className?: string
}

export default function MobileWarning({ className }: MobileWarningProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      // Détection basée sur la largeur d'écran et l'agent utilisateur
      const screenWidth = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Détection par largeur d'écran (smartphones et tablettes)
      const isSmallScreen = screenWidth <= 1024
      
      // Détection par agent utilisateur pour les appareils mobiles
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Détection tactile
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Considérer comme mobile si au moins 2 critères sont remplis
      const mobileIndicators = [isSmallScreen, isMobileUA, isTouchDevice].filter(Boolean).length
      
      setIsMobile(mobileIndicators >= 2 || (isSmallScreen && isTouchDevice))
      setIsLoaded(true)
    }

    // Vérifier au chargement
    checkMobile()

    // Vérifier lors du redimensionnement
    const handleResize = () => {
      checkMobile()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Ne pas afficher pendant le chargement pour éviter le flash
  if (!isLoaded || !isMobile) {
    return null
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-dark-900 flex items-center justify-center p-6",
      className
    )}>
      {/* Overlay avec effet de gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
      
      {/* Contenu principal */}
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Icône principale avec animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/25">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          
          {/* Effet de pulsation */}
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-primary-500/20 rounded-full animate-ping" />
        </div>

        {/* Emoji triste en grand */}
        <div className="text-6xl mb-6 animate-bounce">
          😢
        </div>

        {/* Titre principal */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
          Version mobile non disponible
        </h1>

        {/* Message principal */}
        <p className="text-lg text-dark-200 mb-8 leading-relaxed">
          La version mobile n'est pas encore disponible 😢 
          <br />
          Veuillez consulter Manga Studio sur votre PC pour une meilleure expérience
        </p>

        {/* Icône PC avec indication */}
        <div className="flex items-center justify-center space-x-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
          <Monitor className="w-6 h-6 text-primary-400" />
          <span className="text-primary-400 font-medium">
            Utilisez un ordinateur de bureau
          </span>
        </div>

        {/* Message de développement */}
        <div className="mt-8 p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg border border-primary-500/20">
          <p className="text-sm text-primary-300">
            🚀 Nous travaillons sur une version mobile optimisée !
          </p>
        </div>

        {/* Footer avec branding */}
        <div className="mt-8 pt-6 border-t border-dark-700">
          <p className="text-xs text-dark-500 uppercase tracking-wider font-logo">
            MANGAKA AI - Manga Studio
          </p>
        </div>
      </div>

      {/* Particules décoratives */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-500/30 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-primary-400/40 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary-600/20 rounded-full animate-pulse delay-500" />
      </div>
    </div>
  )
}

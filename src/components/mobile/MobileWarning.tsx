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
      // Detection based on screen width and user agent
      const screenWidth = window.innerWidth
      const userAgent = navigator.userAgent.toLowerCase()
      
      // Detection by screen width (smartphones and tablets)
      const isSmallScreen = screenWidth <= 1024
      
      // Detection by user agent for mobile devices
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      
      // Touch detection
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Consider as mobile if at least 2 criteria are met
      const mobileIndicators = [isSmallScreen, isMobileUA, isTouchDevice].filter(Boolean).length
      
      setIsMobile(mobileIndicators >= 2 || (isSmallScreen && isTouchDevice))
      setIsLoaded(true)
    }

    // Check on load
    checkMobile()

    // Check on resize
    const handleResize = () => {
      checkMobile()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Don't display during loading to avoid flash
  if (!isLoaded || !isMobile) {
    return null
  }

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-dark-900 flex items-center justify-center p-6",
      className
    )}>
      {/* Overlay with gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900" />
      
      {/* Main content */}
      <div className="relative z-10 max-w-md w-full text-center">
        {/* Main icon with animation */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/25">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          
          {/* Pulsation effect */}
          <div className="absolute inset-0 w-24 h-24 mx-auto bg-primary-500/20 rounded-full animate-ping" />
        </div>

        {/* Large sad emoji */}
        <div className="text-6xl mb-6 animate-bounce">
          😢
        </div>

        {/* Main title */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">
          Mobile Version Not Available
        </h1>

        {/* Main message */}
        <p className="text-lg text-dark-200 mb-8 leading-relaxed">
          Mobile version is not yet available 😢
          <br />
          Please access Manga Studio on your PC for a better experience
        </p>

        {/* PC icon with indication */}
        <div className="flex items-center justify-center space-x-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700">
          <Monitor className="w-6 h-6 text-primary-400" />
          <span className="text-primary-400 font-medium">
            Use a desktop computer
          </span>
        </div>

        {/* Development message */}
        <div className="mt-8 p-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 rounded-lg border border-primary-500/20">
          <p className="text-sm text-primary-300">
            🚀 We're working on an optimized mobile version!
          </p>
        </div>

        {/* Footer with branding */}
        <div className="mt-8 pt-6 border-t border-dark-700">
          <p className="text-xs text-dark-500 uppercase tracking-wider font-logo">
            MANGAKA AI - Manga Studio
          </p>
        </div>
      </div>

      {/* Decorative particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-500/30 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-primary-400/40 rounded-full animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-primary-600/20 rounded-full animate-pulse delay-500" />
      </div>
    </div>
  )
}

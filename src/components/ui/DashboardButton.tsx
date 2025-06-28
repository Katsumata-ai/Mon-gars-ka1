'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ArrowRightIcon } from '@radix-ui/react-icons'
import { cn } from '@/lib/utils'

interface DashboardButtonProps {
  className?: string
  children?: React.ReactNode
  variant?: 'default' | 'highlight'
}

export function DashboardButton({ 
  className, 
  children,
  variant = 'default'
}: DashboardButtonProps) {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleClick = async () => {
    setIsProcessing(true)
    
    try {
      // Si l'utilisateur n'est pas connecté, rediriger vers l'inscription
      if (!user) {
        window.location.href = '/signup'
        return
      }

      // Si l'utilisateur est connecté, rediriger vers le dashboard
      window.location.href = '/dashboard'
    } finally {
      setIsProcessing(false)
    }
  }

  const buttonStyles = {
    default: cn(
      "h-12 bg-slate-800 hover:bg-slate-700",
      "text-white border border-slate-600",
      "hover:border-primary-500 shadow-sm hover:shadow-md",
      "text-sm font-medium font-comic",
    ),
    highlight: cn(
      "h-12 bg-primary-500 hover:bg-primary-600",
      "text-white shadow-lg hover:shadow-xl",
      "font-semibold text-base font-comic",
      "border border-primary-400",
    ),
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "w-full relative transition-all duration-300",
        variant === 'highlight' ? buttonStyles.highlight : buttonStyles.default,
        className
      )}
    >
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children || (
          <>
            Get Started
            <ArrowRightIcon className="w-4 h-4" />
          </>
        )}
        {isProcessing && (
          <div className="ml-2 w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
      </span>
    </Button>
  )
}

export default DashboardButton

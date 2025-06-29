'use client'

import { useCurrency } from '@/hooks/useCurrency'
import { CurrencyToggle } from '@/components/ui/CurrencyToggle'
import { cn } from '@/lib/utils'

interface CurrencyDisplayProps {
  variant?: 'toggle' | 'display' | 'minimal'
  className?: string
  showLabel?: boolean
}

export function CurrencyDisplay({ 
  variant = 'display', 
  className,
  showLabel = false 
}: CurrencyDisplayProps) {
  const { currency, setCurrency, getCurrencyCode } = useCurrency()

  if (variant === 'toggle') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && (
          <span className="text-xs text-gray-500">Currency:</span>
        )}
        <CurrencyToggle 
          currency={currency}
          onCurrencyChange={setCurrency}
          size="xs"
          variant="minimal"
        />
      </div>
    )
  }

  if (variant === 'minimal') {
    return (
      <div className={cn("text-xs text-gray-500", className)}>
        {getCurrencyCode()}
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs text-gray-500", className)}>
      <span className="w-2 h-2 rounded-full bg-green-500"></span>
      <span>{getCurrencyCode()}</span>
    </div>
  )
}

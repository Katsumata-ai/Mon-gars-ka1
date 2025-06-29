'use client'

import { cn } from '@/lib/utils'
import { Currency } from '@/hooks/useCurrency'

interface CurrencyToggleProps {
  currency: Currency
  onCurrencyChange: (currency: Currency) => void
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'minimal'
}

export function CurrencyToggle({
  currency,
  onCurrencyChange,
  className,
  size = 'md',
  variant = 'default'
}: CurrencyToggleProps) {
  const sizeClasses = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const variantClasses = {
    default: {
      container: currency === 'usd'
        ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 border-blue-500/50 shadow-blue-500/25"
        : "bg-gradient-to-r from-red-500/20 to-red-600/20 border-red-500/50 shadow-red-500/25",
      active: currency === 'usd'
        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50"
        : "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/50",
      inactive: "text-gray-400 hover:text-white"
    },
    subtle: {
      container: "bg-slate-800/50 border-slate-700/50",
      active: "bg-slate-700 text-white",
      inactive: "text-gray-400 hover:text-gray-300"
    },
    minimal: {
      container: "bg-transparent border-transparent",
      active: "bg-slate-700/50 text-white",
      inactive: "text-gray-500 hover:text-gray-300"
    }
  }

  const currentVariant = variantClasses[variant]

  return (
    <div className={cn(
      "inline-flex items-center p-1 rounded-full border shadow-sm transition-all duration-300",
      currentVariant.container,
      className
    )}>
      {(['eur', 'usd'] as Currency[]).map((curr) => (
        <button
          key={curr}
          onClick={() => onCurrencyChange(curr)}
          className={cn(
            "rounded-full transition-all duration-300 font-medium relative",
            sizeClasses[size],
            currency === curr ? currentVariant.active : currentVariant.inactive
          )}
          aria-label={`Switch to ${curr.toUpperCase()}`}
        >
          {curr === 'eur' ? '€ EUR' : '$ USD'}
          {curr === 'usd' && variant === 'default' && (
            <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full shadow-lg">
              US
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

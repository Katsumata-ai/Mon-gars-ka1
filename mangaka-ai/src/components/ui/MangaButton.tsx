'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface MangaButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  gradient?: boolean
}

const MangaButton = forwardRef<HTMLButtonElement, MangaButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    gradient = false,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = [
      'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
      'transform hover:scale-105 active:scale-95',
      fullWidth && 'w-full'
    ]

    const variants = {
      primary: gradient 
        ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-lg shadow-primary-500/25 focus:ring-primary-500'
        : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/25 focus:ring-primary-500',
      secondary: 'border-2 border-primary-500 text-primary-400 hover:bg-primary-500/10 hover:text-primary-300 focus:ring-primary-500',
      ghost: 'text-dark-200 hover:bg-dark-700 hover:text-white focus:ring-dark-500',
      danger: 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25 focus:ring-red-500',
      success: 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/25 focus:ring-green-500'
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
      xl: 'px-8 py-4 text-lg'
    }

    const iconSizes = {
      sm: 'w-4 h-4',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6'
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <Loader2 className={cn('animate-spin', iconSizes[size], children && 'mr-2')} />
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className={cn(iconSizes[size], children && 'mr-2')}>
            {icon}
          </span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className={cn(iconSizes[size], children && 'ml-2')}>
            {icon}
          </span>
        )}
      </button>
    )
  }
)

MangaButton.displayName = 'MangaButton'

export default MangaButton

'use client'

import { useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'

interface MobileDrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  position?: 'right' | 'bottom'
  className?: string
}

export default function MobileDrawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  className
}: MobileDrawerProps) {
  
  // Gérer l'overflow du body et les touches
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      
      document.addEventListener('keydown', handleEscape)
      
      return () => {
        document.removeEventListener('keydown', handleEscape)
        document.body.style.overflow = 'unset'
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isRightDrawer = position === 'right'
  const isBottomDrawer = position === 'bottom'

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={cn(
        'fixed z-50 md:hidden bg-dark-800 border-dark-700 shadow-xl',
        'transform transition-transform duration-300 ease-out',
        isRightDrawer && [
          'top-0 right-0 h-full w-80 max-w-[85vw] border-l',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        ],
        isBottomDrawer && [
          'bottom-0 left-0 right-0 max-h-[80vh] border-t rounded-t-xl',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        ],
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-700 bg-dark-900">
          <h3 className="text-lg font-semibold text-white truncate">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center text-dark-400 hover:text-white rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-hidden',
          isBottomDrawer ? 'max-h-[calc(80vh-4rem)]' : 'h-[calc(100vh-4rem)]'
        )}>
          {children}
        </div>
      </div>
    </>
  )
}

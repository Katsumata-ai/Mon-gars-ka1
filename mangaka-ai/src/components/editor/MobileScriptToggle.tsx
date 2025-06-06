'use client'

import { useState } from 'react'
import { BookOpen, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileScriptToggleProps {
  children: React.ReactNode
  className?: string
}

export default function MobileScriptToggle({ children, className }: MobileScriptToggleProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Bouton flottant pour ouvrir la sidebar sur mobile */}
      <button
        onClick={toggleSidebar}
        className={cn(
          'fixed bottom-20 right-4 z-50 lg:hidden',
          'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400',
          'text-white p-3 rounded-full shadow-lg',
          'transition-all duration-200 hover:scale-110 active:scale-95',
          'touch-target border-2 border-blue-400/30',
          className
        )}
        title="Structure du Script"
      >
        <BookOpen className="w-5 h-5" />
      </button>

      {/* Overlay pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
          suppressHydrationWarning={true}
        />
      )}

      {/* Sidebar mobile */}
      <div className={cn(
        'fixed top-0 right-0 h-full z-50 lg:hidden',
        'bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-600/50 shadow-xl',
        'transform transition-transform duration-300 ease-out',
        'w-80 max-w-[85vw]',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )} suppressHydrationWarning={true}>
        {/* Header mobile */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900" suppressHydrationWarning={true}>
          <h3 className="text-lg font-semibold text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-400" />
            Structure
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="touch-target flex items-center justify-center text-gray-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu de la sidebar */}
        <div className="h-[calc(100vh-4rem)] overflow-hidden" suppressHydrationWarning={true}>
          {children}
        </div>
      </div>
    </>
  )
}

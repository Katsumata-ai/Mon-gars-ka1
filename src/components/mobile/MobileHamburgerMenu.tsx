'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { 
  Menu, 
  X, 
  FileText, 
  Grid,
  Save,
  Settings,
  User,
  LogOut
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'

interface MobileHamburgerMenuProps {
  projectName: string
  onSave?: () => void
  saving?: boolean
  onAssetsToggle?: () => void
  assetsVisible?: boolean
  className?: string
}

export default function MobileHamburgerMenu({
  projectName,
  onSave,
  saving = false,
  onAssetsToggle,
  assetsVisible = false,
  className
}: MobileHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Fermer le menu quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isOpen && !target.closest('.mobile-menu-container')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      document.body.style.overflow = 'hidden' // Empêcher le scroll
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const handleMenuAction = (action: () => void) => {
    action()
    setIsOpen(false) // Fermer le menu après action
  }

  return (
    <>
      {/* Bouton Hamburger */}
      <button
        onClick={toggleMenu}
        className={cn(
          'md:hidden touch-target flex items-center justify-center',
          'text-white hover:bg-dark-700 rounded-lg transition-colors',
          className
        )}
        aria-label="Menu"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" suppressHydrationWarning={true} />
      )}

      {/* Menu Sidebar */}
      <div className={cn(
        'fixed top-0 left-0 h-full z-50 md:hidden mobile-menu-container',
        'bg-dark-800 border-r border-dark-700 shadow-xl',
        'transform transition-transform duration-300 ease-out',
        'w-80 max-w-[85vw]',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )} suppressHydrationWarning={true}>
        {/* Header */}
        <div className="p-4 border-b border-dark-700" suppressHydrationWarning={true}>
          <div className="flex items-center justify-between" suppressHydrationWarning={true}>
            <div suppressHydrationWarning={true}>
              <h2 className="text-lg font-bold text-white truncate">
                {projectName}
              </h2>
              <p className="text-sm text-dark-400 font-logo">MANGAKA AI</p>
            </div>
            <button
              onClick={toggleMenu}
              className="touch-target flex items-center justify-center text-dark-400 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Actions principales */}
        <div className="p-4 space-y-3" suppressHydrationWarning={true}>
          <MangaButton
            onClick={() => handleMenuAction(onSave || (() => {}))}
            loading={saving}
            size="lg"
            fullWidth
            icon={<Save className="w-5 h-5" />}
          >
            Save
          </MangaButton>

          <MangaButton
            onClick={() => handleMenuAction(onAssetsToggle || (() => {}))}
            size="md"
            variant={assetsVisible ? "primary" : "secondary"}
            fullWidth
            icon={<Grid className="w-4 h-4" />}
          >
            Assets
          </MangaButton>
        </div>

        {/* Menu secondaire */}
        <div className="px-4 py-2 border-t border-dark-700 mt-4" suppressHydrationWarning={true}>
          <div className="space-y-2" suppressHydrationWarning={true}>
            <button className="w-full flex items-center space-x-3 px-3 py-3 text-dark-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
              <span>Paramètres</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-3 text-dark-300 hover:bg-dark-700 hover:text-white rounded-lg transition-colors">
              <User className="w-5 h-5" />
              <span>Profil</span>
            </button>

            <button className="w-full flex items-center space-x-3 px-3 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-700 bg-dark-900" suppressHydrationWarning={true}>
          <div className="text-xs text-dark-500 text-center font-logo" suppressHydrationWarning={true}>
            MANGAKA AI v2.0 Mobile
          </div>
        </div>
      </div>
    </>
  )
}

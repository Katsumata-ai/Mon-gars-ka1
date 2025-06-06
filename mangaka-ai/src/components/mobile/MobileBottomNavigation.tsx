'use client'

import { cn } from '@/lib/utils'
import { 
  FileText, 
  Users, 
  Mountain, 
  Camera, 
  Grid,
  Layers
} from 'lucide-react'

export type EditorTab = 'script' | 'characters' | 'backgrounds' | 'scenes' | 'assembly'

interface MobileBottomNavigationProps {
  activeTab: EditorTab
  onTabChange: (tab: EditorTab) => void
  className?: string
}

const mobileNavTabs = [
  {
    id: 'script' as EditorTab,
    name: 'Script',
    icon: FileText,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20'
  },
  {
    id: 'characters' as EditorTab,
    name: 'Perso',
    icon: Users,
    color: 'text-primary-400',
    bgColor: 'bg-primary-500/20'
  },
  {
    id: 'backgrounds' as EditorTab,
    name: 'Décors',
    icon: Mountain,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20'
  },
  {
    id: 'scenes' as EditorTab,
    name: 'Scènes',
    icon: Camera,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20'
  },
  {
    id: 'assembly' as EditorTab,
    name: 'Canvas',
    icon: Layers,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20'
  }
]

export default function MobileBottomNavigation({ 
  activeTab, 
  onTabChange, 
  className 
}: MobileBottomNavigationProps) {
  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50 md:hidden',
      'bg-dark-800 border-t border-dark-700',
      'mobile-bottom-nav mobile-safe-area',
      className
    )} suppressHydrationWarning={true}>
      <div className="flex items-center justify-around h-full px-2" suppressHydrationWarning={true}>
        {mobileNavTabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center',
                'touch-target rounded-lg transition-all duration-200',
                'min-w-0 flex-1 mx-1',
                isActive
                  ? `${tab.bgColor} ${tab.color}`
                  : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700'
              )}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1 flex-shrink-0',
                isActive ? 'scale-110' : 'scale-100'
              )} />
              <span className={cn(
                'text-xs font-medium truncate',
                isActive ? 'text-current' : 'text-dark-500'
              )}>
                {tab.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

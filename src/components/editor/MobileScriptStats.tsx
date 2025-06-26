'use client'

import { BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScriptStats {
  pages: number
  panels: number
  chapters: number
  words: number
  characters: number
  dialogues: number
}

interface MobileScriptStatsProps {
  stats: ScriptStats
  className?: string
}

export default function MobileScriptStats({ stats, className }: MobileScriptStatsProps) {
  const statsData = [
    {
      label: 'Ch',
      fullLabel: 'Chapters',
      value: stats.chapters,
      color: 'purple',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-300',
      hoverColor: 'hover:bg-purple-600/30'
    },
    {
      label: 'Pg',
      fullLabel: 'Pages',
      value: stats.pages,
      color: 'red',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-300',
      hoverColor: 'hover:bg-red-600/30'
    },
    {
      label: 'Pn',
      fullLabel: 'Panels',
      value: stats.panels,
      color: 'yellow',
      bgColor: 'bg-yellow-600/20',
      borderColor: 'border-yellow-500/30',
      textColor: 'text-yellow-300',
      hoverColor: 'hover:bg-yellow-600/30'
    },
    {
      label: 'Dl',
      fullLabel: 'Dialogues',
      value: stats.dialogues,
      color: 'blue',
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-300',
      hoverColor: 'hover:bg-blue-600/30'
    },
    {
      label: 'Words',
      fullLabel: 'Words',
      value: stats.words,
      color: 'green',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-300',
      hoverColor: 'hover:bg-green-600/30'
    },
    {
      label: 'Char',
      fullLabel: 'Characters',
      value: stats.characters,
      color: 'gray',
      bgColor: 'bg-gray-600/20',
      borderColor: 'border-gray-500/30',
      textColor: 'text-gray-300',
      hoverColor: 'hover:bg-gray-600/30'
    }
  ]

  return (
    <div className={cn(
      'bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-700 p-2 md:hidden',
      className
    )} suppressHydrationWarning={true}>
      <div className="flex items-center justify-between mb-2" suppressHydrationWarning={true}>
        <h3 className="text-xs font-semibold text-white flex items-center">
          <BarChart3 className="w-3 h-3 mr-1 text-blue-400" />
          Stats
        </h3>
      </div>

      {/* Version mobile compacte */}
      <div className="flex items-center justify-between gap-1 overflow-x-auto scrollbar-hide" suppressHydrationWarning={true}>
        {statsData.map((stat, index) => (
          <div
            key={index}
            className={cn(
              'flex flex-col items-center justify-center p-2 rounded text-center transition-colors touch-target flex-shrink-0 min-w-[50px]',
              stat.bgColor,
              stat.borderColor,
              stat.hoverColor,
              'border'
            )}
            title={`${stat.fullLabel}: ${stat.value}`}
            suppressHydrationWarning={true}
          >
            <div className={cn('text-xs font-bold text-white')} suppressHydrationWarning={true}>
              {stat.value}
            </div>
            <div className={cn('text-xs font-medium', stat.textColor)} suppressHydrationWarning={true}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Sword, 
  Shield, 
  Wand2, 
  Crown, 
  Heart, 
  Zap, 
  Eye, 
  Skull,
  Star,
  Book,
  Target,
  Flame
} from 'lucide-react'

interface Archetype {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  traits: string[]
  promptTemplate: string
  color: string
}

const ARCHETYPES: Archetype[] = [
  {
    id: 'hero',
    name: 'Determined Hero',
    description: 'Brave and determined protagonist',
    icon: <Sword className="w-6 h-6" />,
    traits: ['Brave', 'Determined', 'Loyal', 'Strong'],
    promptTemplate: 'heroic protagonist, determined expression, confident pose, brave warrior',
    color: 'bg-blue-500'
  },
  {
    id: 'rival',
    name: 'Mysterious Rival',
    description: 'Charismatic and complex antagonist',
    icon: <Eye className="w-6 h-6" />,
    traits: ['Mysterious', 'Intelligent', 'Ambitious', 'Charismatic'],
    promptTemplate: 'mysterious rival, intense gaze, confident smirk, complex character',
    color: 'bg-purple-500'
  },
  {
    id: 'mentor',
    name: 'Mentor Sage',
    description: 'Experienced and benevolent guide',
    icon: <Book className="w-6 h-6" />,
    traits: ['Wise', 'Experienced', 'Benevolent', 'Patient'],
    promptTemplate: 'wise mentor, kind expression, experienced appearance, guiding figure',
    color: 'bg-green-500'
  },
  {
    id: 'villain',
    name: 'Antagonist',
    description: 'Powerful and intimidating villain',
    icon: <Skull className="w-6 h-6" />,
    traits: ['Intimidating', 'Powerful', 'Calculating', 'Ruthless'],
    promptTemplate: 'powerful villain, menacing presence, dark aura, intimidating figure',
    color: 'bg-red-500'
  },
  {
    id: 'mage',
    name: 'Powerful Mage',
    description: 'User of mysterious magic',
    icon: <Wand2 className="w-6 h-6" />,
    traits: ['Mystical', 'Intelligent', 'Powerful', 'Enigmatic'],
    promptTemplate: 'powerful mage, magical aura, mystical appearance, spellcaster',
    color: 'bg-indigo-500'
  },
  {
    id: 'princess',
    name: 'Rebel Princess',
    description: 'Independent and strong royalty',
    icon: <Crown className="w-6 h-6" />,
    traits: ['Elegant', 'Independent', 'Noble', 'Strong'],
    promptTemplate: 'rebellious princess, elegant features, strong-willed, royal bearing',
    color: 'bg-pink-500'
  },
  {
    id: 'friend',
    name: 'Loyal Friend',
    description: 'Loyal and supportive companion',
    icon: <Heart className="w-6 h-6" />,
    traits: ['Loyal', 'Supportive', 'Friendly', 'Reliable'],
    promptTemplate: 'loyal friend, warm smile, supportive presence, trustworthy companion',
    color: 'bg-yellow-500'
  },
  {
    id: 'genius',
    name: 'Eccentric Genius',
    description: 'Brilliant and original inventor',
    icon: <Zap className="w-6 h-6" />,
    traits: ['Brilliant', 'Eccentric', 'Creative', 'Innovative'],
    promptTemplate: 'eccentric genius, intelligent eyes, creative appearance, innovative mind',
    color: 'bg-cyan-500'
  },
  {
    id: 'warrior',
    name: 'Stoic Warrior',
    description: 'Disciplined and honorable fighter',
    icon: <Shield className="w-6 h-6" />,
    traits: ['Disciplined', 'Honorable', 'Strong', 'Stoic'],
    promptTemplate: 'stoic warrior, disciplined stance, honorable bearing, battle-hardened',
    color: 'bg-orange-500'
  },
  {
    id: 'assassin',
    name: 'Reformed Assassin',
    description: 'Former killer seeking redemption',
    icon: <Target className="w-6 h-6" />,
    traits: ['Agile', 'Mysterious', 'Repentant', 'Skilled'],
    promptTemplate: 'reformed assassin, stealthy appearance, conflicted expression, agile build',
    color: 'bg-gray-500'
  },
  {
    id: 'prodigy',
    name: 'Child Prodigy',
    description: 'Exceptional young talent',
    icon: <Star className="w-6 h-6" />,
    traits: ['Talented', 'Young', 'Brilliant', 'Innocent'],
    promptTemplate: 'child prodigy, youthful appearance, exceptional talent, innocent eyes',
    color: 'bg-emerald-500'
  },
  {
    id: 'elemental',
    name: 'Elemental Master',
    description: 'Controller of natural forces',
    icon: <Flame className="w-6 h-6" />,
    traits: ['Powerful', 'Nature-connected', 'Mystical', 'Balanced'],
    promptTemplate: 'elemental master, natural powers, mystical connection, balanced aura',
    color: 'bg-teal-500'
  }
]

interface ArchetypeSelectorProps {
  selectedArchetype?: string
  onArchetypeSelect: (archetype: Archetype) => void
  className?: string
}

export default function ArchetypeSelector({
  selectedArchetype,
  onArchetypeSelect,
  className
}: ArchetypeSelectorProps) {
  const [hoveredArchetype, setHoveredArchetype] = useState<string | null>(null)

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-medium text-white mb-3">
          Character Archetypes
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {ARCHETYPES.map((archetype) => (
            <button
              key={archetype.id}
              onClick={() => onArchetypeSelect(archetype)}
              onMouseEnter={() => setHoveredArchetype(archetype.id)}
              onMouseLeave={() => setHoveredArchetype(null)}
              className={cn(
                'p-3 rounded-lg border-2 transition-all duration-200 text-left group',
                selectedArchetype === archetype.id
                  ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                  : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500 hover:bg-dark-600'
              )}
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  selectedArchetype === archetype.id
                    ? 'bg-primary-500 text-white'
                    : `${archetype.color} text-white opacity-80 group-hover:opacity-100`
                )}>
                  {archetype.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {archetype.name}
                  </div>
                </div>
              </div>
              
              {(hoveredArchetype === archetype.id || selectedArchetype === archetype.id) && (
                <div className="space-y-2">
                  <p className="text-xs opacity-75 line-clamp-2">
                    {archetype.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {archetype.traits.slice(0, 3).map((trait) => (
                      <span
                        key={trait}
                        className="text-xs px-2 py-1 bg-dark-600 rounded-full opacity-75"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {selectedArchetype && (
        <div className="p-4 bg-dark-800 rounded-lg border border-dark-600">
          <div className="text-sm text-dark-300">
            <strong className="text-white">Selected archetype:</strong>
            {' '}
            {ARCHETYPES.find(a => a.id === selectedArchetype)?.name}
          </div>
        </div>
      )}
    </div>
  )
}

export { ARCHETYPES }
export type { Archetype }

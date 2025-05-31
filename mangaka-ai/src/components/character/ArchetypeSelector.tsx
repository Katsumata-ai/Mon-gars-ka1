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
    name: 'Héros Déterminé',
    description: 'Protagoniste courageux et déterminé',
    icon: <Sword className="w-6 h-6" />,
    traits: ['Courageux', 'Déterminé', 'Loyal', 'Fort'],
    promptTemplate: 'heroic protagonist, determined expression, confident pose, brave warrior',
    color: 'bg-blue-500'
  },
  {
    id: 'rival',
    name: 'Rival Mystérieux',
    description: 'Antagoniste charismatique et complexe',
    icon: <Eye className="w-6 h-6" />,
    traits: ['Mystérieux', 'Intelligent', 'Ambitieux', 'Charismatique'],
    promptTemplate: 'mysterious rival, intense gaze, confident smirk, complex character',
    color: 'bg-purple-500'
  },
  {
    id: 'mentor',
    name: 'Mentor Sage',
    description: 'Guide expérimenté et bienveillant',
    icon: <Book className="w-6 h-6" />,
    traits: ['Sage', 'Expérimenté', 'Bienveillant', 'Patient'],
    promptTemplate: 'wise mentor, kind expression, experienced appearance, guiding figure',
    color: 'bg-green-500'
  },
  {
    id: 'villain',
    name: 'Antagoniste',
    description: 'Méchant puissant et intimidant',
    icon: <Skull className="w-6 h-6" />,
    traits: ['Intimidant', 'Puissant', 'Calculateur', 'Impitoyable'],
    promptTemplate: 'powerful villain, menacing presence, dark aura, intimidating figure',
    color: 'bg-red-500'
  },
  {
    id: 'mage',
    name: 'Magicien Puissant',
    description: 'Utilisateur de magie mystérieuse',
    icon: <Wand2 className="w-6 h-6" />,
    traits: ['Mystique', 'Intelligent', 'Puissant', 'Énigmatique'],
    promptTemplate: 'powerful mage, magical aura, mystical appearance, spellcaster',
    color: 'bg-indigo-500'
  },
  {
    id: 'princess',
    name: 'Princesse Rebelle',
    description: 'Royauté indépendante et forte',
    icon: <Crown className="w-6 h-6" />,
    traits: ['Élégante', 'Indépendante', 'Noble', 'Forte'],
    promptTemplate: 'rebellious princess, elegant features, strong-willed, royal bearing',
    color: 'bg-pink-500'
  },
  {
    id: 'friend',
    name: 'Ami Fidèle',
    description: 'Compagnon loyal et supportif',
    icon: <Heart className="w-6 h-6" />,
    traits: ['Loyal', 'Supportif', 'Amical', 'Fiable'],
    promptTemplate: 'loyal friend, warm smile, supportive presence, trustworthy companion',
    color: 'bg-yellow-500'
  },
  {
    id: 'genius',
    name: 'Génie Excentrique',
    description: 'Inventeur brillant et original',
    icon: <Zap className="w-6 h-6" />,
    traits: ['Brillant', 'Excentrique', 'Créatif', 'Innovant'],
    promptTemplate: 'eccentric genius, intelligent eyes, creative appearance, innovative mind',
    color: 'bg-cyan-500'
  },
  {
    id: 'warrior',
    name: 'Guerrier Stoïque',
    description: 'Combattant discipliné et honorable',
    icon: <Shield className="w-6 h-6" />,
    traits: ['Discipliné', 'Honorable', 'Fort', 'Stoïque'],
    promptTemplate: 'stoic warrior, disciplined stance, honorable bearing, battle-hardened',
    color: 'bg-orange-500'
  },
  {
    id: 'assassin',
    name: 'Assassin Repenti',
    description: 'Ancien tueur cherchant la rédemption',
    icon: <Target className="w-6 h-6" />,
    traits: ['Agile', 'Mystérieux', 'Repenti', 'Habile'],
    promptTemplate: 'reformed assassin, stealthy appearance, conflicted expression, agile build',
    color: 'bg-gray-500'
  },
  {
    id: 'prodigy',
    name: 'Enfant Prodige',
    description: 'Jeune talent exceptionnel',
    icon: <Star className="w-6 h-6" />,
    traits: ['Talentueux', 'Jeune', 'Brillant', 'Innocent'],
    promptTemplate: 'child prodigy, youthful appearance, exceptional talent, innocent eyes',
    color: 'bg-emerald-500'
  },
  {
    id: 'elemental',
    name: 'Maître Élémentaire',
    description: 'Contrôleur des forces naturelles',
    icon: <Flame className="w-6 h-6" />,
    traits: ['Puissant', 'Connecté à la nature', 'Mystique', 'Équilibré'],
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
          Archétypes de Personnages
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
            <strong className="text-white">Archétype sélectionné:</strong>
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

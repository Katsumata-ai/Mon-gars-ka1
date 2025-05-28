'use client'

import { useState } from 'react'
import { 
  Wand2, 
  Zap, 
  Heart, 
  Search, 
  Smile, 
  Sword,
  Plus,
  BookOpen,
  Users,
  MessageSquare,
  Camera
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'

interface ScriptTemplate {
  id: string
  name: string
  description: string
  genre: 'action' | 'romance' | 'mystery' | 'comedy' | 'drama' | 'adventure'
  icon: React.ReactNode
  color: string
  panels: TemplatePanel[]
}

interface TemplatePanel {
  description: string
  shotType: string
  dialogues: string[]
  notes: string
}

const scriptTemplates: ScriptTemplate[] = [
  {
    id: 'action-fight',
    name: 'Scène de combat',
    description: 'Séquence d\'action dynamique avec échanges de coups',
    genre: 'action',
    icon: <Sword className="w-5 h-5" />,
    color: 'text-red-400',
    panels: [
      {
        description: 'Plan large montrant les deux combattants face à face',
        shotType: 'wide',
        dialogues: ['Personnage A: "Tu ne passeras pas!"'],
        notes: 'Tension palpable, postures de combat'
      },
      {
        description: 'Gros plan sur les yeux déterminés du protagoniste',
        shotType: 'close-up',
        dialogues: [],
        notes: 'Montrer la détermination'
      },
      {
        description: 'Plan moyen - Premier coup porté',
        shotType: 'medium',
        dialogues: [],
        notes: 'Effet de mouvement, lignes de vitesse'
      },
      {
        description: 'Plan rapproché - Réaction de l\'adversaire',
        shotType: 'medium-close',
        dialogues: ['Adversaire: "Impossible!"'],
        notes: 'Expression de surprise'
      }
    ]
  },
  {
    id: 'romance-confession',
    name: 'Déclaration d\'amour',
    description: 'Moment romantique avec confession de sentiments',
    genre: 'romance',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-pink-400',
    panels: [
      {
        description: 'Plan d\'ensemble - Coucher de soleil sur le toit de l\'école',
        shotType: 'wide',
        dialogues: [],
        notes: 'Ambiance dorée, romantique'
      },
      {
        description: 'Plan moyen - Les deux personnages côte à côte',
        shotType: 'medium',
        dialogues: ['Personnage A: "Il faut que je te dise quelque chose..."'],
        notes: 'Nervosité palpable'
      },
      {
        description: 'Gros plan sur le visage rougissant',
        shotType: 'close-up',
        dialogues: ['Personnage A: "Je... je t\'aime!"'],
        notes: 'Rougissement, émotion intense'
      },
      {
        description: 'Plan rapproché - Réaction surprise',
        shotType: 'medium-close',
        dialogues: ['Personnage B: "Moi aussi..."'],
        notes: 'Sourire timide, larmes de joie'
      }
    ]
  },
  {
    id: 'mystery-discovery',
    name: 'Découverte d\'indice',
    description: 'Moment de révélation dans une enquête',
    genre: 'mystery',
    icon: <Search className="w-5 h-5" />,
    color: 'text-purple-400',
    panels: [
      {
        description: 'Plan large - Pièce sombre avec un rayon de lumière',
        shotType: 'wide',
        dialogues: [],
        notes: 'Atmosphère mystérieuse, ombres marquées'
      },
      {
        description: 'Plan moyen - Détective fouillant les indices',
        shotType: 'medium',
        dialogues: ['Détective: "Qu\'est-ce que c\'est que ça?"'],
        notes: 'Concentration, recherche minutieuse'
      },
      {
        description: 'Très gros plan sur l\'objet découvert',
        shotType: 'extreme-close',
        dialogues: [],
        notes: 'Mettre en évidence l\'importance de l\'indice'
      },
      {
        description: 'Gros plan sur l\'expression de réalisation',
        shotType: 'close-up',
        dialogues: ['Détective: "Maintenant je comprends tout!"'],
        notes: 'Moment d\'illumination, yeux écarquillés'
      }
    ]
  },
  {
    id: 'comedy-misunderstanding',
    name: 'Quiproquo comique',
    description: 'Situation comique basée sur un malentendu',
    genre: 'comedy',
    icon: <Smile className="w-5 h-5" />,
    color: 'text-yellow-400',
    panels: [
      {
        description: 'Plan moyen - Personnage A parlant au téléphone',
        shotType: 'medium',
        dialogues: ['Personnage A: "Oui, j\'arrive tout de suite!"'],
        notes: 'Expression confiante'
      },
      {
        description: 'Plan large - Personnage A se précipitant vers la mauvaise porte',
        shotType: 'wide',
        dialogues: [],
        notes: 'Mouvement rapide, lignes de vitesse'
      },
      {
        description: 'Plan rapproché - Surprise en ouvrant la porte',
        shotType: 'medium-close',
        dialogues: ['Personnage A: "Euh... bonjour?"'],
        notes: 'Expression embarrassée'
      },
      {
        description: 'Plan moyen - Réaction des personnes présentes',
        shotType: 'medium',
        dialogues: ['Groupe: "QUI ÊTES-VOUS?!"'],
        notes: 'Expressions choquées, effet comique'
      }
    ]
  }
]

interface ScriptTemplatesProps {
  onSelectTemplate: (template: ScriptTemplate) => void
  onClose: () => void
}

export default function ScriptTemplates({ onSelectTemplate, onClose }: ScriptTemplatesProps) {
  const [selectedGenre, setSelectedGenre] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const genres = [
    { value: 'all', label: 'Tous', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'action', label: 'Action', icon: <Zap className="w-4 h-4" /> },
    { value: 'romance', label: 'Romance', icon: <Heart className="w-4 h-4" /> },
    { value: 'mystery', label: 'Mystère', icon: <Search className="w-4 h-4" /> },
    { value: 'comedy', label: 'Comédie', icon: <Smile className="w-4 h-4" /> },
    { value: 'drama', label: 'Drame', icon: <Users className="w-4 h-4" /> }
  ]

  const filteredTemplates = scriptTemplates.filter(template => {
    const matchesGenre = selectedGenre === 'all' || template.genre === selectedGenre
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesGenre && matchesSearch
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Templates de Script</h2>
            <p className="text-dark-400">Choisissez un template pour commencer rapidement</p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Recherche */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un template..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Genres */}
          <div className="flex gap-2 overflow-x-auto">
            {genres.map(genre => (
              <button
                key={genre.value}
                onClick={() => setSelectedGenre(genre.value)}
                className={cn(
                  'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                  selectedGenre === genre.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                )}
              >
                {genre.icon}
                <span>{genre.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-dark-700 rounded-lg p-4 hover:bg-dark-600 transition-colors cursor-pointer"
              onClick={() => onSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={cn('p-2 rounded-lg bg-dark-600', template.color)}>
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-dark-400 text-sm">{template.description}</p>
                  </div>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded', template.color, 'bg-dark-600')}>
                  {template.genre}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-dark-400 text-xs">
                  <Camera className="w-3 h-3 mr-1" />
                  {template.panels.length} panels
                </div>
                <div className="text-dark-300 text-xs">
                  {template.panels[0]?.description.substring(0, 80)}...
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <p className="text-dark-400">Aucun template trouvé pour ces critères</p>
          </div>
        )}
      </div>
    </div>
  )
}

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
  genre: 'Action' | 'romance' | 'mystery' | 'comedy' | 'drama' | 'adventure'
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
    name: 'Combat scene',
    description: 'Dynamic action sequence with exchanges of blows',
    genre: 'Action',
    icon: <Sword className="w-5 h-5" />,
    color: 'text-red-400',
    panels: [
      {
        description: 'Wide shot showing both fighters facing each other',
        shotType: 'wide',
        dialogues: ['Character A: "You shall not pass!"'],
        notes: 'Palpable tension, combat postures'
      },
      {
        description: 'Close-up on the protagonist\'s determined eyes',
        shotType: 'close-up',
        dialogues: [],
        notes: 'Show determination'
      },
      {
        description: 'Medium shot - First blow struck',
        shotType: 'medium',
        dialogues: [],
        notes: 'Movement effect, speed lines'
      },
      {
        description: 'Medium close-up - Opponent\'s reaction',
        shotType: 'medium-close',
        dialogues: ['Opponent: "Impossible!"'],
        notes: 'Expression of surprise'
      }
    ]
  },
  {
    id: 'romance-confession',
    name: 'Love confession',
    description: 'Romantic moment with confession of feelings',
    genre: 'romance',
    icon: <Heart className="w-5 h-5" />,
    color: 'text-pink-400',
    panels: [
      {
        description: 'Wide shot - Sunset on the school rooftop',
        shotType: 'wide',
        dialogues: [],
        notes: 'Golden, romantic atmosphere'
      },
      {
        description: 'Medium shot - Both characters side by side',
        shotType: 'medium',
        dialogues: ['Character A: "I need to tell you something..."'],
        notes: 'Palpable nervousness'
      },
      {
        description: 'Close-up on the blushing face',
        shotType: 'close-up',
        dialogues: ['Character A: "I... I love you!"'],
        notes: 'Blushing, intense emotion'
      },
      {
        description: 'Medium close-up - Surprised reaction',
        shotType: 'medium-close',
        dialogues: ['Character B: "Me too..."'],
        notes: 'Shy smile, tears of joy'
      }
    ]
  },
  {
    id: 'mystery-discovery',
    name: 'Clue discovery',
    description: 'Moment of revelation in an investigation',
    genre: 'mystery',
    icon: <Search className="w-5 h-5" />,
    color: 'text-purple-400',
    panels: [
      {
        description: 'Wide shot - Dark room with a ray of light',
        shotType: 'wide',
        dialogues: [],
        notes: 'Mysterious atmosphere, marked shadows'
      },
      {
        description: 'Medium shot - Detective searching through clues',
        shotType: 'medium',
        dialogues: ['Detective: "What is this?"'],
        notes: 'Concentration, meticulous search'
      },
      {
        description: 'Extreme close-up on the discovered object',
        shotType: 'extreme-close',
        dialogues: [],
        notes: 'Highlight the importance of the clue'
      },
      {
        description: 'Close-up on the expression of realization',
        shotType: 'close-up',
        dialogues: ['Detective: "Now I understand everything!"'],
        notes: 'Moment of illumination, wide eyes'
      }
    ]
  },
  {
    id: 'comedy-misunderstanding',
    name: 'Comic misunderstanding',
    description: 'Comic situation based on a misunderstanding',
    genre: 'comedy',
    icon: <Smile className="w-5 h-5" />,
    color: 'text-yellow-400',
    panels: [
      {
        description: 'Medium shot - Character A talking on the phone',
        shotType: 'medium',
        dialogues: ['Character A: "Yes, I\'m coming right away!"'],
        notes: 'Confident expression'
      },
      {
        description: 'Wide shot - Character A rushing to the wrong door',
        shotType: 'wide',
        dialogues: [],
        notes: 'Fast movement, speed lines'
      },
      {
        description: 'Medium close-up - Surprise when opening the door',
        shotType: 'medium-close',
        dialogues: ['Character A: "Uh... hello?"'],
        notes: 'Embarrassed expression'
      },
      {
        description: 'Medium shot - Reaction of the people present',
        shotType: 'medium',
        dialogues: ['Group: "WHO ARE YOU?!"'],
        notes: 'Shocked expressions, comic effect'
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
    { value: 'all', label: 'All', icon: <BookOpen className="w-4 h-4" /> },
    { value: 'Action', label: 'Action', icon: <Zap className="w-4 h-4" /> },
    { value: 'romance', label: 'Romance', icon: <Heart className="w-4 h-4" /> },
    { value: 'mystery', label: 'Mystery', icon: <Search className="w-4 h-4" /> },
    { value: 'comedy', label: 'Comedy', icon: <Smile className="w-4 h-4" /> },
    { value: 'drama', label: 'Drama', icon: <Users className="w-4 h-4" /> }
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
            <h2 className="text-2xl font-bold text-white">Script Templates</h2>
            <p className="text-dark-400">Choose a template to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for a template..."
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
            <p className="text-dark-400">No template found for these criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}

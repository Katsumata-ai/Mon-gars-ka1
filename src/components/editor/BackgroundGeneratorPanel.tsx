'use client'

import { useState, useEffect } from 'react'
import {
  Mountain,
  Plus,
  Palette,
  Download,
  Eye,
  Zap
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import { cn } from '@/lib/utils'

interface Background {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  category: string
  mood: string
  timeOfDay: string
  created_at: string
}

interface BackgroundGeneratorPanelProps {
  projectId: string
  onBackgroundGenerated?: (background: Background) => void
}

const BACKGROUND_CATEGORIES = [
  { value: 'urban', label: 'Urbain', icon: '🏙️', description: 'Villes, rues, bâtiments' },
  { value: 'nature', label: 'Nature', icon: '🌲', description: 'Forêts, montagnes, rivières' },
  { value: 'fantasy', label: 'Fantasy', icon: '🏰', description: 'Châteaux, donjons, magie' },
  { value: 'interior', label: 'Intérieur', icon: '🏠', description: 'Maisons, bureaux, écoles' },
  { value: 'futuristic', label: 'Futuriste', icon: '🚀', description: 'Sci-fi, cyberpunk, espace' },
  { value: 'historical', label: 'Historique', icon: '⛩️', description: 'Époque ancienne, temples' }
]

const MOOD_OPTIONS = [
  { value: 'peaceful', label: 'Paisible', color: 'text-green-400' },
  { value: 'dramatic', label: 'Dramatique', color: 'text-red-400' },
  { value: 'mysterious', label: 'Mystérieux', color: 'text-purple-400' },
  { value: 'energetic', label: 'Énergique', color: 'text-orange-400' },
  { value: 'melancholic', label: 'Mélancolique', color: 'text-blue-400' },
  { value: 'epic', label: 'Épique', color: 'text-yellow-400' }
]

const TIME_OF_DAY = [
  { value: 'dawn', label: 'Aube', icon: '🌅' },
  { value: 'morning', label: 'Matin', icon: '☀️' },
  { value: 'noon', label: 'Midi', icon: '🌞' },
  { value: 'afternoon', label: 'Après-midi', icon: '🌤️' },
  { value: 'evening', label: 'Soir', icon: '🌆' },
  { value: 'night', label: 'Nuit', icon: '🌙' }
]

const PRESET_BACKGROUNDS = [
  'École japonaise traditionnelle',
  'Toit d\'immeuble au coucher du soleil',
  'Forêt mystérieuse avec brouillard',
  'Café moderne en ville',
  'Plage au clair de lune',
  'Château médiéval en ruines',
  'Laboratoire futuriste',
  'Temple shinto dans les montagnes'
]

export default function BackgroundGeneratorPanel({
  projectId,
  onBackgroundGenerated
}: BackgroundGeneratorPanelProps) {
  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)

  // Formulaire de génération
  const [backgroundName, setBackgroundName] = useState('')
  const [backgroundDescription, setBackgroundDescription] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('urban')
  const [selectedMood, setSelectedMood] = useState('peaceful')
  const [selectedTimeOfDay, setSelectedTimeOfDay] = useState('morning')
  const [customPrompt, setCustomPrompt] = useState('')

  const { credits, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    loadBackgrounds()
  }, [projectId])

  const loadBackgrounds = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('image_type', 'background')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedBackgrounds = (data || []).map(item => ({
        id: item.id,
        name: item.metadata?.name || 'Décor sans nom',
        description: item.original_prompt,
        prompt: item.optimized_prompt,
        image_url: item.image_url,
        category: item.metadata?.category || 'urban',
        mood: item.metadata?.mood || 'peaceful',
        timeOfDay: item.metadata?.timeOfDay || 'morning',
        created_at: item.created_at
      }))

      setBackgrounds(transformedBackgrounds)
    } catch (error) {
      console.error('Erreur lors du chargement des décors:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateBackground = async () => {
    if (!backgroundName.trim() || !backgroundDescription.trim()) {
      alert('Veuillez remplir le nom et la description du décor')
      return
    }

    if (!user) {
      alert('Vous devez être connecté pour générer des décors.')
      return
    }

    // SUPPRIMÉ: Vérification obsolète des crédits - remplacée par le système de limites unifié

    setGenerating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non connecté')

      const categoryInfo = BACKGROUND_CATEGORIES.find(c => c.value === selectedCategory)
      const moodInfo = MOOD_OPTIONS.find(m => m.value === selectedMood)
      const timeInfo = TIME_OF_DAY.find(t => t.value === selectedTimeOfDay)

      const finalPrompt = customPrompt ||
        `${backgroundDescription}, ${categoryInfo?.description}, ${moodInfo?.label} mood, ${timeInfo?.label}, manga background art, detailed environment, high quality illustration`

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          type: 'background',
          optimizePrompt: true,
          projectId,
          metadata: {
            name: backgroundName,
            category: selectedCategory,
            mood: selectedMood,
            timeOfDay: selectedTimeOfDay
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la génération')
      }

      if (result.success) {
        const newBackground: Background = {
          id: result.data.imageId,
          name: backgroundName,
          description: backgroundDescription,
          prompt: result.data.optimizedPrompt,
          image_url: result.data.imageUrl,
          category: selectedCategory,
          mood: selectedMood,
          timeOfDay: selectedTimeOfDay,
          created_at: new Date().toISOString()
        }

        setBackgrounds([newBackground, ...backgrounds])
        onBackgroundGenerated?.(newBackground)
        await refreshCredits()

        // Reset form
        setBackgroundName('')
        setBackgroundDescription('')
        setCustomPrompt('')
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      alert('Erreur lors de la génération du décor')
    } finally {
      setGenerating(false)
    }
  }

  const selectPreset = (preset: string) => {
    setBackgroundDescription(preset)
    setBackgroundName(preset)
  }

  return (
    <div className="h-full flex bg-dark-900 overflow-hidden">
      {/* Générateur - Sidebar */}
      <div className="w-96 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Mountain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Générateur de Décors</h2>
              <p className="text-dark-300 text-sm">Créez vos environnements</p>
            </div>
          </div>

          {credits && (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-lg p-3">
              <p className="text-primary-400 text-sm">
                <Zap className="w-4 h-4 inline mr-1" />
                {credits.monthly_generations_limit - credits.monthly_generations_used} générations restantes
              </p>
            </div>
          )}
        </div>

        {/* Formulaire de génération - Zone Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nom du décor */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nom du décor
            </label>
            <input
              type="text"
              value={backgroundName}
              onChange={(e) => setBackgroundName(e.target.value)}
              placeholder="Ex: École Sakura, Forêt mystérieuse..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Décors prédéfinis */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Décors suggérés
            </label>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_BACKGROUNDS.slice(0, 6).map((preset) => (
                <button
                  key={preset}
                  onClick={() => selectPreset(preset)}
                  className="text-left p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description du décor
            </label>
            <textarea
              value={backgroundDescription}
              onChange={(e) => setBackgroundDescription(e.target.value)}
              placeholder="Décrivez votre environnement en détail..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Catégorie
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BACKGROUND_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-colors text-left',
                    selectedCategory === category.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.label}</span>
                  </div>
                  <div className="text-xs opacity-75 mt-1">{category.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ambiance */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Ambiance
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOOD_OPTIONS.map((mood) => (
                <button
                  key={mood.value}
                  onClick={() => setSelectedMood(mood.value)}
                  className={cn(
                    'p-2 rounded-lg border transition-colors',
                    selectedMood === mood.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <span className={cn('font-medium', mood.color)}>{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Moment de la journée */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Moment de la journée
            </label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OF_DAY.map((time) => (
                <button
                  key={time.value}
                  onClick={() => setSelectedTimeOfDay(time.value)}
                  className={cn(
                    'p-2 rounded-lg border transition-colors text-center',
                    selectedTimeOfDay === time.value
                      ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <div className="text-lg">{time.icon}</div>
                  <div className="text-xs">{time.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt personnalisé */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Prompt personnalisé (optionnel)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Prompt détaillé pour un contrôle précis..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Bouton de génération */}
          <MangaButton
            onClick={generateBackground}
            loading={generating}
            disabled={!backgroundName.trim() || !backgroundDescription.trim()}
            fullWidth
            size="lg"
            icon={<Palette className="w-5 h-5" />}
            gradient
          >
            {generating ? 'Génération en cours (~30 sec)...' : 'Générer le Décor'}
          </MangaButton>
        </div>
      </div>

      {/* Galerie des décors - Zone Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <h3 className="text-2xl font-bold text-white mb-2">My Backgrounds</h3>
          <p className="text-dark-400">
            {backgrounds.length} background{backgrounds.length !== 1 ? 's' : ''} created
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-dark-800 rounded-xl p-6 animate-pulse">
                <div className="w-full h-48 bg-dark-700 rounded-lg mb-4" />
                <div className="h-4 bg-dark-700 rounded mb-2" />
                <div className="h-3 bg-dark-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : backgrounds.length === 0 ? (
          <div className="text-center py-12">
            <Mountain className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No backgrounds created</h3>
            <p className="text-dark-400 mb-6">Start by creating your first background</p>
            <MangaButton
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setBackgroundName('École Sakura')
                setBackgroundDescription('École japonaise traditionnelle')
              }}
            >
              [FR-UNTRANSLATED: Créer mon premier décor]
            </MangaButton>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {backgrounds.map((background) => (
              <div
                key={background.id}
                className={cn(
                  'bg-dark-800 rounded-xl p-6 cursor-pointer transition-all hover:bg-dark-700',
                  selectedBackground === background.id && 'ring-2 ring-purple-500'
                )}
                onClick={() => setSelectedBackground(background.id)}
              >
                {background.image_url && (
                  <img
                    src={background.image_url}
                    alt={background.name}
                    className="w-full h-48 object-cover rounded-lg mb-4 bg-dark-700"
                  />
                )}
                <h4 className="font-semibold text-white mb-2">{background.name}</h4>
                <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                  {background.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded">
                    {BACKGROUND_CATEGORIES.find(c => c.value === background.category)?.label || background.category}
                  </span>
                  <span className="text-xs bg-dark-600 text-dark-300 px-2 py-1 rounded">
                    {TIME_OF_DAY.find(t => t.value === background.timeOfDay)?.label || background.timeOfDay}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    MOOD_OPTIONS.find(m => m.value === background.mood)?.color || 'text-dark-400'
                  )}>
                    {MOOD_OPTIONS.find(m => m.value === background.mood)?.label || background.mood}
                  </span>
                  <div className="flex space-x-1">
                    <button className="p-1 hover:bg-dark-600 rounded">
                      <Eye className="w-4 h-4 text-dark-400" />
                    </button>
                    <button className="p-1 hover:bg-dark-600 rounded">
                      <Download className="w-4 h-4 text-dark-400" />
                    </button>
                  </div>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

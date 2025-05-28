'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Plus,
  Wand2,
  Sparkles,
  Edit3,
  Trash2,
  Download,
  Copy,
  Heart,
  Zap,
  Palette,
  Eye
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  traits: string[]
  style: string
  created_at: string
}

interface CharacterGeneratorPanelProps {
  projectId: string
  onCharacterGenerated?: (character: Character) => void
}

const CHARACTER_STYLES = [
  { value: 'shonen', label: 'Shōnen', description: 'Style action et aventure' },
  { value: 'shoujo', label: 'Shōjo', description: 'Style romantique et élégant' },
  { value: 'seinen', label: 'Seinen', description: 'Style mature et réaliste' },
  { value: 'josei', label: 'Josei', description: 'Style féminin adulte' },
  { value: 'chibi', label: 'Chibi', description: 'Style mignon et déformé' },
  { value: 'realistic', label: 'Réaliste', description: 'Style semi-réaliste' }
]

const CHARACTER_ARCHETYPES = [
  'Héros déterminé', 'Rival mystérieux', 'Mentor sage', 'Antagoniste charismatique',
  'Ami fidèle', 'Génie excentrique', 'Guerrier stoïque', 'Magicien puissant',
  'Princesse rebelle', 'Voleur au grand cœur', 'Assassin repenti', 'Enfant prodige'
]

const TRAIT_SUGGESTIONS = [
  'Cheveux noirs', 'Yeux bleus', 'Cicatrice', 'Lunettes', 'Tatouage',
  'Cape', 'Armure', 'Épée', 'Bâton magique', 'Masque', 'Bandeau',
  'Sourire confiant', 'Regard intense', 'Expression sérieuse'
]

export default function CharacterGeneratorPanel({
  projectId,
  onCharacterGenerated
}: CharacterGeneratorPanelProps) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)

  // Formulaire de génération
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('shonen')
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [customPrompt, setCustomPrompt] = useState('')

  const { credits, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  const loadCharacters = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('image_type', 'character')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transformer les données pour correspondre à l'interface Character
      const transformedCharacters = (data || []).map(item => ({
        id: item.id,
        name: item.metadata?.name || 'Personnage sans nom',
        description: item.original_prompt,
        prompt: item.optimized_prompt,
        image_url: item.image_url,
        traits: item.metadata?.traits || [],
        style: item.metadata?.style || 'shonen',
        created_at: item.created_at
      }))

      setCharacters(transformedCharacters)
    } catch (error) {
      console.error('Erreur lors du chargement des personnages:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCharacter = async () => {
    if (!characterName.trim() || !characterDescription.trim()) {
      alert('Veuillez remplir le nom et la description du personnage')
      return
    }

    if (!user || !credits || (credits.monthly_generations_limit - credits.monthly_generations_used) < 1) {
      alert('Générations insuffisantes. Passez au plan Pro pour continuer.')
      return
    }

    setGenerating(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Non connecté')

      // Construire le prompt optimisé
      const styleInfo = CHARACTER_STYLES.find(s => s.value === selectedStyle)
      const traitsText = selectedTraits.length > 0 ? `, ${selectedTraits.join(', ')}` : ''

      const finalPrompt = customPrompt ||
        `${characterDescription}, style ${styleInfo?.label} manga${traitsText}, high quality anime art, detailed character design`

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          type: 'character',
          optimizePrompt: true,
          projectId,
          metadata: {
            name: characterName,
            style: selectedStyle,
            traits: selectedTraits,
            archetype: characterDescription
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la génération')
      }

      if (result.success) {
        const newCharacter: Character = {
          id: result.data.imageId,
          name: characterName,
          description: characterDescription,
          prompt: result.data.optimizedPrompt,
          image_url: result.data.imageUrl,
          traits: selectedTraits,
          style: selectedStyle,
          created_at: new Date().toISOString()
        }

        setCharacters([newCharacter, ...characters])
        onCharacterGenerated?.(newCharacter)
        await refreshCredits()

        // Reset form
        setCharacterName('')
        setCharacterDescription('')
        setSelectedTraits([])
        setCustomPrompt('')
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      alert('Erreur lors de la génération du personnage')
    } finally {
      setGenerating(false)
    }
  }

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    )
  }

  const selectArchetype = (archetype: string) => {
    setCharacterDescription(archetype)
  }

  return (
    <div className="h-full flex bg-dark-900 overflow-hidden">
      {/* Générateur - Sidebar */}
      <div className="w-96 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Générateur de Personnages</h2>
              <p className="text-dark-300 text-sm">Créez vos héros avec l'IA</p>
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
          {/* Nom du personnage */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nom du personnage
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Ex: Akira, Sakura, Ryu..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Archétypes suggérés */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Archétypes suggérés
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_ARCHETYPES.slice(0, 8).map((archetype) => (
                <button
                  key={archetype}
                  onClick={() => selectArchetype(archetype)}
                  className="text-left p-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
                >
                  {archetype}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description du personnage
            </label>
            <textarea
              value={characterDescription}
              onChange={(e) => setCharacterDescription(e.target.value)}
              placeholder="Décrivez votre personnage: apparence, personnalité, rôle..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Style */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Style manga
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CHARACTER_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  className={cn(
                    'p-3 rounded-lg border-2 transition-colors text-left',
                    selectedStyle === style.value
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <div className="font-medium">{style.label}</div>
                  <div className="text-xs opacity-75">{style.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Traits physiques */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Traits physiques (optionnel)
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAIT_SUGGESTIONS.map((trait) => (
                <button
                  key={trait}
                  onClick={() => toggleTrait(trait)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    selectedTraits.includes(trait)
                      ? 'bg-primary-500 text-white'
                      : 'bg-dark-700 text-dark-300 hover:bg-dark-600'
                  )}
                >
                  {trait}
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
            onClick={generateCharacter}
            loading={generating}
            disabled={!characterName.trim() || !characterDescription.trim()}
            fullWidth
            size="lg"
            icon={<Wand2 className="w-5 h-5" />}
            gradient
          >
            {generating ? 'Génération en cours...' : 'Générer le Personnage'}
          </MangaButton>
        </div>
      </div>

      {/* Galerie des personnages - Zone Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <h3 className="text-2xl font-bold text-white mb-2">Mes Personnages</h3>
          <p className="text-dark-400">
            {characters.length} personnage{characters.length !== 1 ? 's' : ''} créé{characters.length !== 1 ? 's' : ''}
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
        ) : characters.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucun personnage créé</h3>
            <p className="text-dark-400 mb-6">Commencez par créer votre premier personnage</p>
            <MangaButton
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setCharacterName('Héros')
                setCharacterDescription('Héros déterminé')
              }}
            >
              Créer mon premier personnage
            </MangaButton>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character) => (
              <div
                key={character.id}
                className={cn(
                  'bg-dark-800 rounded-xl p-6 cursor-pointer transition-all hover:bg-dark-700',
                  selectedCharacter === character.id && 'ring-2 ring-primary-500'
                )}
                onClick={() => setSelectedCharacter(character.id)}
              >
                {character.image_url && (
                  <img
                    src={character.image_url}
                    alt={character.name}
                    className="w-full h-48 object-cover rounded-lg mb-4 bg-dark-700"
                  />
                )}
                <h4 className="font-semibold text-white mb-2">{character.name}</h4>
                <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                  {character.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-1 rounded">
                    {CHARACTER_STYLES.find(s => s.value === character.style)?.label || character.style}
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

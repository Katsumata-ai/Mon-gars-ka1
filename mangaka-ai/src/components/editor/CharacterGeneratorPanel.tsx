'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Wand2,
  Zap
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import { cn } from '@/lib/utils'
import ArchetypeSelector, { ARCHETYPES, type Archetype } from '@/components/character/ArchetypeSelector'
import CharacterGallery from '@/components/character/CharacterGallery'

interface Character {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  traits: string[]
  style: string
  created_at: string
  metadata?: {
    archetype?: string
    mood?: string
    pose?: string
    [key: string]: unknown
  }
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
  const [generating, setGenerating] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  // Formulaire de génération
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('shonen')
  const [selectedTraits, setSelectedTraits] = useState<string[]>([])
  const [selectedArchetype, setSelectedArchetype] = useState<string>('')
  const [customPrompt, setCustomPrompt] = useState('')

  const { credits, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    loadCharacters()
  }, [projectId])

  const loadCharacters = async () => {
    try {
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
        created_at: item.created_at,
        metadata: item.metadata || {}
      }))

      setCharacters(transformedCharacters)
    } catch (error) {
      console.error('Erreur lors du chargement des personnages:', error)
    }
  }

  const loadFavorites = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'character')

      if (error) throw error

      setFavorites(data?.map(fav => fav.item_id) || [])
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    }
  }

  useEffect(() => {
    if (projectId) {
      loadCharacters()
      loadFavorites()
    }
  }, [projectId, user?.id])

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
      const archetypeInfo = ARCHETYPES.find(a => a.id === selectedArchetype)
      const archetypePrompt = archetypeInfo ? `, ${archetypeInfo.promptTemplate}` : ''

      const finalPrompt = customPrompt ||
        `${characterDescription}${archetypePrompt}, style ${styleInfo?.label} manga${traitsText}, high quality anime art, detailed character design`

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
            archetype: selectedArchetype || characterDescription
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
        setSelectedArchetype('')
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



  const handleArchetypeSelect = (archetype: Archetype) => {
    setSelectedArchetype(archetype.id)
    setCharacterDescription(archetype.description)
    setSelectedTraits(archetype.traits.slice(0, 3)) // Prendre les 3 premiers traits
  }

  const handleFavoriteToggle = async (character: Character) => {
    try {
      const isFavorite = favorites.includes(character.id)

      if (isFavorite) {
        // Retirer des favoris
        setFavorites(prev => prev.filter(id => id !== character.id))

        // Mettre à jour en base de données
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('item_id', character.id)
          .eq('item_type', 'character')
      } else {
        // Ajouter aux favoris
        setFavorites(prev => [...prev, character.id])

        // Mettre à jour en base de données
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user?.id,
            item_id: character.id,
            item_type: 'character'
          })
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error)
    }
  }

  const handleCharacterEdit = (character: Character) => {
    // Pré-remplir le formulaire avec les données du personnage
    setCharacterName(character.name)
    setCharacterDescription(character.description)
    setSelectedStyle(character.style)
    setSelectedTraits(character.traits)
    setSelectedArchetype(character.metadata?.archetype || '')
    setCustomPrompt(character.prompt)
  }

  const handleCharacterDelete = async (character: Character) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le personnage "${character.name}" ?`)) {
      return
    }

    try {
      // Supprimer de la base de données
      const { error } = await supabase
        .from('generated_images')
        .delete()
        .eq('id', character.id)

      if (error) throw error

      // Mettre à jour l'état local
      setCharacters(prev => prev.filter(c => c.id !== character.id))
      setFavorites(prev => prev.filter(id => id !== character.id))

      // Supprimer des favoris si nécessaire
      await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user?.id)
        .eq('item_id', character.id)
        .eq('item_type', 'character')

    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du personnage')
    }
  }

  const handleCharacterDownload = (character: Character) => {
    if (character.image_url) {
      const link = document.createElement('a')
      link.href = character.image_url
      link.download = `${character.name}.png`
      link.click()
    }
  }

  const handleCopyPrompt = (character: Character) => {
    navigator.clipboard.writeText(character.prompt)
    alert('Prompt copié dans le presse-papiers !')
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

          {/* Sélecteur d'archétypes */}
          <ArchetypeSelector
            selectedArchetype={selectedArchetype}
            onArchetypeSelect={handleArchetypeSelect}
          />

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

      {/* Galerie des personnages améliorée */}
      <CharacterGallery
        characters={characters}
        favorites={favorites}
        selectedCharacter={selectedCharacter || undefined}
        onCharacterSelect={(character) => setSelectedCharacter(character.id)}
        onFavoriteToggle={handleFavoriteToggle}
        onCharacterEdit={handleCharacterEdit}
        onCharacterDelete={handleCharacterDelete}
        onCharacterDownload={handleCharacterDownload}
        onCopyPrompt={handleCopyPrompt}
      />
    </div>
  )
}

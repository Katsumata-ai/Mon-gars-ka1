'use client'

import { useState, useEffect } from 'react'
import { useFormAccessibility } from '@/hooks/useAccessibilityFix'
import {
  Palette,
  Sparkles,
  Download,
  Heart,
  Copy,
  RefreshCw,
  User,
  Shirt,
  Eye,
  Zap,
  ImageIcon,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MangaButton from '@/components/ui/MangaButton'
import ImprovedCharacterGallery from './ImprovedCharacterGallery'
import AccessibleInput from '@/components/ui/AccessibleInput'
import toast from 'react-hot-toast'
import { useUpsellContext, LimitIndicator } from '@/components/upselling'
import { ImageGenerationLimits } from '@/components/credits/ImageGenerationLimits'
import { useUserCredits } from '@/hooks/useUserCredits'
import { useUserLimitsSimple } from '@/hooks/useUserLimitsSimple'

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

interface MangaCharacterStudioProps {
  projectId: string
  cachedCharacters?: Character[]
  charactersLoaded?: boolean
  charactersLoading?: boolean
  onCharacterGenerated?: (character: Character) => void
  onCharacterDeleted?: (id: string) => void
}

// Available manga styles
const MANGA_STYLES = [
  { value: 'shonen', label: 'Shōnen', description: 'Dynamic and energetic style' },
  { value: 'shoujo', label: 'Shōjo', description: 'Elegant and romantic style' },
  { value: 'seinen', label: 'Seinen', description: 'Mature and realistic style' },
  { value: 'josei', label: 'Josei', description: 'Refined style for adults' },
  { value: 'chibi', label: 'Chibi', description: 'Cute and deformed style' },
  { value: 'realistic', label: 'Realistic', description: 'Semi-realistic style' }
]

// Character archetypes
const CHARACTER_ARCHETYPES = [
  { value: 'hero', label: 'Hero', description: 'Main protagonist' },
  { value: 'villain', label: 'Antagonist', description: 'Main villain' },
  { value: 'mentor', label: 'Mentor', description: 'Wise guide' },
  { value: 'sidekick', label: 'Sidekick', description: 'Faithful companion' },
  { value: 'rival', label: 'Rival', description: 'Friendly competitor' },
  { value: 'love_interest', label: 'Love Interest', description: 'Romantic partner' },
  { value: 'comic_relief', label: 'Comic Relief', description: 'Funny character' },
  { value: 'mysterious', label: 'Mysterious', description: 'Enigmatic character' }
]

// Suggested poses
const CHARACTER_POSES = [
  { value: 'standing', label: 'Standing', description: 'Neutral standing pose' },
  { value: 'action', label: 'Action', description: 'Dynamic pose' },
  { value: 'portrait', label: 'Portrait', description: 'Bust or face' },
  { value: 'sitting', label: 'Sitting', description: 'Sitting position' },
  { value: 'fighting', label: 'Fighting', description: 'Combat pose' },
  { value: 'thinking', label: 'Thinking', description: 'Thoughtful pose' }
]

export default function MangaCharacterStudio({
  projectId,
  cachedCharacters = [],
  charactersLoaded = false,
  charactersLoading = false,
  onCharacterGenerated,
  onCharacterDeleted
}: MangaCharacterStudioProps) {
  // États du formulaire
  const [characterName, setCharacterName] = useState('')
  const [characterDescription, setCharacterDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('shonen')
  const [selectedArchetype, setSelectedArchetype] = useState('hero')
  const [selectedPose, setSelectedPose] = useState('standing')
  const [customTraits, setCustomTraits] = useState('')

  // États de l'interface
  const [isGenerating, setIsGenerating] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<string>()

  // Hook d'upselling pour gérer les limites de personnages
  const { checkCharacterImageLimit, getLimitStatus, hasActiveSubscription } = useUpsellContext()
  const characterLimitStatus = getLimitStatus('character_images')
  const { refreshCredits } = useUserCredits()
  const { usage, limits, isLimitReached, refreshData } = useUserLimitsSimple()

  // Corriger automatiquement les problèmes d'accessibilité
  useFormAccessibility()

  // Utiliser les données du cache si disponibles, sinon charger
  useEffect(() => {
    if (charactersLoaded && cachedCharacters.length >= 0) {
      setCharacters(cachedCharacters)
    } else if (!charactersLoaded && !charactersLoading) {
      loadCharacters()
    }
  }, [cachedCharacters, charactersLoaded, charactersLoading, projectId])

  const loadCharacters = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/characters`)
      if (response.ok) {
        const data = await response.json()
        setCharacters(data.characters || [])
      }
    } catch (error) {
      console.error('Error loading characters:', error)
    }
  }



  const generateCharacter = async () => {
    if (!characterName.trim() || !characterDescription.trim()) {
      toast.error('Please fill in the character name and description')
      return
    }

    // Vérifier les limites avant de générer
    if (usage && limits && !hasActiveSubscription) {
      if (usage.character_images >= limits.character_images && limits.character_images !== -1) {
        toast.error(`Character limit reached (${usage.character_images}/${limits.character_images})`)
        return
      }
      if (usage.monthly_generations >= limits.monthly_generations && limits.monthly_generations !== -1) {
        toast.error(`Monthly limit reached (${usage.monthly_generations}/${limits.monthly_generations})`)
        return
      }
    }

    // Vérifier avec le système d'upselling
    if (!checkCharacterImageLimit()) {
      // La modale d'upselling s'affichera automatiquement
      return
    }

    setIsGenerating(true)

    try {
      // Construire le prompt optimisé
      const traits = customTraits.split(',').map(t => t.trim()).filter(Boolean)
      const selectedStyleData = MANGA_STYLES.find(s => s.value === selectedStyle)
      const selectedArchetypeData = CHARACTER_ARCHETYPES.find(a => a.value === selectedArchetype)
      const selectedPoseData = CHARACTER_POSES.find(p => p.value === selectedPose)

      const prompt = `${characterDescription}, ${selectedArchetypeData?.description}, ${selectedPoseData?.description}, ${traits.join(', ')}`

      const metadata = {
        name: characterName,
        style: selectedStyle,
        archetype: selectedArchetype,
        pose: selectedPose,
        traits: traits
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          type: 'character',
          optimizePrompt: true,
          projectId,
          metadata
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Character generated successfully!')

        // Rafraîchir les crédits et limites pour refléter la nouvelle utilisation
        await refreshCredits()
        await refreshData()

        // Ajouter le nouveau personnage à la liste
        const newCharacter: Character = {
          id: result.data.imageId,
          name: characterName,
          description: characterDescription,
          prompt: result.data.optimizedPrompt,
          image_url: result.data.imageUrl,
          traits,
          style: selectedStyle,
          created_at: new Date().toISOString(),
          metadata
        }

        setCharacters(prev => [newCharacter, ...prev])

        // Mettre à jour le cache si callback disponible
        onCharacterGenerated?.(newCharacter)

        // Réinitialiser le formulaire
        setCharacterName('')
        setCharacterDescription('')
        setCustomTraits('')

      } else {
        toast.error(result.error || 'Error during generation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Error generating character')
    } finally {
      setIsGenerating(false)
    }
  }



  const handleDownload = async (character: Character) => {
    if (!character.image_url) return

    try {
      const response = await fetch(character.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${character.name.replace(/\s+/g, '_')}_character.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Image downloaded')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Download error')
    }
  }

  const handleCharacterDelete = async (character: Character) => {
    if (!confirm(`Are you sure you want to delete the character "${character.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/characters/${character.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCharacters(prev => prev.filter(c => c.id !== character.id))

        // Update cache if callback available
        onCharacterDeleted?.(character.id)

        toast.success('Character deleted successfully!')
      } else {
        toast.error('Error during deletion')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast.error('Error during deletion')
    }
  }

  const handleCopyPrompt = (character: Character) => {
    navigator.clipboard.writeText(character.prompt)
    toast.success('Prompt copié dans le presse-papiers')
  }

  return (
    <div className="h-full flex bg-dark-900">
      {/* Zone principale - Formulaire de création */}
      <div className="flex-1 flex flex-col">
        {/* Formulaire de création - Sans header */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3">
            <div className="max-w-4xl mx-auto space-y-3">
            {/* Indicateur de limites unifié - Tout en haut */}
            <div className="mb-3">
              <ImageGenerationLimits
                type="characters"
                className="text-xs"
                showUpgradeButton={true}
                onUpgradeClick={() => checkCharacterImageLimit()}
              />
            </div>

            {/* Basic information */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-base font-semibold text-white flex items-center">
                  <User className="w-4 h-4 mr-2 text-primary-500" />
                  Basic information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Character name *
                  </label>
                  <input
                    type="text"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    placeholder="Ex: Akira Tanaka"
                    className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Manga style
                  </label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                  >
                    {MANGA_STYLES.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label} - {style.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-dark-200 mb-1">
                  Character description *
                </label>
                <textarea
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  placeholder="Describe the appearance, personality and characteristics..."
                  rows={2}
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none text-xs"
                />
              </div>
            </div>

            {/* Advanced configuration */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <h2 className="text-base font-semibold text-white mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-primary-500" />
                Advanced configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Archetype
                  </label>
                  <select
                    value={selectedArchetype}
                    onChange={(e) => setSelectedArchetype(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                  >
                    {CHARACTER_ARCHETYPES.map(archetype => (
                      <option key={archetype.value} value={archetype.value}>
                        {archetype.label} - {archetype.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Pose
                  </label>
                  <select
                    value={selectedPose}
                    onChange={(e) => setSelectedPose(e.target.value)}
                    className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                  >
                    {CHARACTER_POSES.map(pose => (
                      <option key={pose.value} value={pose.value}>
                        {pose.label} - {pose.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-medium text-dark-200 mb-1">
                  Custom traits (optional)
                </label>
                <input
                  type="text"
                  value={customTraits}
                  onChange={(e) => setCustomTraits(e.target.value)}
                  placeholder="Ex: blue hair, scar, glasses..."
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                />
              </div>
            </div>

            {/* Generation button */}
            <div className="text-center pb-3">
              <MangaButton
                onClick={generateCharacter}
                loading={isGenerating}
                size="sm"
                gradient
                icon={<Zap className="w-4 h-4" />}
                className="px-6 py-2"
                disabled={
                  !characterName.trim() ||
                  !characterDescription.trim() ||
                  (!hasActiveSubscription && characterLimitStatus?.isReached)
                }
              >
                {isGenerating
                  ? 'Generating...'
                  : (!hasActiveSubscription && characterLimitStatus?.isReached)
                    ? 'Limit reached - Upgrade to Senior plan'
                    : 'Generate character'
                }
              </MangaButton>


            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Galerie des personnages améliorée */}
      <div className="w-96 bg-dark-800 border-l border-dark-700">
        <ImprovedCharacterGallery
          characters={characters}
          selectedCharacter={selectedCharacter}
          onCharacterSelect={(character) => setSelectedCharacter(character.id)}
          onCharacterDelete={handleCharacterDelete}
          onCharacterDownload={handleDownload}
          onCopyPrompt={handleCopyPrompt}
        />
      </div>
    </div>
  )
}

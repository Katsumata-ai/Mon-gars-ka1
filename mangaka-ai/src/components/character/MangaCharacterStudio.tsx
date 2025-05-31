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

// Styles manga disponibles
const MANGA_STYLES = [
  { value: 'shonen', label: 'Shōnen', description: 'Style dynamique et énergique' },
  { value: 'shoujo', label: 'Shōjo', description: 'Style élégant et romantique' },
  { value: 'seinen', label: 'Seinen', description: 'Style mature et réaliste' },
  { value: 'josei', label: 'Josei', description: 'Style raffiné pour adultes' },
  { value: 'chibi', label: 'Chibi', description: 'Style mignon et déformé' },
  { value: 'realistic', label: 'Réaliste', description: 'Style semi-réaliste' }
]

// Archétypes de personnages
const CHARACTER_ARCHETYPES = [
  { value: 'hero', label: 'Héros', description: 'Protagoniste principal' },
  { value: 'villain', label: 'Antagoniste', description: 'Méchant principal' },
  { value: 'mentor', label: 'Mentor', description: 'Guide sage' },
  { value: 'sidekick', label: 'Acolyte', description: 'Compagnon fidèle' },
  { value: 'rival', label: 'Rival', description: 'Concurrent amical' },
  { value: 'love_interest', label: 'Intérêt romantique', description: 'Partenaire amoureux' },
  { value: 'comic_relief', label: 'Relief comique', description: 'Personnage drôle' },
  { value: 'mysterious', label: 'Mystérieux', description: 'Personnage énigmatique' }
]

// Poses suggérées
const CHARACTER_POSES = [
  { value: 'standing', label: 'Debout', description: 'Pose neutre debout' },
  { value: 'action', label: 'Action', description: 'Pose dynamique' },
  { value: 'portrait', label: 'Portrait', description: 'Buste ou visage' },
  { value: 'sitting', label: 'Assis', description: 'Position assise' },
  { value: 'fighting', label: 'Combat', description: 'Pose de combat' },
  { value: 'thinking', label: 'Réflexion', description: 'Pose pensive' }
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
      console.error('Erreur lors du chargement des personnages:', error)
    }
  }



  const generateCharacter = async () => {
    if (!characterName.trim() || !characterDescription.trim()) {
      toast.error('Veuillez remplir le nom et la description du personnage')
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
        toast.success('Personnage généré avec succès !')

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
        toast.error(result.error || 'Erreur lors de la génération')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Erreur lors de la génération du personnage')
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
      toast.success('Image téléchargée')
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      toast.error('Erreur lors du téléchargement')
    }
  }

  const handleCharacterDelete = async (character: Character) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le personnage "${character.name}" ?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/characters/${character.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCharacters(prev => prev.filter(c => c.id !== character.id))

        // Mettre à jour le cache si callback disponible
        onCharacterDeleted?.(character.id)

        toast.success('Personnage supprimé avec succès !')
      } else {
        toast.error('Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
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
            {/* Informations de base */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <h2 className="text-base font-semibold text-white mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-primary-500" />
                Informations de base
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Nom du personnage *
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
                    Style manga
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
                  Description du personnage *
                </label>
                <textarea
                  value={characterDescription}
                  onChange={(e) => setCharacterDescription(e.target.value)}
                  placeholder="Décrivez l'apparence, la personnalité et les caractéristiques..."
                  rows={2}
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none text-xs"
                />
              </div>
            </div>

            {/* Configuration avancée */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <h2 className="text-base font-semibold text-white mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-primary-500" />
                Configuration avancée
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Archétype
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
                  Traits personnalisés (optionnel)
                </label>
                <input
                  type="text"
                  value={customTraits}
                  onChange={(e) => setCustomTraits(e.target.value)}
                  placeholder="Ex: cheveux bleus, cicatrice, lunettes..."
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                />
              </div>
            </div>

            {/* Bouton de génération */}
            <div className="text-center pb-3">
              <MangaButton
                onClick={generateCharacter}
                loading={isGenerating}
                size="sm"
                gradient
                icon={<Zap className="w-4 h-4" />}
                className="px-6 py-2"
                disabled={!characterName.trim() || !characterDescription.trim()}
              >
                {isGenerating ? 'Génération...' : 'Générer le personnage'}
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

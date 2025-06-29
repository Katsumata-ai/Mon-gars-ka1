'use client'

import { useState, useEffect } from 'react'
import { ImageGenerationLimits } from '@/components/credits/ImageGenerationLimits'
import { useUpsellContext } from '@/components/upselling'
import { useUserLimitsSimple } from '@/hooks/useUserLimitsSimple'

import { createClient } from '@/lib/supabase/client'
import { Camera, Lightbulb, Palette, Plus, X, Loader2, Users, MapPin, Settings } from 'lucide-react'
import ImprovedSceneGallery from '@/components/scene/ImprovedSceneGallery'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface CharacterImage {
  id: string
  image_url: string
  original_prompt: string
  metadata: any
  created_at: string
}

interface DecorImage {
  id: string
  image_url: string
  original_prompt: string
  metadata: any
  created_at: string
}

interface Scene {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  characters: string[]
  decors: string[]
  camera_plan: string
  lighting: string
  ambiance: string
  details: string
  created_at: string
  metadata?: {
    [key: string]: unknown
  }
}

interface SceneResult {
  sceneId: string
  imageUrl: string
  originalPrompt: string
  optimizedPrompt: string
  analysisPrompt: string
  combinedAssets: {
    characters: CharacterImage[]
    decor: DecorImage
  }
  generationTimeMs: number
  creditsUsed: number
}

interface GeneratedScene {
  id: string
  image_url: string
  original_prompt: string
  optimized_prompt: string
  metadata: any
  character_ids: string[]
  decor_id: string
  scene_settings: any
  created_at: string
}

// Scene settings options
const CAMERA_ANGLES = [
  { value: 'close-up', label: 'Close-up', description: 'Focus on expressions', icon: '🔍' },
  { value: 'medium', label: 'Medium shot', description: 'Balanced view', icon: '👥' },
  { value: 'wide', label: 'Wide shot', description: 'Overview', icon: '🌅' },
  { value: 'bird-eye', label: 'Bird\'s eye view', description: 'Top-down perspective', icon: '🦅' },
  { value: 'low-angle', label: 'Low angle', description: 'Dramatic view', icon: '⬆️' },
  { value: 'high-angle', label: 'High angle', description: 'Dominant view', icon: '⬇️' }
]

const LIGHTING_OPTIONS = [
  { value: 'natural', label: 'Natural', description: 'Soft daylight', icon: '☀️' },
  { value: 'dramatic', label: 'Dramatic', description: 'Strong contrasts', icon: '⚡' },
  { value: 'soft', label: 'Soft', description: 'Diffused light', icon: '🌤️' },
  { value: 'golden', label: 'Golden', description: 'Golden hour', icon: '🌅' },
  { value: 'night', label: 'Night', description: 'Night ambiance', icon: '🌙' },
  { value: 'studio', label: 'Studio', description: 'Professional lighting', icon: '💡' }
]

const MOOD_OPTIONS = [
  { value: 'action', label: 'Action', description: 'Dynamic and intense', icon: '⚔️' },
  { value: 'romantic', label: 'Romantic', description: 'Tender and emotional', icon: '💕' },
  { value: 'dramatic', label: 'Dramatic', description: 'Emotional tension', icon: '🎭' },
  { value: 'peaceful', label: 'Peaceful', description: 'Calm and serene', icon: '🌸' },
  { value: 'mysterious', label: 'Mysterious', description: 'Enigmatic and suspenseful', icon: '🌙' },
  { value: 'comedic', label: 'Comedic', description: 'Light and amusing', icon: '😄' }
]

interface Scene {
  id: string
  name: string
  description: string
  prompt: string
  image_url?: string
  characters: string[]
  decors: string[]
  camera_plan: string
  lighting: string
  ambiance: string
  details: string
  created_at: string
  metadata?: {
    [key: string]: unknown
  }
}

interface ImprovedSceneCreatorProps {
  projectId?: string
  onSceneCreated?: (sceneData: SceneResult) => void
  onSceneGenerated?: (scene: any) => void
  // Props pour le cache (optionnelles pour compatibilité)
  cachedScenes?: Scene[]
  cachedCharacters?: CharacterImage[]
  cachedDecors?: DecorImage[]
  scenesLoaded?: boolean
  scenesLoading?: boolean
  charactersLoaded?: boolean
  decorsLoaded?: boolean
  onSceneDeleted?: (id: string) => void
}

export default function ImprovedSceneCreator({
  projectId,
  onSceneCreated,
  onSceneGenerated,
  cachedScenes,
  cachedCharacters,
  cachedDecors,
  scenesLoaded = false,
  scenesLoading = false,
  charactersLoaded = false,
  decorsLoaded = false,
  onSceneDeleted
}: ImprovedSceneCreatorProps = {}) {
  // États pour les sélections
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [selectedDecor, setSelectedDecor] = useState<string>('')
  const [sceneDescription, setSceneDescription] = useState('')
  const [cameraAngle, setCameraAngle] = useState('medium')
  const [lighting, setLighting] = useState('natural')
  const [mood, setMood] = useState('dramatic')
  const [additionalDetails, setAdditionalDetails] = useState('')

  // États pour les données
  const [characters, setCharacters] = useState<CharacterImage[]>([])
  const [decors, setDecors] = useState<DecorImage[]>([])
  const [generatedScenes, setGeneratedScenes] = useState<Scene[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingScenes, setLoadingScenes] = useState(false)
  const [selectedScene, setSelectedScene] = useState<string>('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState<SceneResult | null>(null)

  // SUPPRIMÉ: useAuth() - Vérification d'authentification redondante car l'utilisateur est déjà connecté pour accéder à cette page

  // Hook d'upselling pour gérer les limites de scènes (copié du système personnages/décors)
  const { checkSceneGenerationLimit, getLimitStatus, hasActiveSubscription } = useUpsellContext()
  const sceneLimitStatus = getLimitStatus('scene_generation')
  const { usage, limits, isLimitReached, refreshData } = useUserLimitsSimple()

  const supabase = createClient()

  // Utiliser les données en cache (filtrées par project_id) au lieu de faire des requêtes directes
  useEffect(() => {
    if (cachedCharacters && charactersLoaded) {
      // Cache personnages initialisé
      setCharacters(cachedCharacters)
    }
  }, [cachedCharacters, charactersLoaded])

  useEffect(() => {
    if (cachedDecors && decorsLoaded) {
      // Cache décors initialisé
      setDecors(cachedDecors)
    }
  }, [cachedDecors, decorsLoaded])

  useEffect(() => {
    if (cachedScenes && scenesLoaded) {
      // Cache scènes initialisé
      setGeneratedScenes(cachedScenes)
    }
  }, [cachedScenes, scenesLoaded])

  // Fonctions de gestion des scènes
  const handleSceneSelect = (scene: Scene) => {
    setSelectedScene(scene.id)
  }

  const handleSceneDelete = async (scene: Scene) => {
    if (!confirm(`Are you sure you want to delete the scene "${scene.name}"?`)) return

    try {
      // Use atomic deletion API (database + storage)
      const response = await fetch(`/api/projects/${projectId}/scenes/${scene.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error during deletion')
      }

      // Update cache and local state
      if (onSceneDeleted) {
        onSceneDeleted(scene.id)
      }
      setGeneratedScenes(prev => prev.filter(s => s.id !== scene.id))

      toast.success('🗑️ Scene deleted successfully!', {
        duration: 3000,
        icon: '✅'
      })
      setSuccess('🗑️ Scene deleted successfully (database + file)')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('Scene deletion error:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error deleting scene'
      setError(errorMessage)
      toast.error(`❌ Deletion error: ${errorMessage}`, {
        duration: 5000
      })
    }
  }

  const handleSceneDownload = (scene: Scene) => {
    if (scene.image_url) {
      const link = document.createElement('a')
      link.href = scene.image_url
      link.download = `${scene.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('📥 Image downloaded!', {
        duration: 2000,
        icon: '✅'
      })
    }
  }

  const handleCopyPrompt = (scene: Scene) => {
    navigator.clipboard.writeText(scene.prompt)
    toast.success('📋 Prompt copié !', {
      duration: 2000,
      icon: '✅'
    })
  }

  const handleCharacterSelect = (characterId: string) => {
    if (selectedCharacters.includes(characterId)) {
      setSelectedCharacters(prev => prev.filter(id => id !== characterId))
    } else if (selectedCharacters.length < 3) {
      setSelectedCharacters(prev => [...prev, characterId])
    }
  }

  const handleDecorSelect = (decorId: string) => {
    setSelectedDecor(decorId === selectedDecor ? '' : decorId)
  }

  const handleGenerateScene = async () => {
    // Validation with toast notifications
    if (selectedCharacters.length === 0) {
      const errorMsg = 'Please select at least one character'
      setError(errorMsg)
      toast.error(`❌ ${errorMsg}`, { duration: 4000 })
      return
    }

    if (!selectedDecor) {
      const errorMsg = 'Please select a background'
      setError(errorMsg)
      toast.error(`❌ ${errorMsg}`, { duration: 4000 })
      return
    }

    if (!sceneDescription.trim()) {
      const errorMsg = 'Please describe the scene'
      setError(errorMsg)
      toast.error(`❌ ${errorMsg}`, { duration: 4000 })
      return
    }

    // SUPPRIMÉ: Vérification d'authentification redondante
    // L'utilisateur est déjà authentifié pour accéder à la page d'édition

    // Vérifier les limites avant de générer (système unifié)
    if (usage && limits && !hasActiveSubscription) {
      if (usage.scene_generation >= limits.scene_generation && limits.scene_generation !== -1) {
        toast.error(`Scene limit reached (${usage.scene_generation}/${limits.scene_generation})`)
        return
      }
      if (usage.monthly_generations >= limits.monthly_generations && limits.monthly_generations !== -1) {
        toast.error(`Monthly limit reached (${usage.monthly_generations}/${limits.monthly_generations})`)
        return
      }
    }

    // SUPPRIMÉ: Vérification obsolète des "comic panels"
    // Les utilisateurs premium ont un accès illimité aux scènes
    // La vérification des limites se fait maintenant uniquement via le système unifié ci-dessus

    setLoading(true)
    setError('')
    setSuccess('')
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Vous devez être connecté pour créer des scènes')
        return
      }

      const response = await fetch('/api/combine-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          selectedCharacters,
          selectedDecor,
          sceneDescription: sceneDescription.trim(),
          cameraAngle,
          lighting,
          mood,
          additionalDetails: additionalDetails.trim(),
          projectId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la scène')
      }

      if (data.success) {
        // Immediate success notification
        toast.success('🎬 Scene generated successfully!', {
          duration: 4000,
          icon: '🎉'
        })

        setResult(data.data)

        // Rafraîchir les limites pour refléter la nouvelle utilisation
        await refreshData()

        // Créer la nouvelle scène pour l'affichage immédiat
        const newScene: Scene = {
          id: data.data.sceneId,
          name: (data.data.originalPrompt || '').slice(0, 40) || 'Unnamed scene',
          description: data.data.originalPrompt || '',
          prompt: data.data.optimizedPrompt || data.data.originalPrompt || '',
          image_url: data.data.imageUrl,
          characters: selectedCharacters,
          decors: selectedDecor ? [selectedDecor] : [],
          camera_plan: cameraAngle,
          lighting: lighting,
          ambiance: mood,
          details: additionalDetails,
          created_at: new Date().toISOString(),
          metadata: {}
        }

        console.log('🎬 Nouvelle scène créée:', newScene)

        // TOUJOURS ajouter la scène à la liste locale pour affichage immédiat
        setGeneratedScenes(prev => {
          console.log('📝 Mise à jour de la liste des scènes:', prev.length, '->', prev.length + 1)
          return [newScene, ...prev]
        })

        // Notifier le cache si callback disponible
        if (onSceneGenerated) {
          onSceneGenerated(newScene)
        }

        // Notifier le parent si callback disponible
        onSceneCreated?.(data.data)

        // Display success message
        setSuccess('🎉 Scene generated successfully! It now appears in the gallery.')

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000)

        // Don't reset form to allow variations
        // setSelectedCharacters([])
        // setSelectedDecor('')
        // setSceneDescription('')
        // setAdditionalDetails('')
      } else {
        throw new Error(data.error || 'Scene creation failed')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      toast.error(`❌ Error: ${errorMessage}`, {
        duration: 5000
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCharacterData = characters.filter(char => selectedCharacters.includes(char.id))
  const selectedDecorData = decors.find(decor => decor.id === selectedDecor)

  // État du bouton de génération (copié du système personnages/décors)
  const isButtonDisabled = loading ||
    selectedCharacters.length === 0 ||
    !selectedDecor ||
    !sceneDescription.trim() ||
    (!hasActiveSubscription && sceneLimitStatus?.isReached)

  return (
    <div className="flex h-screen bg-dark-900">
      {/* Formulaire principal - Prend tout l'espace disponible */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar-vertical">
        {error && (
          <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Indicateur de limites */}
        <div className="mb-3">
          <ImageGenerationLimits
            type="scenes"
            className="text-xs"
            showUpgradeButton={true}
          />
        </div>

        {/* Basic information section */}
        <div className="bg-dark-800 rounded-lg p-3 mb-3">
          <div className="flex items-center mb-2">
            <Camera className="w-4 h-4 mr-2 text-primary-500" />
            <h2 className="text-lg font-bold">Basic information</h2>
          </div>

          <div className="space-y-3">
            {/* Scene description */}
            <div>
              <label className="block text-xs font-medium mb-1">
                Scene description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={sceneDescription}
                onChange={(e) => setSceneDescription(e.target.value)}
                placeholder="Describe what happens in the scene..."
                className="w-full px-2 py-1.5 text-sm bg-dark-700 border border-dark-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors resize-none custom-scrollbar-vertical"
                rows={2}
                maxLength={200}
              />
              <div className="text-right text-xs text-dark-400 mt-0.5">
                {sceneDescription.length}/200
              </div>
            </div>

            {/* Character selection */}
            <div>
              <label className="block text-xs font-medium mb-2">
                Characters (max 3) <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar-horizontal pb-2" style={{ scrollbarWidth: 'thin' }}>
                {characters.map((character) => {
                  const isSelected = selectedCharacters.includes(character.id)
                  const selectionIndex = selectedCharacters.indexOf(character.id)

                  return (
                    <div
                      key={character.id}
                      className={cn(
                        'group relative bg-dark-800 overflow-hidden border-2 transition-all duration-200 cursor-pointer flex-shrink-0',
                        isSelected
                          ? 'border-primary-500'
                          : 'border-dark-600 hover:border-primary-400'
                      )}
                      style={{ width: '110px', height: '110px' }}
                      onClick={() => handleCharacterSelect(character.id)}
                    >
                      <img
                        src={character.image_url}
                        alt={character.original_prompt}
                        className="w-full h-full object-cover"
                        style={{
                          imageRendering: 'auto'
                        }}
                        loading="lazy"
                      />

                      {/* Overlay de sélection simple */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary-500/30 border-2 border-primary-500">
                          <div className="absolute top-2 right-2 w-6 h-6 bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                            {selectionIndex + 1}
                          </div>
                        </div>
                      )}

                      {/* Hover simple */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="text-white text-sm font-medium">
                          {isSelected ? 'Selected' : 'Select'}
                        </div>
                      </div>

                      {/* Nom en bas */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                        <div className="text-white text-xs font-medium truncate">
                          {(character.original_prompt || '').slice(0, 16)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {selectedCharacterData.length > 0 && (
                <div className="mt-2 p-2 bg-dark-600/30 rounded border border-dark-600/50">
                  <div className="text-xs text-dark-300 font-medium mb-1">Sélectionnés ({selectedCharacterData.length}/3) :</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCharacterData.map((char, index) => (
                      <span key={char.id} className="inline-flex items-center gap-1 bg-primary-500/20 text-primary-300 text-xs px-1.5 py-0.5 rounded border border-primary-500/30">
                        <span className="w-3 h-3 bg-primary-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        {(char.original_prompt || '').slice(0, 10)}...
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Background selection */}
            <div>
              <label className="block text-xs font-medium mb-2">
                Background <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar-horizontal pb-2" style={{ scrollbarWidth: 'thin' }}>
                {decors.map((decor) => {
                  const isSelected = selectedDecor === decor.id

                  return (
                    <div
                      key={decor.id}
                      className={cn(
                        'group relative bg-dark-800 overflow-hidden border-2 transition-all duration-200 cursor-pointer flex-shrink-0',
                        isSelected
                          ? 'border-accent-500'
                          : 'border-dark-600 hover:border-accent-400'
                      )}
                      style={{ width: '130px', height: '110px' }}
                      onClick={() => handleDecorSelect(decor.id)}
                    >
                      <img
                        src={decor.image_url}
                        alt={decor.original_prompt}
                        className="w-full h-full object-cover"
                        style={{
                          imageRendering: 'auto'
                        }}
                        loading="lazy"
                      />

                      {/* Overlay de sélection simple */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-accent-500/30 border-2 border-accent-500">
                          <div className="absolute top-2 right-2 w-6 h-6 bg-accent-500 text-white flex items-center justify-center text-sm font-bold">
                            ✓
                          </div>
                        </div>
                      )}

                      {/* Hover simple */}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="text-white text-sm font-medium">
                          {isSelected ? 'Selected' : 'Select'}
                        </div>
                      </div>

                      {/* Nom en bas */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
                        <div className="text-white text-xs font-medium truncate">
                          {(decor.original_prompt || '').slice(0, 18)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {selectedDecorData && (
                <div className="mt-2 p-2 bg-dark-600/30 rounded border border-dark-600/50">
                  <div className="text-xs text-dark-300 font-medium mb-1">Décor sélectionné :</div>
                  <div className="inline-flex items-center gap-1 bg-accent-500/20 text-accent-300 text-xs px-1.5 py-0.5 rounded border border-accent-500/30">
                    <span className="w-3 h-3 bg-accent-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    {(selectedDecorData.original_prompt || '').slice(0, 20)}...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Advanced configuration section */}
        <div className="bg-dark-800 rounded-lg p-3 mb-3">
          <div className="flex items-center mb-2">
            <Settings className="w-4 h-4 mr-2 text-primary-500" />
            <h2 className="text-lg font-bold">Advanced configuration</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            {/* Camera plan */}
            <div>
              <label className="block text-xs font-medium mb-0.5">Camera</label>
              <select
                value={cameraAngle}
                onChange={(e) => setCameraAngle(e.target.value)}
                className="w-full px-1.5 py-1 text-xs bg-dark-700 border border-dark-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                {CAMERA_ANGLES.map((angle) => (
                  <option key={angle.value} value={angle.value}>
                    {angle.icon} {angle.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Lighting */}
            <div>
              <label className="block text-xs font-medium mb-0.5">Lighting</label>
              <select
                value={lighting}
                onChange={(e) => setLighting(e.target.value)}
                className="w-full px-1.5 py-1 text-xs bg-dark-700 border border-dark-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                {LIGHTING_OPTIONS.map((light) => (
                  <option key={light.value} value={light.value}>
                    {light.icon} {light.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mood */}
            <div>
              <label className="block text-xs font-medium mb-0.5">Mood</label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full px-1.5 py-1 text-xs bg-dark-700 border border-dark-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors"
              >
                {MOOD_OPTIONS.map((moodOption) => (
                  <option key={moodOption.value} value={moodOption.value}>
                    {moodOption.icon} {moodOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="block text-xs font-medium mb-0.5">Details (optional)</label>
            <textarea
              value={additionalDetails}
              onChange={(e) => setAdditionalDetails(e.target.value)}
              placeholder="Specific details..."
              className="w-full px-1.5 py-1 text-xs bg-dark-700 border border-dark-600 rounded focus:ring-1 focus:ring-primary-500 focus:border-transparent transition-colors resize-none custom-scrollbar-vertical"
              rows={1}
              maxLength={100}
            />
            <div className="text-right text-xs text-dark-400 mt-0.5">
              {additionalDetails.length}/100
            </div>
          </div>

          {/* Indicateur de statut */}
          {isButtonDisabled && !loading && (
            <div className="text-center mb-2">
              <div className="text-xs text-dark-400 bg-dark-700 px-3 py-1 rounded-full inline-block">
                {selectedCharacters.length === 0 && "Select characters"}
                {selectedCharacters.length > 0 && !selectedDecor && "Select a background"}
                {selectedCharacters.length > 0 && selectedDecor && !sceneDescription.trim() && "Describe the scene"}
                {(!hasActiveSubscription && sceneLimitStatus?.isReached) && "Limit reached - Upgrade to Senior plan"}
              </div>
            </div>
          )}

          {/* Bouton de génération */}
          <div className="text-center pt-4 pb-2">
            <button
              onClick={handleGenerateScene}
              disabled={isButtonDisabled}
              className="bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 manga-shadow-lg text-sm transform hover:scale-105 disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span>Génération (~30 sec)...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">🎨</span>
                  <span>
                    {(!hasActiveSubscription && sceneLimitStatus?.isReached)
                      ? 'Limit reached - Upgrade to Senior plan'
                      : 'Generate Scene'
                    }
                  </span>
                </div>
              )}
            </button>


          </div>
        </div>

        {/* Espace supplémentaire en bas pour assurer la visibilité complète du bouton */}
        <div className="h-20"></div>
      </div>

      {/* Sidebar - Galerie des scènes améliorée */}
      <div className="w-96 bg-dark-800 border-l border-dark-700">
        <ImprovedSceneGallery
          scenes={generatedScenes}
          selectedScene={selectedScene}
          onSceneSelect={handleSceneSelect}
          onSceneDelete={handleSceneDelete}
          onSceneDownload={handleSceneDownload}
          onCopyPrompt={handleCopyPrompt}
        />
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Camera,
  Users,
  Mountain,
  Plus,
  Wand2,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Download,
  Eye,
  Settings,
  Zap,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import { cn } from '@/lib/utils'

interface Character {
  id: string
  name: string
  image_url: string
}

interface Background {
  id: string
  name: string
  image_url: string
}

interface Scene {
  id: string
  name: string
  description: string
  characters: Character[]
  background: Background | null
  composition: string
  mood: string
  shotType: string
  image_url?: string
  created_at: string
}

interface SceneComposerPanelProps {
  projectId: string
  onSceneGenerated?: (scene: Scene) => void
}

const SHOT_TYPES = [
  { value: 'close-up', label: 'Gros plan', description: 'Focus sur le visage/détail' },
  { value: 'medium', label: 'Plan moyen', description: 'Personnage en buste' },
  { value: 'full', label: 'Plan large', description: 'Personnage entier' },
  { value: 'wide', label: 'Plan d\'ensemble', description: 'Vue d\'ensemble de la scène' },
  { value: 'bird-eye', label: 'Vue aérienne', description: 'Vue du dessus' },
  { value: 'low-angle', label: 'Contre-plongée', description: 'Vue du bas vers le haut' }
]

const COMPOSITION_STYLES = [
  { value: 'centered', label: 'Centré', description: 'Composition équilibrée' },
  { value: 'rule-of-thirds', label: 'Règle des tiers', description: 'Composition dynamique' },
  { value: 'diagonal', label: 'Diagonale', description: 'Composition en mouvement' },
  { value: 'symmetrical', label: 'Symétrique', description: 'Composition formelle' },
  { value: 'asymmetrical', label: 'Asymétrique', description: 'Composition moderne' }
]

const MOOD_OPTIONS = [
  { value: 'action', label: 'Action', color: 'text-red-400' },
  { value: 'romantic', label: 'Romantique', color: 'text-pink-400' },
  { value: 'dramatic', label: 'Dramatique', color: 'text-purple-400' },
  { value: 'peaceful', label: 'Paisible', color: 'text-green-400' },
  { value: 'mysterious', label: 'Mystérieux', color: 'text-blue-400' },
  { value: 'comedic', label: 'Comique', color: 'text-yellow-400' }
]

export default function SceneComposerPanel({
  projectId,
  onSceneGenerated
}: SceneComposerPanelProps) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [backgrounds, setBackgrounds] = useState<Background[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedScene, setSelectedScene] = useState<string | null>(null)

  // Formulaire de composition
  const [sceneName, setSceneName] = useState('')
  const [sceneDescription, setSceneDescription] = useState('')
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([])
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null)
  const [selectedShotType, setSelectedShotType] = useState('medium')
  const [selectedComposition, setSelectedComposition] = useState('rule-of-thirds')
  const [selectedMood, setSelectedMood] = useState('action')
  const [customPrompt, setCustomPrompt] = useState('')

  // UI State
  const [showCharacters, setShowCharacters] = useState(true)
  const [showBackgrounds, setShowBackgrounds] = useState(true)

  const { credits, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  useEffect(() => {
    loadAssets()
    loadScenes()
  }, [projectId])

  const loadAssets = async () => {
    try {
      // Charger les personnages
      const { data: charactersData } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('image_type', 'character')
        .order('created_at', { ascending: false })

      // Charger les décors
      const { data: backgroundsData } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('image_type', 'background')
        .order('created_at', { ascending: false })

      setCharacters((charactersData || []).map(item => ({
        id: item.id,
        name: item.metadata?.name || 'Personnage',
        image_url: item.image_url
      })))

      setBackgrounds((backgroundsData || []).map(item => ({
        id: item.id,
        name: item.metadata?.name || 'Décor',
        image_url: item.image_url
      })))
    } catch (error) {
      console.error('Erreur lors du chargement des assets:', error)
    }
  }

  const loadScenes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('project_id', projectId)
        .eq('image_type', 'scene')
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedScenes = (data || []).map(item => ({
        id: item.id,
        name: item.metadata?.name || 'Scène sans nom',
        description: item.original_prompt,
        characters: item.metadata?.characters || [],
        background: item.metadata?.background || null,
        composition: item.metadata?.composition || 'rule-of-thirds',
        mood: item.metadata?.mood || 'action',
        shotType: item.metadata?.shotType || 'medium',
        image_url: item.image_url,
        created_at: item.created_at
      }))

      setScenes(transformedScenes)
    } catch (error) {
      console.error('Erreur lors du chargement des scènes:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateScene = async () => {
    if (!sceneName.trim() || !sceneDescription.trim()) {
      alert('Veuillez remplir le nom et la description de la scène')
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

      // Construire le prompt avec les éléments sélectionnés
      const selectedCharacterObjects = characters.filter(c => selectedCharacters.includes(c.id))
      const selectedBackgroundObject = backgrounds.find(b => b.id === selectedBackground)

      const charactersText = selectedCharacterObjects.length > 0
        ? `featuring ${selectedCharacterObjects.map(c => c.name).join(', ')}`
        : ''

      const backgroundText = selectedBackgroundObject
        ? `in ${selectedBackgroundObject.name}`
        : ''

      const shotTypeInfo = SHOT_TYPES.find(s => s.value === selectedShotType)
      const compositionInfo = COMPOSITION_STYLES.find(c => c.value === selectedComposition)
      const moodInfo = MOOD_OPTIONS.find(m => m.value === selectedMood)

      const finalPrompt = customPrompt ||
        `${sceneDescription} ${charactersText} ${backgroundText}, ${shotTypeInfo?.label}, ${compositionInfo?.label} composition, ${moodInfo?.label} mood, manga scene, high quality illustration, detailed artwork`

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          type: 'scene',
          optimizePrompt: true,
          projectId,
          metadata: {
            name: sceneName,
            characters: selectedCharacterObjects,
            background: selectedBackgroundObject,
            composition: selectedComposition,
            mood: selectedMood,
            shotType: selectedShotType
          }
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la génération')
      }

      if (result.success) {
        const newScene: Scene = {
          id: result.data.imageId,
          name: sceneName,
          description: sceneDescription,
          characters: selectedCharacterObjects,
          background: selectedBackgroundObject || null,
          composition: selectedComposition,
          mood: selectedMood,
          shotType: selectedShotType,
          image_url: result.data.imageUrl,
          created_at: new Date().toISOString()
        }

        setScenes([newScene, ...scenes])
        onSceneGenerated?.(newScene)
        await refreshCredits()

        // Reset form
        setSceneName('')
        setSceneDescription('')
        setSelectedCharacters([])
        setSelectedBackground(null)
        setCustomPrompt('')
      }
    } catch (error) {
      console.error('Erreur lors de la génération:', error)
      alert('Erreur lors de la génération de la scène')
    } finally {
      setGenerating(false)
    }
  }

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    )
  }

  return (
    <div className="h-full flex bg-dark-900 overflow-hidden">
      {/* Compositeur - Sidebar */}
      <div className="w-96 bg-dark-800 border-r border-dark-700 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Compositeur de Scènes</h2>
              <p className="text-dark-300 text-sm">Assemblez vos éléments</p>
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

        {/* Formulaire de composition - Zone Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Nom de la scène */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nom de la scène
            </label>
            <input
              type="text"
              value={sceneName}
              onChange={(e) => setSceneName(e.target.value)}
              placeholder="Ex: Combat final, Première rencontre..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description de la scène
            </label>
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Décrivez l'action, l'émotion, l'atmosphère..."
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>

          {/* Sélection des personnages */}
          <div>
            <button
              onClick={() => setShowCharacters(!showCharacters)}
              className="flex items-center justify-between w-full text-sm font-medium text-white mb-2"
            >
              <span>Personnages ({selectedCharacters.length} sélectionnés)</span>
              {showCharacters ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showCharacters && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {characters.length === 0 ? (
                  <p className="text-dark-400 text-sm">Aucun personnage disponible</p>
                ) : (
                  characters.map((character) => (
                    <div
                      key={character.id}
                      onClick={() => toggleCharacterSelection(character.id)}
                      className={cn(
                        'flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors',
                        selectedCharacters.includes(character.id)
                          ? 'bg-primary-500/20 border border-primary-500/50'
                          : 'bg-dark-700 hover:bg-dark-600'
                      )}
                    >
                      <img
                        src={character.image_url}
                        alt={character.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-white text-sm">{character.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sélection du décor */}
          <div>
            <button
              onClick={() => setShowBackgrounds(!showBackgrounds)}
              className="flex items-center justify-between w-full text-sm font-medium text-white mb-2"
            >
              <span>Décor {selectedBackground && '(1 sélectionné)'}</span>
              {showBackgrounds ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>

            {showBackgrounds && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {backgrounds.length === 0 ? (
                  <p className="text-dark-400 text-sm">Aucun décor disponible</p>
                ) : (
                  backgrounds.map((background) => (
                    <div
                      key={background.id}
                      onClick={() => setSelectedBackground(
                        selectedBackground === background.id ? null : background.id
                      )}
                      className={cn(
                        'flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors',
                        selectedBackground === background.id
                          ? 'bg-purple-500/20 border border-purple-500/50'
                          : 'bg-dark-700 hover:bg-dark-600'
                      )}
                    >
                      <img
                        src={background.image_url}
                        alt={background.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                      <span className="text-white text-sm">{background.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Type de plan */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Type de plan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SHOT_TYPES.map((shot) => (
                <button
                  key={shot.value}
                  onClick={() => setSelectedShotType(shot.value)}
                  className={cn(
                    'p-2 rounded-lg border transition-colors text-left',
                    selectedShotType === shot.value
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <div className="font-medium text-xs">{shot.label}</div>
                  <div className="text-xs opacity-75">{shot.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Composition */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Composition
            </label>
            <select
              value={selectedComposition}
              onChange={(e) => setSelectedComposition(e.target.value)}
              className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {COMPOSITION_STYLES.map((comp) => (
                <option key={comp.value} value={comp.value}>
                  {comp.label} - {comp.description}
                </option>
              ))}
            </select>
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
                      ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                      : 'border-dark-600 bg-dark-700 text-dark-200 hover:border-dark-500'
                  )}
                >
                  <span className={cn('font-medium text-sm', mood.color)}>{mood.label}</span>
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
            onClick={generateScene}
            loading={generating}
            disabled={!sceneName.trim() || !sceneDescription.trim()}
            fullWidth
            size="lg"
            icon={<Wand2 className="w-5 h-5" />}
            gradient
          >
            {generating ? 'Composition en cours...' : 'Composer la Scène'}
          </MangaButton>
        </div>
      </div>

      {/* Galerie des scènes - Zone Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-dark-700 flex-shrink-0">
          <h3 className="text-2xl font-bold text-white mb-2">Mes Scènes</h3>
          <p className="text-dark-400">
            {scenes.length} scène{scenes.length !== 1 ? 's' : ''} composée{scenes.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-dark-800 rounded-xl p-6 animate-pulse">
                <div className="w-full h-64 bg-dark-700 rounded-lg mb-4" />
                <div className="h-4 bg-dark-700 rounded mb-2" />
                <div className="h-3 bg-dark-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-12">
            <Camera className="w-16 h-16 text-dark-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune scène composée</h3>
            <p className="text-dark-400 mb-6">Créez des personnages et décors d'abord, puis composez vos scènes</p>
            <MangaButton
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setSceneName('Première scène')
                setSceneDescription('Une scène d\'introduction')
              }}
            >
              Composer ma première scène
            </MangaButton>
          </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scenes.map((scene) => (
              <div
                key={scene.id}
                className={cn(
                  'bg-dark-800 rounded-xl p-6 cursor-pointer transition-all hover:bg-dark-700',
                  selectedScene === scene.id && 'ring-2 ring-orange-500'
                )}
                onClick={() => setSelectedScene(scene.id)}
              >
                {scene.image_url && (
                  <img
                    src={scene.image_url}
                    alt={scene.name}
                    className="w-full h-64 object-cover rounded-lg mb-4 bg-dark-700"
                  />
                )}
                <h4 className="font-semibold text-white mb-2">{scene.name}</h4>
                <p className="text-sm text-dark-300 mb-4 line-clamp-2">
                  {scene.description}
                </p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded">
                    {SHOT_TYPES.find(s => s.value === scene.shotType)?.label || scene.shotType}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    MOOD_OPTIONS.find(m => m.value === scene.mood)?.color || 'text-dark-400'
                  )}>
                    {MOOD_OPTIONS.find(m => m.value === scene.mood)?.label || scene.mood}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-1">
                    {scene.characters.slice(0, 3).map((char, index) => (
                      <img
                        key={index}
                        src={char.image_url}
                        alt={char.name}
                        className="w-6 h-6 rounded-full object-cover border border-dark-600"
                        title={char.name}
                      />
                    ))}
                    {scene.characters.length > 3 && (
                      <div className="w-6 h-6 rounded-full bg-dark-600 flex items-center justify-center text-xs text-dark-300">
                        +{scene.characters.length - 3}
                      </div>
                    )}
                  </div>
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

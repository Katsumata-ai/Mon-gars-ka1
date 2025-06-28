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
  Mountain,
  Shirt,
  Eye,
  Zap,
  ImageIcon,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import MangaButton from '@/components/ui/MangaButton'
import ImprovedDecorGallery from './ImprovedDecorGallery'
import { ImageGenerationLimits } from '@/components/credits/ImageGenerationLimits'
import { useGenerationLimits } from '@/hooks/useGenerationLimits'
import toast from 'react-hot-toast'

interface Decor {
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

interface MangaDecorStudioProps {
  projectId: string
  cachedDecors?: Decor[]
  decorsLoaded?: boolean
  decorsLoading?: boolean
  onDecorGenerated?: (decor: Decor) => void
  onDecorDeleted?: (id: string) => void
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

// Background archetypes
const DECOR_ARCHETYPES = [
  { value: 'urban', label: 'Urban', description: 'City environment' },
  { value: 'nature', label: 'Nature', description: 'Natural landscape' },
  { value: 'interior', label: 'Interior', description: 'Indoor space' },
  { value: 'fantasy', label: 'Fantasy', description: 'Imaginary world' },
  { value: 'school', label: 'School', description: 'School environment' },
  { value: 'traditional', label: 'Traditional', description: 'Japanese architecture' },
  { value: 'modern', label: 'Modern', description: 'Contemporary style' },
  { value: 'historical', label: 'Historical', description: 'Ancient era' }
]

// Suggested poses
const DECOR_POSES = [
  { value: 'wide', label: 'Wide view', description: 'Wide shot' },
  { value: 'close', label: 'Close view', description: 'Close-up shot' },
  { value: 'aerial', label: 'Aerial view', description: 'Top-down view' },
  { value: 'ground', label: 'Ground view', description: 'Normal perspective' },
  { value: 'dramatic', label: 'Dramatic view', description: 'Dynamic angle' },
  { value: 'peaceful', label: 'Peaceful view', description: 'Serene angle' }
]

export default function MangaDecorStudio({
  projectId,
  cachedDecors = [],
  decorsLoaded = false,
  decorsLoading = false,
  onDecorGenerated,
  onDecorDeleted
}: MangaDecorStudioProps) {
  // États du formulaire
  const [decorName, setDecorName] = useState('')
  const [decorDescription, setDecorDescription] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('shonen')
  const [selectedArchetype, setSelectedArchetype] = useState('urban')
  const [selectedPose, setSelectedPose] = useState('wide')
  const [customTraits, setCustomTraits] = useState('')

  // États de l'interface
  const [isGenerating, setIsGenerating] = useState(false)
  const [decors, setDecors] = useState<Decor[]>([])
  const [selectedDecor, setSelectedDecor] = useState<string>()

  // Hook to manage generation limits
  const { canGenerate, incrementGeneration, checkLimitsAndShowUpsell } = useGenerationLimits()

  // Corriger automatiquement les problèmes d'accessibilité
  useFormAccessibility()

  // Utiliser les données du cache si disponibles, sinon charger
  useEffect(() => {
    if (decorsLoaded && cachedDecors.length >= 0) {
      setDecors(cachedDecors)
    } else if (!decorsLoaded && !decorsLoading) {
      loadDecors()
    }
  }, [cachedDecors, decorsLoaded, decorsLoading, projectId])

  const loadDecors = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/decors`)
      if (response.ok) {
        const data = await response.json()
        setDecors(data.decors || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement des décors:', error)
    }
  }

  const generateDecor = async () => {
    if (!decorName.trim() || !decorDescription.trim()) {
      toast.error('Veuillez remplir le nom et la description du décor')
      return
    }

    // Check limits before generation
    if (!(await checkLimitsAndShowUpsell('decors'))) {
      return
    }

    setIsGenerating(true)

    try {
      // Construire le prompt optimisé
      const traits = customTraits.split(',').map(t => t.trim()).filter(Boolean)
      const selectedStyleData = MANGA_STYLES.find(s => s.value === selectedStyle)
      const selectedArchetypeData = DECOR_ARCHETYPES.find(a => a.value === selectedArchetype)
      const selectedPoseData = DECOR_POSES.find(p => p.value === selectedPose)

      const prompt = `${decorDescription}, ${selectedArchetypeData?.description}, ${selectedPoseData?.description}, ${traits.join(', ')}`

      const metadata = {
        name: decorName,
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
          type: 'background',
          optimizePrompt: true,
          projectId,
          metadata
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Background generated successfully!')

        // Ajouter le nouveau décor à la liste
        const newDecor: Decor = {
          id: result.data.imageId,
          name: decorName,
          description: decorDescription,
          prompt: result.data.optimizedPrompt,
          image_url: result.data.imageUrl,
          traits,
          style: selectedStyle,
          created_at: new Date().toISOString(),
          metadata
        }

        setDecors(prev => [newDecor, ...prev])

        // Mettre à jour le cache si callback disponible
        onDecorGenerated?.(newDecor)

        // Réinitialiser le formulaire
        setDecorName('')
        setDecorDescription('')
        setCustomTraits('')

      } else {
        toast.error(result.error || 'Error during generation')
      }
    } catch (error) {
      console.error('Erreur:', error)
      toast.error('Error generating background')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (decor: Decor) => {
    if (!decor.image_url) return

    try {
      const response = await fetch(decor.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${decor.name.replace(/\s+/g, '_')}_decor.png`
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

  const handleDecorDelete = async (decor: Decor) => {
    if (!confirm(`Are you sure you want to delete the background "${decor.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/decors/${decor.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDecors(prev => prev.filter(c => c.id !== decor.id))

        // Update cache if callback available
        onDecorDeleted?.(decor.id)

        toast.success('Background deleted successfully!')
      } else {
        toast.error('Error during deletion')
      }
    } catch (error) {
      console.error('Deletion error:', error)
      toast.error('Error during deletion')
    }
  }

  const handleCopyPrompt = (decor: Decor) => {
    navigator.clipboard.writeText(decor.prompt)
    toast.success('Prompt copied to clipboard')
  }

  return (
    <div className="h-full flex bg-dark-900">
      {/* Zone principale - Formulaire de création */}
      <div className="flex-1 flex flex-col">
        {/* Formulaire de création - Sans header */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-3">
            <div className="max-w-4xl mx-auto space-y-3">
            {/* Indicateur de limites unifié */}
            <div className="mb-3">
              <ImageGenerationLimits
                type="decors"
                className="text-xs"
                showUpgradeButton={true}
              />
            </div>

            {/* Basic information */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <h2 className="text-base font-semibold text-white mb-2 flex items-center">
                <Mountain className="w-4 h-4 mr-2 text-primary-500" />
                Basic information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-200 mb-1">
                    Background name *
                  </label>
                  <input
                    type="text"
                    value={decorName}
                    onChange={(e) => setDecorName(e.target.value)}
                    placeholder="Ex: Sakura School"
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
                  Background description *
                </label>
                <textarea
                  value={decorDescription}
                  onChange={(e) => setDecorDescription(e.target.value)}
                  placeholder="Describe the environment, atmosphere and characteristics..."
                  rows={2}
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent resize-none text-xs"
                />
              </div>
            </div>

            {/* Configuration avancée */}
            <div className="bg-dark-800 rounded-lg p-3 border border-dark-700">
              <h2 className="text-base font-semibold text-white mb-2 flex items-center">
                <Settings className="w-4 h-4 mr-2 text-primary-500" />
                Advanced Configuration
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
                    {DECOR_ARCHETYPES.map(archetype => (
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
                    {DECOR_POSES.map(pose => (
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
                  placeholder="Ex: fog, dramatic lighting, bright colors..."
                  className="w-full bg-dark-700 border border-dark-600 rounded px-2 py-1.5 text-white focus:ring-1 focus:ring-primary-500 focus:border-transparent text-xs"
                />
              </div>
            </div>

            {/* Generation button */}
            <div className="text-center pb-3">
              <MangaButton
                onClick={generateDecor}
                loading={isGenerating}
                size="sm"
                gradient
                icon={<Zap className="w-4 h-4" />}
                className="px-6 py-2"
                disabled={!decorName.trim() || !decorDescription.trim()}
              >
                {isGenerating ? 'Generating...' : 'Generate background'}
              </MangaButton>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Sidebar - Galerie des décors améliorée */}
      <div className="w-96 bg-dark-800 border-l border-dark-700">
        <ImprovedDecorGallery
          decors={decors}
          selectedDecor={selectedDecor}
          onDecorSelect={(decor) => setSelectedDecor(decor.id)}
          onDecorDelete={handleDecorDelete}
          onDecorDownload={handleDownload}
          onCopyPrompt={handleCopyPrompt}
        />
      </div>
    </div>
  )
}

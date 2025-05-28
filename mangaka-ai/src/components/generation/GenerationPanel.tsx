'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'

interface GenerationPanelProps {
  onImageGenerated?: (imageData: GenerationResult) => void
}

type ImageType = 'character' | 'background' | 'scene'

interface GenerationResult {
  imageId: string
  imageUrl: string
  originalPrompt: string
  optimizedPrompt: string
  creditsUsed: number
  creditsRemaining: number
  generationTimeMs: number
}

const IMAGE_TYPE_OPTIONS = [
  {
    value: 'character' as const,
    label: 'Personnage',
    description: 'Héros, méchants, personnages secondaires',
    icon: '👤',
    examples: ['jeune héros aux cheveux noirs', 'méchant en armure sombre', 'fille magicienne']
  },
  {
    value: 'background' as const,
    label: 'Décor',
    description: 'Environnements, paysages, intérieurs',
    icon: '🏞️',
    examples: ['ville futuriste', 'forêt mystérieuse', 'château médiéval']
  },
  {
    value: 'scene' as const,
    label: 'Scène',
    description: 'Scènes complètes avec action',
    icon: '🎬',
    examples: ['combat épique', 'moment romantique', 'révélation dramatique']
  }
]

export default function GenerationPanel({ onImageGenerated }: GenerationPanelProps = {}) {
  const [prompt, setPrompt] = useState('')
  const [imageType, setImageType] = useState<ImageType>('character')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<GenerationResult | null>(null)

  const { credits, loading: creditsLoading, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Veuillez saisir une description')
      return
    }

    if (!user) {
      setError('Vous devez être connecté pour générer des images')
      return
    }

    if (!credits || credits.credits_remaining < 1) {
      setError('Crédits insuffisants. Passez au plan Pro pour continuer à créer.')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setError('Vous devez être connecté pour générer des images')
        return
      }

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          type: imageType,
          optimizePrompt: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la génération')
      }

      if (data.success) {
        setResult(data.data)
        await refreshCredits() // Refresh credits after successful generation
        onImageGenerated?.(data.data)
      } else {
        throw new Error(data.error || 'Échec de la génération')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = IMAGE_TYPE_OPTIONS.find(option => option.value === imageType)

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-dark-800 rounded-xl manga-border p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Générateur d&apos;Images Manga</h2>
          <p className="text-dark-200">
            Décrivez votre vision, notre IA la transforme en art manga professionnel
          </p>
          {creditsLoading ? (
            <div className="mt-4 inline-flex items-center bg-dark-700 rounded-lg px-4 py-2">
              <div className="w-24 h-6 bg-dark-600 rounded animate-pulse"></div>
            </div>
          ) : credits && (
            <div className="mt-4 inline-flex items-center bg-primary-500/10 border border-primary-500/20 rounded-lg px-4 py-2">
              <span className="text-primary-500 font-medium">
                {credits.credits_remaining} crédits restants
              </span>
              <span className="text-dark-400 text-sm ml-2">
                ({credits.subscription_tier === 'free' ? 'Gratuit' : 'Pro'})
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">Type d&apos;image</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {IMAGE_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setImageType(option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  imageType === option.value
                    ? 'border-primary-500 bg-primary-500/10'
                    : 'border-dark-600 hover:border-primary-500/50'
                }`}
              >
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-3">{option.icon}</span>
                  <span className="font-medium">{option.label}</span>
                </div>
                <p className="text-sm text-dark-400">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label htmlFor="prompt" className="block text-sm font-medium mb-2">
            Description de votre {selectedType?.label.toLowerCase()}
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={`Ex: ${selectedType?.examples.join(', ')}`}
            className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            rows={4}
            maxLength={500}
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm text-dark-400">
              Soyez précis pour de meilleurs résultats
            </p>
            <span className="text-sm text-dark-400">
              {prompt.length}/500
            </span>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim() || !user || !credits || credits.credits_remaining < 1}
          className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none manga-shadow-lg"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
              Génération en cours...
            </div>
          ) : (
            `Générer ${selectedType?.label}`
          )}
        </button>

        {/* Result Display */}
        {result && (
          <div className="mt-8 p-6 bg-dark-700 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Image générée avec succès !</h3>

            <div className="mb-4">
              <img
                src={result.imageUrl}
                alt={result.originalPrompt}
                className="w-full rounded-lg manga-shadow"
              />
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-dark-400">Prompt original:</span>
                <p className="text-dark-200">{result.originalPrompt}</p>
              </div>
              <div>
                <span className="text-dark-400">Prompt optimisé:</span>
                <p className="text-dark-200 text-xs">{result.optimizedPrompt}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">
                  Temps de génération: {(result.generationTimeMs / 1000).toFixed(1)}s
                </span>
                <span className="text-primary-500">
                  {result.creditsUsed} crédit utilisé
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button className="flex-1 bg-dark-600 hover:bg-dark-500 text-white py-2 rounded-lg transition-colors">
                Sauvegarder
              </button>
              <button className="flex-1 bg-accent-500 hover:bg-accent-600 text-white py-2 rounded-lg transition-colors">
                Utiliser dans un projet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

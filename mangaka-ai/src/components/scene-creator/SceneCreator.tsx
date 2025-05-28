'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'
import AssetLibrary from './AssetLibrary'

interface GeneratedImage {
  id: string
  original_prompt: string
  optimized_prompt: string
  image_url: string
  image_type: 'character' | 'background' | 'scene'
  created_at: string
}

interface SceneResult {
  sceneId: string
  imageUrl: string
  originalPrompt: string
  optimizedPrompt: string
  combinedAssets: string[]
  sceneType: string
  creditsUsed: number
  creditsRemaining: number
  generationTimeMs: number
}

type SceneType = 'action' | 'dialogue' | 'dramatic' | 'romantic' | 'comedy'

const SCENE_TYPES = [
  {
    value: 'action' as const,
    label: 'Action',
    description: 'Scènes dynamiques avec mouvement',
    icon: '⚔️',
    examples: ['combat épique', 'poursuite intense', 'bataille finale']
  },
  {
    value: 'dialogue' as const,
    label: 'Dialogue',
    description: 'Conversations entre personnages',
    icon: '💬',
    examples: ['conversation importante', 'négociation tendue', 'révélation']
  },
  {
    value: 'dramatic' as const,
    label: 'Dramatique',
    description: 'Moments émotionnels intenses',
    icon: '🎭',
    examples: ['moment de tristesse', 'révélation choquante', 'sacrifice héroïque']
  },
  {
    value: 'romantic' as const,
    label: 'Romantique',
    description: 'Scènes d\'amour et d\'émotion',
    icon: '💕',
    examples: ['premier baiser', 'déclaration d\'amour', 'moment tendre']
  },
  {
    value: 'comedy' as const,
    label: 'Comédie',
    description: 'Moments drôles et légers',
    icon: '😄',
    examples: ['situation comique', 'malentendu drôle', 'gag visuel']
  }
]

interface SceneCreatorProps {
  onSceneCreated?: (sceneData: SceneResult) => void
}

export default function SceneCreator({ onSceneCreated }: SceneCreatorProps = {}) {
  const [selectedAssets, setSelectedAssets] = useState<GeneratedImage[]>([])
  const [sceneContext, setSceneContext] = useState('')
  const [sceneType, setSceneType] = useState<SceneType>('dramatic')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SceneResult | null>(null)

  const { credits, loading: creditsLoading, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  const handleAssetSelect = (asset: GeneratedImage) => {
    if (selectedAssets.length < 5) {
      setSelectedAssets(prev => [...prev, asset])
    }
  }

  const handleAssetDeselect = (assetId: string) => {
    setSelectedAssets(prev => prev.filter(asset => asset.id !== assetId))
  }

  const handleCombineScene = async () => {
    if (selectedAssets.length === 0) {
      setError('Veuillez sélectionner au moins un asset')
      return
    }

    if (!sceneContext.trim()) {
      setError('Veuillez décrire le contexte de la scène')
      return
    }

    if (!user) {
      setError('Vous devez être connecté pour créer des scènes')
      return
    }

    if (!credits || credits.credits_remaining < 2) {
      setError('Crédits insuffisants. La création de scène coûte 2 crédits.')
      return
    }

    setLoading(true)
    setError('')
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
          assetIds: selectedAssets.map(asset => asset.id),
          sceneContext: sceneContext.trim(),
          sceneType,
          optimizePrompt: true
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la création de la scène')
      }

      if (data.success) {
        setResult(data.data)
        await refreshCredits()
        onSceneCreated?.(data.data)
        // Reset form
        setSelectedAssets([])
        setSceneContext('')
      } else {
        throw new Error(data.error || 'Échec de la création de scène')
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue s\'est produite')
    } finally {
      setLoading(false)
    }
  }

  const selectedType = SCENE_TYPES.find(type => type.value === sceneType)

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Créateur de Scènes</h1>
        <p className="text-xl text-dark-200 mb-6">
          Combinez vos assets pour créer des scènes manga cohérentes et dynamiques
        </p>
        {creditsLoading ? (
          <div className="inline-flex items-center bg-dark-700 rounded-lg px-4 py-2">
            <div className="w-32 h-6 bg-dark-600 rounded animate-pulse"></div>
          </div>
        ) : credits && (
          <div className="inline-flex items-center bg-primary-500/10 border border-primary-500/20 rounded-lg px-4 py-2">
            <span className="text-primary-500 font-medium">
              {credits.credits_remaining} crédits restants
            </span>
            <span className="text-dark-400 text-sm ml-2">
              (Création de scène: 2 crédits)
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Asset Library */}
        <div>
          <AssetLibrary
            selectedAssets={selectedAssets}
            onAssetSelect={handleAssetSelect}
            onAssetDeselect={handleAssetDeselect}
            maxSelection={5}
          />
        </div>

        {/* Scene Configuration */}
        <div className="bg-dark-800 rounded-xl manga-border p-6">
          <h3 className="text-2xl font-bold mb-6">Configuration de la Scène</h3>

          {/* Selected Assets Preview */}
          {selectedAssets.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium mb-3">Assets sélectionnés ({selectedAssets.length}/5)</h4>
              <div className="flex flex-wrap gap-2">
                {selectedAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="relative group"
                  >
                    <img
                      src={asset.image_url}
                      alt={asset.original_prompt}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleAssetDeselect(asset.id)}
                      className="absolute -top-2 -right-2 bg-error rounded-full w-6 h-6 flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scene Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-3">Type de scène</label>
            <div className="grid grid-cols-1 gap-2">
              {SCENE_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSceneType(type.value)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    sceneType === type.value
                      ? 'border-primary-500 bg-primary-500/10'
                      : 'border-dark-600 hover:border-primary-500/50'
                  }`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-xl mr-3">{type.icon}</span>
                    <span className="font-medium">{type.label}</span>
                  </div>
                  <p className="text-sm text-dark-400">{type.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Scene Context */}
          <div className="mb-6">
            <label htmlFor="sceneContext" className="block text-sm font-medium mb-2">
              Contexte de la scène
            </label>
            <textarea
              id="sceneContext"
              value={sceneContext}
              onChange={(e) => setSceneContext(e.target.value)}
              placeholder={`Ex: ${selectedType?.examples.join(', ')}`}
              className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              rows={4}
              maxLength={300}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-dark-400">
                Décrivez l'action ou l'émotion de la scène
              </p>
              <span className="text-sm text-dark-400">
                {sceneContext.length}/300
              </span>
            </div>
          </div>

          {/* Create Scene Button */}
          <button
            onClick={handleCombineScene}
            disabled={loading || selectedAssets.length === 0 || !sceneContext.trim() || !user || !credits || credits.credits_remaining < 2}
            className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white py-4 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 disabled:transform-none manga-shadow-lg"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                Création en cours...
              </div>
            ) : (
              `Créer la Scène (2 crédits)`
            )}
          </button>
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="bg-dark-800 rounded-xl manga-border p-8">
          <h3 className="text-2xl font-bold mb-6">Scène créée avec succès !</h3>

          <div className="grid lg:grid-cols-2 gap-8">
            <div>
              <img
                src={result.imageUrl}
                alt={result.originalPrompt}
                className="w-full rounded-lg manga-shadow"
              />
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-dark-400 font-medium">Type de scène:</span>
                <p className="text-dark-200">{selectedType?.label}</p>
              </div>
              <div>
                <span className="text-dark-400 font-medium">Contexte original:</span>
                <p className="text-dark-200">{result.originalPrompt}</p>
              </div>
              <div>
                <span className="text-dark-400 font-medium">Prompt optimisé:</span>
                <p className="text-dark-200 text-sm">{result.optimizedPrompt}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">
                  Temps de génération: {(result.generationTimeMs / 1000).toFixed(1)}s
                </span>
                <span className="text-primary-500">
                  {result.creditsUsed} crédits utilisés
                </span>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 bg-dark-600 hover:bg-dark-500 text-white py-2 rounded-lg transition-colors">
                  Sauvegarder
                </button>
                <button className="flex-1 bg-accent-500 hover:bg-accent-600 text-white py-2 rounded-lg transition-colors">
                  Utiliser dans un projet
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

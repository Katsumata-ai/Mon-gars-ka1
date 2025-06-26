'use client'

import { useEffect } from 'react'
import { useDataCache } from '@/components/editor/ModernUnifiedEditor'
import ImprovedSceneCreator from './ImprovedSceneCreator'

interface CachedImprovedSceneCreatorProps {
  projectId: string
}

export default function CachedImprovedSceneCreator({ projectId }: CachedImprovedSceneCreatorProps) {
  const { cache, loadScenes, loadCharacters, loadDecors, addScene, removeScene } = useDataCache()

  // Charger les données au premier accès seulement
  useEffect(() => {
    if (!cache.scenesLoaded && !cache.scenesLoading) {
      loadScenes()
    }
  }, [cache.scenesLoaded, cache.scenesLoading, loadScenes])

  // Charger les personnages et décors si pas encore chargés (nécessaires pour la création de scènes)
  useEffect(() => {
    if (!cache.charactersLoaded && !cache.charactersLoading) {
      loadCharacters()
    }
  }, [cache.charactersLoaded, cache.charactersLoading, loadCharacters])

  useEffect(() => {
    if (!cache.decorsLoaded && !cache.decorsLoading) {
      loadDecors()
    }
  }, [cache.decorsLoaded, cache.decorsLoading, loadDecors])

  return (
    <ImprovedSceneCreator
      projectId={projectId}
      cachedScenes={cache.scenes}
      cachedCharacters={cache.characters}
      cachedDecors={cache.decors}
      scenesLoaded={cache.scenesLoaded}
      scenesLoading={cache.scenesLoading}
      charactersLoaded={cache.charactersLoaded}
      decorsLoaded={cache.decorsLoaded}
      onSceneGenerated={addScene}
      onSceneDeleted={removeScene}
    />
  )
}

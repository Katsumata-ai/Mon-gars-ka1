'use client'

import { useEffect } from 'react'
import MangaCharacterStudio from './MangaCharacterStudio'
import { useDataCache } from '@/components/editor/ModernUnifiedEditor'

interface CachedMangaCharacterStudioProps {
  projectId: string
}

export default function CachedMangaCharacterStudio({ projectId }: CachedMangaCharacterStudioProps) {
  const { cache, loadCharacters, addCharacter, removeCharacter } = useDataCache()

  // Charger les données au premier accès seulement
  useEffect(() => {
    if (!cache.charactersLoaded && !cache.charactersLoading) {
      loadCharacters()
    }
  }, [cache.charactersLoaded, cache.charactersLoading, loadCharacters])

  return (
    <MangaCharacterStudio
      projectId={projectId}
      cachedCharacters={cache.characters}
      charactersLoaded={cache.charactersLoaded}
      charactersLoading={cache.charactersLoading}
      onCharacterGenerated={addCharacter}
      onCharacterDeleted={removeCharacter}
    />
  )
}

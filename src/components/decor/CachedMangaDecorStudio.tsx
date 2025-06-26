'use client'

import { useEffect } from 'react'
import MangaDecorStudio from './MangaDecorStudio'
import { useDataCache } from '@/components/editor/ModernUnifiedEditor'

interface CachedMangaDecorStudioProps {
  projectId: string
}

export default function CachedMangaDecorStudio({ projectId }: CachedMangaDecorStudioProps) {
  const { cache, loadDecors, addDecor, removeDecor } = useDataCache()

  // Charger les données au premier accès seulement
  useEffect(() => {
    if (!cache.decorsLoaded && !cache.decorsLoading) {
      loadDecors()
    }
  }, [cache.decorsLoaded, cache.decorsLoading, loadDecors])

  return (
    <MangaDecorStudio
      projectId={projectId}
      cachedDecors={cache.decors}
      decorsLoaded={cache.decorsLoaded}
      decorsLoading={cache.decorsLoading}
      onDecorGenerated={addDecor}
      onDecorDeleted={removeDecor}
    />
  )
}

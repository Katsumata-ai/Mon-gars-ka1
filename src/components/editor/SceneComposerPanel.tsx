'use client'

import React from 'react'
import CachedImprovedSceneCreator from '@/components/scene-creator/CachedImprovedSceneCreator'

interface SceneComposerPanelProps {
  projectId: string
  onSceneGenerated?: (scene: any) => void
}

export default function SceneComposerPanel({ projectId, onSceneGenerated }: SceneComposerPanelProps) {
  return (
    <div className="h-full w-full">
      <CachedImprovedSceneCreator
        projectId={projectId}
      />
    </div>
  )
}

'use client'

import ModernUnifiedEditor from '@/components/editor/ModernUnifiedEditor'

export default function TestEditorPage() {
  return (
    <div className="h-screen">
      <ModernUnifiedEditor 
        projectId="test-project-123"
        projectName="Mon Manga de Test"
      />
    </div>
  )
}

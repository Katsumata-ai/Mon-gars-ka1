import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MangaPageEditor from '@/components/canvas-editor/MangaPageEditor'

export const metadata: Metadata = {
  title: 'Éditeur de Pages - MANGAKA AI',
  description: 'Créez des pages manga professionnelles avec notre éditeur visuel avancé',
}

export default async function PageEditorPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/page-editor')
  }

  return (
    <div className="h-screen bg-dark-900">
      <MangaPageEditor />
    </div>
  )
}

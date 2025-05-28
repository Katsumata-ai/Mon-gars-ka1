import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import SceneCreator from '@/components/scene-creator/SceneCreator'

export const metadata: Metadata = {
  title: 'Créateur de Scènes - MANGAKA AI',
  description: 'Combinez vos assets pour créer des scènes manga cohérentes et dynamiques',
}

export default async function SceneCreatorPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/scene-creator')
  }

  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      <Navigation variant="app" />
      
      <main className="pt-20">
        <SceneCreator />
      </main>
    </div>
  )
}

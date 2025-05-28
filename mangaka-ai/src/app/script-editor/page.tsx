import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ScriptEditor from '@/components/script-editor/ScriptEditor'

export const metadata: Metadata = {
  title: 'Script Editor - MANGAKA AI',
  description: 'Organisez votre histoire manga en chapitres, scènes et panels',
}

export default async function ScriptEditorPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/script-editor')
  }

  return (
    <div className="h-screen bg-dark-900">
      <ScriptEditor />
    </div>
  )
}

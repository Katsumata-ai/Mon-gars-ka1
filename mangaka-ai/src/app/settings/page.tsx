import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import SettingsContent from '@/components/settings/SettingsContent'
import ClientToaster from '@/components/ClientToaster'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <Navigation variant="app" currentPage="settings" />

      {/* Main Content */}
      <main>
        <SettingsContent user={{ id: user.id, email: user.email || '' }} />
      </main>

      {/* Toast notifications */}
      <ClientToaster />
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import SimpleProjectDashboard from '@/components/dashboard/SimpleProjectDashboard'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <Navigation variant="app" currentPage="dashboard" />

      {/* Main Content */}
      <SimpleProjectDashboard />
    </div>
  )
}

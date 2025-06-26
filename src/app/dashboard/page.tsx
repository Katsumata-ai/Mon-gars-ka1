import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import SimpleProjectDashboard from '@/components/dashboard/SimpleProjectDashboard'
import { ConditionalUpsellProvider } from '@/components/upselling/ConditionalUpsellProvider'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <ConditionalUpsellProvider>
      <div className="min-h-screen bg-dark-900" suppressHydrationWarning>
        {/* Navigation */}
        <Navigation variant="app" currentPage="dashboard" />

        {/* Main Content */}
        <SimpleProjectDashboard />
      </div>
    </ConditionalUpsellProvider>
  )
}

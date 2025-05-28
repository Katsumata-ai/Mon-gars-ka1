import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/navigation/Navigation'

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-dark-200">
            Bienvenue dans votre espace de création manga !
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Link
            href="/generate"
            className="bg-dark-800 p-6 rounded-xl manga-border hover:border-primary-500 transition-colors group"
          >
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Générer des Images</h3>
            <p className="text-dark-200">
              Créez personnages, décors et scènes avec l&apos;IA
            </p>
          </Link>

          <Link
            href="/projects"
            className="bg-dark-800 p-6 rounded-xl manga-border hover:border-primary-500 transition-colors group"
          >
            <div className="w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📚</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Mes Projets</h3>
            <p className="text-dark-200">
              Gérez vos créations et projets manga
            </p>
          </Link>

          <Link
            href="/editor"
            className="bg-dark-800 p-6 rounded-xl manga-border hover:border-primary-500 transition-colors group"
          >
            <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">✏️</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Éditeur de Pages</h3>
            <p className="text-dark-200">
              Assemblez vos pages manga complètes
            </p>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-dark-800 p-4 rounded-lg manga-border">
            <div className="text-2xl font-bold text-primary-500">5</div>
            <div className="text-sm text-dark-400">Crédits restants</div>
          </div>

          <div className="bg-dark-800 p-4 rounded-lg manga-border">
            <div className="text-2xl font-bold text-accent-500">0</div>
            <div className="text-sm text-dark-400">Images générées</div>
          </div>

          <div className="bg-dark-800 p-4 rounded-lg manga-border">
            <div className="text-2xl font-bold text-info">0</div>
            <div className="text-sm text-dark-400">Projets créés</div>
          </div>

          <div className="bg-dark-800 p-4 rounded-lg manga-border">
            <div className="text-2xl font-bold text-success">Gratuit</div>
            <div className="text-sm text-dark-400">Plan actuel</div>
          </div>
        </div>
      </main>
    </div>
  )
}

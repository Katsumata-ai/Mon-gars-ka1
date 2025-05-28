import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GenerationPanel from '@/components/generation/GenerationPanel'
import Navigation from '@/components/navigation/Navigation'

export default async function GeneratePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/generate')
  }

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <Navigation variant="app" currentPage="generate" />

      {/* Main Content */}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Générateur d&apos;Images Manga</h1>
            <p className="text-xl text-dark-200 max-w-3xl mx-auto">
              Transformez vos idées en art manga professionnel grâce à notre IA spécialisée.
              Créez des personnages, décors et scènes en quelques clics.
            </p>
          </div>

          <GenerationPanel />

          {/* Tips Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Conseils pour de meilleurs résultats
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-dark-800 p-6 rounded-xl manga-border">
                <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Soyez spécifique</h3>
                <p className="text-dark-200 text-sm">
                  Plus votre description est détaillée, plus le résultat sera précis.
                  Mentionnez les couleurs, expressions, poses, vêtements.
                </p>
              </div>

              <div className="bg-dark-800 p-6 rounded-xl manga-border">
                <div className="w-12 h-12 bg-accent-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">🎨</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Style cohérent</h3>
                <p className="text-dark-200 text-sm">
                  Notre IA optimise automatiquement vos prompts pour maintenir
                  un style manga cohérent à travers toutes vos créations.
                </p>
              </div>

              <div className="bg-dark-800 p-6 rounded-xl manga-border">
                <div className="w-12 h-12 bg-info rounded-lg flex items-center justify-center mb-4">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-lg font-bold mb-2">Itérez rapidement</h3>
                <p className="text-dark-200 text-sm">
                  N&apos;hésitez pas à expérimenter avec différentes descriptions.
                  Chaque génération vous rapproche de votre vision parfaite.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

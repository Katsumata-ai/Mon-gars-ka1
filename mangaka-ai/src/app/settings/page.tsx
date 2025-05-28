import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navigation from '@/components/navigation/Navigation'
import { User, Bell, Palette, CreditCard, Shield } from 'lucide-react'

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Paramètres</h1>
          <p className="text-dark-200">
            Gérez votre compte et vos préférences
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Section */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Profil</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="w-full bg-dark-700 text-dark-300 px-4 py-2 rounded-lg border border-dark-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  placeholder="Votre nom..."
                  className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center space-x-3 mb-6">
              <Bell className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Notifications par email</h3>
                  <p className="text-dark-300 text-sm">Recevez des mises à jour par email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-medium">Notifications push</h3>
                  <p className="text-dark-300 text-sm">Notifications dans le navigateur</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-dark-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Préférences</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Style de manga préféré
                </label>
                <select className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none">
                  <option>Shonen</option>
                  <option>Shojo</option>
                  <option>Seinen</option>
                  <option>Josei</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-200 mb-2">
                  Qualité d'image par défaut
                </label>
                <select className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none">
                  <option>Standard</option>
                  <option>Haute qualité</option>
                  <option>Ultra HD</option>
                </select>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center space-x-3 mb-6">
              <CreditCard className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Abonnement</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Plan Gratuit</h3>
                <p className="text-dark-300 text-sm">5 crédits par mois</p>
              </div>
              <button className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg transition-colors">
                Upgrade
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
            <div className="flex items-center space-x-3 mb-6">
              <Shield className="w-6 h-6 text-primary-400" />
              <h2 className="text-xl font-semibold text-white">Sécurité</h2>
            </div>

            <div className="space-y-4">
              <button className="w-full md:w-auto bg-dark-700 hover:bg-dark-600 text-white px-6 py-2 rounded-lg transition-colors">
                Changer le mot de passe
              </button>
              <button className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors ml-0 md:ml-4">
                Supprimer le compte
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg transition-colors">
              Sauvegarder les modifications
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

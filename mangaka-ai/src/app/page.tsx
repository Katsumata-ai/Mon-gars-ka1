import Link from "next/link";
import Image from "next/image";
import Navigation from "@/components/navigation/Navigation";
import { MangakaHeroSection } from "@/components/ui/gradient-bar-hero-section";
import { VisionStory } from "@/components/ui/vision-story";
import { PricingSection } from "@/components/ui/pricing-section";
import { Faq5 } from "@/components/ui/faq-5";
import { Sparkles, Zap } from "lucide-react";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

// Utiliser la configuration Stripe pour les tiers de prix
const mangakaPricingTiers = STRIPE_CONFIG.plans.map(plan => ({
  name: plan.name,
  price: plan.price,
  description: plan.description,
  icon: plan.id === 'junior' ? (
    <div className="relative">
      <Sparkles className="w-7 h-7 relative z-10 text-gray-400" />
    </div>
  ) : (
    <div className="relative">
      <Zap className="w-7 h-7 relative z-10 text-primary-500" />
    </div>
  ),
  features: plan.features,
  highlight: plan.highlight,
  badge: plan.badge,
}))

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-slate-900 to-dark-900 text-white">
      {/* Navigation */}
      <Navigation variant="landing" />

      {/* Hero Section */}
      <MangakaHeroSection />

      {/* Vision Story Section */}
      <VisionStory />

      {/* Features in Action Section */}
      <section id="features" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-comic">
              Fonctionnalités
            </h2>
          </div>

          <div className="space-y-20">
            {/* Feature 1 - Génération IA */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-primary-500">Génération IA Avancée</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Notre système utilise un workflow ComfyUI professionnel avec Stable Diffusion,
                  spécialement optimisé pour la création de manga. Cette technologie de pointe
                  garantit une cohérence artistique exceptionnelle et un style japonais authentique.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Workflow ComfyUI professionnel intégré
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Powered by Stable Diffusion optimisé manga
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Pipeline de génération avancé et modulaire
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Cohérence artistique garantie par IA
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="relative w-full h-80 rounded-2xl overflow-hidden manga-shadow-lg">
                  <Image
                    src="/generation-interface.png"
                    alt="Interface ComfyUI avec workflow Stable Diffusion pour manga"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Éditeur de Pages */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h3 className="text-3xl font-bold mb-6 text-primary-500">Éditeur de Pages Intuitif</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Notre système similaire à Canva mais spécialisé manga vous offre une suite d&apos;outils
                  complète et professionnelle. Interface intuitive de type glisser-déposer qui rassemble
                  tous les outils nécessaires en un seul endroit pour créer vos pages manga.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Système similaire à Canva spécialisé manga
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Suite d&apos;outils complète et professionnelle
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Interface intuitive glisser-déposer
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Tous les outils nécessaires en un endroit
                  </li>
                </ul>
              </div>
              <div className="lg:order-1 relative">
                <div className="relative w-full h-80 rounded-2xl overflow-hidden manga-shadow-lg">
                  <Image
                    src="/assemblage-tool.png"
                    alt="Menu assemblage de Mangaka AI - Éditeur de pages manga"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent"></div>
                </div>
              </div>
            </div>

            {/* Feature 3 - Workflow */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-primary-500">Et bien plus encore !</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Qu&apos;attendez-vous ? Plongez dans l&apos;univers infini de la création manga !
                  Découvrez toutes les possibilités qui s&apos;offrent à vous avec Mangaka AI.
                  Votre imagination n&apos;a plus de limites !
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">✨</div>
                    <span className="text-gray-300">Créez des univers manga uniques et captivants</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">🚀</div>
                    <span className="text-gray-300">Lancez-vous dès maintenant dans l&apos;aventure</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">💫</div>
                    <span className="text-gray-300">Rejoignez la révolution de la création manga</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="relative w-full h-80 rounded-2xl overflow-hidden manga-shadow-lg">
                  <Image
                    src="/feature3-interface.png"
                    alt="Et bien plus encore avec Mangaka AI !"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-900/50 to-transparent"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection tiers={mangakaPricingTiers} />

      {/* FAQ Section */}
      <div id="faq" className="bg-slate-800/30">
        <Faq5 />
      </div>

      {/* Discord Community Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 to-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="w-20 h-20 flex items-center justify-center">
              <Image
                src="/discord-logo.png"
                alt="Discord Logo"
                width={80}
                height={80}
                className="object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white font-comic">
                Rejoignez Notre Communauté !
              </h2>
              <p className="text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
                Avec nos fonctionnalités avancées, vous pourrez créer des mangas époustouflants en un rien de temps.
                Rejoignez des milliers de créateurs passionnés sur Discord !
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="https://discord.gg/mangakaai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 !text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Rejoindre Discord
              </Link>

              <Link
                href="/signup"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl !text-white"
              >
                Commencer Maintenant
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold text-primary-500 font-logo mb-4">
                MANGAKA AI
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                L&apos;IA qui démocratise la création de manga pour tous les créateurs.
                Transformez vos idées en histoires visuelles captivantes.
              </p>
              <div className="flex space-x-4">
                <Link href="/signup" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors !text-white">
                  Commencer maintenant
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Produit</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-primary-500 transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#pricing" className="hover:text-primary-500 transition-colors">Tarifs</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary-500 transition-colors">Dashboard</Link></li>
                <li><Link href="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Compte</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/login" className="hover:text-primary-500 transition-colors">Connexion</Link></li>
                <li><Link href="/signup" className="hover:text-primary-500 transition-colors">Inscription</Link></li>
                <li><Link href="/forgot-password" className="hover:text-primary-500 transition-colors">Mot de passe oublié</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 MANGAKA AI. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-primary-500 text-sm transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-primary-500 text-sm transition-colors">
                Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
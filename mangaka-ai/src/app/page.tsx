import Link from "next/link";
import Navigation from "@/components/navigation/Navigation";
import HeroCTA from "@/components/navigation/HeroCTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-50">
      {/* Navigation */}
      <Navigation variant="landing" />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Créez des <span className="text-primary-500">manga</span> sans savoir dessiner
          </h1>
          <p className="text-xl md:text-2xl text-dark-200 mb-8 leading-relaxed max-w-3xl mx-auto">
            L&apos;IA qui transforme vos idées en histoires manga professionnelles.
            Générez personnages, décors et scènes en quelques clics.
          </p>
          <HeroCTA />
          <p className="text-sm text-dark-400 mt-4">
            ✨ 5 générations gratuites • Aucune carte bancaire requise
          </p>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Le problème que nous résolvons
              </h2>
              <div className="space-y-4 text-dark-200">
                <p className="flex items-start">
                  <span className="text-primary-500 mr-3 text-xl">✗</span>
                  Apprendre à dessiner prend des années
                </p>
                <p className="flex items-start">
                  <span className="text-primary-500 mr-3 text-xl">✗</span>
                  Les outils existants sont complexes et chers
                </p>
                <p className="flex items-start">
                  <span className="text-primary-500 mr-3 text-xl">✗</span>
                  Difficile de maintenir un style cohérent
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-6 text-primary-500">
                Notre solution
              </h3>
              <div className="space-y-4 text-dark-200">
                <p className="flex items-start">
                  <span className="text-accent-500 mr-3 text-xl">✓</span>
                  IA spécialisée dans le style manga
                </p>
                <p className="flex items-start">
                  <span className="text-accent-500 mr-3 text-xl">✓</span>
                  Interface simple et intuitive
                </p>
                <p className="flex items-start">
                  <span className="text-accent-500 mr-3 text-xl">✓</span>
                  Cohérence stylistique garantie
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tout ce dont vous avez besoin pour créer
            </h2>
            <p className="text-xl text-dark-200 max-w-3xl mx-auto">
              Des outils puissants et simples pour donner vie à vos histoires manga
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-dark-800 p-8 rounded-xl manga-border hover:border-primary-500 transition-colors">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Génération IA Optimisée</h3>
              <p className="text-dark-200">
                Créez personnages, décors et scènes avec des prompts simples.
                Notre IA spécialisée garantit un style manga authentique.
              </p>
            </div>

            <div className="bg-dark-800 p-8 rounded-xl manga-border hover:border-primary-500 transition-colors">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">🔧</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Éditeur de Pages</h3>
              <p className="text-dark-200">
                Assemblez vos créations en pages manga complètes avec notre éditeur
                visuel intuitif. Cases, bulles et mise en page professionnelle.
              </p>
            </div>

            <div className="bg-dark-800 p-8 rounded-xl manga-border hover:border-primary-500 transition-colors">
              <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center mb-6">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-4">Workflow Optimisé</h3>
              <p className="text-dark-200">
                De l&apos;idée au manga fini en 3 étapes : Générer → Combiner → Assembler.
                Créez plus vite que jamais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-dark-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tarifs simples et transparents
            </h2>
            <p className="text-xl text-dark-200">
              Commencez gratuitement, évoluez selon vos besoins
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-dark-800 p-8 rounded-xl manga-border">
              <h3 className="text-2xl font-bold mb-4">Gratuit</h3>
              <div className="text-4xl font-bold mb-6">
                0€<span className="text-lg text-dark-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  5 générations d&apos;images par mois
                </li>
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  Éditeur de pages basique
                </li>
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  Export en basse résolution
                </li>
              </ul>
              <Link
                href="/signup"
                className="w-full bg-dark-700 hover:bg-dark-600 text-white py-3 rounded-lg font-medium transition-colors block text-center"
              >
                Commencer gratuitement
              </Link>
            </div>

            <div className="bg-dark-800 p-8 rounded-xl border-2 border-primary-500 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-6">
                19€<span className="text-lg text-dark-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  100 générations d&apos;images par mois
                </li>
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  Éditeur de pages avancé
                </li>
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  Export haute résolution
                </li>
                <li className="flex items-center">
                  <span className="text-accent-500 mr-3">✓</span>
                  Support prioritaire
                </li>
              </ul>
              <Link
                href="/signup?plan=pro"
                className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 rounded-lg font-medium transition-colors block text-center"
              >
                Commencer l&apos;essai gratuit
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-dark-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-primary-500 font-display mb-4">
                MANGAKA AI
              </h3>
              <p className="text-dark-400">
                L&apos;IA qui démocratise la création de manga pour tous les créateurs.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-dark-400">
                <li><Link href="#features" className="hover:text-primary-500 transition-colors">Fonctionnalités</Link></li>
                <li><Link href="#pricing" className="hover:text-primary-500 transition-colors">Tarifs</Link></li>
                <li><Link href="/demo" className="hover:text-primary-500 transition-colors">Démo</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-dark-400">
                <li><Link href="/help" className="hover:text-primary-500 transition-colors">Centre d&apos;aide</Link></li>
                <li><Link href="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
                <li><Link href="/tutorials" className="hover:text-primary-500 transition-colors">Tutoriels</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-dark-400">
                <li><Link href="/privacy" className="hover:text-primary-500 transition-colors">Confidentialité</Link></li>
                <li><Link href="/terms" className="hover:text-primary-500 transition-colors">Conditions</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-dark-700 mt-8 pt-8 text-center text-dark-400">
            <p>&copy; 2024 MANGAKA AI. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
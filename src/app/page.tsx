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
              Features
            </h2>
          </div>

          <div className="space-y-20">
            {/* Feature 1 - AI Generation */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-6 text-primary-500">Advanced AI Generation</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Our system uses a professional ComfyUI workflow with Stable Diffusion,
                  specially optimized for manga creation. This cutting-edge technology
                  guarantees exceptional artistic consistency and authentic Japanese style.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Integrated professional ComfyUI workflow
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Powered by manga-optimized Stable Diffusion
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Advanced and modular generation pipeline
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    AI-guaranteed artistic consistency
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

            {/* Feature 2 - Page Editor */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="lg:order-2">
                <h3 className="text-3xl font-bold mb-6 text-primary-500">Intuitive Page Editor</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  Our Canva-like system but specialized for manga offers you a complete
                  and professional tool suite. Intuitive drag-and-drop interface that brings
                  all the necessary tools together in one place to create your manga pages.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Canva-like system specialized for manga
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Complete and professional tool suite
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    Intuitive drag-and-drop interface
                  </li>
                  <li className="flex items-center text-gray-300">
                    <span className="text-accent-500 mr-3">✓</span>
                    All necessary tools in one place
                  </li>
                </ul>
              </div>
              <div className="lg:order-1 relative">
                <div className="relative w-full h-80 rounded-2xl overflow-hidden manga-shadow-lg">
                  <Image
                    src="/intuitive-page-editor.png"
                    alt="Éditeur de pages manga intuitif - Interface Mangaka AI"
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
                <h3 className="text-3xl font-bold mb-6 text-primary-500">And much more!</h3>
                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  What are you waiting for? Dive into the infinite universe of manga creation!
                  Discover all the possibilities that await you with Mangaka AI.
                  Your imagination has no limits!
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">✨</div>
                    <span className="text-gray-300">Create unique and captivating manga universes</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">🚀</div>
                    <span className="text-gray-300">Start your adventure right now</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold mr-4">💫</div>
                    <span className="text-gray-300">Join the manga creation revolution</span>
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
                Join Our Community!
              </h2>
              <p className="text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
                With our advanced features, you'll be able to create stunning manga in no time.
                Join thousands of passionate creators on Discord!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <Link
                href="https://discord.gg/9jxTRpmK"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 !text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.8943 4.34399C17.5183 3.71467 16.057 3.256 14.5317 3C14.3396 3.33067 14.1263 3.77866 13.977 4.13067C12.3546 3.89599 10.7439 3.89599 9.14391 4.13067C8.99457 3.77866 8.77056 3.33067 8.58922 3C7.05325 3.256 5.59191 3.71467 4.22552 4.34399C1.46286 8.41865 0.716188 12.3973 1.08952 16.3226C2.92418 17.6559 4.69486 18.4666 6.4346 19C6.86126 18.424 7.24527 17.8053 7.57594 17.1546C6.9466 16.92 6.34927 16.632 5.77327 16.2906C5.9226 16.184 6.07194 16.0667 6.21061 15.9493C9.68793 17.5387 13.4543 17.5387 16.889 15.9493C17.0383 16.0667 17.177 16.184 17.3263 16.2906C16.7503 16.632 16.153 16.92 15.5236 17.1546C15.8543 17.8053 16.2383 18.424 16.665 19C18.4036 18.4666 20.185 17.6559 22.01 16.3226C22.4687 11.7787 21.2836 7.83202 18.8943 4.34399ZM8.05593 13.9013C6.8 13.9013 5.8 12.952 5.8 11.7893C5.8 10.6267 6.8 9.67731 8.05593 9.67731C9.3 9.67731 10.3 10.6267 10.3 11.7893C10.3 12.952 9.3 13.9013 8.05593 13.9013ZM15.065 13.9013C13.8 13.9013 12.8 12.952 12.8 11.7893C12.8 10.6267 13.8 9.67731 15.065 9.67731C16.3 9.67731 17.3 10.6267 17.3 11.7893C17.3 12.952 16.3 13.9013 15.065 13.9013Z" fill="currentColor"/>
                </svg>
                Join Discord
              </Link>

              <Link
                href="https://x.com/try_mangaka_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 !text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 512 462.799" fill="currentColor">
                  <path fillRule="nonzero" d="M403.229 0h78.506L310.219 196.04 512 462.799H354.002L230.261 301.007 88.669 462.799h-78.56l183.455-209.683L0 0h161.999l111.856 147.88L403.229 0zm-27.556 415.805h43.505L138.363 44.527h-46.68l283.99 371.278z"/>
                </svg>
                Follow us
              </Link>

              <Link
                href="/signup"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl !text-white"
              >
                Get Started Now
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
                The AI that democratizes manga creation for all creators.
                Transform your ideas into captivating visual stories.
              </p>
              <div className="flex space-x-4">
                <Link href="/signup" className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-lg font-medium transition-colors !text-white">
                  Get started now
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="#features" className="hover:text-primary-500 transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-primary-500 transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary-500 transition-colors">Dashboard</Link></li>
                <li><Link href="/contact" className="hover:text-primary-500 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-white">Account</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/login" className="hover:text-primary-500 transition-colors">Login</Link></li>
                <li><Link href="/signup" className="hover:text-primary-500 transition-colors">Sign up</Link></li>
                <li><Link href="/forgot-password" className="hover:text-primary-500 transition-colors">Forgot password</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2024 MANGAKA AI. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-primary-500 text-sm transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-primary-500 text-sm transition-colors">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
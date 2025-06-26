import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy - MANGAKA AI',
  description: 'Privacy Policy and data protection information for MANGAKA AI manga creation platform.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link 
            href="/" 
            className="text-primary-500 hover:text-primary-400 transition-colors"
          >
            ← Back to MANGAKA AI
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="prose prose-invert prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
          
          <p className="text-gray-300 mb-8">
            <strong>Last updated:</strong> {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to MANGAKA AI ("we," "our," or "us"). We are committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our 
                manga creation platform and related services.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                By using MANGAKA AI, you agree to the collection and use of information in accordance with this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">2.1 Personal Information</h3>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Email address (for account creation and communication)</li>
                <li>• Username and profile information</li>
                <li>• Payment information (processed securely through Stripe)</li>
                <li>• Subscription and billing details</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">2.2 Content and Usage Data</h3>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Manga projects, characters, and scenes you create</li>
                <li>• Generated images and AI prompts</li>
                <li>• Usage patterns and feature interactions</li>
                <li>• Device information and browser data</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">2.3 Automatically Collected Information</h3>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• IP address and location data</li>
                <li>• Cookies and similar tracking technologies</li>
                <li>• Log files and analytics data</li>
                <li>• Performance and error reporting</li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Provide and maintain our manga creation services</li>
                <li>• Process payments and manage subscriptions</li>
                <li>• Generate AI-powered content based on your prompts</li>
                <li>• Improve our platform and develop new features</li>
                <li>• Send important updates and notifications</li>
                <li>• Provide customer support and technical assistance</li>
                <li>• Ensure platform security and prevent fraud</li>
                <li>• Comply with legal obligations</li>
              </ul>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Third-Party Services</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">4.1 Supabase (Database & Authentication)</h3>
              <p className="text-gray-300 leading-relaxed">
                We use Supabase to store your account data, projects, and generated content. Supabase is GDPR compliant 
                and provides enterprise-grade security for your data.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">4.2 Stripe (Payment Processing)</h3>
              <p className="text-gray-300 leading-relaxed">
                Payment information is processed securely through Stripe. We do not store your credit card details on our servers. 
                Stripe is PCI DSS compliant and handles all payment data securely.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">4.3 XAI Grok 2 (AI Generation)</h3>
              <p className="text-gray-300 leading-relaxed">
                We use XAI Grok 2 API for AI-powered image generation. Your prompts and generated content may be processed 
                by XAI's systems according to their privacy policy.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• With your explicit consent</li>
                <li>• To comply with legal obligations or court orders</li>
                <li>• To protect our rights, property, or safety</li>
                <li>• In connection with a business transfer or merger</li>
                <li>• With trusted service providers (Supabase, Stripe, XAI) under strict confidentiality agreements</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Your Rights (GDPR)</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                Under the General Data Protection Regulation (GDPR), you have the following rights:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• <strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li>• <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li>• <strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                <li>• <strong>Right to Portability:</strong> Receive your data in a structured format</li>
                <li>• <strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                <li>• <strong>Right to Object:</strong> Object to certain types of processing</li>
                <li>• <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                To exercise these rights, please contact us at privacy@mangaka-ai.com
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal data against
                unauthorized access, alteration, disclosure, or destruction. This includes encryption, secure servers,
                regular security audits, and access controls.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal data only as long as necessary to provide our services and comply with legal obligations.
                Account data is retained while your account is active. After account deletion, we may retain certain data
                for legal compliance purposes for up to 7 years.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• <strong>Essential Cookies:</strong> Required for basic functionality</li>
                <li>• <strong>Authentication Cookies:</strong> Keep you logged in</li>
                <li>• <strong>Preference Cookies:</strong> Remember your settings</li>
                <li>• <strong>Analytics Cookies:</strong> Help us improve our service</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                You can control cookies through your browser settings.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
              <p className="text-gray-300 leading-relaxed">
                Your data may be transferred to and processed in countries outside the European Economic Area (EEA).
                We ensure appropriate safeguards are in place, including Standard Contractual Clauses and adequacy decisions.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13. If you become aware that a child has provided us with personal
                information, please contact us immediately.
              </p>
            </section>

            {/* Changes to Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the
                new Privacy Policy on this page and updating the "Last updated" date. Continued use of our service
                after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-dark-800 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> privacy@mangaka-ai.com<br />
                  <strong>Data Protection Officer:</strong> dpo@mangaka-ai.com<br />
                  <strong>Address:</strong> [Your Company Address]
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}

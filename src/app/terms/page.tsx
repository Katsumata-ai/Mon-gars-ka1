import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Service - MANGAKA AI',
  description: 'Terms of Service and conditions of use for MANGAKA AI manga creation platform.',
}

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
          
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
              <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                Welcome to MANGAKA AI ("Service," "we," "our," or "us"). These Terms of Service ("Terms") govern your 
                use of our manga creation platform and related services. By accessing or using MANGAKA AI, you agree 
                to be bound by these Terms.
              </p>
              <p className="text-gray-300 leading-relaxed mt-4">
                If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">2. Service Description</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                MANGAKA AI is an AI-powered platform that enables users to create manga stories, characters, 
                backgrounds, and scenes. Our Service includes:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• AI-powered image generation for manga creation</li>
                <li>• Character, background, and scene creation tools</li>
                <li>• Project management and organization features</li>
                <li>• Export and sharing capabilities</li>
                <li>• Subscription-based premium features</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">3. User Accounts</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">3.1 Account Creation</h3>
              <p className="text-gray-300 leading-relaxed">
                To use certain features of our Service, you must create an account. You agree to provide accurate, 
                current, and complete information and to update such information as necessary.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">3.2 Account Security</h3>
              <p className="text-gray-300 leading-relaxed">
                You are responsible for maintaining the confidentiality of your account credentials and for all 
                activities that occur under your account. You agree to notify us immediately of any unauthorized use.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">3.3 Account Termination</h3>
              <p className="text-gray-300 leading-relaxed">
                You may delete your account at any time through your account settings. We may suspend or terminate 
                your account if you violate these Terms.
              </p>
            </section>

            {/* Subscription Plans */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">4. Subscription Plans and Billing</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">4.1 Free and Premium Plans</h3>
              <p className="text-gray-300 leading-relaxed">
                We offer both free and premium subscription plans. Free plans have usage limitations, while premium 
                plans provide unlimited access to features.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">4.2 Payment Terms</h3>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>• All payments are processed securely through Stripe</li>
                <li>• Prices are subject to change with 30 days notice</li>
                <li>• All fees are non-refundable except as required by law</li>
              </ul>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">4.3 Automatic Renewal</h3>
              <p className="text-gray-300 leading-relaxed">
                Subscriptions automatically renew unless cancelled before the renewal date. You can cancel your 
                subscription at any time through your account settings.
              </p>
            </section>

            {/* Refund Policy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">5. Refund Policy</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We offer a limited refund policy:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• <strong>7-day refund window:</strong> Full refund available within 7 days of initial purchase</li>
                <li>• <strong>Technical issues:</strong> Refunds may be provided for unresolved technical problems</li>
                <li>• <strong>Unused subscriptions:</strong> Pro-rated refunds for cancelled annual subscriptions</li>
                <li>• <strong>No refunds for:</strong> Partial months, content violations, or account terminations</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mt-4">
                To request a refund, contact us at support@mangaka-ai.com with your order details.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">6. Acceptable Use Policy</h2>
              
              <h3 className="text-xl font-medium text-white mb-3">6.1 Permitted Uses</h3>
              <p className="text-gray-300 leading-relaxed">
                You may use our Service to create original manga content for personal, educational, or commercial purposes, 
                provided you comply with these Terms and applicable laws.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">6.2 Prohibited Uses</h3>
              <p className="text-gray-300 leading-relaxed mb-4">You agree not to use our Service to:</p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Create content that is illegal, harmful, or violates others' rights</li>
                <li>• Generate explicit, violent, or inappropriate content involving minors</li>
                <li>• Infringe on copyrights, trademarks, or other intellectual property</li>
                <li>• Harass, threaten, or harm others</li>
                <li>• Distribute malware or engage in fraudulent activities</li>
                <li>• Attempt to reverse engineer or hack our systems</li>
                <li>• Share account credentials or circumvent usage limits</li>
              </ul>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">7. Intellectual Property Rights</h2>

              <h3 className="text-xl font-medium text-white mb-3">7.1 Your Content</h3>
              <p className="text-gray-300 leading-relaxed">
                You retain ownership of the manga content you create using our Service. By using our Service, you grant
                us a limited license to process, store, and display your content solely to provide our services.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">7.2 Our Platform</h3>
              <p className="text-gray-300 leading-relaxed">
                MANGAKA AI, including our software, algorithms, and platform features, is protected by intellectual
                property laws. You may not copy, modify, or distribute our platform without permission.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">7.3 AI-Generated Content</h3>
              <p className="text-gray-300 leading-relaxed">
                Content generated by our AI tools is provided "as is." While you can use AI-generated content in your
                projects, we cannot guarantee its originality or freedom from third-party claims.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                To the maximum extent permitted by law:
              </p>
              <ul className="text-gray-300 space-y-2 ml-6">
                <li>• Our Service is provided "as is" without warranties of any kind</li>
                <li>• We are not liable for any indirect, incidental, or consequential damages</li>
                <li>• Our total liability is limited to the amount you paid in the last 12 months</li>
                <li>• We are not responsible for third-party content or services</li>
                <li>• We do not guarantee uninterrupted or error-free service</li>
              </ul>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">9. Data and Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Your privacy is important to us. Our collection and use of personal information is governed by our
                <Link href="/privacy" className="text-primary-500 hover:text-primary-400 underline">
                  Privacy Policy
                </Link>, which is incorporated into these Terms by reference.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">10. Service Availability</h2>
              <p className="text-gray-300 leading-relaxed">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. We may
                temporarily suspend the Service for maintenance, updates, or technical issues. We will provide
                reasonable notice when possible.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">11. Termination</h2>

              <h3 className="text-xl font-medium text-white mb-3">11.1 Termination by You</h3>
              <p className="text-gray-300 leading-relaxed">
                You may terminate your account at any time by following the account deletion process in your settings.
                Termination does not entitle you to a refund of prepaid fees.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">11.2 Termination by Us</h3>
              <p className="text-gray-300 leading-relaxed">
                We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent
                activity, or for any other reason at our sole discretion.
              </p>

              <h3 className="text-xl font-medium text-white mb-3 mt-6">11.3 Effect of Termination</h3>
              <p className="text-gray-300 leading-relaxed">
                Upon termination, your access to the Service will cease, and we may delete your account data after
                a reasonable period, subject to our data retention policies.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">12. Governing Law and Disputes</h2>
              <p className="text-gray-300 leading-relaxed">
                These Terms are governed by the laws of [Your Jurisdiction]. Any disputes will be resolved through
                binding arbitration or in the courts of [Your Jurisdiction]. You waive any right to participate in
                class action lawsuits.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">13. Changes to Terms</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update these Terms from time to time. We will notify you of material changes by email or
                through our Service. Continued use after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Severability */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">14. Severability</h2>
              <p className="text-gray-300 leading-relaxed">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain
                in full force and effect.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">15. Contact Information</h2>
              <p className="text-gray-300 leading-relaxed">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="mt-4 p-4 bg-dark-800 rounded-lg">
                <p className="text-gray-300">
                  <strong>Email:</strong> legal@mangaka-ai.com<br />
                  <strong>Support:</strong> support@mangaka-ai.com<br />
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

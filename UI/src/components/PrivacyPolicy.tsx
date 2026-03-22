import { ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Globe, Mail } from "lucide-react";

interface PrivacyPolicyProps {
  onBack: () => void;
}

export function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-teal-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-slate-900 text-2xl sm:text-3xl">Privacy Policy</h1>
              <p className="text-slate-600 text-sm">Last Updated: December 27, 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-8">
          
          {/* Privacy Commitment */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-teal-900 text-sm mb-1">Our Commitment to Your Privacy</div>
              <p className="text-teal-800 text-xs leading-relaxed">
                At Green Turtle Trades, we take your privacy seriously. Your trade data is YOUR property. We never sell, rent, or share your personal trading data 
                with third parties. This policy explains what data we collect, how we use it, and your rights.
              </p>
            </div>
          </div>

          {/* Section 1: Introduction */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">1</span>
              Introduction
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                Green Turtle Trades ("we", "us", or "our") operates the Green Turtle Trades platform (the "Platform"). This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our Platform.
              </p>
              <p>
                By using the Platform, you consent to the data practices described in this policy. If you do not agree with this policy, please do not use the Platform.
              </p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <Database className="w-4 h-4" />
              </span>
              Information We Collect
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-4 pl-10">
              
              {/* Personal Information */}
              <div>
                <h3 className="text-slate-900 font-medium mb-2">2.1 Personal Information You Provide</h3>
                <p className="text-xs mb-2">When you create an account, we collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-xs">
                  <li><strong>Account Information:</strong> Full name, email address, password (encrypted)</li>
                  <li><strong>Billing Information:</strong> Payment card details (processed securely by Stripe, we do NOT store full card numbers)</li>
                  <li><strong>MetaTrader Information:</strong> MT4/MT5 account username (for trade synchronization)</li>
                  <li><strong>Profile Information:</strong> Any additional information you choose to provide</li>
                </ul>
              </div>

              {/* Trading Data */}
              <div>
                <h3 className="text-slate-900 font-medium mb-2">2.2 Trading Data</h3>
                <p className="text-xs mb-2">When you use Turtle Analytics and the Trading Journal, we collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-xs">
                  <li><strong>Trade History:</strong> Entry/exit prices, timestamps, currency pairs, position sizes, profit/loss, R-multiples</li>
                  <li><strong>Journal Entries:</strong> Your notes, emotions, lessons learned, market observations</li>
                  <li><strong>Market Data:</strong> Volatility, spread, session times (used for regime clustering analysis)</li>
                  <li><strong>Performance Metrics:</strong> Win rate, Sharpe ratio, drawdown, consecutive losses</li>
                </ul>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-2">
                  <p className="text-xs text-slate-700">
                    <strong>🔒 Privacy Guarantee:</strong> Your individual trade data is never shared with other traders. Each trader's Turtle Analytics system 
                    operates independently on their own data only. We do not use your trades to train models for other users.
                  </p>
                </div>
              </div>

              {/* Automatically Collected Information */}
              <div>
                <h3 className="text-slate-900 font-medium mb-2">2.3 Information Collected Automatically</h3>
                <p className="text-xs mb-2">When you access the Platform, we automatically collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-xs">
                  <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, clicks, navigation paths</li>
                  <li><strong>Device Information:</strong> Browser type, operating system, device type, screen resolution</li>
                  <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                  <li><strong>Cookies:</strong> Session cookies for authentication, preference cookies for settings (see Section 7)</li>
                </ul>
              </div>

            </div>
          </section>

          {/* Section 3: How We Use Your Information */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <Eye className="w-4 h-4" />
              </span>
              How We Use Your Information
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">We use the information we collect to:</p>
              
              <div className="space-y-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">✓ Provide Our Services</div>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li>Generate your personalised Turtle Analytics insights</li>
                    <li>Run counterfactual simulations, Bayesian optimisation, and ML analysis on YOUR trade data</li>
                    <li>Store and display your trading journal entries</li>
                    <li>Synchronize trades from your MetaTrader account</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">✓ Process Payments</div>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li>Charge subscription fees and usage-based fees (Pay-As-You-Go plan)</li>
                    <li>Send payment confirmations and receipts</li>
                    <li>Detect and prevent fraudulent transactions</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">✓ Improve Our Platform</div>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li>Analyse usage patterns to improve features (using anonymised, aggregated data)</li>
                    <li>Debug technical issues and optimise performance</li>
                    <li>Develop new features and machine learning models</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">✓ Communicate With You</div>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li>Send transactional emails (account confirmations, password resets, payment receipts)</li>
                    <li>Notify you of important Platform updates or changes to terms</li>
                    <li>Respond to your inquiries and support requests</li>
                    <li>Send optional marketing emails about new features (you can opt out anytime)</li>
                  </ul>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">✓ Ensure Security & Compliance</div>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li>Detect and prevent fraud, abuse, or security threats</li>
                    <li>Enforce our Terms of Service</li>
                    <li>Comply with legal obligations and law enforcement requests</li>
                  </ul>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4">
                <p className="text-amber-900 text-xs">
                  <strong>What We DON'T Do:</strong> We do not sell your data to third parties. We do not use your individual trade data to train models for other traders. 
                  We do not share your personal information with advertisers or data brokers.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Data Sharing & Disclosure */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <Globe className="w-4 h-4" />
              </span>
              Data Sharing & Disclosure
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">We may share your information in the following limited circumstances:</p>
              
              <div className="space-y-3">
                <div>
                  <h3 className="text-slate-900 text-xs font-medium mb-1">4.1 Service Providers</h3>
                  <p className="text-xs text-slate-600 mb-2">
                    We use trusted third-party service providers to help us operate the Platform:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600">
                    <li><strong>Stripe:</strong> Payment processing (PCI-DSS compliant, they never share full card numbers with us)</li>
                    <li><strong>AWS/Cloud Hosting:</strong> Secure data storage and server infrastructure</li>
                    <li><strong>Email Service:</strong> Transactional and marketing emails (e.g., SendGrid, Mailgun)</li>
                    <li><strong>Analytics:</strong> Anonymous usage analytics to improve the platform</li>
                  </ul>
                  <p className="text-xs text-slate-600 mt-2">
                    These providers are contractually obligated to use your data only for providing services to us and must maintain confidentiality.
                  </p>
                </div>

                <div>
                  <h3 className="text-slate-900 text-xs font-medium mb-1">4.2 Legal Requirements</h3>
                  <p className="text-xs text-slate-600">
                    We may disclose your information if required by law, subpoena, court order, or government request, or to protect the rights, 
                    property, or safety of Green Turtle Trades, our users, or the public.
                  </p>
                </div>

                <div>
                  <h3 className="text-slate-900 text-xs font-medium mb-1">4.3 Business Transfers</h3>
                  <p className="text-xs text-slate-600">
                    If Green Turtle Trades is acquired, merged, or undergoes a business restructuring, your information may be transferred as part of that transaction. 
                    We will notify you via email before your information becomes subject to a different privacy policy.
                  </p>
                </div>

                <div>
                  <h3 className="text-slate-900 text-xs font-medium mb-1">4.4 Aggregated Data</h3>
                  <p className="text-xs text-slate-600">
                    We may share anonymized, aggregated statistics about platform usage (e.g., "80% of traders improve after adjusting their stop loss") 
                    for research, marketing, or partnership purposes. This data cannot be used to identify individual users.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Data Security */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <Lock className="w-4 h-4" />
              </span>
              Data Security
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                We implement industry-standard security measures to protect your information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">🔐 Encryption</div>
                  <p className="text-xs text-slate-600">
                    All data transmitted between your browser and our servers uses TLS/SSL encryption. Passwords are hashed using bcrypt.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">☁️ Secure Hosting</div>
                  <p className="text-xs text-slate-600">
                    Data is stored on secure, encrypted servers with AWS (or similar) with regular backups and disaster recovery.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">🔑 Access Controls</div>
                  <p className="text-xs text-slate-600">
                    Only authorised personnel have access to user data, and access is logged and monitored.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">🛡️ Regular Audits</div>
                  <p className="text-xs text-slate-600">
                    We conduct regular security audits and penetration testing to identify and fix vulnerabilities.
                  </p>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-3">
                <strong>Important:</strong> While we use industry-standard security measures, no system is 100% secure. You are responsible for keeping your 
                account credentials confidential and should use a strong, unique password.
              </p>
            </div>
          </section>

          {/* Section 6: Data Retention */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">6</span>
              Data Retention
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs">
                <li><strong>Active Accounts:</strong> We retain your data for as long as your account is active</li>
                <li><strong>Cancelled Accounts:</strong> After account cancellation, we retain your data for 90 days (for recovery purposes) before permanent deletion</li>
                <li><strong>Financial Records:</strong> Billing and payment records are retained for 7 years for tax and legal compliance</li>
                <li><strong>Anonymous Analytics:</strong> Aggregated usage statistics may be retained indefinitely as they cannot identify individuals</li>
              </ul>
              <p className="text-xs text-teal-700 mt-3">
                You can request immediate account deletion at any time by contacting contact@greenturtletraders.co.uk.
              </p>
            </div>
          </section>

          {/* Section 7: Cookies & Tracking */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">7</span>
              Cookies & Tracking Technologies
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">Essential Cookies (Required)</div>
                  <p className="text-xs text-slate-600">
                    These cookies are necessary for authentication, session management, and security. You cannot opt out of these cookies.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">Preference Cookies (Optional)</div>
                  <p className="text-xs text-slate-600">
                    Remember your settings (e.g., theme, language, dashboard layout). You can clear these through your browser settings.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="text-slate-900 text-xs font-medium mb-1">Analytics Cookies (Optional)</div>
                  <p className="text-xs text-slate-600">
                    Help us understand how users interact with the Platform (e.g., which features are most popular). Data is anonymized.
                  </p>
                </div>
              </div>
              <p className="text-xs mt-3">
                Most browsers allow you to block or delete cookies through their settings. Note that blocking cookies may affect Platform functionality.
              </p>
            </div>
          </section>

          {/* Section 8: Your Rights & Choices */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <UserCheck className="w-4 h-4" />
              </span>
              Your Rights & Choices
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                You have the following rights regarding your personal information:
              </p>
              <div className="space-y-3">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-teal-900 text-xs font-medium mb-1">✓ Access Your Data</div>
                  <p className="text-xs text-teal-800">
                    You can view and export your trade data, journal entries, and account information through the Settings page.
                  </p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-teal-900 text-xs font-medium mb-1">✓ Correct Inaccuracies</div>
                  <p className="text-xs text-teal-800">
                    You can update your account information, trade entries, and journal notes at any time through your dashboard.
                  </p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-teal-900 text-xs font-medium mb-1">✓ Delete Your Data</div>
                  <p className="text-xs text-teal-800">
                    You can delete individual trade entries or request full account deletion by contacting support. We'll delete your data within 90 days.
                  </p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-teal-900 text-xs font-medium mb-1">✓ Opt Out of Marketing</div>
                  <p className="text-xs text-teal-800">
                    You can unsubscribe from promotional emails using the "unsubscribe" link in any marketing email. You'll still receive transactional emails.
                  </p>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                  <div className="text-teal-900 text-xs font-medium mb-1">✓ Data Portability</div>
                  <p className="text-xs text-teal-800">
                    You can export your trade history and journal entries in CSV or JSON format from the Settings page.
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3">
                To exercise any of these rights, contact us at <a href="mailto:privacy@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">privacy@greenturtletraders.co.uk</a>. 
                We'll respond within 30 days.
              </p>
            </div>
          </section>

          {/* Section 9: International Users */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">9</span>
              International Users & Data Transfers
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                Green Turtle Trades is based in the United States. If you access the Platform from outside the US, your information will be transferred to, 
                stored, and processed in the United States.
              </p>
              <p className="text-xs">
                The United States may have data protection laws that differ from those in your country. By using the Platform, you consent to the transfer 
                of your information to the US and the processing of your data in accordance with this Privacy Policy and applicable US law.
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mt-3">
                <p className="text-xs text-slate-700">
                  <strong>GDPR (EU Users):</strong> If you are in the European Union, you have additional rights under GDPR, including the right to object to processing, 
                  the right to lodge a complaint with a supervisory authority, and the right to data portability. Contact us at privacy@greenturtletraders.co.uk for GDPR requests.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10: Children's Privacy */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">10</span>
              Children's Privacy
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                The Platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. 
                If we discover that we have inadvertently collected information from a child under 18, we will delete it immediately.
              </p>
              <p className="text-xs">
                If you believe we have collected information from a minor, please contact us at privacy@greenturtletraders.co.uk.
              </p>
            </div>
          </section>

          {/* Section 11: Third-Party Links */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">11</span>
              Third-Party Links
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                The Platform may contain links to third-party websites or services (e.g., MetaTrader, payment processors, educational resources). 
                We are not responsible for the privacy practices of these third parties.
              </p>
              <p className="text-xs">
                We encourage you to review the privacy policies of any third-party services you access through our Platform.
              </p>
            </div>
          </section>

          {/* Section 12: Changes to This Policy */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">12</span>
              Changes to This Privacy Policy
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal/regulatory reasons. When we make material changes, 
                we will notify you via email or through a prominent notice on the Platform at least 30 days before the changes take effect.
              </p>
              <p className="text-xs">
                The "Last Updated" date at the top of this policy indicates when it was last revised. Your continued use of the Platform after changes 
                become effective constitutes your acceptance of the updated policy.
              </p>
            </div>
          </section>

          {/* Section 13: Contact Us */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">
                <Mail className="w-4 h-4" />
              </span>
              Contact Us
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="text-xs">
                  <strong>Privacy Inquiries:</strong> <a href="mailto:privacy@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">privacy@greenturtletraders.co.uk</a>
                </div>
                <div className="text-xs">
                  <strong>Data Protection Officer:</strong> <a href="mailto:dpo@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">dpo@greenturtletraders.co.uk</a>
                </div>
                <div className="text-xs">
                  <strong>General Support:</strong> <a href="mailto:contact@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">contact@greenturtletraders.co.uk</a>
                </div>
                <div className="text-xs mt-3">
                  <strong>Mail:</strong><br />
                  Green Turtle Trades Ltd<br />
                  Attn: Privacy Department<br />
                  123 Canary Wharf<br />
                  London E14 5AB<br />
                  United Kingdom
                </div>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-teal-900 text-xs leading-relaxed">
              <strong>Acknowledgment:</strong> By using Green Turtle Trades, you acknowledge that you have read, understood, and agree to this Privacy Policy.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
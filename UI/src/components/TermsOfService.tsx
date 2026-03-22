import { ArrowLeft, FileText, Shield, AlertTriangle } from "lucide-react";

interface TermsOfServiceProps {
  onBack: () => void;
}

export function TermsOfService({ onBack }: TermsOfServiceProps) {
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
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-slate-900 text-2xl sm:text-3xl">Terms of Service</h1>
              <p className="text-slate-600 text-sm">Last Updated: 22 Mar 2026</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-8">
          
          {/* Important Notice */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-amber-900 text-sm mb-1">Important Notice</div>
              <p className="text-amber-800 text-xs leading-relaxed">
                Trading forex, CFDs, and other leveraged instruments involves substantial risk of loss and may not be suitable for all investors. 
                Past performance is not indicative of future results. Please read these terms carefully before using our platform.
              </p>
            </div>
          </div>

          {/* Section 1: Agreement to Terms */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">1</span>
              Agreement to Terms
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                By accessing or using Green Turtle Trades ("the Platform", "we", "us", or "our"), you agree to be bound by these Terms of Service and all applicable laws and regulations. 
                If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
              </p>
              <p>
                These terms apply to all users of the Platform, including without limitation traders, investors, and browsers.
              </p>
            </div>
          </section>

          {/* Section 2: Service Description */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">2</span>
              Service Description
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                Green Turtle Trades provides:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Turtle Analytics:</strong> A machine learning-powered analytics system for traders that analyses historical trade data using counterfactual simulations, 
                  Bayesian optimisation, survival analysis, and unsupervised clustering to generate personalised performance insights.
                </li>
                <li>
                  <strong>Trading Journal:</strong> A comprehensive trade journaling system for documenting trades, emotions, lessons learned, and market conditions.
                </li>
                <li>
                  <strong>MetaTrader Integration:</strong> Expert Advisor (EA) integration for automated trade synchronization with MT4/MT5 platforms.
                </li>
              </ul>
              <p className="text-slate-600 text-xs italic">
                Note: Green Turtle Trades is an analytics and journaling platform. We do not provide investment advice, execute trades on your behalf, 
                or manage investment accounts.
              </p>
            </div>
          </section>

          {/* Section 3: Subscription Plans */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">3</span>
              Subscription Plans & Billing
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                We offer two subscription tiers:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-slate-900 font-medium mb-1">Pay-As-You-Go</div>
                  <p className="text-slate-600 text-xs">
                    £25/month base fee + £0.20 per trade analysed.
                  </p>
                </div>
              </div>
              <p>
                <strong>Billing Terms:</strong>
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs">
                <li>All subscriptions are billed monthly in advance</li>
                <li>Pay-As-You-Go usage fees are billed at the end of each billing cycle</li>
                <li>Payments are processed via secure third-party payment processors (Stripe)</li>
                <li>You authorise us to charge your payment method on file for recurring subscription fees</li>
                <li>Failed payments may result in suspension of service until payment is resolved</li>
                <li>Refunds are provided on a case-by-case basis within 14 days of initial purchase only</li>
              </ul>
            </div>
          </section>

          {/* Section 4: Account Responsibilities */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">4</span>
              Account Responsibilities
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                You are responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Ensuring the accuracy of information provided during registration</li>
                <li>Notifying us immediately of any unauthorised use of your account</li>
                <li>Using the Platform in compliance with all applicable laws and regulations</li>
              </ul>
              <p className="text-amber-700 text-xs mt-3">
                You must be at least 18 years old to use this Platform.
              </p>
            </div>
          </section>

          {/* Section 5: Data Privacy & Security */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">5</span>
              Data Privacy & Security
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                <strong>Your Trade Data:</strong> All trade data you submit to the Platform remains your property. We use your trade data solely to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs">
                <li>Generate your personalised Turtle Analytics insights</li>
                <li>Provide trade journaling functionality</li>
                <li>Improve our machine learning algorithms (using anonymized, aggregated data only)</li>
              </ul>
              <p className="text-xs">
                <strong>No Cross-Trader Data Sharing:</strong> Your individual trade data is never shared with other traders or used to train models for other users. 
                Each trader's Turtle Analytics system operates independently on their own historical data.
              </p>
              <p className="text-xs">
                For complete details on data collection and usage, please review our <span className="text-teal-600">Privacy Policy</span>.
              </p>
            </div>
          </section>

          {/* Section 6: Risk Disclosure */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-700 text-sm">6</span>
              Risk Disclosure
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2 mb-2">
                  <Shield className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-900 font-medium text-sm">Important Risk Warning</div>
                </div>
                <p className="text-red-800 text-xs leading-relaxed">
                  Trading foreign exchange (forex), contracts for difference (CFDs), and other leveraged instruments carries a high level of risk and may not be suitable for all investors. 
                  The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, 
                  level of experience, and risk appetite.
                </p>
              </div>
              <p className="text-xs">
                <strong>No Guarantees:</strong> Past performance is not indicative of future results. Turtle Analytics provides statistical insights based on your historical data 
                but cannot predict future market movements or guarantee profitable trades.
              </p>
              <p className="text-xs">
                <strong>Not Financial Advice:</strong> The insights and recommendations provided by Turtle Analytics are for informational purposes only and do not constitute 
                financial, investment, or trading advice. You are solely responsible for your trading decisions.
              </p>
              <p className="text-xs text-red-700">
                <strong>You should only trade with money you can afford to lose.</strong>
              </p>
            </div>
          </section>

          {/* Section 7: Prohibited Activities */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">7</span>
              Prohibited Activities
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p>
                You agree NOT to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-xs">
                <li>Use the Platform for any illegal or unauthorised purpose</li>
                <li>Attempt to gain unauthorised access to our systems or other users' accounts</li>
                <li>Upload malicious code, viruses, or any harmful software</li>
                <li>Scrape, data-mine, or systematically extract data from the Platform</li>
                <li>Share your account credentials with others or create multiple accounts</li>
                <li>Reverse engineer, decompile, or attempt to extract the source code of our algorithms</li>
                <li>Use the Platform to provide services to third parties without our written consent</li>
                <li>Submit false, misleading, or fraudulent information</li>
              </ul>
              <p className="text-red-700 text-xs">
                Violation of these terms may result in immediate account termination without refund.
              </p>
            </div>
          </section>

          {/* Section 8: Intellectual Property */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">8</span>
              Intellectual Property
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                All content, features, functionality, algorithms, machine learning models, code, and materials on the Platform are owned by Green Turtle Trades 
                and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
              <p className="text-xs">
                You may not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any 
                of our proprietary materials without prior written consent.
              </p>
            </div>
          </section>

          {/* Section 9: Termination */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">9</span>
              Termination
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                <strong>By You:</strong> You may cancel your subscription at any time through the Settings page. Cancellation takes effect at the end of your current billing period. 
                No refunds will be provided for partial months.
              </p>
              <p className="text-xs">
                <strong>By Us:</strong> We reserve the right to suspend or terminate your access to the Platform at our sole discretion, without notice, for conduct that we believe:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>Violates these Terms of Service</li>
                <li>Is harmful to other users, us, or third parties</li>
                <li>Violates applicable laws or regulations</li>
                <li>Involves fraudulent or suspicious activity</li>
              </ul>
            </div>
          </section>

          {/* Section 10: Limitation of Liability */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">10</span>
              Limitation of Liability
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-xs uppercase text-slate-600 mb-2">IMPORTANT LEGAL NOTICE</p>
                <p className="text-xs leading-relaxed">
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, GREEN TURTLE TRADES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, 
                  OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR TRADING LOSSES, WHETHER ARISING IN CONTRACT, TORT (INCLUDING NEGLIGENCE), 
                  OR OTHERWISE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
                </p>
                <p className="text-xs leading-relaxed mt-3">
                  OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM YOUR USE OF THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN SUBSCRIPTION FEES 
                  IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO LIABILITY.
                </p>
              </div>
            </div>
          </section>

          {/* Section 11: Disclaimer of Warranties */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">11</span>
              Disclaimer of Warranties
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO 
                IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p className="text-xs">
                We do not warrant that:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>The Platform will be uninterrupted, timely, secure, or error-free</li>
                <li>The results obtained from using the Platform will be accurate or reliable</li>
                <li>Any errors in the Platform will be corrected</li>
                <li>The Platform or servers are free of viruses or other harmful components</li>
              </ul>
            </div>
          </section>

          {/* Section 12: Changes to Terms */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">12</span>
              Changes to Terms
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                We reserve the right to modify these Terms of Service at any time. When we make material changes, we will notify you via email or through a prominent notice 
                on the Platform at least 30 days before the changes take effect.
              </p>
              <p className="text-xs">
                Your continued use of the Platform after changes become effective constitutes your acceptance of the revised terms.
              </p>
            </div>
          </section>

          {/* Section 13: Governing Law */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">13</span>
              Governing Law & Dispute Resolution
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                These Terms of Service shall be governed by and construed in accordance with the laws of England and Wales, 
                without regard to its conflict of law provisions.
              </p>
              <p className="text-xs">
                Any disputes arising from these terms or your use of the Platform shall be subject to the exclusive jurisdiction of the 
                courts of England and Wales.
              </p>
            </div>
          </section>

          {/* Section 14: Contact Information */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-700 text-sm">14</span>
              Contact Us
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3 pl-10">
              <p className="text-xs">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="text-xs">
                  <strong>Email:</strong> <a href="mailto:legal@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">legal@greenturtletraders.co.uk</a>
                </div>
                <div className="text-xs">
                  <strong>Mail:</strong><br />
                  GREEN TURTLE TRADES LIMITED<br />
                  Legal Department<br />
                  5 South Charlotte Street<br />
                  Edinburgh EH2 4AN<br />
                  United Kingdom
                </div>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-teal-900 text-xs leading-relaxed">
              <strong>Acknowledgment:</strong> By using Green Turtle Trades, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

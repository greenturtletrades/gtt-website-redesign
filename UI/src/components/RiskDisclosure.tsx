import { ArrowLeft, AlertTriangle, TrendingDown, Shield, DollarSign } from "lucide-react";

interface RiskDisclosureProps {
  onBack: () => void;
}

export function RiskDisclosure({ onBack }: RiskDisclosureProps) {
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
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-slate-900 text-2xl sm:text-3xl">Risk Disclosure</h1>
              <p className="text-slate-600 text-sm">Last Updated: December 27, 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 space-y-8">
          
          {/* Critical Warning */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
            <div className="flex items-start gap-3 mb-3">
              <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0" />
              <div>
                <div className="text-red-900 mb-2 text-lg">CRITICAL RISK WARNING</div>
                <p className="text-red-800 text-sm leading-relaxed">
                  Trading foreign exchange (forex), contracts for difference (CFDs), and other leveraged financial instruments carries an extremely high level of risk 
                  and may result in the loss of all your invested capital. These products may not be suitable for all investors.
                </p>
              </div>
            </div>
            <div className="bg-red-600 text-white text-center py-3 rounded-lg text-sm mt-4">
              <strong>YOU SHOULD ONLY TRADE WITH MONEY YOU CAN AFFORD TO LOSE</strong>
            </div>
          </div>

          {/* Introduction */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3">Introduction</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3">
              <p>
                This Risk Disclosure Statement is provided to help you understand the risks associated with trading leveraged financial instruments 
                and using Green Turtle Trades' analytics platform.
              </p>
              <p>
                <strong>Green Turtle Trades is NOT a broker, investment advisor, or financial institution.</strong> We provide analytical tools and educational 
                insights to help traders understand their historical performance. We do not execute trades, provide investment advice, or guarantee profits.
              </p>
              <p className="text-amber-700">
                Before you begin trading, you should carefully consider your investment objectives, level of experience, and risk tolerance. 
                If you have any doubts, seek advice from an independent financial advisor.
              </p>
            </div>
          </section>

          {/* Key Risks */}
          <section>
            <h2 className="text-slate-900 text-xl mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-red-600" />
              Key Risks of Trading
            </h2>
            
            <div className="space-y-4">
              {/* Risk 1: Leverage */}
              <div className="border-l-4 border-red-500 bg-red-50 p-4">
                <h3 className="text-red-900 font-medium mb-2">1. Leverage Risk</h3>
                <p className="text-red-800 text-sm leading-relaxed mb-2">
                  Leverage allows you to control large positions with a small amount of capital. While this can magnify profits, it also magnifies losses.
                </p>
                <div className="bg-white border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-slate-700 mb-2"><strong>Example:</strong></p>
                  <p className="text-xs text-slate-600">
                    With 100:1 leverage, a 1% market move against you results in a 100% loss of your position. You can lose more than your initial investment 
                    if your broker does not provide negative balance protection.
                  </p>
                </div>
              </div>

              {/* Risk 2: Volatility */}
              <div className="border-l-4 border-amber-500 bg-amber-50 p-4">
                <h3 className="text-amber-900 font-medium mb-2">2. Market Volatility</h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Currency pairs and CFDs can experience rapid price movements, especially during:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-amber-800 mt-2">
                  <li>Economic news releases (NFP, interest rate decisions, GDP reports)</li>
                  <li>Geopolitical events (elections, conflicts, trade disputes)</li>
                  <li>Market opening/closing times</li>
                  <li>Low liquidity periods (Asian session, holidays)</li>
                </ul>
                <p className="text-xs text-amber-700 mt-2">
                  Sudden volatility can trigger stop losses or prevent you from exiting positions at your desired price (slippage).
                </p>
              </div>

              {/* Risk 3: Liquidity */}
              <div className="border-l-4 border-orange-500 bg-orange-50 p-4">
                <h3 className="text-orange-900 font-medium mb-2">3. Liquidity Risk</h3>
                <p className="text-orange-800 text-sm leading-relaxed">
                  During periods of low liquidity or extreme volatility, you may not be able to close your position at your desired price—or at all. 
                  This can occur during:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-orange-800 mt-2">
                  <li>Market gaps (price jumps over your stop loss)</li>
                  <li>Flash crashes (sudden, extreme price movements)</li>
                  <li>Broker system outages</li>
                  <li>Weekend gaps (markets closed, news events occur)</li>
                </ul>
              </div>

              {/* Risk 4: Margin Calls */}
              <div className="border-l-4 border-red-600 bg-red-50 p-4">
                <h3 className="text-red-900 font-medium mb-2">4. Margin Calls & Forced Liquidation</h3>
                <p className="text-red-800 text-sm leading-relaxed">
                  If your account equity falls below the required margin level, your broker may issue a margin call, requiring you to deposit additional funds. 
                  If you cannot meet the margin call, your broker may forcibly close your positions at a loss—possibly at unfavorable prices.
                </p>
              </div>

              {/* Risk 5: Counterparty Risk */}
              <div className="border-l-4 border-slate-500 bg-slate-50 p-4">
                <h3 className="text-slate-900 font-medium mb-2">5. Counterparty & Broker Risk</h3>
                <p className="text-slate-800 text-sm leading-relaxed">
                  Your broker is your counterparty for CFD trades. If your broker becomes insolvent or fails to execute trades properly, you may lose funds. 
                  Always use a regulated broker and verify they have investor protection schemes.
                </p>
              </div>

              {/* Risk 6: Technology Risk */}
              <div className="border-l-4 border-slate-500 bg-slate-50 p-4">
                <h3 className="text-slate-900 font-medium mb-2">6. Technology & Platform Risk</h3>
                <p className="text-slate-800 text-sm leading-relaxed">
                  Internet outages, software bugs, broker server downtime, or latency issues can prevent you from entering or exiting trades. 
                  Green Turtle Trades is not liable for losses resulting from technical issues with your broker, internet connection, or MetaTrader platform.
                </p>
              </div>
            </div>
          </section>

          {/* Turtle Analytics Specific Risks */}
          <section>
            <h2 className="text-slate-900 text-xl mb-4 flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-600" />
              Risks Related to Turtle Analytics
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-slate-900 font-medium mb-2 text-sm">Past Performance ≠ Future Results</h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Turtle Analytics analyses your <strong>historical</strong> trade data to identify patterns and optimise parameters. However:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 mt-2">
                  <li>Market conditions change. What worked in the past may not work in the future.</li>
                  <li>Statistical models can overfit to historical data (especially with small sample sizes).</li>
                  <li>Black swan events (rare, unpredictable events) can invalidate historical patterns.</li>
                </ul>
                <p className="text-amber-700 text-xs mt-2">
                  <strong>The optimised settings suggested by Bayesian optimisation are NOT guaranteed to produce profits in future trades.</strong>
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-slate-900 font-medium mb-2 text-sm">Not Financial Advice</h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Turtle Analytics provides <strong>informational insights</strong> based on your data. These insights are NOT:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 mt-2">
                  <li>Investment advice or trading recommendations</li>
                  <li>Predictions about future price movements</li>
                  <li>Guarantees of profitability</li>
                  <li>Endorsements of specific trading strategies</li>
                </ul>
                <p className="text-slate-700 text-xs mt-2">
                  <strong>You are solely responsible for your trading decisions.</strong> Always do your own research and consider seeking advice from a licensed financial advisor.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-slate-900 font-medium mb-2 text-sm">Data Quality Matters</h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  The accuracy of Turtle Analytics depends on the quality and completeness of your trade data. Garbage in = garbage out. Ensure your:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 mt-2">
                  <li>Trade history is complete and accurate</li>
                  <li>MetaTrader account is properly connected</li>
                  <li>Sample size is large enough (we recommend at least 100+ trades for reliable insights)</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <h3 className="text-slate-900 font-medium mb-2 text-sm">Simulation Limitations</h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  Counterfactual simulations assume you could have exited at exact SL/TP levels. In reality:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-xs text-slate-600 mt-2">
                  <li>Slippage may cause exits at worse prices than expected</li>
                  <li>Spread widens during volatile periods, affecting entry/exit prices</li>
                  <li>Broker execution speed varies</li>
                  <li>Gaps can skip over your stop loss entirely</li>
                </ul>
                <p className="text-amber-700 text-xs mt-2">
                  Simulated performance may be better than achievable real-world performance.
                </p>
              </div>
            </div>
          </section>

          {/* Statistical Considerations */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3">Statistical & Methodological Considerations</h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-900 font-medium mb-2 text-sm">Confidence Intervals Are Not Guarantees</h3>
                <p className="text-amber-800 text-xs leading-relaxed">
                  When we show "95% CI: ±0.08R," this means there's a 95% probability that the true average falls within that range—<strong>based on your historical data</strong>. 
                  This does NOT guarantee future performance will fall in that range.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-900 font-medium mb-2 text-sm">Sample Size Matters</h3>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Small sample sizes (&lt;50 trades) produce unreliable insights. With only 10-20 trades, statistical noise can dominate real patterns. 
                  The more trades you have, the more reliable the analysis.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="text-amber-900 font-medium mb-2 text-sm">Overfitting Risk</h3>
                <p className="text-amber-800 text-xs leading-relaxed">
                  Bayesian optimisation can find parameter combinations that performed well historically but may not generalise to future market conditions. 
                  Use recommended settings as guidelines, not absolute rules.
                </p>
              </div>
            </div>
          </section>

          {/* Regulatory Information */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-slate-700" />
              Regulatory Information
            </h2>
            <div className="text-slate-700 text-sm leading-relaxed space-y-3">
              <p className="text-xs">
                <strong>Green Turtle Trades is NOT regulated as a broker, investment advisor, or financial institution.</strong> We are a technology platform 
                providing analytical tools for educational purposes.
              </p>
              <p className="text-xs">
                In the United Kingdom:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li>We are not authorised or regulated by the FCA (Financial Conduct Authority)</li>
                <li>We do not provide regulated investment advice or portfolio management services</li>
                <li>We are not covered by the Financial Services Compensation Scheme (FSCS)</li>
              </ul>
              <p className="text-xs mt-3">
                <strong>Important:</strong> Ensure your forex/CFD broker is regulated by a reputable authority (e.g., FCA, ASIC, CySEC) and offers investor protection.
              </p>
            </div>
          </section>

          {/* Your Responsibilities */}
          <section>
            <h2 className="text-slate-900 text-xl mb-3">Your Responsibilities as a Trader</h2>
            <div className="text-slate-700 text-sm leading-relaxed">
              <p className="text-xs mb-3">By using Green Turtle Trades and trading financial instruments, you acknowledge and accept that:</p>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <ul className="space-y-2 text-xs">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You understand the risks of leveraged trading and accept full responsibility for your trading decisions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You are trading with capital you can afford to lose without affecting your standard of living</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You will conduct your own research and not rely solely on Turtle Analytics insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You will use proper risk management (position sizing, stop losses, diversification)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You understand that past performance does not guarantee future results</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-600 flex-shrink-0">✓</span>
                    <span>You will seek professional financial advice if you are unsure about any aspect of trading</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Final Warning */}
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <div className="text-red-900 mb-2 font-medium">Final Warning</div>
                <p className="text-red-800 text-xs leading-relaxed mb-3">
                  The majority of retail forex traders lose money. Industry statistics show that 70-80% of retail traders lose their entire investment within the first year. 
                  Leverage magnifies both gains and losses.
                </p>
                <p className="text-red-800 text-xs leading-relaxed">
                  <strong>If you cannot afford to lose your trading capital, do not trade.</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-slate-900 text-sm mb-2">Questions About Risk?</h3>
            <p className="text-slate-600 text-xs mb-2">
              If you have questions about the risks of trading or using our platform, contact us:
            </p>
            <p className="text-xs">
              <strong>Email:</strong> <a href="mailto:contact@greenturtletraders.co.uk" className="text-teal-600 hover:text-teal-700">contact@greenturtletraders.co.uk</a>
            </p>
          </div>

          {/* Acknowledgment */}
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <p className="text-teal-900 text-xs leading-relaxed">
              <strong>Acknowledgment:</strong> By using Green Turtle Trades, you acknowledge that you have read, understood, and accept this Risk Disclosure Statement 
              and the inherent risks of trading leveraged financial instruments.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
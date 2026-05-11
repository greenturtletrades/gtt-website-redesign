import { Brain, TrendingUp, Target, Zap, BarChart3, RefreshCw, GitBranch, Shield, CheckCircle } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function TurtleAnalyticsFeature({ mlEnabled = false }: { mlEnabled?: boolean }) {
  const headerRef = useRef(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });

  const conceptRef = useRef(null);
  const conceptInView = useInView(conceptRef, { once: true, amount: 0.3 });

  const featuresRef = useRef(null);
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });

  const improvementRef = useRef(null);
  const improvementInView = useInView(improvementRef, { once: true, amount: 0.3 });

  return (
    <section className="w-full bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 py-16 sm:py-24 px-4 sm:px-6 overflow-hidden relative">
      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-20 left-10 w-96 h-96 bg-teal-500 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 50 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-white mb-4 text-3xl sm:text-4xl md:text-5xl"
          >
            Turtle Analytics: Your Personal Trading Analyst
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={headerInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 px-4 py-2 rounded-full mb-4 border border-teal-500/30"
          >
            <Brain className="w-4 h-4" />
            <span className="text-sm">Powered by Machine Learning</span>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-teal-100 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed"
          >
            Unlike traditional analytics that just show you <span className="text-red-300">what happened</span>, 
            Turtle Analytics reveals <span className="text-teal-300">what could have happened</span> if you had adjusted your strategy. 
            It's a self-optimising feedback engine that learns from your trading DNA. No predictions, no comparisons, just statistical evidence from your own trades.
          </motion.p>
        </motion.div>

        {/* Core Features */}
        <div ref={featuresRef} className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12">
          {[
            {
              icon: GitBranch,
              gradient: "from-teal-500 to-emerald-500",
              title: "Counterfactual Simulations",
              description: "What if you had used a tighter stop loss? A wider take profit? Turtle Analytics replays your exact entry points with different risk parameters across thousands of scenarios.",
              features: [
                { title: "Optimal Stop Loss/Take Profit Discovery", desc: "Find your perfect risk-reward ratios based on YOUR entries" },
                { title: "Confidence Intervals", desc: "See how reliable each simulation result is (e.g., ±0.08R)" },
                { title: "Parameter Grid Testing", desc: "Tests 12+ combinations to find your statistical edge" }
              ]
            },
            {
              icon: Target,
              gradient: "from-emerald-500 to-teal-500",
              title: "Bayesian Optimisation",
              description: "The system learns which parameters to test based on what's working for your specific trading pattern. It gets smarter with every trade you log.",
              features: [
                { title: "Intelligent Search", desc: "Doesn't waste time testing bad parameters" },
                { title: "Continuous Refinement", desc: "Updates recommendations as you add new trades" },
                { title: "Probabilistic Insights", desc: "Provides probability-based insights rather than guaranteed outcomes" }
              ]
            },
            {
              icon: BarChart3,
              gradient: "from-teal-500 to-cyan-500",
              title: "Market Regime Clustering",
              description: "Unsupervised machine learning automatically discovers patterns in market conditions where you excel or struggle without you having to tag anything.",
              features: [
                { title: "Auto-Detects Your Edge", desc: "Discovers where you thrive: \"Trending Bull\" markets (74.6% win rate)" },
                { title: "Warns About Weak Zones", desc: "Highlights \"Choppy Range\" conditions where you lose money" },
                { title: "Regime-Specific Parameters", desc: "Suggests different SL/TP for each market condition" }
              ]
            },
            {
              icon: TrendingUp,
              gradient: "from-cyan-500 to-teal-500",
              title: "Survival Analysis",
              description: "Analyses how long your trades survive before hitting SL or TP. Discovers if you're exiting too early or holding too long.",
              features: [
                { title: "Optimal Hold Times", desc: "Your winners peak at 6.2 hours—exits should match this" },
                { title: "Trailing Stop Optimisation", desc: "Tests 8+ trailing stop strategies on your actual trades" },
                { title: "Trade Duration Patterns", desc: "Analyses timing patterns across all your trades to identify trends" }
              ]
            }
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 50 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="bg-white/5 border border-teal-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm hover:bg-white/10 transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="text-white text-xl sm:text-2xl">{feature.title}</h3>
                </div>
                <p className="text-slate-300 mb-4">
                  {feature.description.includes('exact entry points') ? (
                    <>
                      {feature.description.split('exact entry points')[0]}
                      <span className="text-teal-300">exact entry points</span>
                      {feature.description.split('exact entry points')[1]}
                    </>
                  ) : (
                    feature.description
                  )}
                </p>
                <div className="space-y-3">
                  {feature.features.map((item, j) => (
                    <motion.div
                      key={j}
                      initial={{ opacity: 0, x: -20 }}
                      animate={featuresInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: i * 0.1 + j * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="text-white text-sm">{item.title}</div>
                        <div className="text-slate-400 text-sm">{item.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* How It Improves Your Trading */}
        <motion.div
          ref={improvementRef}
          initial={{ opacity: 0, y: 50 }}
          animate={improvementInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-sm"
        >
          <h3 className="text-white mb-6 text-2xl sm:text-3xl text-center">How Turtle Analytics Improves Your Trading</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                color: "teal",
                title: "Discover Hidden Edges",
                desc: "Uncover optimisation opportunities, such as improving your average R-multiple from 0.42 to 0.72 by adjusting stop loss placement"
              },
              {
                icon: RefreshCw,
                color: "emerald",
                title: "Eliminate Weak Setups",
                desc: "Identify underperforming conditions, such as recognising a 68% loss rate in low liquidity environments to refine your trading schedule"
              },
              {
                icon: Brain,
                color: "cyan",
                title: "Personalised Strategy",
                desc: "Get recommendations tailored to YOUR trading behaviour, rather than generalised strategies designed for other traders"
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={improvementInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className="text-center cursor-pointer"
                >
                  <motion.div
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className={`w-16 h-16 bg-${item.color}-500/20 rounded-full flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className={`w-8 h-8 text-${item.color}-300`} />
                  </motion.div>
                  <h4 className="text-white mb-2 text-lg">{item.title}</h4>
                  <p className="text-slate-300 text-sm">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={improvementInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center mt-12"
        >
          <p className="text-slate-300 mb-6 text-sm">
            Available exclusively for Green Turtle Traders
          </p>
          {mlEnabled ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.dispatchEvent(new CustomEvent('navigateToTurtleAnalytics'))}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg hover:from-teal-600 hover:to-emerald-600 transition-all shadow-lg shadow-teal-500/30"
            >
              <Brain className="w-5 h-5" />
              Explore Turtle Analytics
            </motion.button>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-2 px-8 py-4 bg-slate-700 text-slate-400 rounded-lg cursor-not-allowed"
            >
              <Brain className="w-5 h-5" />
              Coming Soon
            </button>
          )}
        </motion.div>
      </div>
    </section>
  );
}
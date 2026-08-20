import { Brain, Shield, Lock, Sparkles, GitBranch, Target, BarChart3, Activity, Clock, TrendingUp, Settings, RefreshCw, CheckCircle, LogIn, UserPlus, Calculator, Crown, Check, BookOpen } from "lucide-react";
import { motion } from "motion/react";

interface TurtleAnalyticsWelcomeProps {
  onSignUp: () => void;
  onSignIn: () => void;
  onSubscribe?: () => void;
  isLoggedIn?: boolean;
}

export function TurtleAnalyticsWelcome({ onSignUp, onSignIn, onSubscribe, isLoggedIn = false }: TurtleAnalyticsWelcomeProps) {
  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-teal-900 via-cyan-900 to-teal-900 py-16 sm:py-20 px-4 sm:px-6 relative overflow-hidden">
        {/* Animated background */}
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
          className="absolute top-20 left-10 w-96 h-96 bg-teal-400 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 bg-teal-400/20 text-teal-200 px-4 py-2 rounded-full mb-6 border border-teal-400/30"
            >
              <Brain className="w-4 h-4" />
              <span className="text-sm">Machine Learning-Powered Personal Coach</span>
            </motion.div>
            <h1 className="text-white mb-4 text-3xl sm:text-4xl md:text-6xl">
              Turtle Analytics by Green Turtle Trades
            </h1>
            <p className="text-teal-100 max-w-3xl mx-auto text-lg mb-8">
              Turtle Analytics is the trading analytics and trading journal platform developed by Green Turtle Trades. It combines a journal, performance analytics, and a self-optimising feedback engine that analyses
              <span className="text-cyan-300"> your unique trading history</span> to reveal hidden patterns, risk behaviour, and personalised improvement opportunities.
            </p>

            {/* CTA Buttons */}
            <div className="flex items-center justify-center gap-4 flex-wrap">
              {isLoggedIn ? (
                <button
                  onClick={onSubscribe}
                  className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <Crown className="w-5 h-5" />
                  Subscribe to Get Access
                </button>
              ) : (
                <>
                  <button
                    onClick={onSignUp}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <UserPlus className="w-5 h-5" />
                    Sign Up - Get Started
                  </button>
                  <button
                    onClick={onSignIn}
                    className="px-8 py-4 bg-white/10 text-white border border-white/30 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-sm"
                  >
                    <LogIn className="w-5 h-5" />
                    Login
                  </button>
                </>
              )}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 flex justify-center"
            >
              <div className="max-w-2xl px-4 text-center">
                <p className="text-xs leading-relaxed text-teal-100/80 sm:text-sm">
                  Connect your MetaTrader account, import Trading 212 history, or upload CSV trade history for analysis.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Private Analytics Workflow */}
          <div className="mb-12 rounded-2xl border border-teal-400/30 bg-white/[0.04] p-5 shadow-2xl shadow-teal-950/30 backdrop-blur-sm sm:p-7">
            <div className="mb-7 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                <Shield className="h-3.5 w-3.5" />
                Private by design
              </div>
              <h2 className="mx-auto max-w-4xl text-2xl text-white sm:text-3xl">
                One workflow for journal, analytics, risk review, and personal feedback
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-sm leading-6 text-teal-100 sm:text-base">
                Turtle Analytics is built around your own trading record: import the history, keep the journal, review the dashboard,
                and use risk metrics to understand what is actually driving performance.
              </p>
            </div>

            <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "No Predictions",
                  desc: "We analyse your historical trading behaviour and identify alternative scenarios that could have improved performance.",
                  highlight: "100% based on YOUR historical trades",
                },
                {
                  icon: Lock,
                  title: "Zero Cross-Trader Data",
                  desc: "We analyse your trading behaviour in complete isolation. Every insight is derived exclusively from your own patterns.",
                  highlight: "Your data stays yours, always private",
                },
                {
                  icon: Sparkles,
                  title: "Continuously Learning",
                  desc: "The model refines recommendations with each additional trade, learning your unique patterns without overfitting.",
                  highlight: "Self-optimising feedback loop",
                },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="rounded-xl border border-teal-300/20 bg-slate-950/30 p-5 transition-all hover:border-teal-300/40 hover:bg-slate-950/45"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-white">{item.title}</h3>
                    <p className="mb-3 text-sm leading-6 text-teal-100">{item.desc}</p>
                    <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                      {item.highlight}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                {
                  icon: RefreshCw,
                  title: "Connect history",
                  desc: "MetaTrader 4, MetaTrader 5, Trading 212, and CSV workflows bring trade history into one review process.",
                  highlight: "MT4, MT5, Trading 212, CSV",
                },
                {
                  icon: BookOpen,
                  title: "Keep the journal",
                  desc: "Record entries, exits, symbols, direction, notes, holding time, account activity, and lessons learned.",
                  highlight: "Notes, lessons, context",
                },
                {
                  icon: BarChart3,
                  title: "Read the dashboard",
                  desc: "Track win rate, expectancy, profit factor, R-multiple, best trade, worst trade, and average hold time.",
                  highlight: "Metrics that explain performance",
                },
                {
                  icon: Shield,
                  title: "Control risk",
                  desc: "Review drawdown, risk per trade, open exposure, stop-loss behaviour, leverage, and consistency signals.",
                  highlight: "Drawdown and exposure review",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="rounded-xl border border-teal-300/20 bg-white/5 p-5 transition-all hover:border-teal-300/40 hover:bg-white/10"
                  >
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-teal-400/15 text-teal-200">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mb-2 text-white">{item.title}</h3>
                    <p className="mb-3 text-sm leading-6 text-teal-100">{item.desc}</p>
                    <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
                      {item.highlight}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* What You Get Access To */}
          <div className="mb-12">
            <h2 className="text-white text-2xl sm:text-3xl mb-4 text-center">What You Get Access To</h2>
            <p className="text-teal-100 text-center mb-8 max-w-2xl mx-auto">
              Start with free account access, then upgrade when you want the full analytics stack.
            </p>
            
            <div className="grid max-w-5xl gap-6 mx-auto md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative cursor-pointer rounded-lg p-4 transition-all border border-slate-400/30 bg-white/5 backdrop-blur-sm hover:border-slate-400 hover:shadow-md hover:scale-105"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>

                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-white">Free Trading Journal</h3>
                </div>
                <div className="mb-3">
                  <span className="text-2xl font-semibold text-white">£0</span>
                  <span className="text-slate-300 text-sm">/month</span>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Free account access</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Trade journal and account ledger</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Account settings and profile management</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Import trades from MetaTrader, Trading 212, or CSV</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Journal stats cards and public leaderboard profile controls</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Upgrade to ML analytics whenever you are ready</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative cursor-pointer rounded-lg p-4 transition-all border border-slate-400/30 bg-white/5 backdrop-blur-sm hover:border-slate-400 hover:shadow-md hover:scale-105"
              >
                <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center mb-3">
                  <Calculator className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-white mb-2">Pay-As-You-Go</h3>
                <div className="mb-3">
                  <span className="text-2xl font-semibold text-white">£10</span>
                  <span className="text-slate-300 text-sm">/month</span>
                  <div className="mt-1">
                    <span className="text-slate-300 text-sm">+ £0.20 per trade</span>
                  </div>
                </div>

                <ul className="space-y-2 mb-4">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">£10/month base subscription</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">£0.20 per trade analysed</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Full Turtle Analytics access</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Trade journal, account ledger, and stats cards</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Full counterfactual analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Survival analysis and hold-time optimisation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">MFE/MAE and exit-quality analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Market regime clustering and expectancy diagnostics</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Trailing stop and risk optimisation</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Email support</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Real Example */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 mb-12"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Counterfactual Simulations</h4>
                </div>
                <p className="text-white text-sm">
                  Test multiple stop-loss, take-profit, and management combinations on your historical trades to find stronger risk parameters
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Bayesian Optimisation</h4>
                </div>
                <p className="text-white text-sm">
                  Intelligent search that learns which parameters work for you, finding optimal settings efficiently
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Market Regime Clustering</h4>
                </div>
                <p className="text-white text-sm">
                  ML segments your trading into market conditions so you can see where you perform best and where your edge weakens
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Survival Analysis</h4>
                </div>
                <p className="text-white text-sm">
                  Analyses how long trades survive before hitting SL or TP to improve hold duration and exit timing
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">MFE/MAE Analysis</h4>
                </div>
                <p className="text-white text-sm">
                  See peak profit potential versus worst drawdown per trade to refine exits and understand missed opportunity
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Journal And Ledger</h4>
                </div>
                <p className="text-white text-sm">
                  Keep imported trade history, review account activity, and switch between journal rows and dedicated stats cards
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Risk Optimisation</h4>
                </div>
                <p className="text-white text-sm">
                  Find stronger risk fractions, cleaner exit structures, and more repeatable trading behaviour
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-emerald-500 rounded-lg flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Trailing Stop Testing</h4>
                </div>
                <p className="text-white text-sm">
                  Test trailing stop approaches on your actual trades to improve exit timing without guessing
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Expectancy Metrics</h4>
                </div>
                <p className="text-white text-sm">
                  Understand expectancy, profit factor, win rate, and trade quality through verified account data
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Multi-Source Imports</h4>
                </div>
                <p className="text-white text-sm">
                  Pull trade history from MetaTrader, Trading 212, or CSV uploads into one consistent trading record
                </p>
              </div>
            </div>
          </motion.div>

          {/* Final CTA Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900 rounded-2xl p-8 sm:p-12 shadow-2xl border border-teal-500/20">
              <h3 className="text-white text-2xl sm:text-3xl mb-4">Ready to Optimise Your Trading?</h3>
              <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                Join verified traders who use Turtle Analytics to discover their hidden edge. Sign up now to get access 
                to the most advanced personal trading intelligence system.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {isLoggedIn ? (
                  <button
                    onClick={onSubscribe}
                    className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Crown className="w-5 h-5" />
                    Subscribe to Get Access
                  </button>
                ) : (
                  <>
                    <button
                      onClick={onSignUp}
                      className="px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg hover:from-teal-600 hover:to-cyan-600 transition-all flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Sparkles className="w-5 h-5" />
                      Sign Up for Turtle Analytics
                    </button>
                    <button
                      onClick={onSignIn}
                      className="px-8 py-4 bg-white/10 text-white border border-white/30 rounded-lg hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-sm"
                    >
                      <LogIn className="w-5 h-5" />
                      Already Have an Account? Login
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

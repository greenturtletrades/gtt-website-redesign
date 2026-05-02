import { Brain, Shield, Lock, Sparkles, GitBranch, Target, BarChart3, Activity, Clock, TrendingUp, RefreshCw, CheckCircle, LogIn, UserPlus, Calculator, Crown, Check, BookOpen } from "lucide-react";
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
              Your Personalised Analyst
            </h1>
            <p className="text-teal-100 max-w-3xl mx-auto text-lg mb-8">
              Turtle Analytics is unlike any trading tool you've used before. It's a self-optimising feedback engine that analyses 
              <span className="text-cyan-300"> your unique trading DNA</span> to reveal hidden patterns, optimal parameters, and personalised improvement opportunities.
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
              className="mt-5"
            >
              <p className="text-sm text-teal-100/85">
                Connect your MetaTrader account directly or upload CSV trade history for analysis.
              </p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-cyan-300/80">
                Additional broker and platform integrations coming soon
              </p>
            </motion.div>
          </div>

          {/* Key Differentiators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: Shield,
                title: "No Predictions",
                desc: "We analyse your historical trading behaviour and identify alternative scenarios that could have improved performance.",
                highlight: "100% based on YOUR historical trades"
              },
              {
                icon: Lock,
                title: "Zero Cross-Trader Data",
                desc: "We analyse your trading behaviour in complete isolation. Every insight is derived exclusively from your own patterns.",
                highlight: "Your data stays yours, always private"
              },
              {
                icon: Sparkles,
                title: "Continuously Learning",
                desc: "The model refines recommendations with each additional trade, learning your unique patterns without overfitting.",
                highlight: "Self-optimising feedback loop"
              }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="bg-white/5 border border-teal-400/30 rounded-xl p-6 backdrop-blur-sm hover:bg-white/10 transition-all"
                >
                  <div className="w-12 h-12 bg-teal-400/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-teal-300" />
                  </div>
                  <h3 className="text-white mb-2">{item.title}</h3>
                  <p className="text-teal-100 text-sm mb-3">{item.desc}</p>
                  <div className="text-xs text-cyan-300 bg-cyan-400/10 px-3 py-1 rounded-full inline-block border border-cyan-400/20">
                    {item.highlight}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* What You Get Access To */}
          <div className="mb-12">
            <h2 className="text-white text-2xl sm:text-3xl mb-4 text-center">What You Get Access To</h2>
            <p className="text-teal-100 text-center mb-8 max-w-2xl mx-auto">
              Subscribe to unlock comprehensive trading analytics
            </p>
            
            <div className="max-w-md mx-auto">
              {/* Pay-As-You-Go Plan */}
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
                    <span className="text-slate-200">Access to Turtle Analytics</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Trade Journal</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Full counterfactual analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">MFE/MAE analysis</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Market regime clustering</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-200">Trailing stop optimisation</span>
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
                  Test 12+ stop-loss/take-profit combinations on your historical trades to find optimal risk parameters
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
                  ML discovers 5 market conditions where you excel or struggle, without manual tagging
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
                  Analyses how long trades survive before hitting SL/TP to optimise your hold duration
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
                  See peak profit potential vs. worst drawdown per trade to refine your exit strategy
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Hourly Performance</h4>
                </div>
                <p className="text-white text-sm">
                  Discover your best trading hours with detailed performance breakdowns by time
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
                  Find your optimal position sizing and risk fraction for maximum Sharpe ratio
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
                  Test 8+ trailing stop strategies on your actual trades to optimise exit timing
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">R-Multiple Distribution</h4>
                </div>
                <p className="text-white text-sm">
                  Understand how your wins and losses cluster with statistical confidence intervals
                </p>
              </div>

              <div className="bg-teal-800/40 backdrop-blur-sm rounded-xl p-5 border border-teal-400/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="text-white">Trade Journal</h4>
                </div>
                <p className="text-white text-sm">
                  Comprehensive logging and review of all your trades with detailed notes and performance tracking
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

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import splashScreen from "figma:asset/37c1056c539b133077eab0bb8ff89c374d821376.png";
import marketplace from "../../assets/IMG_0159.jpeg";
import portfolio from "../../assets/IMG_0158.jpeg";

export function PlatformPreview() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="w-full bg-gradient-to-b from-white to-slate-50 py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-slate-900 mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl">Experience the Trading Platform</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm sm:text-base md:text-lg">
            A seamless interface for trading analytics, verified performance records, university competition activity, and future trader-backed investing workflows.
          </p>
        </motion.div>

        {/* Features with Screenshots */}
        <div className="space-y-16 sm:space-y-20 md:space-y-24">
          {[
            {
              image: splashScreen,
              title: "Welcome to Turtle Trades",
              description: "Where equity meets talent. A transparent trading analytics platform building toward trader-backed investing. Experience our clean, professional fintech interface designed for serious traders and future investor workflows.",
              highlights: [
                "Professional fintech aesthetic",
                "Secure and transparent platform",
                "Built for serious traders",
                "Clean, intuitive interface"
              ]
            },
            {
              image: marketplace,
              title: "Trader Marketplace",
              description: "Browse verified trader summaries and competition profiles. Filter by performance metrics, risk level, and trading style. See stats including win rates, average returns, follower counts, and total trades across top performers.",
              highlights: [
                "Advanced filtering and search",
                "Real-time performance metrics",
                "Verified trader badges",
                "Top performer rankings"
              ]
            },
            {
              image: portfolio,
              title: "Portfolio Performance",
              description: "Comprehensive portfolio analytics showing total invested capital, current value, and total returns. Track performance metrics including win rate, average return, active trader allocations, plus best and worst performing traders at a glance.",
              highlights: [
                "Complete investment overview",
                "Performance breakdown by trader",
                "Win rate and return analytics",
                "Best and worst performer tracking"
              ]
            }
          ].map((feature, index) => (
            <div
              key={index}
              className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 md:gap-12 items-center ${
                index % 2 === 1 ? "lg:flex-row-reverse" : ""
              }`}
            >
              {/* Screenshot */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`${index % 2 === 1 ? "lg:order-2" : "lg:order-1"}`}
              >
                <motion.div
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  {/* Phone mockup effect */}
                  <div className="relative mx-auto max-w-[320px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] p-3 shadow-2xl">
                    {/* Phone notch */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-10" />
                    
                    {/* Screen */}
                    <div className="relative bg-teal-400 rounded-[2.5rem] overflow-hidden">
                      <img
                        src={feature.image}
                        alt={feature.title}
                        className="block w-full h-auto contrast-[1.04] saturate-[1.03] brightness-[1.01]"
                      />
                    </div>
                  </div>

                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-teal-500/10 rounded-[3rem] blur-3xl -z-10" />
                </motion.div>
              </motion.div>

              {/* Description */}
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 50 : -50 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.2 + 0.2 }}
                className={`${index % 2 === 1 ? "lg:order-1" : "lg:order-2"}`}
              >
                <h3 className="text-slate-900 mb-4 text-2xl sm:text-3xl">
                  {feature.title}
                </h3>
                <p className="text-slate-600 mb-6 text-base sm:text-lg">
                  {feature.description}
                </p>

                {/* Highlights */}
                <div className="space-y-3">
                  {feature.highlights.map((highlight, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: index * 0.2 + 0.4 + i * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                      <span className="text-slate-700">{highlight}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 sm:mt-20 md:mt-24"
        >
          <h3 className="text-slate-900 mb-12 text-2xl sm:text-3xl text-center">
            Everything You Need to
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* For Investors - Left Side */}
            <div>
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm tracking-wide uppercase">
                  Invest
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {[
                  {
                    title: "Flexible Capital Management",
                    desc: "Scale allocations up or down instantly based on trader performance without penalties"
                  },
                  {
                    title: "Portfolio Monitoring",
                    desc: "Track all your allocations, returns, and performance across multiple traders in real-time"
                  },
                  {
                    title: "Transparent Trader Performance",
                    desc: "Full access to verified metrics, trading history, and risk analytics for every trader"
                  },
                  {
                    title: "Custom Filters & Preferences",
                    desc: "Find the perfect traders using advanced filters for strategy, risk level, and performance"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <h4 className="text-slate-900 mb-2 text-lg">{item.title}</h4>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* For Traders - Right Side */}
            <div>
              <div className="text-center mb-6">
                <span className="inline-block px-4 py-2 bg-teal-100 text-teal-700 rounded-full text-sm tracking-wide uppercase">
                  Trade
                </span>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {[
                  {
                    title: "Trade From Your Own Account",
                    desc: "Use your existing MT4/MT5 platform with no platform switching, trade from the comfort of your own account"
                  },
                  {
                    title: "Build Toward Capital Access",
                    desc: "Use verified performance records and risk analytics to support future investor-capital workflows"
                  },
                  {
                    title: "Turtle Analytics",
                    desc: "Advanced ML-powered analytics to optimise your performance and refine your trading strategies"
                  },
                  {
                    title: "Transparent Account Workflows",
                    desc: "Keep account activity, analytics, and performance summaries in a clearer platform record"
                  }
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, delay: 0.8 + i * 0.1 }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className="bg-gradient-to-br from-teal-50 to-white border border-teal-200 rounded-xl p-6 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer"
                  >
                    <h4 className="text-slate-900 mb-2 text-lg">{item.title}</h4>
                    <p className="text-slate-600 text-sm">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

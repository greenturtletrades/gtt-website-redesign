import { motion } from "motion/react";

export function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50 pt-32 pb-20 sm:py-28 md:py-36 px-4 sm:px-6 overflow-hidden relative">
      {/* Subtle background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <motion.div
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            opacity: [0.6, 0.4, 0.6],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 4
          }}
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-200 to-teal-200 rounded-full blur-3xl"
        />
      </div>

      {/* Fine grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>

      <div className="max-w-6xl mx-auto text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-slate-900 mb-4 sm:mb-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight px-2"
        >
          <span className="bg-gradient-to-r from-slate-900 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
            Real Traders.
          </span>
          <br />
          <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-teal-700 bg-clip-text text-transparent">
            Real Capital.
          </span>
          <br />
          <span className="bg-gradient-to-r from-cyan-700 via-teal-700 to-slate-900 bg-clip-text text-transparent">
            Shared Profits.
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 max-w-3xl mx-auto mb-4 text-base sm:text-lg md:text-xl leading-relaxed px-4"
        >
          Trading talent deserves to be seen. We're building a platform where traders can prove their skill and investors can understand the people behind the performance.
        </motion.p>
        <p className="text-slate-600 max-w-2xl mx-auto mb-8 sm:mb-12 text-sm sm:text-base leading-relaxed px-4">
          Explore our trading journal, analytics, and university competition today. Investor-backed trading is in development.
        </p>
        
        {/* Product areas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 sm:mt-16 flex flex-wrap justify-center items-center gap-4 sm:gap-8 text-slate-600 text-xs sm:text-sm px-4"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
            <span>Trading Analytics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
            <span>Performance Records</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>University Competition</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

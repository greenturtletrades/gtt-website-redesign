import { TrendingUp, Users, DollarSign } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";
import appLogo from "figma:asset/b6c202d5578e49b4e66e1eefc40188c94fca514e.png";

export function ProductSummary() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const features = [
    {
      icon: TrendingUp,
      title: "Elite Traders",
      description: "Rigorously vetted professionals trade institutional capital with transparent performance metrics"
    },
    {
      icon: Users,
      title: "Strategic Investors",
      description: "Algorithmically mirror verified traders with full transparency and real-time oversight"
    },
    {
      icon: DollarSign,
      title: "Aligned Incentives",
      description: "Performance-based compensation ensures traders and investors succeed together"
    }
  ];

  return (
    <section ref={ref} className="w-full bg-white py-20 sm:py-28 md:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-slate-900 mb-4 text-3xl sm:text-4xl md:text-5xl tracking-tight">The Future of Trading and Investing</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
            Built with sophisticated infrastructure, connecting capital and skill
          </p>
        </motion.div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-slate-50 to-white rounded-xl border border-slate-200 p-8 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-slate-400 mb-4 text-sm tracking-widest uppercase">The Problem</div>
              <ul className="text-slate-900 text-lg leading-relaxed space-y-3">
                <li className="flex items-start">
                  <span className="text-slate-400 mr-3 mt-1">•</span>
                  <span>Talented traders lacking reliable capital</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 mr-3 mt-1">•</span>
                  <span>Investors struggling to identify genuine skill</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 mr-3 mt-1">•</span>
                  <span>Prop firms with unrealistic challenges and misaligned incentives</span>
                </li>
                <li className="flex items-start">
                  <span className="text-slate-400 mr-3 mt-1">•</span>
                  <span>Lack of transparency in an industry that demands trust</span>
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="bg-gradient-to-br from-teal-50 to-white rounded-xl border border-teal-200 p-8 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="text-teal-600 mb-4 text-sm tracking-widest uppercase">Our Solution</div>
              <ul className="text-slate-900 text-lg leading-relaxed space-y-3">
                <li className="flex items-start">
                  <span className="text-teal-600 mr-3 mt-1">•</span>
                  <span>Verified traders get access to real investor capital</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-3 mt-1">•</span>
                  <span>Complete transparency with real-time performance tracking</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-3 mt-1">•</span>
                  <span>Fair revenue sharing with aligned incentives for success</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-600 mr-3 mt-1">•</span>
                  <span>Machine learning analytics proving genuine skill</span>
                </li>
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-8 text-center"
          >
            <p className="text-slate-600 text-lg mb-6">
              All in one app
            </p>
            {/* App Store Style Display */}
            <div className="flex flex-col items-center gap-3">
              <motion.img 
                src={appLogo} 
                alt="Turtle Trades App" 
                className="w-20 h-20 rounded-2xl shadow-lg"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: 1.0 }}
                className="text-slate-900 tracking-tight"
              >
                Turtle Trades
              </motion.p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
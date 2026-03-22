import { Award, Shield, Eye, Lock } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function ValuePropositions() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const values = [
    {
      icon: Lock,
      title: "Security",
      description: "Your data and capital are secured through bank-level encryption and rigorous verification.",
      color: "from-teal-600 to-cyan-600"
    },
    {
      icon: Eye,
      title: "Transparency",
      description: "All trades verified. All metrics visible. Pure transparency in every performance record.",
      color: "from-teal-600 to-cyan-600"
    },
    {
      icon: Award,
      title: "Regulation",
      description: "Regulation protects everyone. We're building to meet those standards, not avoid them.",
      color: "from-cyan-600 to-teal-600"
    }
  ];

  return (
    <section ref={ref} className="w-full bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-20 sm:py-28 md:py-32 px-4 sm:px-6 relative overflow-hidden">
      {/* Subtle grid accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:6rem_6rem] opacity-20"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 sm:mb-20"
        >
          <h2 className="text-slate-900 mb-4 text-3xl sm:text-4xl md:text-5xl tracking-tight">Our Values</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-base sm:text-lg md:text-xl leading-relaxed">
            held by us, for you
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {values.map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ duration: 0.8, delay: index * 0.15 }}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              {/* Card background */}
              <div className="absolute inset-0 bg-white rounded-2xl border border-slate-200 group-hover:border-teal-400 transition-all duration-300 shadow-sm group-hover:shadow-xl"></div>
              
              {/* Gradient accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${value.color} opacity-0 group-hover:opacity-[0.04] rounded-2xl transition-opacity duration-300`}></div>
              
              {/* Content */}
              <div className="relative p-8 sm:p-10 flex flex-col items-center text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                  className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${value.color} rounded-xl mb-6 shadow-lg`}
                >
                  <value.icon className="w-7 h-7 text-white" />
                </motion.div>
                <h3 className="text-slate-900 mb-4 text-xl sm:text-2xl tracking-tight">{value.title}</h3>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{value.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
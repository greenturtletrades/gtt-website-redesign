import { useState, useRef } from "react";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { motion, useInView } from "motion/react";
import { joinWaitlist } from "../api/waitlist";
import { createCheckoutSession } from "../api/checkout";

const PAYMENTS_ACTIVE = import.meta.env.VITE_PAYMENTS_ACTIVE === "true";

export function WaitingListSignup() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleSubscribe = async () => {
    setIsCheckingOut(true);
    setErrorMsg(null);
    try {
      const url = await createCheckoutSession();
      window.location.href = url;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
      setIsCheckingOut(false);
    }
  };

  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      await joinWaitlist(email);
      setSubmitted(true);
      setEmail("");

      // Keep your existing “confirmed” behavior
      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      ref={ref}
      className="w-full bg-white py-20 sm:py-28 md:py-32 px-4 sm:px-6 relative overflow-hidden border-t border-slate-200"
    >
      {/* Subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f008_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f008_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>

      <div className="max-w-3xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-block bg-teal-50 text-teal-700 px-5 py-2 rounded-full mb-6 border border-teal-200 text-sm tracking-wide uppercase"
          >
            {PAYMENTS_ACTIVE ? "Subscribe Now" : "Limited Early Access"}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-900 mb-4 text-3xl sm:text-4xl md:text-5xl tracking-tight"
          >
            {PAYMENTS_ACTIVE ? "Start Your Subscription" : "Request Early Access"}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-slate-600 mb-10 max-w-xl mx-auto text-base sm:text-lg leading-relaxed"
          >
            {PAYMENTS_ACTIVE
              ? "One plan. Full access to Turtle Analytics."
              : "Join the waitlist for early access to where trading performance meets investment opportunity."}
          </motion.p>
        </motion.div>

        {PAYMENTS_ACTIVE ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="max-w-sm mx-auto"
          >
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 mb-6 text-left">
              <div className="mb-6">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-semibold text-slate-900">£10</span>
                  <span className="text-slate-500 text-sm">/month</span>
                </div>
                <p className="text-slate-500 text-sm">+ £0.20 per trade analysed</p>
              </div>
              <ul className="space-y-3 text-sm text-slate-600 mb-8">
                {[
                  "Full counterfactual analysis",
                  "MFE / MAE analysis",
                  "Market regime clustering",
                  "Trailing stop optimisation",
                  "Trade Journal",
                  "Email support",
                  "Cancel anytime",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <motion.button
                whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                whileTap={{ scale: isCheckingOut ? 1 : 0.98 }}
                onClick={handleSubscribe}
                disabled={isCheckingOut}
                className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 py-4 rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <span>Redirecting to checkout...</span>
                ) : (
                  <>
                    <span>Subscribe Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </div>

            {errorMsg && (
              <p className="text-red-600 text-xs sm:text-sm text-center">{errorMsg}</p>
            )}

            <p className="text-slate-500 text-xs text-center">
              Secure checkout powered by Stripe. Cancel anytime.
            </p>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            onSubmit={handleSubmit}
            className="max-w-lg mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your professional email"
                  className="w-full pl-12 pr-4 py-3 sm:py-4 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-500 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-sm sm:text-base"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <motion.button
                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:from-teal-400 hover:to-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">Confirmed</span>
                  </>
                ) : (
                  <>
                    <span>{isSubmitting ? "Submitting..." : "Submit Request"}</span>
                    {!isSubmitting && <ArrowRight className="w-5 h-5" />}
                  </>
                )}
              </motion.button>
            </div>

            {errorMsg && (
              <p className="text-red-600 text-xs sm:text-sm mt-3">{errorMsg}</p>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-slate-500 text-xs sm:text-sm mt-4"
            >
              Your information remains confidential and will not be shared with third parties.
            </motion.p>
          </motion.form>
        )}
      </div>
    </section>
  );
}

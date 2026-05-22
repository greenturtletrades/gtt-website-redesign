import { useState } from "react";
import { X, Mail, Lock, User, Gift, CheckCircle } from "lucide-react";
import { login, register, forgotPassword } from "../../api/auth";
import { setStoredToken } from "../../api/client";

interface AuthModalProps {
  type: "trader" | "admin";
  onClose: () => void;
  onComplete: (type: "trader" | "admin", details?: { name?: string; email?: string; referralCode?: string }) => void;
  initialMode?: "signup" | "login";
  signupPlan?: "free" | "payg";
}

export function AuthModal({ type, onClose, onComplete, initialMode = "signup", signupPlan = "free" }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup" && type !== "admin");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    tradingPlatform: "MetaTrader",
    referralCode: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send reset link right now. Please try again shortly."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== "trader") {
      onComplete(type);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (isSignUp && formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const authResponse = isSignUp
        ? await register({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            brokerName: formData.tradingPlatform,
            referralCode: formData.referralCode,
            plan: signupPlan,
          })
        : await login(formData.email, formData.password);

      if (!authResponse?.ok || !authResponse?.token) {
        throw new Error("Authentication failed");
      }

      setStoredToken(authResponse.token);

      onComplete(type, {
        name: formData.name,
        email: formData.email,
        referralCode: formData.referralCode.trim().toUpperCase() || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (type === "admin") return "Admin Login";
    return isSignUp ? "Sign up as Trader" : "Login as Trader";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg ${isSignUp && type === "trader" ? "max-w-2xl" : "max-w-md"} w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto`}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {showForgot ? (
          <>
            <h2 className="text-slate-900 mb-1.5 text-xl sm:text-2xl">Reset password</h2>
            <p className="text-slate-600 mb-6 text-sm">Enter your email and we'll send a reset link.</p>
            {forgotSent ? (
              <div className="text-center py-4">
                <CheckCircle className="w-10 h-10 text-teal-500 mx-auto mb-3" />
                <p className="text-slate-700 mb-4">If that email is registered, a reset link is on its way.</p>
                <button onClick={() => { setShowForgot(false); setForgotSent(false); }} className="text-teal-600 text-sm hover:underline">
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-70"
                >
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </button>
                <button type="button" onClick={() => setShowForgot(false)} className="w-full text-slate-600 text-sm hover:underline">
                  Back to login
                </button>
              </form>
            )}
          </>
        ) : (
          <>
        <h2 className="text-slate-900 mb-1.5 sm:mb-2 text-xl sm:text-2xl">
          {getTitle()}
        </h2>
        <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">
          {isSignUp ? "Create your account" : "Login to your account"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}
          {isSignUp && (
            <div>
              <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {!isSignUp && type === "trader" && (
            <div className="text-right -mt-1">
              <button
                type="button"
                onClick={() => {
                  setShowForgot(true);
                  setForgotSent(false);
                  setErrorMessage("");
                }}
                className="text-teal-600 text-xs hover:underline"
              >
                Forgot password?
              </button>
            </div>
          )}

          {isSignUp && (
            <div>
              <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {type === "trader" && isSignUp && (
            <>
              <div>
                <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Trading Platform</label>
                <select
                  value={formData.tradingPlatform}
                  onChange={(e) => setFormData({ ...formData, tradingPlatform: e.target.value })}
                  className="w-full px-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base bg-white"
                  required
                >
                  <option value="MetaTrader">MetaTrader</option>
                  <option value="Trading 212">Trading 212</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">Referral Code (Optional)</label>
                <div className="relative">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.referralCode}
                    onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                    placeholder="Referral Code"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-2.5 sm:py-3 rounded-lg hover:bg-teal-700 transition-colors text-sm sm:text-base disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : isSignUp ? "Create Account" : "Login"}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-teal-600 hover:text-teal-700 text-sm sm:text-base"
          >
            {isSignUp ? "Already have an account? Login" : "Don't have an account? Sign up"}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

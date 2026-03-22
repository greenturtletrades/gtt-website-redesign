import { useState } from "react";
import { X, Mail, Lock, User, Key, Gift } from "lucide-react";
import { login, register } from "../api/auth";

interface AuthModalProps {
  type: "trader" | "admin";
  onClose: () => void;
  onComplete: (type: "trader" | "admin") => void;
  initialMode?: "signup" | "login";
}

export function AuthModal({ type, onClose, onComplete, initialMode = "signup" }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === "signup" && type !== "admin");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    metaTraderUsername: "",
    referralCode: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type !== "trader") {
      onComplete(type);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const authResponse = isSignUp
        ? await register(formData.email, formData.password)
        : await login(formData.email, formData.password);

      if (!authResponse?.ok || !authResponse?.token) {
        throw new Error("Authentication failed");
      }

      localStorage.setItem("gtt_token", authResponse.token);
      onComplete(type);
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
                <label className="block text-slate-700 mb-1.5 sm:mb-2 text-sm sm:text-base">MetaTrader ID</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  <input
                    type="text"
                    value={formData.metaTraderUsername}
                    onChange={(e) => setFormData({ ...formData, metaTraderUsername: e.target.value })}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm sm:text-base"
                    placeholder="MetaTrader ID"
                    required
                  />
                </div>
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
      </div>
    </div>
  );
}

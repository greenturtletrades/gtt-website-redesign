import { X, Shield, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { adminLogin, changeAdminPassword } from "../../api/admin";
import { setStoredToken } from "../../api/client";

interface AdminLoginModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ onClose, onSuccess }: AdminLoginModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminLogin(formData.email, formData.password);
      if (response?.token) {
        setStoredToken(response.token);
      }
      if (response.mustChangePassword) {
        setMustChangePassword(true);
      } else {
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSubmitting) return;

    if (newPassword.trim().length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeAdminPassword(formData.password, newPassword);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to change password";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-slate-900 to-slate-800 text-white p-6 rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-teal-400" />
            </div>
            <div>
              <h2 className="text-xl">Admin Access</h2>
              <p className="text-slate-300 text-sm">Authorised personnel only</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={mustChangePassword ? handlePasswordChangeSubmit : handleCredentialsSubmit} className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs">
                {mustChangePassword
                  ? "Your one-time admin code was accepted. Set a new password before continuing."
                  : "This area is restricted to authorised administrators only. All access attempts are logged."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                {error}
              </div>
            )}

            {!mustChangePassword && (
              <>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Admin Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="admin@greenturtletrades.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {mustChangePassword && (
              <>
                <div>
                  <label className="block text-slate-700 mb-2 text-sm">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Set a new password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 mb-2 text-sm">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                      placeholder="Confirm the new password"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 rounded-lg hover:from-teal-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Please wait..." : mustChangePassword ? "Set New Password" : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

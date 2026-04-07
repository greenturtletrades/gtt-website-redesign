import { useState } from "react";
import { X, Lock, CheckCircle } from "lucide-react";
import { resetPassword } from "../api/auth";

interface ResetPasswordModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({ token, onClose, onSuccess }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset link is invalid or has expired");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 sm:p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>

        {done ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-teal-500 mx-auto mb-4" />
            <h2 className="text-slate-900 text-xl mb-2">Password updated</h2>
            <p className="text-slate-600 text-sm mb-6">You can now log in with your new password.</p>
            <button
              onClick={onSuccess}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <Lock className="w-10 h-10 text-teal-600 mx-auto mb-3" />
              <h2 className="text-slate-900 text-xl mb-1">Set a new password</h2>
              <p className="text-slate-600 text-sm">Must be at least 8 characters</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-1.5 text-sm">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-700 mb-1.5 text-sm">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Repeat password"
                  required
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Updating..." : "Update password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

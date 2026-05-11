import { X, Check, Calculator, Gift, CheckCircle } from "lucide-react";
import { useState } from "react";
import { apiPost } from "../../api/client";

interface SubscriptionModalProps {
  onClose: () => void;
  onSelectPlan: (plan: "payg", referralCode?: string) => void;
  userName?: string;
  initialReferralCode?: string;
}

export function SubscriptionModal({ onClose, onSelectPlan, userName, initialReferralCode = "" }: SubscriptionModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<"payg" | null>("payg");
  const [estimatedTrades, setEstimatedTrades] = useState(100);
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [referralChecking, setReferralChecking] = useState(false);

  const handleApplyReferral = async () => {
    const code = referralCode.trim().toUpperCase();
    if (!code) return;
    setReferralChecking(true);
    setReferralError(null);
    setReferralApplied(false);
    try {
      const res = await apiPost<{ ok: boolean; error?: string; source?: "platform" | "stripe" }>("/api/referral-codes/validate", { code });
      if (res.ok) {
        setReferralApplied(true);
      } else {
        setReferralError(res.error || "Invalid or inactive referral code");
      }
    } catch {
      setReferralError("Invalid or inactive referral code");
    } finally {
      setReferralChecking(false);
    }
  };

  const plan = {
    id: "payg" as const,
    name: "Pay-As-You-Go",
    price: "£10",
    icon: Calculator,
    color: "from-teal-500 to-cyan-500",
    borderColor: "border-teal-300",
    bgColor: "bg-teal-50",
    perTradePrice: "£0.20",
    features: [
      "£10/month base subscription",
      "£0.20 per trade analysed",
      "Access to Turtle Analytics",
      "Trade Journal",
      "Full counterfactual analysis",
      "MFE/MAE analysis",
      "Market regime clustering",
      "Trailing stop optimisation",
      "Email support"
    ]
  };

  const calculatePaygEstimate = () => {
    const baseFee = 10;
    const perTrade = 0.20;
    const total = baseFee + (estimatedTrades * perTrade);
    return total.toFixed(2);
  };

  const handleContinue = () => {
    if (selectedPlan) {
      onSelectPlan(selectedPlan, referralCode.trim().toUpperCase() || undefined);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-5xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-slate-900 mb-2 text-2xl sm:text-3xl">
            {userName ? `Welcome, ${userName}!` : "Welcome to Green Turtle Trades"}
          </h2>
          <p className="text-slate-600">
            Your subscription plan for Turtle Analytics
          </p>
        </div>

        <div className="max-w-md mx-auto mb-6">
          <div
            className="relative rounded-xl p-6 transition-all border-2 border-teal-300 shadow-lg"
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-lg flex items-center justify-center mb-4`}>
              <plan.icon className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-slate-900 text-xl mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-3xl font-semibold text-slate-900">{plan.price}</span>
              <span className="text-slate-600 text-sm">/month</span>
              <div className="mt-1">
                <span className="text-slate-600 text-sm">+ {plan.perTradePrice} per trade</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pay-As-You-Go Cost Calculator */}
        <div className="bg-slate-50 rounded-lg p-6 mb-8 border border-slate-200">
          <h3 className="text-slate-900 mb-4 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-teal-600" />
            Pay-As-You-Go Cost Estimator
          </h3>
          <p className="text-slate-600 text-sm mb-4">
            Estimate your monthly cost based on how many trades you typically analyse per month:
          </p>
          <div className="flex items-center gap-4 mb-4">
            <label className="text-slate-700 text-sm min-w-fit">Trades per month:</label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={estimatedTrades}
              onChange={(e) => setEstimatedTrades(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <input
              type="number"
              min="0"
              max="1000"
              value={estimatedTrades}
              onChange={(e) => setEstimatedTrades(Number(e.target.value))}
              className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900"
            />
          </div>
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-600">Base subscription:</span>
              <span className="text-slate-900">£10.00</span>
            </div>
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="text-slate-600">{estimatedTrades} trades × £0.20:</span>
              <span className="text-slate-900">£{(estimatedTrades * 0.20).toFixed(2)}</span>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-900 font-semibold">Estimated monthly cost:</span>
                <span className="text-2xl font-semibold text-slate-900">£{calculatePaygEstimate()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedPlan}
            className={`px-8 py-3 rounded-lg transition-all ${
              selectedPlan
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600 shadow-lg"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            Continue to Payment
          </button>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Platform access is billed monthly, and ML runs are billed per trade analysed.
          Payment methods are handled securely by Stripe.
        </p>

        {/* Referral / Discount Code */}
        <div className="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Gift className="w-5 h-5 text-teal-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h4 className="text-teal-900 font-medium mb-1">Have a Referral Code?</h4>
              <p className="text-teal-700 text-sm mb-3">
                Enter your discount code below. Platform referral codes and valid Stripe promo codes are both accepted here and passed through to checkout.
              </p>
              {referralApplied ? (
                <div className="flex items-center gap-2 text-teal-700 text-sm bg-teal-100 border border-teal-300 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Code <strong>{referralCode}</strong> applied — discount will be reflected at checkout.</span>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => { setReferralCode(e.target.value.toUpperCase()); setReferralError(null); setReferralApplied(false); }}
                      placeholder="e.g. GTT-ABC123"
                      className="flex-1 px-3 py-2 border border-teal-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyReferral}
                      disabled={!referralCode.trim() || referralChecking}
                      className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {referralChecking ? "Checking..." : "Apply"}
                    </button>
                  </div>
                  {referralError && (
                    <p className="text-red-600 text-xs mt-1">{referralError}</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

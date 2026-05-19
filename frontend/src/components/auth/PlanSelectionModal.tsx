import { X, BookOpen, Calculator, Check } from "lucide-react";

export type SignupPlanChoice = "free" | "payg";

interface PlanSelectionModalProps {
  onClose: () => void;
  onSelectPlan: (plan: SignupPlanChoice) => void;
}

const planCards: Array<{
  id: SignupPlanChoice;
  title: string;
  price: string;
  suffix: string;
  accent: string;
  icon: typeof BookOpen;
  description: string;
  features: string[];
  buttonLabel: string;
}> = [
  {
    id: "free",
    title: "Free Account",
    price: "£0",
    suffix: "/month",
    accent: "from-cyan-500 to-teal-500",
    icon: BookOpen,
    description: "Get straight into the journal, ledger, and imports without hitting a payment wall.",
    features: [
      "Trade journal and account ledger",
      "MetaTrader, Trading 212, and CSV imports",
      "Stats cards and profile controls",
      "Upgrade to ML analytics later",
    ],
    buttonLabel: "Continue with Free",
  },
  {
    id: "payg",
    title: "Pay-As-You-Go",
    price: "£10",
    suffix: "/month + £0.20 per trade",
    accent: "from-teal-500 to-cyan-500",
    icon: Calculator,
    description: "Create the account first, then go straight to secure checkout before entering the platform.",
    features: [
      "Full Turtle Analytics access",
      "Counterfactual analysis and optimisation",
      "MFE/MAE, clustering, and survival analysis",
      "Journal, ledger, and stats cards included",
    ],
    buttonLabel: "Continue with Paid",
  },
];

export function PlanSelectionModal({ onClose, onSelectPlan }: PlanSelectionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
      <div className="relative w-full max-w-5xl rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 transition-colors hover:text-slate-600"
          aria-label="Close plan selection"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl text-slate-900 sm:text-3xl">Choose your account access</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Pick the route first. Free accounts go straight into the platform after signup. Paid accounts go through signup,
            then straight to checkout before platform access.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {planCards.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.id}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${plan.accent}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div className="mb-3">
                  <h3 className="text-xl text-slate-900">{plan.title}</h3>
                  <div className="mt-2">
                    <span className="text-3xl text-slate-900">{plan.price}</span>
                    <span className="ml-1 text-sm text-slate-500">{plan.suffix}</span>
                  </div>
                </div>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">{plan.description}</p>
                <ul className="mb-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => onSelectPlan(plan.id)}
                  className={`mt-auto rounded-xl bg-gradient-to-r px-5 py-3 text-sm text-white transition-all hover:shadow-lg ${plan.accent}`}
                >
                  {plan.buttonLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

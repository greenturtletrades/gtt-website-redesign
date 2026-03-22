import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  submitTraderApplication,
  type TraderApplicationStatus,
} from "../../api/traderApplication";

interface TraderApplicationFormProps {
  onBack: () => void;
  onSubmitted: (email: string, status: TraderApplicationStatus) => void;
}

export function TraderApplicationForm({
  onBack,
  onSubmitted,
}: TraderApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    brokerName: "",
    yearsTrading: "",
    usesMetaTrader: "",
  });
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitStatus === "loading") {
      return;
    }

    setSubmitStatus("loading");
    setSubmitError(null);

    try {
      const response = await submitTraderApplication({
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country.trim(),
        brokerName: formData.brokerName.trim() || undefined,
        yearsTrading: Number(formData.yearsTrading),
        usesMetaTrader: formData.usesMetaTrader === "yes",
      });

      setSubmitStatus("success");
      alert("Thank you for your application.");
      onSubmitted(formData.email.trim().toLowerCase(), response.status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to submit application.";
      setSubmitError(message);
      setSubmitStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-32 sm:pt-36">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 pb-40">
        <button
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
        >
          ← Back to Home
        </button>

        <Card className="mt-6 shadow-sm">
          <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-2xl text-slate-900">
              Apply as a Trader
            </CardTitle>
            <CardDescription className="text-sm">
              Tell us a little about your trading background and we will review your application for platform access.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="mb-6 rounded-xl border border-teal-100 bg-teal-50/60 p-4 text-sm text-slate-700">
              We only need a few details to review your application. Once approved, we will contact you directly with next steps.
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Full Name
                </label>
                <Input
                  value={formData.fullName}
                  onChange={(event) =>
                    setFormData({ ...formData, fullName: event.target.value })
                  }
                  placeholder="Jane Trader"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    setFormData({ ...formData, email: event.target.value })
                  }
                  placeholder="jane@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Country
                </label>
                <Input
                  value={formData.country}
                  onChange={(event) =>
                    setFormData({ ...formData, country: event.target.value })
                  }
                  placeholder="United Kingdom"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Broker
                </label>
                <Input
                  value={formData.brokerName}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      brokerName: event.target.value,
                    })
                  }
                  placeholder="IC Markets"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Years Trading
                </label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.yearsTrading}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      yearsTrading: event.target.value,
                    })
                  }
                  placeholder="3"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Do You Use MetaTrader?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, usesMetaTrader: "yes" })
                    }
                    className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                      formData.usesMetaTrader === "yes"
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-300 bg-white text-slate-700 hover:border-teal-300"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, usesMetaTrader: "no" })
                    }
                    className={`rounded-lg border px-4 py-3 text-sm transition-colors ${
                      formData.usesMetaTrader === "no"
                        ? "border-teal-600 bg-teal-50 text-teal-700"
                        : "border-slate-300 bg-white text-slate-700 hover:border-teal-300"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {submitError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {submitError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700"
                  disabled={submitStatus === "loading"}
                >
                  {submitStatus === "loading" ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

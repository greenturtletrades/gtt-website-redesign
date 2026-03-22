import { useState, type FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
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
  onCheckStatus: () => void;
}

const experienceLevels = [
  { value: "BEGINNER", label: "Beginner (0-2 years)" },
  { value: "INTERMEDIATE", label: "Intermediate (2-5 years)" },
  { value: "ADVANCED", label: "Advanced (5+ years)" },
] as const;

const platforms = [
  { value: "MT4", label: "MetaTrader 4" },
  { value: "MT5", label: "MetaTrader 5" },
  { value: "CTRADER", label: "cTrader" },
] as const;

export function TraderApplicationForm({
  onBack,
  onSubmitted,
  onCheckStatus,
}: TraderApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    brokerName: "",
    platform: "",
    accountNumber: "",
    experienceLevel: "",
    riskDisclosureAccepted: false,
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

    if (!formData.riskDisclosureAccepted) {
      setSubmitError("Please confirm the risk disclosure to continue.");
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
        platform: formData.platform as "MT4" | "MT5" | "CTRADER",
        accountNumber: formData.accountNumber.trim(),
        experienceLevel: formData.experienceLevel as
          | "BEGINNER"
          | "INTERMEDIATE"
          | "ADVANCED",
        riskDisclosureAccepted: formData.riskDisclosureAccepted,
      });

      setSubmitStatus("success");
      onSubmitted(formData.email.trim().toLowerCase(), response.status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to submit application.";
      setSubmitError(message);
      setSubmitStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
        >
          ← Back to Home
        </button>

        <Card className="mt-6 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl text-slate-900">
              Trader Application
            </CardTitle>
            <CardDescription className="text-sm">
              Apply for early access to Turtle Analytics by sharing your trading
              details.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    Broker Name (optional)
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
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Platform
                  </label>
                  <Select
                    value={formData.platform}
                    onValueChange={(value) =>
                      setFormData({ ...formData, platform: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {platforms.map((platform) => (
                        <SelectItem key={platform.value} value={platform.value}>
                          {platform.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">
                    Account Number
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        accountNumber: event.target.value,
                      })
                    }
                    placeholder="123456789"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Trading Experience
                </label>
                <Select
                  value={formData.experienceLevel}
                  onValueChange={(value) =>
                    setFormData({ ...formData, experienceLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <Checkbox
                  checked={formData.riskDisclosureAccepted}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      riskDisclosureAccepted: checked === true,
                    })
                  }
                />
                <div className="text-xs text-slate-600">
                  I understand trading involves risk and I am applying for
                  evaluation to access Turtle Analytics.
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCheckStatus}
                >
                  Check Application Status
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="border-t text-xs text-slate-500">
            We review applications within 48 hours and will notify you by email.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

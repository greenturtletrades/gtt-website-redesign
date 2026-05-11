import { useEffect, useState, type FormEvent } from "react";
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
  fetchTraderApplicationStatus,
  type TraderApplicationStatus,
} from "../../api/traderApplication";

interface TraderApplicationStatusProps {
  initialToken?: string;
  initialStatus?: TraderApplicationStatus | null;
  initialRejectionReason?: string | null;
  onBack: () => void;
  onStartNew: () => void;
}

export function TraderApplicationStatus({
  initialToken = "",
  initialStatus = null,
  initialRejectionReason = null,
  onBack,
  onStartNew,
}: TraderApplicationStatusProps) {
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<TraderApplicationStatus | null>(
    initialStatus,
  );
  const [rejectionReason, setRejectionReason] = useState<string | null>(
    initialRejectionReason,
  );
  const [submitState, setSubmitState] = useState<
    "idle" | "loading" | "success" | "error"
  >(initialStatus ? "success" : "idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(initialToken);
  }, [initialToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token.trim()) {
      setErrorMessage("Enter the application status token you received after applying.");
      return;
    }

    setSubmitState("loading");
    setErrorMessage(null);

    try {
      const response = await fetchTraderApplicationStatus(token.trim());
      setStatus(response.status);
      setRejectionReason(response.rejectionReason ?? null);
      setSubmitState("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to fetch application status.";
      setErrorMessage(message);
      setSubmitState("error");
    }
  };

  const renderStatus = () => {
    if (!status) {
      return null;
    }

    if (status === "APPROVED") {
      return (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ Your application is approved. We will contact you with next steps.
        </div>
      );
    }

    if (status === "REJECTED") {
      return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Application not approved yet.{" "}
          {rejectionReason ? `Reason: ${rejectionReason}` : "We will email you with details."}
        </div>
      );
    }

    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        Your application is in review. We will email you once a decision is made.
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={onBack}
          className="text-sm text-slate-600 hover:text-teal-600 transition-colors"
        >
          ← Back to Home
        </button>

        <Card className="mt-6 shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="text-2xl text-slate-900">
              Application Status
            </CardTitle>
            <CardDescription className="text-sm">
              Check the status of your trader application.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {token.trim() && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
                <p className="font-medium">Your application status token</p>
                <p className="mt-2 break-all font-mono text-xs sm:text-sm">{token.trim()}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">
                  Application Status Token
                </label>
                <Input
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder="Paste your application token"
                  required
                />
                <p className="mt-2 text-xs text-slate-500">
                  This token is shown after submission and included in your confirmation email.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700"
                  disabled={submitState === "loading"}
                >
                  {submitState === "loading" ? "Checking..." : "Check Status"}
                </Button>
                <Button type="button" variant="outline" onClick={onStartNew}>
                  Start New Application
                </Button>
              </div>
            </form>

            {errorMessage && (
              <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            {renderStatus()}
          </CardContent>

          <CardFooter className="border-t text-xs text-slate-500">
            If you need help, contact support at contact@greenturtletrades.co.uk.
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

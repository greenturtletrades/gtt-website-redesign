import { apiPost } from "./client";

export function submitChurnFeedback(reason: string, feedback: string, plan: "payg" | null) {
  return apiPost<{ ok: boolean; id: string }>("/api/subscription/churn-feedback", {
    reason,
    feedback,
    plan,
  });
}

export function createCheckoutSession() {
  return apiPost<{ ok: boolean; url?: string; bypass?: boolean; internalAccount?: boolean }>("/api/create-checkout-session", {});
}

export function pauseSubscription() {
  return apiPost<{ ok: boolean; subscriptionStatus: string }>("/api/subscription/pause", {});
}

export function resumeSubscription() {
  return apiPost<{ ok: boolean; subscriptionStatus: string }>("/api/subscription/resume", {});
}

export function cancelSubscription(reason: string, feedback: string, plan: "payg" | null) {
  return apiPost<{ ok: boolean; subscriptionStatus: string; currentPeriodEnd: string | null }>(
    "/api/subscription/cancel",
    {
      reason,
      feedback,
      plan,
    }
  );
}

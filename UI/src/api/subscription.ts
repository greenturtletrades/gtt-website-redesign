import { apiPost } from "./client";

export function submitChurnFeedback(reason: string, feedback: string, plan: "payg" | null) {
  return apiPost<{ ok: boolean; id: string }>("/api/subscription/churn-feedback", {
    reason,
    feedback,
    plan,
  });
}

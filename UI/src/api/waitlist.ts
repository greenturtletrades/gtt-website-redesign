import { apiPost } from "./client";

export function joinWaitlist(email: string) {
  return apiPost<{ ok: boolean }>("/api/waitlist", {
    email,
    source: "landing",
  });
}

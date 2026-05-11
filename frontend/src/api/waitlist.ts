import { apiPost } from "./client";

export function joinWaitlist(email: string, source: "landing" | "investor" = "investor") {
  return apiPost<{ ok: boolean }>("/api/waitlist", {
    email,
    source,
  });
}

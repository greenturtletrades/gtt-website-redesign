import { apiGet, apiPost } from "./client";

export type TraderApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TraderApplicationPayload {
  fullName: string;
  email: string;
  country: string;
  brokerName?: string;
  platform: "MT4" | "MT5" | "CTRADER";
  accountNumber: string;
  experienceLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  riskDisclosureAccepted: boolean;
}

export interface TraderApplicationResponse {
  ok: boolean;
  id: string;
  status: TraderApplicationStatus;
}

export interface TraderApplicationStatusResponse {
  ok: boolean;
  status: TraderApplicationStatus;
  rejectionReason?: string | null;
}

export function submitTraderApplication(payload: TraderApplicationPayload) {
  return apiPost<TraderApplicationResponse>("/api/trader/apply", payload);
}

export function fetchTraderApplicationStatus(email: string) {
  const query = encodeURIComponent(email);
  return apiGet<TraderApplicationStatusResponse>(`/api/trader/application?email=${query}`);
}

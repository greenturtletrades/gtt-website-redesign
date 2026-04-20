import { apiGet, apiPost } from "./client";

export type TraderApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TraderApplicationPayload {
  fullName: string;
  email: string;
  country: string;
  brokerName?: string;
  yearsTrading: number;
  usesMetaTrader: boolean;
}

export interface TraderApplicationResponse {
  ok: boolean;
  id: string;
  status: TraderApplicationStatus;
  statusLookupToken: string;
}

export interface TraderApplicationStatusResponse {
  ok: boolean;
  status: TraderApplicationStatus;
  rejectionReason?: string | null;
}

export function submitTraderApplication(payload: TraderApplicationPayload) {
  return apiPost<TraderApplicationResponse>("/api/trader/apply", payload);
}

export function fetchTraderApplicationStatus(token: string) {
  const query = encodeURIComponent(token);
  return apiGet<TraderApplicationStatusResponse>(`/api/trader/application?token=${query}`);
}

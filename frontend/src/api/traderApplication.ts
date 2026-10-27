import { apiGet, apiPostForm } from "./client";

export type TraderApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TradingPlatform = "MT4" | "MT5" | "CTRADER" | "OTHER";
export type TradingMarket = "FX" | "INDICES" | "COMMODITIES" | "EQUITIES" | "CRYPTO";
export type TradingStyle = "DISCRETIONARY" | "AUTOMATED" | "BOTH";
export type EquityRange = "UNDER_5K" | "5K_25K" | "25K_100K" | "100K_500K" | "OVER_500K";
export type HoldingPeriod = "INTRADAY" | "DAYS" | "WEEKS" | "MONTHS";
export type RecordType = "LIVE" | "DEMO" | "COMPETITION";

// Field names match the multipart form fields the backend reads (see redesign-docs/02-backend-build-guide.md).
export interface TraderApplicationFields {
  fullName: string;
  email: string;
  country: string;
  phone?: string;
  linkedinUrl?: string;
  brokerName: string;
  platform: TradingPlatform;
  platformOther?: string;
  markets: TradingMarket[];
  tradingStyle: TradingStyle;
  historyStartDate: string;
  yearsExperience: number;
  equityRange: EquityRange;
  verifiedRecordUrl?: string;
  returnPct: number;
  maxDrawdownPct: number;
  calcMethod: string;
  strategySummary: string;
  holdingPeriod: HoldingPeriod;
  sizingApproach: string;
  recordType: RecordType;
  whyGtt: string;
  suitability: string;
  timeCommitment: string;
  consentAccurate: boolean;
  consentPrivacy: boolean;
}

export interface TraderApplicationFiles {
  cv: File;
  brokerStatement: File;
  tradeHistory: File;
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

export function submitTraderApplication(fields: TraderApplicationFields, files: TraderApplicationFiles) {
  const body = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => body.append(key, item));
    } else {
      body.append(key, String(value));
    }
  });
  body.append("cv", files.cv);
  body.append("brokerStatement", files.brokerStatement);
  body.append("tradeHistory", files.tradeHistory);
  return apiPostForm<TraderApplicationResponse>("/api/trader/apply", body);
}

export function fetchTraderApplicationStatus(token: string) {
  const query = encodeURIComponent(token);
  return apiGet<TraderApplicationStatusResponse>(`/api/trader/application?token=${query}`);
}

import { apiGet } from "./client";

export interface PublicLeaderboardRow {
  rank: number;
  id: string;
  name: string;
  market: string;
  percentilePnl: number | null;
  verifiedPnl: number | null;
  winRate: number | null;
  riskPerTradePercent: number | null;
  totalTrades: number;
  avgRMultiple: number | null;
  riskLevel: "Low" | "Medium" | "High" | "N/A";
  lastUpdatedAt: string | null;
  source: "analysis" | "journal";
}

export interface PublicLeaderboardResponse {
  ok: boolean;
  minimumTradeCount: number;
  leaderboard: PublicLeaderboardRow[];
}

export function fetchPublicLeaderboard() {
  return apiGet<PublicLeaderboardResponse>("/api/public/leaderboard");
}

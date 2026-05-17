import { apiGet } from "./client";

export interface PublicLeaderboardRow {
  rank: number;
  id: string;
  name: string;
  market: string;
  percentilePnl: number;
  winRate: number | null;
  riskPerTradePercent: number;
  totalTrades: number;
  riskLevel: "Low" | "Medium" | "High";
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

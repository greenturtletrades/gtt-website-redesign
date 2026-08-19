import { apiGet } from "./client";

export interface PublicLeaderboardRow {
  rank: number;
  id: string;
  name: string;
  initials: string;
  universityName: string;
  score: number;
  winRate: number;
  avgReturn: number;
  totalReturnPercent: number;
  realizedReturnPercent: number;
  unrealizedReturnPercent: number;
  riskLabel: string;
  totalTrades: number;
  openTrades: number;
  followers: number;
  aum: number;
  mainAssets: string[];
  lastUpdatedAt: string | null;
}

export interface PublicUniversityLeaderboardRow {
  rank: number;
  universityName: string;
  activeTraders: number;
  totalTraders: number;
  totalReturnPercent: number;
  realizedReturnPercent: number;
  unrealizedReturnPercent: number;
  score: number;
  avgTraderScore: number;
  winRate: number;
  avgRiskScore: number | null;
  riskLabel: string;
  trades: number;
  followers: number;
  aum: number;
}

export interface PublicLeaderboardResponse {
  ok: boolean;
  source: "university_competition";
  leaderboard: PublicLeaderboardRow[];
  universities: PublicUniversityLeaderboardRow[];
}

export function fetchPublicLeaderboard() {
  return apiGet<PublicLeaderboardResponse>("/api/public/leaderboard");
}

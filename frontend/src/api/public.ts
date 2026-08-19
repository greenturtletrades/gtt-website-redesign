import { apiGet } from "./client";

export interface PublicPerformancePoint {
  date: string | null;
  value: number;
}

export interface PublicRecentTrade {
  id: string;
  symbol: string;
  side: "LONG" | "SHORT";
  status: string;
  pnl: number;
  pnlPercent: number;
  entryTime: string | null;
  exitTime: string | null;
  closeReason: string | null;
}

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
  performanceData: PublicPerformancePoint[];
  recentTrades: PublicRecentTrade[];
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

export interface PublicCompetitionArchive {
  id: string;
  competitionId: string;
  competitionName: string;
  archiveLabel: string;
  year: number;
  region: string;
  status: string;
  savedAt: string | null;
  rowCount: number;
  note: string | null;
}

export interface PublicCompetitionOverview {
  id: string;
  name: string;
  year: number;
  region: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  startingBalance: number;
  includedUniversities: string[];
  locked: boolean;
  archives: PublicCompetitionArchive[];
  selectedArchive?: PublicCompetitionArchive;
}

export interface PublicLeaderboardResponse {
  ok: boolean;
  source: "university_competition";
  competition?: PublicCompetitionOverview;
  leaderboard: PublicLeaderboardRow[];
  universities: PublicUniversityLeaderboardRow[];
}

export function fetchPublicLeaderboard(archiveId?: string) {
  const query = archiveId ? `?archiveId=${encodeURIComponent(archiveId)}` : "";
  return apiGet<PublicLeaderboardResponse>(`/api/public/leaderboard${query}`);
}

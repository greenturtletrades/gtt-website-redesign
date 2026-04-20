import { API_BASE, ApiError, apiDelete, apiGet, apiPost, getAuthHeaders } from "./client";

export interface AnalysisOptionsResponse {
  ok: boolean;
  availableTradeCount: number;
  minimumTradeCount: number;
  recommendedTradeCount: number;
  mlRunDiscountPercent: number;
  accountDiscountPercent: number;
  referralCode: string | null;
  latestAnalysis: {
    id: string;
    updatedAt: string;
    tradesAnalysed: number | null;
    tradeFingerprint: string | null;
  } | null;
}

export interface StartAnalysisResponse {
  ok: boolean;
  jobId: string;
  analysisRunId?: string;
  estimatedCost?: number;
  availableTradeCount?: number;
  pendingTradeCount?: number;
  duplicateTradeCount?: number;
  importedTradeCount?: number;
  storedTradeCount?: number;
}

export interface AnalysisJobResponse {
  status: string;
  error?: string;
  report?: unknown;
  tradesAnalysed?: number;
  trades_analysed?: number;
  simulationsRun?: number;
  simulations_run?: number;
  regimesFound?: number;
  regimes_found?: number;
  avgRMultiple?: number;
  avg_r_multiple?: number;
  cost?: number;
}

export function fetchAnalysisOptions() {
  return apiGet<AnalysisOptionsResponse>("/api/analyse/options");
}

export function deleteAnalysisRun(runId: string, deleteJournalData = false) {
  return apiDelete<{ ok: boolean }>(`/api/analyse/history/${encodeURIComponent(runId)}`, {
    deleteJournalData,
  });
}

export function startAnalysis(input: { mode: "trades" | "months" | "csv"; tradeCount: number; months: number }) {
  return apiPost<StartAnalysisResponse>("/api/analyse", input);
}

export async function startCsvAnalysis(file: File, replaceDataset = false) {
  const formData = new FormData();
  formData.append("file", file);

  const csvUrl = new URL(`${API_BASE}/api/analyse/csv`);
  if (replaceDataset) {
    csvUrl.searchParams.set("replace", "1");
  }

  const response = await fetch(csvUrl.toString(), {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = (payload && (payload.error || payload.detail || payload.message)) || "Failed to start analysis";
    throw new ApiError(msg, response.status, payload);
  }

  return payload as StartAnalysisResponse;
}

export function pollAnalysisJob(jobId: string) {
  return apiGet<AnalysisJobResponse>(`/api/analyse/${jobId}`);
}

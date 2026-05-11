import { API_BASE, ApiError, clearStoredToken, getAuthHeaders } from "./client";

export interface UpdateTradeJournalInput {
  notes: string;
  emotions: string;
  lessonsLearned: string;
  pair: string;
  direction: "long" | "short";
  date: string;
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  exitPrice: number;
}

export interface UpdateTradeJournalResponse<TTrade = unknown> {
  ok: boolean;
  trade?: TTrade;
}

export async function updateTradeJournalEntry<TTrade = unknown>(
  tradeIdentity: string,
  input: UpdateTradeJournalInput,
  apiBase = API_BASE
) {
  const response = await fetch(
    `${apiBase}/api/trades/${encodeURIComponent(tradeIdentity)}/journal`,
    {
      method: "PATCH",
      credentials: "include",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(input),
    }
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
    }
    const message =
      (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : null) || "Failed to save journal notes.";
    throw new ApiError(message, response.status, payload);
  }

  return (payload || { ok: true }) as UpdateTradeJournalResponse<TTrade>;
}

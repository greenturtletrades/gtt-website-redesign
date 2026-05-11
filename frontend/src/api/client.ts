export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) || "http://localhost:3001";

const TOKEN_KEY = "gtt_token";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getAuthHeaders(extraHeaders?: Record<string, string>) {
  const token = getStoredToken();
  return {
    ...(extraHeaders || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    credentials: "include",
    headers: getAuthHeaders(),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    credentials: "include",
    headers:
      typeof body === "undefined"
        ? getAuthHeaders()
        : getAuthHeaders({ "Content-Type": "application/json" }),
    ...(typeof body === "undefined" ? {} : { body: JSON.stringify(body) }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || "Request failed";
    throw new ApiError(msg, res.status, data);
  }

  return data as T;
}

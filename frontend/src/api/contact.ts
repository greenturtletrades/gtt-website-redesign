import { apiPost } from "./client";

export interface ContactPayload {
  name?: string;
  email: string;
  subject?: string;
  message: string;
}

export function submitContact(payload: ContactPayload) {
  return apiPost<{ ok: boolean }>("/api/contact", payload);
}

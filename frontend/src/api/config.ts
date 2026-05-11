import { apiGet } from "./client";

export function getConfig() {
  return apiGet<{ ml_enabled: boolean }>("/config");
}

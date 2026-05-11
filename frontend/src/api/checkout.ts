import { apiPost } from "./client";

interface CheckoutSessionResponse {
  ok: boolean;
  url: string;
}

export async function createCheckoutSession(): Promise<string> {
  const data = await apiPost<CheckoutSessionResponse>(
    "/api/create-checkout-session",
    {}
  );
  return data.url;
}

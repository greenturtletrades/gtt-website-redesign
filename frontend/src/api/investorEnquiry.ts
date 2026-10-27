import { apiPost } from "./client";

export type EnquiringAs = "INDIVIDUAL" | "ORGANISATION";
export type ProfessionalStatus = "YES" | "NO" | "NOT_SURE";
export type AllocationRange = "UNDER_50K" | "50K_250K" | "250K_1M" | "OVER_1M";
export type EnquiryTiming = "WITHIN_3_MONTHS" | "3_TO_12_MONTHS" | "EXPLORING";

export interface InvestorEnquiryPayload {
  fullName: string;
  email: string;
  phone?: string;
  enquiringAs: EnquiringAs;
  organisation?: string;
  role?: string;
  country: string;
  professionalStatus: ProfessionalStatus;
  allocationRange: AllocationRange;
  objectives: string;
  timing: EnquiryTiming;
  message?: string;
  consentPrivacy: boolean;
}

export function submitInvestorEnquiry(payload: InvestorEnquiryPayload) {
  return apiPost<{ ok: boolean; id: string }>("/api/investor/enquiry", payload);
}

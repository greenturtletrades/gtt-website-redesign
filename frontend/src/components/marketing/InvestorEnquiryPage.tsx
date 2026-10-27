import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { ApiError } from "../../api/client";
import { submitInvestorEnquiry, type AllocationRange, type EnquiringAs, type EnquiryTiming, type ProfessionalStatus } from "../../api/investorEnquiry";
import { isFormsDemo } from "../../featureFlags";
import { CheckboxField, ChoiceField, SelectField, TextAreaField, TextField, type FieldErrors } from "../forms/FormControls";
import { countryOptions } from "../forms/countries";
import { NoticeBanner, PageShell } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

interface EnquiryState {
  fullName: string;
  email: string;
  phone: string;
  enquiringAs: EnquiringAs | "";
  organisation: string;
  role: string;
  country: string;
  professionalStatus: ProfessionalStatus | "";
  allocationRange: AllocationRange | "";
  objectives: string;
  timing: EnquiryTiming | "";
  message: string;
  consentPrivacy: boolean;
}

const emptyEnquiry: EnquiryState = {
  fullName: "", email: "", phone: "", enquiringAs: "", organisation: "", role: "", country: "",
  professionalStatus: "", allocationRange: "", objectives: "", timing: "", message: "", consentPrivacy: false,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(form: EnquiryState): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address, like name@example.com.";
  if (!form.enquiringAs) errors.enquiringAs = "Tell us whether you're enquiring as an individual or an organisation.";
  if (form.enquiringAs === "ORGANISATION") {
    if (!form.organisation.trim()) errors.organisation = "Enter your organisation's name.";
    if (!form.role.trim()) errors.role = "Enter your role.";
  }
  if (!form.country) errors.country = form.enquiringAs === "ORGANISATION" ? "Select the country of incorporation." : "Select your country of residence.";
  if (!form.professionalStatus) errors.professionalStatus = "Select an answer.";
  if (!form.allocationRange) errors.allocationRange = "Select an indicative allocation.";
  if (!form.objectives.trim()) errors.objectives = "Tell us briefly what you want to achieve.";
  if (!form.timing) errors.timing = "Select your intended timing.";
  if (!form.consentPrivacy) errors.consentPrivacy = "Confirm you have read the privacy notice.";
  return errors;
}

export function InvestorEnquiryPage({ onNavigate }: { onNavigate?: Navigate }) {
  const [form, setForm] = useState<EnquiryState>(emptyEnquiry);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const confirmRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (done) {
      window.scrollTo(0, 0);
      confirmRef.current?.focus();
    }
  }, [done]);

  const set = <K extends keyof EnquiryState>(key: K) => (value: EnquiryState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const submit = async () => {
    const found = validate(form);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".has-error input, .has-error select, .has-error textarea")?.focus());
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!isFormsDemo) {
        const isOrganisation = form.enquiringAs === "ORGANISATION";
        await submitInvestorEnquiry({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          enquiringAs: form.enquiringAs as EnquiringAs,
          organisation: isOrganisation ? form.organisation.trim() : undefined,
          role: isOrganisation ? form.role.trim() : undefined,
          country: form.country,
          professionalStatus: form.professionalStatus as ProfessionalStatus,
          allocationRange: form.allocationRange as AllocationRange,
          objectives: form.objectives.trim(),
          timing: form.timing as EnquiryTiming,
          message: form.message.trim() || undefined,
          consentPrivacy: form.consentPrivacy,
        });
      }
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) setSubmitError("Too many attempts from this connection. Please wait a few minutes and try again.");
      else if (error instanceof ApiError) setSubmitError(error.message);
      else setSubmitError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return <PageShell tone="investor">
      <div className="gtt-form-shell">
        <div className="gtt-form-card gtt-confirm" role="status">
          <div className="gtt-confirm-icon" style={{ background: "#cffafe", color: "#0e7490" }}><CheckCircle2 size={32} aria-hidden="true" /></div>
          <h1 ref={confirmRef} tabIndex={-1}>Thank you for your enquiry</h1>
          <p>A member of the GTT team will contact you to discuss the service and next steps.</p>
          <p className="gtt-fine">Access depends on assessment and client categorisation by the regulated firm. This enquiry does not establish eligibility.</p>
          <div className="gtt-hero-actions">
            <button type="button" className="home-brand-button home-brand-button-secondary" onClick={() => onNavigate?.("professional-investors")}>Back to Professional Investors</button>
          </div>
        </div>
      </div>
    </PageShell>;
  }

  const isOrganisation = form.enquiringAs === "ORGANISATION";

  return <PageShell tone="investor">
    <div className="gtt-form-shell">
      <div className="gtt-form-card">
        <button type="button" className="gtt-text-link gtt-form-back" onClick={() => onNavigate?.("professional-investors")}>
          <ArrowLeft size={16} aria-hidden="true" />Professional Investors
        </button>
        <h1>Enquire about access</h1>
        <p className="gtt-form-intro">Tell us a little about yourself and what you're looking for. This starts a conversation; it doesn't commit you to anything.</p>
        <div style={{ marginBottom: 28 }}>
          <NoticeBanner><strong>For professional clients only.</strong> This enquiry does not establish eligibility. Don't send categorisation evidence or identity documents here; they are collected later through a private onboarding process.</NoticeBanner>
        </div>

        <form noValidate onSubmit={(event) => { event.preventDefault(); void submit(); }}>
          <div className="gtt-fields">
            <TextField label="Full name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
            <TextField label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
            <TextField label="Telephone" type="tel" optional value={form.phone} onChange={set("phone")} autoComplete="tel" />
            <ChoiceField label="Enquiring as" options={[{ value: "INDIVIDUAL", label: "Individual" }, { value: "ORGANISATION", label: "Organisation" }]} value={form.enquiringAs} onChange={(value) => set("enquiringAs")(value as EnquiringAs)} error={errors.enquiringAs} />
            {isOrganisation && <>
              <TextField label="Organisation" value={form.organisation} onChange={set("organisation")} error={errors.organisation} autoComplete="organization" />
              <TextField label="Your role" value={form.role} onChange={set("role")} error={errors.role} autoComplete="organization-title" />
            </>}
            <SelectField label={isOrganisation ? "Country of incorporation" : "Country of residence"} full value={form.country} onChange={set("country")} options={countryOptions} error={errors.country} />
            <ChoiceField
              label="Are you already classified as a professional client by a regulated firm?"
              options={[{ value: "YES", label: "Yes" }, { value: "NO", label: "No" }, { value: "NOT_SURE", label: "Not sure" }]}
              value={form.professionalStatus}
              onChange={(value) => set("professionalStatus")(value as ProfessionalStatus)}
              error={errors.professionalStatus}
            />
            <ChoiceField
              label="Indicative allocation"
              options={[{ value: "UNDER_50K", label: "Under £50k" }, { value: "50K_250K", label: "£50k – £250k" }, { value: "250K_1M", label: "£250k – £1m" }, { value: "OVER_1M", label: "Over £1m" }]}
              value={form.allocationRange}
              onChange={(value) => set("allocationRange")(value as AllocationRange)}
              error={errors.allocationRange}
            />
            <TextField label="Investment objectives" full value={form.objectives} onChange={set("objectives")} error={errors.objectives} hint="For example: diversify into systematic FX strategies with a 15% drawdown limit." />
            <ChoiceField
              label="Intended timing"
              options={[{ value: "WITHIN_3_MONTHS", label: "Within 3 months" }, { value: "3_TO_12_MONTHS", label: "3–12 months" }, { value: "EXPLORING", label: "Exploring" }]}
              value={form.timing}
              onChange={(value) => set("timing")(value as EnquiryTiming)}
              error={errors.timing}
            />
            <TextAreaField label="Message or question" optional value={form.message} onChange={set("message")} rows={4} />
            <CheckboxField checked={form.consentPrivacy} onChange={set("consentPrivacy")} error={errors.consentPrivacy}>
              I have read the <a href="/privacy" target="_blank" rel="noreferrer" className="gtt-text-link" style={{ fontSize: "inherit" }}>privacy notice</a> and agree to GTT contacting me about this enquiry.
            </CheckboxField>
          </div>

          {submitError && <div className="gtt-form-alert" role="alert">{submitError}</div>}

          <div className="gtt-form-actions" style={{ justifyContent: "flex-end" }}>
            <button type="submit" className="home-brand-button gtt-button-investor" disabled={submitting}>
              {submitting ? "Sending…" : "Send enquiry"}{!submitting && <ArrowRight size={18} aria-hidden="true" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  </PageShell>;
}

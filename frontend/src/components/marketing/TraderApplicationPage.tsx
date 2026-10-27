import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileSpreadsheet, Gauge, Landmark, Lock, Save, UserRound } from "lucide-react";
import type { ViewType } from "../../seo/routes";
import { ApiError } from "../../api/client";
import {
  submitTraderApplication,
  type EquityRange,
  type HoldingPeriod,
  type RecordType,
  type TradingMarket,
  type TradingPlatform,
  type TradingStyle,
} from "../../api/traderApplication";
import { isFormsDemo } from "../../featureFlags";
import { CheckboxField, ChoiceField, FileField, SelectField, TextAreaField, TextField, type FieldErrors } from "../forms/FormControls";
import { countryOptions } from "../forms/countries";
import { NoticeBanner, PageShell } from "./PageBlocks";

type Navigate = (view: ViewType) => void;

const STORAGE_KEY = "gtt_trader_application_draft_v1";
const MB = 1024 * 1024;
const ANSWER_LIMIT = 600;
const LARGE_FILE_EMAIL = "contact@greenturtletraders.co.uk";

const stepTitles = ["About you", "Trading account", "Evidence", "Questions and consent"];

interface FormState {
  fullName: string;
  email: string;
  country: string;
  phone: string;
  linkedinUrl: string;
  brokerName: string;
  platform: TradingPlatform | "";
  platformOther: string;
  markets: TradingMarket[];
  tradingStyle: TradingStyle | "";
  historyStartDate: string;
  yearsExperience: string;
  equityRange: EquityRange | "";
  verifiedRecordUrl: string;
  returnPct: string;
  maxDrawdownPct: string;
  calcMethod: string;
  strategySummary: string;
  holdingPeriod: HoldingPeriod | "";
  sizingApproach: string;
  recordType: RecordType | "";
  whyGtt: string;
  suitability: string;
  timeCommitment: string;
  consentAccurate: boolean;
  consentPrivacy: boolean;
}

interface FileState {
  cv: File | null;
  brokerStatement: File | null;
  tradeHistory: File | null;
}

const emptyForm: FormState = {
  fullName: "", email: "", country: "", phone: "", linkedinUrl: "",
  brokerName: "", platform: "", platformOther: "", markets: [], tradingStyle: "", historyStartDate: "", yearsExperience: "", equityRange: "",
  verifiedRecordUrl: "", returnPct: "", maxDrawdownPct: "", calcMethod: "", strategySummary: "", holdingPeriod: "", sizingApproach: "", recordType: "",
  whyGtt: "", suitability: "", timeCommitment: "", consentAccurate: false, consentPrivacy: false,
};

const platformOptions = [
  { value: "MT4", label: "MetaTrader 4" },
  { value: "MT5", label: "MetaTrader 5" },
  { value: "CTRADER", label: "cTrader" },
  { value: "OTHER", label: "Other" },
];
const marketOptions = [
  { value: "FX", label: "FX" },
  { value: "INDICES", label: "Indices" },
  { value: "COMMODITIES", label: "Commodities" },
  { value: "EQUITIES", label: "Equities" },
  { value: "CRYPTO", label: "Crypto" },
];
const styleOptions = [
  { value: "DISCRETIONARY", label: "Discretionary" },
  { value: "AUTOMATED", label: "Automated" },
  { value: "BOTH", label: "Both" },
];
const equityOptions = [
  { value: "UNDER_5K", label: "Under £5,000" },
  { value: "5K_25K", label: "£5,000 – £25,000" },
  { value: "25K_100K", label: "£25,000 – £100,000" },
  { value: "100K_500K", label: "£100,000 – £500,000" },
  { value: "OVER_500K", label: "Over £500,000" },
];
const holdingOptions = [
  { value: "INTRADAY", label: "Intraday (closed same day)" },
  { value: "DAYS", label: "Days" },
  { value: "WEEKS", label: "Weeks" },
  { value: "MONTHS", label: "Months or longer" },
];
const recordOptions = [
  { value: "LIVE", label: "Live" },
  { value: "DEMO", label: "Demo" },
  { value: "COMPETITION", label: "Competition" },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function loadDraft(): { form: FormState; step: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { form: { ...emptyForm, ...parsed.form }, step: Number(parsed.step) || 0 };
  } catch {
    return null;
  }
}

function validateStep(step: number, form: FormState, files: FileState): FieldErrors {
  const errors: FieldErrors = {};
  const required = (key: keyof FormState, message: string) => {
    const value = form[key];
    if (Array.isArray(value) ? value.length === 0 : typeof value === "string" ? !value.trim() : !value) errors[key] = message;
  };

  if (step === 1) {
    required("fullName", "Enter your full name.");
    if (!emailPattern.test(form.email.trim())) errors.email = "Enter a valid email address, like name@example.com.";
    required("country", "Select your country of residence.");
    if (!files.cv) errors.cv = "Upload your CV.";
    if (form.linkedinUrl.trim() && !isUrl(form.linkedinUrl.trim())) errors.linkedinUrl = "Enter a full web address starting with https://.";
  }

  if (step === 2) {
    required("brokerName", "Enter the name of your broker.");
    required("platform", "Select your trading platform.");
    if (form.platform === "OTHER") required("platformOther", "Tell us which platform you use.");
    required("markets", "Select at least one market.");
    required("tradingStyle", "Select your trading style.");
    required("historyStartDate", "Enter the date your live history starts.");
    if (form.historyStartDate && new Date(form.historyStartDate) > new Date()) errors.historyStartDate = "The start date can't be in the future.";
    const years = Number(form.yearsExperience);
    if (!form.yearsExperience.trim() || !Number.isFinite(years) || years < 0 || years > 60) errors.yearsExperience = "Enter your years of trading experience, for example 4.";
    required("equityRange", "Select your approximate account equity.");
  }

  if (step === 3) {
    if (!files.brokerStatement) errors.brokerStatement = "Upload your broker statement.";
    if (!files.tradeHistory) errors.tradeHistory = "Upload your trade history export.";
    if (form.verifiedRecordUrl.trim() && !isUrl(form.verifiedRecordUrl.trim())) errors.verifiedRecordUrl = "Enter a full web address starting with https://.";
    if (!form.returnPct.trim() || !Number.isFinite(Number(form.returnPct))) errors.returnPct = "Enter your historical return as a number.";
    const drawdown = Number(form.maxDrawdownPct);
    if (!form.maxDrawdownPct.trim() || !Number.isFinite(drawdown) || drawdown < 0 || drawdown > 100) errors.maxDrawdownPct = "Enter your maximum drawdown between 0 and 100.";
    required("calcMethod", "Tell us how you calculated these figures.");
    required("strategySummary", "Describe your strategy.");
    required("holdingPeriod", "Select your typical holding period.");
    required("sizingApproach", "Describe how you size positions.");
    required("recordType", "Select the type of record you're submitting.");
  }

  if (step === 4) {
    (["whyGtt", "suitability", "timeCommitment"] as const).forEach((key) => {
      if (!form[key].trim()) errors[key] = "Answer this question.";
      else if (form[key].length > ANSWER_LIMIT) errors[key] = `Keep your answer under ${ANSWER_LIMIT} characters.`;
    });
    if (!form.consentAccurate) errors.consentAccurate = "Confirm your record is accurate and that you may share it.";
    if (!form.consentPrivacy) errors.consentPrivacy = "Confirm you have read the privacy notice.";
  }

  return errors;
}

function describeSubmitError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Trader applications are not open yet. Your answers are saved in this browser, so you can submit once they reopen.";
    if (error.status === 413) return `One of your files is too large. Email ${LARGE_FILE_EMAIL} and we'll send you a private upload link.`;
    if (error.status === 429) return "Too many attempts from this connection. Please wait a few minutes and try again.";
    return error.message;
  }
  return "We couldn't reach the server. Check your connection and try again. Your answers are saved in this browser.";
}

export function TraderApplicationPage({ onNavigate }: { onNavigate?: Navigate }) {
  const draft = useRef(loadDraft()).current;
  const [step, setStep] = useState(draft?.step ?? 0);
  const [form, setForm] = useState<FormState>(draft?.form ?? emptyForm);
  const [files, setFiles] = useState<FileState>({ cv: null, brokerStatement: null, tradeHistory: null });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (done) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ form, step }));
    } catch {
      // Storage may be unavailable (private mode); the form still works without it.
    }
  }, [form, step, done]);

  useEffect(() => {
    window.scrollTo(0, 0);
    headingRef.current?.focus();
  }, [step, done]);

  const set = <K extends keyof FormState>(key: K) => (value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };
  const setFile = (key: keyof FileState) => (file: File | null) => {
    setFiles((current) => ({ ...current, [key]: file }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const next = () => {
    const stepErrors = validateStep(step, form, files);
    setErrors(stepErrors);
    if (Object.values(stepErrors).some(Boolean)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(".has-error input, .has-error select, .has-error textarea")?.focus());
      return;
    }
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    // Files are not kept across a page reload, so send the applicant back to re-attach them.
    const missingStep = !files.cv ? 1 : !files.brokerStatement || !files.tradeHistory ? 3 : null;
    if (missingStep) {
      setStep(missingStep);
      setErrors(validateStep(missingStep, form, files));
      return;
    }
    void submit();
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (!isFormsDemo) {
        await submitTraderApplication({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          country: form.country,
          phone: form.phone.trim() || undefined,
          linkedinUrl: form.linkedinUrl.trim() || undefined,
          brokerName: form.brokerName.trim(),
          platform: form.platform as TradingPlatform,
          platformOther: form.platform === "OTHER" ? form.platformOther.trim() : undefined,
          markets: form.markets,
          tradingStyle: form.tradingStyle as TradingStyle,
          historyStartDate: form.historyStartDate,
          yearsExperience: Number(form.yearsExperience),
          equityRange: form.equityRange as EquityRange,
          verifiedRecordUrl: form.verifiedRecordUrl.trim() || undefined,
          returnPct: Number(form.returnPct),
          maxDrawdownPct: Number(form.maxDrawdownPct),
          calcMethod: form.calcMethod.trim(),
          strategySummary: form.strategySummary.trim(),
          holdingPeriod: form.holdingPeriod as HoldingPeriod,
          sizingApproach: form.sizingApproach.trim(),
          recordType: form.recordType as RecordType,
          whyGtt: form.whyGtt.trim(),
          suitability: form.suitability.trim(),
          timeCommitment: form.timeCommitment.trim(),
          consentAccurate: form.consentAccurate,
          consentPrivacy: form.consentPrivacy,
        }, {
          cv: files.cv as File,
          brokerStatement: files.brokerStatement as File,
          tradeHistory: files.tradeHistory as File,
        });
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore storage errors.
      }
      setDone(true);
    } catch (error) {
      setSubmitError(describeSubmitError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const oversize = (limit: string) => <>This file is larger than {limit}. Email <a href={`mailto:${LARGE_FILE_EMAIL}?subject=Large%20file%20upload%20for%20trader%20application`}>{LARGE_FILE_EMAIL}</a> and we'll send you a private upload link.</>;
  const filesMissingAfterReload = Boolean(draft && draft.step > 1) && !files.cv && !files.brokerStatement;

  if (done) {
    return <PageShell tone="trader">
      <div className="gtt-form-shell">
        <div className="gtt-form-card gtt-confirm" role="status">
          <div className="gtt-confirm-icon"><CheckCircle2 size={32} aria-hidden="true" /></div>
          <h1 ref={headingRef} tabIndex={-1}>Thanks, we've received your application</h1>
          <p>We will review your CV and records, verify your trading history and contact you within 10 working days if we'd like to discuss your strategy.</p>
          <p>A confirmation has been sent to <strong>{form.email}</strong>.</p>
          <p className="gtt-fine">Applying does not guarantee selection, a contract or investor capital.</p>
          <div className="gtt-hero-actions">
            <button type="button" className="home-brand-button home-brand-button-secondary" onClick={() => onNavigate?.("landing")}>Back to the homepage</button>
          </div>
        </div>
      </div>
    </PageShell>;
  }

  return <PageShell tone="trader">
    <div className="gtt-form-shell">
      <div className="gtt-form-card">
        <button type="button" className="gtt-text-link gtt-form-back" onClick={() => (step === 0 ? onNavigate?.("traders") : setStep(step - 1))}>
          <ArrowLeft size={16} aria-hidden="true" />{step === 0 ? "For Traders" : "Previous step"}
        </button>

        {step === 0 ? <>
          <h1 ref={headingRef} tabIndex={-1}>Apply as a trader</h1>
          <p className="gtt-form-intro">The application has four short steps and takes about 20 minutes. Have these documents ready before you start:</p>
          <ul className="gtt-doc-list" style={{ gridTemplateColumns: "1fr" }}>
            <li><span className="gtt-card-icon"><UserRound size={20} aria-hidden="true" /></span><div><strong>Your CV</strong><span>PDF, DOC or DOCX, up to 10 MB</span></div></li>
            <li><span className="gtt-card-icon"><Landmark size={20} aria-hidden="true" /></span><div><strong>Broker statement</strong><span>PDF, up to 20 MB</span></div></li>
            <li><span className="gtt-card-icon"><FileSpreadsheet size={20} aria-hidden="true" /></span><div><strong>Trade history export</strong><span>CSV or XLSX, up to 20 MB</span></div></li>
            <li><span className="gtt-card-icon"><Gauge size={20} aria-hidden="true" /></span><div><strong>Your headline figures</strong><span>Historical return, maximum drawdown and how you calculated them</span></div></li>
          </ul>
          <p className="gtt-saved-note"><Save size={14} aria-hidden="true" />Your answers are saved in this browser as you go. Uploaded files need re-attaching if you leave and come back.</p>
          <div className="gtt-form-actions" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="home-brand-button gtt-button-trader" onClick={() => setStep(1)}>Start application<ArrowRight size={18} aria-hidden="true" /></button>
          </div>
        </> : <>
          <div className="gtt-progress">
            <div className="gtt-progress-top"><strong>Step {step} of 4: {stepTitles[step - 1]}</strong><span>{Math.round(((step - 1) / 4) * 100)}% complete</span></div>
            <div className="gtt-progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={4} aria-valuenow={step - 1} aria-label="Application progress"><span style={{ width: `${((step - 1) / 4) * 100 + 4}%` }} /></div>
            <ol className="gtt-progress-steps">
              {stepTitles.map((title, index) => <li key={title} aria-current={index + 1 === step ? "step" : undefined} className={index + 1 < step ? "is-done" : undefined}>{index + 1}. {title}</li>)}
            </ol>
          </div>

          <h1 ref={headingRef} tabIndex={-1} style={{ fontSize: 26 }}>{stepTitles[step - 1]}</h1>

          {filesMissingAfterReload && <div style={{ marginBottom: 24 }}><NoticeBanner>Your typed answers were restored, but files can't be kept in the browser. Go back to re-attach your CV and evidence before submitting.</NoticeBanner></div>}

          <form noValidate onSubmit={(event) => { event.preventDefault(); next(); }}>
            {step === 1 && <div className="gtt-fields">
              <TextField label="Full name" value={form.fullName} onChange={set("fullName")} error={errors.fullName} autoComplete="name" />
              <TextField label="Email" type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
              <SelectField label="Country of residence" value={form.country} onChange={set("country")} options={countryOptions} error={errors.country} />
              <TextField label="Telephone" type="tel" optional value={form.phone} onChange={set("phone")} autoComplete="tel" />
              <FileField label="CV" file={files.cv} onChange={setFile("cv")} accept={[".pdf", ".doc", ".docx"]} maxBytes={10 * MB} error={errors.cv} oversizeMessage={oversize("10 MB")} />
              <TextField label="LinkedIn or website" type="url" optional full value={form.linkedinUrl} onChange={set("linkedinUrl")} error={errors.linkedinUrl} placeholder="https://" />
            </div>}

            {step === 2 && <div className="gtt-fields">
              <TextField label="Broker" value={form.brokerName} onChange={set("brokerName")} error={errors.brokerName} hint="The broker that holds your live account." />
              <SelectField label="Platform" value={form.platform} onChange={(value) => set("platform")(value as TradingPlatform)} options={platformOptions} error={errors.platform} />
              {form.platform === "OTHER" && <TextField label="Which platform?" full value={form.platformOther} onChange={set("platformOther")} error={errors.platformOther} />}
              <ChoiceField label="Markets traded" multiple options={marketOptions} value={form.markets} onChange={(value) => set("markets")(value as TradingMarket[])} error={errors.markets} hint="Select all that apply." />
              <ChoiceField label="Style" options={styleOptions} value={form.tradingStyle} onChange={(value) => set("tradingStyle")(value as TradingStyle)} error={errors.tradingStyle} />
              <TextField label="Live history start date" type="date" value={form.historyStartDate} onChange={set("historyStartDate")} error={errors.historyStartDate} />
              <TextField label="Years of trading experience" type="number" min={0} max={60} step="any" value={form.yearsExperience} onChange={set("yearsExperience")} error={errors.yearsExperience} />
              <SelectField label="Approximate account equity" full value={form.equityRange} onChange={(value) => set("equityRange")(value as EquityRange)} options={equityOptions} error={errors.equityRange} />
            </div>}

            {step === 3 && <div className="gtt-fields">
              <div className="gtt-field-full">
                <NoticeBanner><strong><Lock size={14} style={{ display: "inline", verticalAlign: "-2px", marginRight: 4 }} aria-hidden="true" />We never ask for passwords.</strong> Don't include account passwords, investor passwords or API keys in anything you upload or type here.</NoticeBanner>
              </div>
              <FileField label="Broker statement" file={files.brokerStatement} onChange={setFile("brokerStatement")} accept={[".pdf"]} maxBytes={20 * MB} error={errors.brokerStatement} oversizeMessage={oversize("20 MB")} />
              <FileField label="Trade history export" file={files.tradeHistory} onChange={setFile("tradeHistory")} accept={[".csv", ".xlsx"]} maxBytes={20 * MB} error={errors.tradeHistory} hint="Every trade over your live history, exported from your platform." oversizeMessage={oversize("20 MB")} />
              <TextField label="Verified record link" type="url" optional full value={form.verifiedRecordUrl} onChange={set("verifiedRecordUrl")} error={errors.verifiedRecordUrl} hint="For example a Myfxbook or FX Blue page." placeholder="https://" />
              <p className="gtt-form-section-title">Headline figures</p>
              <TextField label="Historical return" type="number" step="any" suffix="%" value={form.returnPct} onChange={set("returnPct")} error={errors.returnPct} hint="Total return over your live history." />
              <TextField label="Maximum drawdown" type="number" step="any" min={0} max={100} suffix="%" value={form.maxDrawdownPct} onChange={set("maxDrawdownPct")} error={errors.maxDrawdownPct} hint="Largest peak-to-trough fall in equity." />
              <TextField label="How were these calculated?" full value={form.calcMethod} onChange={set("calcMethod")} error={errors.calcMethod} hint="For example: time-weighted, from Myfxbook, net of deposits and withdrawals." />
              <p className="gtt-form-section-title">Strategy</p>
              <TextAreaField label="Describe your strategy" value={form.strategySummary} onChange={set("strategySummary")} error={errors.strategySummary} hint="What you trade, how you decide to enter and exit, and when the approach struggles." />
              <SelectField label="Typical holding period" value={form.holdingPeriod} onChange={(value) => set("holdingPeriod")(value as HoldingPeriod)} options={holdingOptions} error={errors.holdingPeriod} />
              <TextField label="Position sizing" value={form.sizingApproach} onChange={set("sizingApproach")} error={errors.sizingApproach} hint="For example: 1% risk per trade." />
              <ChoiceField label="Record type" options={recordOptions} value={form.recordType} onChange={(value) => set("recordType")(value as RecordType)} error={errors.recordType} hint="Demo and competition records are accepted and reviewed separately." />
            </div>}

            {step === 4 && <div className="gtt-fields">
              <TextAreaField label="Why do you want to trade with GTT?" value={form.whyGtt} onChange={set("whyGtt")} error={errors.whyGtt} maxLength={ANSWER_LIMIT} rows={4} />
              <TextAreaField label="Why is your strategy suitable for professional clients?" value={form.suitability} onChange={set("suitability")} error={errors.suitability} maxLength={ANSWER_LIMIT} rows={4} />
              <TextAreaField label="How much time can you commit to trading and communication each week?" value={form.timeCommitment} onChange={set("timeCommitment")} error={errors.timeCommitment} maxLength={ANSWER_LIMIT} rows={4} />
              <p className="gtt-form-section-title">Consent</p>
              <CheckboxField checked={form.consentAccurate} onChange={set("consentAccurate")} error={errors.consentAccurate}>
                The trading record I have provided is accurate, and I have the right to share it with Green Turtle Trades.
              </CheckboxField>
              <CheckboxField checked={form.consentPrivacy} onChange={set("consentPrivacy")} error={errors.consentPrivacy}>
                I have read the <a href="/privacy" target="_blank" rel="noreferrer" className="gtt-text-link" style={{ fontSize: "inherit" }}>privacy notice</a> and understand how my application data is used and stored.
              </CheckboxField>
            </div>}

            {submitError && <div className="gtt-form-alert" role="alert">{submitError}</div>}

            <div className="gtt-form-actions">
              <button type="button" className="home-brand-button home-brand-button-secondary" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={18} aria-hidden="true" />Back
              </button>
              <button type="submit" className="home-brand-button gtt-button-trader" disabled={submitting}>
                {step === 4 ? (submitting ? "Submitting…" : "Submit application") : "Continue"}
                {!submitting && <ArrowRight size={18} aria-hidden="true" />}
              </button>
            </div>
          </form>
          <p className="gtt-saved-note"><Save size={14} aria-hidden="true" />Answers saved in this browser.</p>
        </>}
      </div>
    </div>
  </PageShell>;
}

import { useId, useRef, useState, type ChangeEvent, type DragEvent, type ReactNode } from "react";
import { AlertCircle, FileText, UploadCloud } from "lucide-react";

export type FieldErrors = Record<string, string | undefined>;

interface FieldProps {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  full?: boolean;
  children: (ids: { inputId: string; describedBy: string | undefined }) => ReactNode;
}

export function Field({ label, error, hint, optional, full, children }: FieldProps) {
  const inputId = useId();
  const hintId = hint ? `${inputId}-hint` : "";
  const errorId = error ? `${inputId}-error` : "";
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return <div className={`gtt-field${full ? " gtt-field-full" : ""}${error ? " has-error" : ""}`}>
    <label htmlFor={inputId}>{label}{optional && <span className="gtt-optional"> (optional)</span>}</label>
    {hint && <p className="gtt-hint" id={hintId}>{hint}</p>}
    {children({ inputId, describedBy })}
    {error && <FieldError id={errorId}>{error}</FieldError>}
  </div>;
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return <p className="gtt-field-error" id={id}><AlertCircle size={15} aria-hidden="true" />{children}</p>;
}

interface TextFieldProps {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  full?: boolean;
  type?: "text" | "email" | "tel" | "url" | "number" | "date";
  autoComplete?: string;
  placeholder?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number | "any";
}

export function TextField({ label, value, onChange, error, hint, optional, full, type = "text", autoComplete, placeholder, suffix, min, max, step }: TextFieldProps) {
  return <Field label={label} error={error} hint={hint} optional={optional} full={full}>
    {({ inputId, describedBy }) => {
      const input = <input
        id={inputId}
        className="gtt-input"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-required={!optional}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={type === "number" ? "decimal" : undefined}
        min={min}
        max={max}
        step={step}
      />;
      return suffix ? <div className="gtt-input-suffix">{input}<span aria-hidden="true">{suffix}</span></div> : input;
    }}
  </Field>;
}

export function TextAreaField({ label, value, onChange, error, hint, optional, maxLength, rows = 5 }: { label: ReactNode; value: string; onChange: (value: string) => void; error?: string; hint?: ReactNode; optional?: boolean; maxLength?: number; rows?: number }) {
  return <Field label={label} error={error} hint={hint} optional={optional} full>
    {({ inputId, describedBy }) => <>
      <textarea
        id={inputId}
        className="gtt-textarea"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        aria-required={!optional}
      />
      {maxLength && <span className={`gtt-counter${value.length > maxLength ? " is-over" : ""}`} aria-live="polite">{value.length} / {maxLength}</span>}
    </>}
  </Field>;
}

export interface Option {
  value: string;
  label: string;
}

export function SelectField({ label, value, onChange, options, error, hint, optional, full, placeholder = "Select…" }: { label: ReactNode; value: string; onChange: (value: string) => void; options: Option[]; error?: string; hint?: ReactNode; optional?: boolean; full?: boolean; placeholder?: string }) {
  return <Field label={label} error={error} hint={hint} optional={optional} full={full}>
    {({ inputId, describedBy }) => <select
      id={inputId}
      className="gtt-select"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy}
      aria-required={!optional}
    >
      <option value="" disabled>{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>}
  </Field>;
}

/* Radio or checkbox choices rendered as selectable chips. */
export function ChoiceField({ label, options, value, onChange, error, hint, multiple, full = true }: { label: ReactNode; options: Option[]; value: string | string[]; onChange: (value: string | string[]) => void; error?: string; hint?: ReactNode; multiple?: boolean; full?: boolean }) {
  const name = useId();
  const selected = Array.isArray(value) ? value : [value];
  const toggle = (optionValue: string) => {
    if (!multiple) {
      onChange(optionValue);
      return;
    }
    onChange(selected.includes(optionValue) ? selected.filter((item) => item !== optionValue) : [...selected, optionValue]);
  };
  return <fieldset className={`gtt-fieldset${full ? " gtt-field-full" : ""}${error ? " has-error" : ""}`} aria-invalid={Boolean(error)}>
    <legend>{label}</legend>
    {hint && <p className="gtt-hint">{hint}</p>}
    <div className="gtt-choices">
      {options.map((option) => <label className="gtt-choice" key={option.value}>
        <input type={multiple ? "checkbox" : "radio"} name={name} value={option.value} checked={selected.includes(option.value)} onChange={() => toggle(option.value)} />
        <span>{option.label}</span>
      </label>)}
    </div>
    {error && <FieldError>{error}</FieldError>}
  </fieldset>;
}

export function CheckboxField({ checked, onChange, children, error }: { checked: boolean; onChange: (checked: boolean) => void; children: ReactNode; error?: string }) {
  return <div className={`gtt-field gtt-field-full${error ? " has-error" : ""}`}>
    <label className="gtt-check">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-invalid={Boolean(error)} />
      <span>{children}</span>
    </label>
    {error && <FieldError>{error}</FieldError>}
  </div>;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileFieldProps {
  label: ReactNode;
  file: File | null;
  onChange: (file: File | null) => void;
  accept: string[];
  maxBytes: number;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  oversizeMessage?: ReactNode;
}

export function FileField({ label, file, onChange, accept, maxBytes, error, hint, optional, oversizeMessage }: FileFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState<ReactNode>(null);
  const acceptLabel = accept.map((ext) => ext.replace(".", "").toUpperCase()).join(", ");

  const pick = (candidate: File | undefined) => {
    if (!candidate) return;
    const extension = `.${candidate.name.split(".").pop()?.toLowerCase() || ""}`;
    if (!accept.includes(extension)) {
      setLocalError(`This file type isn't accepted. Upload ${acceptLabel}.`);
      return;
    }
    if (candidate.size > maxBytes) {
      setLocalError(oversizeMessage || `This file is larger than ${formatFileSize(maxBytes)}.`);
      return;
    }
    setLocalError(null);
    onChange(candidate);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    pick(event.dataTransfer.files?.[0]);
  };

  const shownError = localError || error;

  return <Field label={label} error={undefined} hint={hint} optional={optional} full>
    {({ inputId, describedBy }) => <>
      {file ? <div className="gtt-file">
        <span className="gtt-card-icon"><FileText size={20} aria-hidden="true" /></span>
        <div><strong>{file.name}</strong><span>{formatFileSize(file.size)}</span></div>
        <button type="button" onClick={() => { onChange(null); if (inputRef.current) inputRef.current.value = ""; }}>Remove</button>
      </div> : <label
        htmlFor={inputId}
        className={`gtt-drop${dragging ? " is-dragging" : ""}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <UploadCloud size={28} aria-hidden="true" />
        <strong>Drag a file here or choose one</strong>
        <span>{acceptLabel}, up to {formatFileSize(maxBytes)}</span>
      </label>}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept.join(",")}
        className="sr-only"
        aria-describedby={describedBy}
        aria-invalid={Boolean(shownError)}
        onChange={(event: ChangeEvent<HTMLInputElement>) => pick(event.target.files?.[0])}
      />
      {shownError && <FieldError>{shownError}</FieldError>}
    </>}
  </Field>;
}

import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readAnalyticsConsent, saveAnalyticsConsent, type AnalyticsConsent as Choice } from "../../analytics/google-analytics";
import "../../styles/analytics-consent.css";

export function AnalyticsConsent() {
  const [choice, setChoice] = useState(readAnalyticsConsent);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const settings = useRef<HTMLButtonElement>(null);
  const visible = choice === null || open;

  useEffect(() => {
    const refresh = () => setChoice(readAnalyticsConsent());
    const edit = () => { setOpen(true); requestAnimationFrame(() => heading.current?.focus()); };
    window.addEventListener(CONSENT_EVENT, refresh);
    window.addEventListener("gtt-open-cookie-settings", edit);
    return () => {
      window.removeEventListener(CONSENT_EVENT, refresh);
      window.removeEventListener("gtt-open-cookie-settings", edit);
    };
  }, []);

  const choose = (value: Choice) => {
    saveAnalyticsConsent(value);
    setChoice(readAnalyticsConsent());
    setOpen(false);
    setAnnouncement(value === "accepted" ? "Analytics preference saved." : "Optional analytics rejected.");
    requestAnimationFrame(() => settings.current?.focus());
  };

  return <>
    <span className="sr-only" role="status">{announcement}</span>
    {visible ? <section className="gtt-cookie-banner" aria-labelledby="gtt-cookie-title">
      <div>
        <h2 id="gtt-cookie-title" ref={heading} tabIndex={-1}>Your cookie choices</h2>
        <p>With your permission, we use Google Analytics to understand visits to our public website. Optional analytics stays off until you accept. Essential services work either way.</p>
        <p>You can change your choice using Cookie settings. <a href="/privacy">Read our privacy policy</a>.</p>
      </div>
      <div className="gtt-cookie-actions">
        <button type="button" onClick={() => choose("rejected")}>Reject analytics</button>
        <button type="button" onClick={() => choose("accepted")}>Accept analytics</button>
        {choice !== null && <button type="button" className="gtt-cookie-close" onClick={() => { setOpen(false); requestAnimationFrame(() => settings.current?.focus()); }}>Keep current choice</button>}
      </div>
    </section> : <button ref={settings} type="button" className="gtt-cookie-settings" onClick={() => { setOpen(true); requestAnimationFrame(() => heading.current?.focus()); }}>Cookie settings</button>}
  </>;
}

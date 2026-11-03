import { useEffect, useRef, useState } from "react";
import { CONSENT_EVENT, readAnalyticsConsent, saveAnalyticsConsent, type AnalyticsConsent as Choice } from "../../analytics/google-analytics";
import "../../styles/analytics-consent.css";

export function AnalyticsConsent() {
  const [choice, setChoice] = useState(readAnalyticsConsent);
  const [open, setOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const visible = choice === null || open;

  useEffect(() => {
    const refresh = () => setChoice(readAnalyticsConsent());
    const edit = () => {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setOpen(true);
      requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
    };
    window.addEventListener(CONSENT_EVENT, refresh);
    window.addEventListener("gtt-open-cookie-settings", edit);
    return () => {
      window.removeEventListener(CONSENT_EVENT, refresh);
      window.removeEventListener("gtt-open-cookie-settings", edit);
    };
  }, []);

  const close = () => {
    setOpen(false);
    const trigger = opener.current;
    opener.current = null;
    requestAnimationFrame(() => { if (trigger?.isConnected) trigger.focus({ preventScroll: true }); });
  };

  const choose = (value: Choice) => {
    saveAnalyticsConsent(value);
    setChoice(readAnalyticsConsent());
    close();
    setAnnouncement(value === "accepted" ? "Analytics preference saved." : "Optional analytics rejected.");
  };

  return <>
    <span className="gtt-cookie-status" role="status">{announcement}</span>
    {visible && <section className="gtt-cookie-banner" aria-labelledby="gtt-cookie-title">
      <div>
        <h2 id="gtt-cookie-title" ref={heading} tabIndex={-1}>Your cookie choices</h2>
        <p>With your permission, we use Google Analytics to understand visits to our public website. Optional analytics stays off until you accept. Essential services work either way.</p>
        <p>You can change your choice using Cookie settings in the footer. <a href="/privacy">Read our privacy policy</a>.</p>
      </div>
      <div className="gtt-cookie-actions">
        <button type="button" onClick={() => choose("rejected")}>Reject analytics</button>
        <button type="button" onClick={() => choose("accepted")}>Accept analytics</button>
        {choice !== null && <button type="button" className="gtt-cookie-close" onClick={close}>Keep current choice</button>}
      </div>
    </section>}
  </>;
}

import { useId, useState } from "react";
import { Mail, ArrowRight, CheckCircle, Lock } from "lucide-react";
import { joinWaitlist } from "../../api/waitlist";

export function WaitingListSignup() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || submitted) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await joinWaitlist(email, "investor");
      setSubmitted(true);
      setEmail("");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return <section className="home-waitlist" aria-labelledby={`${id}-title`}>
    <span className="home-kicker">Investor Waitlist</span>
    <h2 id={`${id}-title`}>Join the Investor Waitlist</h2>
    <p className="home-waitlist-intro">Register your interest in the Green Turtle Trades investor product and we will contact you when access becomes available.</p>
    <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
      <label htmlFor={`${id}-email`}>Email address</label>
      <div className="home-waitlist-input">
        <Mail size={20} aria-hidden="true" />
        <input id={`${id}-email`} type="email" name="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required disabled={isSubmitting || submitted} aria-describedby={errorMsg ? `${id}-error` : undefined} />
      </div>
      <button className="home-brand-button" type="submit" disabled={isSubmitting || submitted}>
        {submitted ? <><CheckCircle size={19} aria-hidden="true" />You're on the list</> : <>{isSubmitting ? "Joining..." : "Join Waitlist"}<ArrowRight size={19} aria-hidden="true" /></>}
      </button>
      <div aria-live="polite" aria-atomic="true">
        {submitted && <p className="home-waitlist-success">Thank you. We will contact you when investor access becomes available.</p>}
        {errorMsg && <p id={`${id}-error`} className="home-waitlist-error" role="alert">{errorMsg}</p>}
      </div>
      <p className="home-waitlist-privacy"><Lock size={15} aria-hidden="true" /><span>Your information remains confidential and will not be shared with third parties.</span></p>
    </form>
  </section>;
}

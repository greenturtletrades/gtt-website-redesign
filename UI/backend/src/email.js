const { Resend } = require("resend");

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function sendEmail({ to, subject, html, text }) {
  const resend = getResend();
  if (!resend) {
    console.warn("RESEND_API_KEY missing; skipping email send.");
    return { skipped: true };
  }

  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("EMAIL_FROM is missing in .env");

  return resend.emails.send({
    from,
    to,
    subject,
    ...(html ? { html } : {}),
    ...(text ? { text } : {}),
  });
}

module.exports = { sendEmail };

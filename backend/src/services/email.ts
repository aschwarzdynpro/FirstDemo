import { Resend } from 'resend';

let client: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

export async function sendWelcomeEmail(email: string): Promise<void> {
  const resend = getResend();
  if (!resend) return; // silently skip if not configured

  const appName = process.env.VITE_APP_NAME ?? 'VertragsCheck AI';
  const fromAddress = process.env.EMAIL_FROM ?? 'noreply@vertragscheck.ai';

  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `Willkommen bei ${appName}!`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="color:#4338ca;font-size:24px;margin-bottom:8px">⚖ ${appName}</h1>
        <p style="color:#374151;font-size:16px;margin-bottom:16px">
          Hallo,<br><br>
          willkommen bei ${appName}! Ihr Konto wurde erfolgreich erstellt.
        </p>
        <p style="color:#374151;font-size:15px">
          Sie können ab sofort <strong>3 kostenlose Vertragsanalysen</strong> pro Monat durchführen.
        </p>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4338ca;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Jetzt starten →
        </a>
        <p style="margin-top:32px;color:#9ca3af;font-size:12px">
          Diese E-Mail wurde automatisch versandt. Kein Ersatz für Rechtsberatung.
        </p>
      </div>
    `,
  });
}

export async function sendUpgradeConfirmationEmail(email: string, plan: string): Promise<void> {
  const resend = getResend();
  if (!resend) return;

  const appName = process.env.VITE_APP_NAME ?? 'VertragsCheck AI';
  const fromAddress = process.env.EMAIL_FROM ?? 'noreply@vertragscheck.ai';
  const planLabel = plan === 'business' ? 'Business' : 'Pro';

  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `${appName} — ${planLabel}-Plan aktiviert`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
        <h1 style="color:#4338ca;font-size:24px;margin-bottom:8px">⚖ ${appName}</h1>
        <p style="color:#374151;font-size:16px;margin-bottom:16px">
          Ihr <strong>${planLabel}-Plan</strong> ist jetzt aktiv!
        </p>
        <p style="color:#374151;font-size:15px">
          Sie haben ab sofort Zugang zu unbegrenzten Analysen, PDF-Export und allen Pro-Features.
        </p>
        <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/dashboard"
           style="display:inline-block;margin-top:20px;padding:12px 24px;background:#4338ca;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px">
          Zum Dashboard →
        </a>
      </div>
    `,
  });
}

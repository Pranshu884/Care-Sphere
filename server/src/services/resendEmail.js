import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  // Let requests fail loudly so you don't silently run without email delivery.
  throw new Error('Missing RESEND_API_KEY');
}

const resend = new Resend(resendApiKey);

function buildEmailHtml({ otp, expiresInMinutes }) {
  const otpEscaped = String(otp);
  return `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; padding: 24px; color: #0f172a;">
      <h2 style="margin: 0 0 12px; font-size: 20px;">CareSphere</h2>
      <p style="margin: 0 0 16px; font-size: 14px; color: #334155;">
        Hi there,
      </p>
      <p style="margin: 0 0 10px; font-size: 14px; color: #334155;">
        Your verification code is:
      </p>
      <div style="display:inline-block; padding: 12px 18px; background: #14b8a6; color: white; font-weight: 700; letter-spacing: 2px; border-radius: 10px; font-size: 20px;">
        ${otpEscaped}
      </div>
      <p style="margin: 14px 0 0; font-size: 14px; color: #334155;">
        This code expires in <strong>${expiresInMinutes} minutes</strong>.
      </p>
      <p style="margin: 14px 0 0; font-size: 13px; color: #64748b;">
        For your security, please do not share this code with anyone. If you didn’t request this, you can safely ignore this email.
      </p>
    </div>
  `;
}

export async function sendOtpEmail({ toEmail, otp, expiresInMinutes }) {
  const from = process.env.RESEND_FROM_EMAIL;
  if (!from) throw new Error('Missing RESEND_FROM_EMAIL');

  const subject = 'Verify your CareSphere account';
  const html = buildEmailHtml({ otp, expiresInMinutes });
  const text = `Your CareSphere verification code is ${otp}. It expires in ${expiresInMinutes} minutes. If you didn't request this, ignore this email.`;

  await resend.emails.send({
    from,
    to: toEmail,
    subject,
    html,
    text
  });
}


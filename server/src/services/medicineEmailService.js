import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify email service configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('[MedicineEmail] Nodemailer verify error:', error);
  } else {
    console.log('[MedicineEmail] ✅ Nodemailer is ready to send messages');
  }
});

function buildReminderHtml({ userName, medicineName, dosage, time, instructions }) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0B0F19; margin: 0; padding: 0; color: #E2E8F0; }
    .container { max-width: 520px; margin: 40px auto; background: #131928; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #00D4FF22, #7C3AED22); padding: 32px 28px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .header h1 { color: #00D4FF; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p  { color: #94A3B8; margin: 6px 0 0; font-size: 13px; }
    .body { padding: 32px 28px; }
    .body p { font-size: 15px; line-height: 24px; color: #94A3B8; margin: 0 0 16px; }
    .card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px 24px; margin: 20px 0; }
    .card .label { font-size: 11px; font-weight: 700; color: #00D4FF; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px; }
    .card .value { font-size: 20px; font-weight: 800; color: #FFFFFF; }
    .card .sub   { font-size: 13px; color: #94A3B8; margin-top: 4px; }
    .badge { display: inline-block; background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3); color: #00D4FF; border-radius: 30px; padding: 6px 18px; font-size: 13px; font-weight: 700; margin-top: 8px; }
    .cta { text-align: center; margin: 28px 0 8px; }
    .cta a { display: inline-block; background: linear-gradient(90deg, #00D4FF, #3B82F6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 800; font-size: 15px; }
    .footer { padding: 20px 28px; text-align: center; background: rgba(255,255,255,0.02); border-top: 1px solid rgba(255,255,255,0.05); }
    .footer p { margin: 0; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💊 CareSphere</h1>
      <p>Medicine Reminder</p>
    </div>
    <div class="body">
      <p>Hi <strong style="color:#E2E8F0">${userName || 'there'}</strong>,</p>
      <p>It's time to take your medicine. Here are your details:</p>
      <div class="card">
        <div class="label">Medicine</div>
        <div class="value">${medicineName}</div>
        <div class="sub">${dosage}${instructions ? ' &bull; ' + instructions : ''}</div>
        <span class="badge">🕐 ${time}</span>
      </div>
      ${instructions ? `<p style="font-size:13px;color:#64748B;margin-top:0">⚠️ <em>${instructions}</em></p>` : ''}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} CareSphere Health. Reminder sent automatically.</p>
      <p style="margin-top:8px;">This is an automated message — please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendMedicineReminderEmail({ toEmail, userName, medicineName, dosage, time, instructions }) {
  const from = process.env.EMAIL_USER;
  if (!from) {
    console.warn('[MedicineEmail] EMAIL_USER not set — skipping reminder.');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"CareSphere" <${from}>`,
      to: toEmail,
      subject: `💊 Medicine Reminder — ${medicineName} at ${time}`,
      text: `Hi ${userName}, it's time to take your ${medicineName} (${dosage}) at ${time}. ${instructions || ''}`,
      html: buildReminderHtml({ userName, medicineName, dosage, time, instructions }),
    });
    console.log(`[MedicineEmail] Sent reminder for ${medicineName} to ${toEmail}`);
  } catch (err) {
    console.error('[MedicineEmail] Failed:', err.message);
  }
}

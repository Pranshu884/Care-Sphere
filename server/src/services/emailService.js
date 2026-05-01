import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS (Port 587)
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

function buildEmailHtml({ otp, expiresInMinutes }) {
  const otpEscaped = String(otp);
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
    .header { background-color: #0f766e; padding: 32px 24px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; color: #334155; }
    .content p { font-size: 16px; line-height: 24px; margin: 0 0 20px; }
    .otp-container { text-align: center; margin: 32px 0; }
    .otp-code { display: inline-block; background: #f0fdfa; color: #0f766e; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 16px 32px; border-radius: 12px; border: 2px dashed #5eead4; }
    .footer { padding: 24px; text-align: center; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
    .footer p { margin: 0; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CareSphere</h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>Use the verification code below to securely access your CareSphere account. This code is valid for <strong>${expiresInMinutes} minutes</strong>.</p>
      <div class="otp-container">
        <div class="otp-code">${otpEscaped}</div>
      </div>
      <p><strong>Security Notice:</strong> CareSphere team members will never ask for your password or verification code. Do not share this code with anyone.</p>
    </div>
    <div class="footer">
      <p>If you didn't request this code, you can safely ignore this email.</p>
      <p style="margin-top: 12px;">© ${new Date().getFullYear()} CareSphere Health. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendOTPEmail(toEmail, otp, purpose, expiresInMinutes = 5) {
  const from = process.env.EMAIL_USER;
  if (!from) throw new Error('Missing EMAIL_USER in environment variables');

  const subject = 'Your CareSphere Verification Code';
  const html = buildEmailHtml({ otp, expiresInMinutes });
  const text = `Your CareSphere verification code is ${otp}. It expires in ${expiresInMinutes} minutes. If you didn't request this, ignore this email.`;

  try {
    const info = await transporter.sendMail({
      from: `"CareSphere" <${from}>`,
      to: toEmail,
      subject,
      text,
      html,
    });
    return info;
  } catch (err) {
    console.error('[Email Delivery Failed]:', err);
    throw new Error('Email delivery failed via Nodemailer. Check your EMAIL_USER and EMAIL_PASS variables.');
  }
}

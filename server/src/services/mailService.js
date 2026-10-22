const nodemailer = require('nodemailer');
const config = require('../config/env');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const service = process.env.SMTP_SERVICE;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);

  if (user && pass) {
    try {
      if (service === 'gmail' || host?.includes('gmail') || (user && user.endsWith('@gmail.com'))) {
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
        });
        console.log(`📧 Gmail SMTP Transporter initialized for: ${user}`);
        return transporter;
      }

      if (host) {
        transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });
        console.log(`📧 Custom SMTP Transporter initialized (${host}:${port})`);
        return transporter;
      }
    } catch (err) {
      console.warn('⚠️ Failed to initialize SMTP transporter:', err.message);
    }
  }

  return null;
};

/**
 * Send 6-digit verification code email
 */
const sendVerificationCodeEmail = async ({ toEmail, name, code, purpose = 'registration' }) => {
  const isReset = purpose === 'password_reset';
  const subject = isReset
    ? `🔐 ${code} is your WorkSphere password reset code`
    : `✨ ${code} is your WorkSphere verification code`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05); }
          .logo { display: inline-flex; align-items: center; gap: 8px; font-weight: 800; font-size: 20px; color: #0f172a; margin-bottom: 24px; text-decoration: none; }
          .logo span { color: #6366f1; }
          .badge { display: inline-block; padding: 4px 12px; background: #eef2ff; color: #4f46e5; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
          .code-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
          .code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; margin: 0; }
          .expiry { font-size: 12px; color: #64748b; margin-top: 8px; }
          .footer { font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 28px; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">
            Work<span>Sphere</span>
          </div>
          <div class="badge">${isReset ? 'Password Reset' : 'Account Verification'}</div>
          <h1>${isReset ? 'Reset your password' : 'Confirm your email address'}</h1>
          <p>Hi ${name || 'there'},</p>
          <p>Use the following 6-digit verification code to ${isReset ? 'reset your password' : 'verify your account and set up your workspace'}.</p>
          
          <div class="code-box">
            <div class="code">${code}</div>
            <div class="expiry">Expires in 10 minutes</div>
          </div>

          <p>If you did not request this verification code, please ignore this email or contact support if you have concerns.</p>

          <div class="footer">
            &copy; ${new Date().getFullYear()} WorkSphere Inc. All rights reserved.<br>
            Secure automated transmission. Please do not reply directly to this email.
          </div>
        </div>
      </body>
    </html>
  `;

  // Check if SMTP transporter is available
  const transport = getTransporter();
  let emailSent = false;

  if (transport) {
    try {
      const senderEmail = process.env.SMTP_USER || 'noreply@worksphere.io';
      const from = process.env.EMAIL_FROM || `"WorkSphere" <${senderEmail}>`;
      await transport.sendMail({
        from,
        to: toEmail,
        subject,
        html: htmlContent,
      });
      emailSent = true;
      console.log(`📨 Verification email successfully sent via SMTP to: ${toEmail}`);
    } catch (err) {
      console.warn(`⚠️ SMTP send error: ${err.message}. Displaying code in server console.`);
    }
  }

  // Always log clearly to console for easy local testing & development
  console.log('\n======================================================');
  console.log(`📬 EMAIL VERIFICATION CODE DISPATCHED`);
  console.log(`To:      ${toEmail} (${name})`);
  console.log(`Purpose: ${purpose}`);
  console.log(`CODE:    >>>  ${code}  <<<`);
  console.log(`Expires: 10 minutes`);
  console.log(`SMTP:    ${emailSent ? 'Delivered to inbox' : 'Console fallback (configure SMTP in .env for real delivery)'}`);
  console.log('======================================================\n');

  return {
    sent: true,
    emailSent,
    code,
  };
};

module.exports = {
  sendVerificationCodeEmail,
};

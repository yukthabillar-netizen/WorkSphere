require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const nodemailer = require('nodemailer');

async function testSmtp() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const service = process.env.SMTP_SERVICE;
  const targetEmail = process.argv[2] || user;

  console.log('----------------------------------------------------');
  console.log('🔍 Testing SMTP Email Delivery Configuration');
  console.log('Host:   ', host || (service ? `Service: ${service}` : '(not configured)'));
  console.log('Port:   ', port);
  console.log('User:   ', user || '(not configured)');
  console.log('Pass:   ', pass ? '********' : '(not configured)');
  console.log('Target: ', targetEmail);
  console.log('----------------------------------------------------');

  if (!user || !pass || (!host && !service)) {
    console.error('❌ Missing credentials! Please fill in SMTP_HOST, SMTP_USER, and SMTP_PASS in server/.env');
    process.exit(1);
  }

  let transporter;
  if (service === 'gmail' || (user && user.endsWith('@gmail.com'))) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  } else {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  console.log('⏳ Verifying SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }

  console.log(`⏳ Sending test verification email to: ${targetEmail}...`);
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"WorkSphere" <${user}>`,
      to: targetEmail,
      subject: '✨ 123456 is your WorkSphere test verification code',
      html: `
        <div style="font-family: sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0;">
          <h2 style="color: #4f46e5; margin-top: 0;">WorkSphere</h2>
          <h3 style="color: #0f172a;">Your SMTP email delivery is working!</h3>
          <p style="color: #475569;">This confirms your real email delivery setup. Use code <b style="font-size: 20px; color: #4f46e5; letter-spacing: 2px;">123456</b> for registration.</p>
        </div>
      `,
    });
    console.log('🎉 Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log(`👉 Check your inbox at ${targetEmail}!`);
  } catch (err) {
    console.error('❌ Failed to send email:', err.message);
    process.exit(1);
  }
}

testSmtp();

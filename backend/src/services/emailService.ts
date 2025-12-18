import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || SMTP_USER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

let transporter: nodemailer.Transporter | null = null;

// Initialize email transporter only if credentials are provided
if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransporter({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  // Verify connection
  transporter.verify((error) => {
    if (error) {
      console.error('[Email] SMTP connection error:', error.message);
      transporter = null;
    } else {
      console.log('[Email] SMTP server ready to send emails');
    }
  });
} else {
  console.warn('[Email] SMTP credentials not configured - email features disabled');
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  if (!transporter) {
    console.warn('[Email] Skipping password reset email - SMTP not configured');
    return;
  }

  const resetUrl = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Password Reset Request - Odispear',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C9A961;">Password Reset Request</h2>
        <p>You requested to reset your password for your Odispear account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #C9A961; color: #000; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Password reset email sent to ${email}`);
  } catch (error: any) {
    console.error('[Email] Failed to send password reset email:', error.message);
    throw new Error('Failed to send password reset email');
  }
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  if (!transporter) {
    return;
  }

  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Welcome to Odispear!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #C9A961;">Welcome to Odispear, ${username}!</h2>
        <p>Thank you for joining our community.</p>
        <p>Get started by:</p>
        <ul>
          <li>Creating or joining a server</li>
          <li>Customizing your profile</li>
          <li>Connecting with friends</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Welcome email sent to ${email}`);
  } catch (error: any) {
    console.error('[Email] Failed to send welcome email:', error.message);
  }
}

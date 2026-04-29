import nodemailer from 'nodemailer';
import { env } from '../config/env';

/**
 * Lazy-initialised singleton transporter.
 * Avoids creating a connection pool at module-load time when SMTP is not configured.
 */
let _transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    });
  }
  return _transporter;
}

/**
 * Send a password-reset email.
 *
 * Design decisions:
 *  - Errors are caught and logged but never re-thrown.
 *    The caller (forgotPassword) must always return 200 to prevent
 *    user-existence enumeration via timing / error differences.
 *  - The transporter is created lazily so tests can inject a mock
 *    before the first call via `setTransporterForTesting()`.
 */
export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions: nodemailer.SendMailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: 'Reset your Hack-Flow password',
    text: [
      'You requested a password reset for your Hack-Flow account.',
      '',
      `Reset link (valid for 1 hour): ${resetUrl}`,
      '',
      'If you did not request this, you can safely ignore this email.',
    ].join('\n'),
    html: `
      <p>You requested a password reset for your <strong>Hack-Flow</strong> account.</p>
      <p>
        <a href="${resetUrl}" style="background:#4f46e5;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p style="color:#6b7280;font-size:12px;">
        This link expires in 1 hour. If you didn't request a reset, ignore this email.
      </p>
    `,
  };

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (err) {
    // Log but swallow — never expose SMTP errors to the client
    console.error('[EmailService] Failed to send password reset email:', err);
  }
}

/**
 * Override the transporter — used in unit tests to inject a mock.
 * Not exported from the barrel index; test files import directly.
 */
export function setTransporterForTesting(t: nodemailer.Transporter): void {
  _transporter = t;
}

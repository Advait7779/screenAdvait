/**
 * HTML email templates for ScreenAdvait platform notifications.
 * All templates use inline CSS for maximum Gmail/Outlook compatibility.
 */

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f2f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);border-radius:12px 12px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">Screen<span style="color:#4ade80;">Advait</span></span>
              </div>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:13px;letter-spacing:0.5px;">Enterprise Screenshot & License Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">
              ${content}
              <!-- Footer -->
              <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f1f5f9;text-align:center;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">This is an automated notification from ScreenAdvait Platform.</p>
                <p style="margin:4px 0 0;color:#94a3b8;font-size:12px;">If you have questions, contact your company administrator.</p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const credentialRow = (label: string, value: string, highlight = false) => `
  <tr>
    <td style="padding:10px 16px;font-size:13px;color:#64748b;font-weight:500;width:40%;border-bottom:1px solid #f8fafc;">${label}</td>
    <td style="padding:10px 16px;font-size:13px;color:${highlight ? '#0f3460' : '#1e293b'};font-weight:${highlight ? '700' : '500'};font-family:${highlight ? "'Courier New',monospace" : 'inherit'};border-bottom:1px solid #f8fafc;">${value}</td>
  </tr>
`;

export function welcomeEmailTemplate(opts: {
  fullName: string;
  username: string;
  password: string;
  licenseKey: string;
  companyName: string;
  serverUrl?: string;
}): { subject: string; html: string } {
  const subject = `Welcome to ScreenAdvait — Your Account is Ready`;
  const html = baseTemplate(
    `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Welcome, ${opts.fullName}! 🎉</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Your ScreenAdvait employee account has been set up by your company administrator at <strong>${opts.companyName}</strong>.
      Below are your login credentials and license key — keep them safe.
    </p>

    <!-- Credentials Card -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0f3460;padding:12px 16px;">
        <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">🔐 YOUR LOGIN CREDENTIALS</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${credentialRow('Full Name', opts.fullName)}
        ${credentialRow('Username', opts.username, true)}
        ${credentialRow('Password', opts.password, true)}
        ${credentialRow('License Key', opts.licenseKey, true)}
        ${opts.serverUrl ? credentialRow('Server URL', opts.serverUrl) : ''}
      </table>
    </div>

    <!-- Steps Card -->
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#166534;">📋 Getting Started</p>
      <ol style="margin:0;padding-left:20px;color:#15803d;font-size:13px;line-height:1.8;">
        <li>Download and install the ScreenAdvait desktop client</li>
        <li>Open the app and enter the Server URL shown above</li>
        <li>Login with your <strong>Username</strong> and <strong>Password</strong></li>
        <li>Enter your <strong>License Key</strong> when prompted</li>
        <li>Screenshots will start capturing automatically</li>
      </ol>
    </div>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:13px;color:#9a3412;">
        ⚠️ <strong>Security Note:</strong> Change your password after your first login. Do not share your license key with others.
      </p>
    </div>
    `,
    subject,
  );
  return { subject, html };
}

export function passwordResetEmailTemplate(opts: {
  fullName: string;
  username: string;
  newPassword: string;
  companyName: string;
}): { subject: string; html: string } {
  const subject = `ScreenAdvait — Your Password Has Been Reset`;
  const html = baseTemplate(
    `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Password Reset</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Your password for <strong>${opts.companyName}</strong> ScreenAdvait account has been reset by your administrator.
    </p>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#0f3460;padding:12px 16px;">
        <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">🔑 NEW CREDENTIALS</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${credentialRow('Username', opts.username, true)}
        ${credentialRow('New Password', opts.newPassword, true)}
      </table>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;">
      <p style="margin:0;font-size:13px;color:#1e40af;">
        💡 <strong>Tip:</strong> Login to the ScreenAdvait desktop app with these credentials and change your password immediately from Settings.
      </p>
    </div>

    <p style="margin:20px 0 0;color:#94a3b8;font-size:13px;">
      If you did not request this reset, contact your company administrator immediately.
    </p>
    `,
    subject,
  );
  return { subject, html };
}

export function licenseReactivatedEmailTemplate(opts: {
  fullName: string;
  username: string;
  licenseKey: string;
  companyName: string;
}): { subject: string; html: string } {
  const subject = `ScreenAdvait — Your License Has Been Reactivated`;
  const html = baseTemplate(
    `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">License Reactivated ✅</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Good news! Your ScreenAdvait license at <strong>${opts.companyName}</strong> has been reactivated by your administrator.
      You can now log in to the desktop client and resume normal operations.
    </p>

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#166534;padding:12px 16px;">
        <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">✅ LICENSE DETAILS</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${credentialRow('Full Name', opts.fullName)}
        ${credentialRow('Username', opts.username, true)}
        ${credentialRow('License Key', opts.licenseKey, true)}
        ${credentialRow('Status', '🟢 ACTIVE')}
      </table>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      Open the ScreenAdvait desktop app and log in — your screenshots will resume automatically.
    </p>
    `,
    subject,
  );
  return { subject, html };
}

export function licenseExpiryWarningEmailTemplate(opts: {
  adminFullName: string;
  companyName: string;
  employeeName: string;
  licenseKey: string;
  expiryDate: string;
  daysLeft: number;
}): { subject: string; html: string } {
  const subject = `ScreenAdvait — License Expiring in ${opts.daysLeft} Days`;
  const html = baseTemplate(
    `
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">⚠️ License Expiry Warning</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
      Hi <strong>${opts.adminFullName}</strong>, an employee license in <strong>${opts.companyName}</strong> is expiring soon.
    </p>

    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <div style="background:#c2410c;padding:12px 16px;">
        <span style="color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.5px;">⚠️ EXPIRING LICENSE</span>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${credentialRow('Employee', opts.employeeName)}
        ${credentialRow('License Key', opts.licenseKey, true)}
        ${credentialRow('Expiry Date', opts.expiryDate)}
        ${credentialRow('Days Remaining', `${opts.daysLeft} days`, true)}
      </table>
    </div>

    <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
      Please log in to the <strong>Company Admin Portal</strong> and renew the subscription or extend the license before it expires to avoid service interruption.
    </p>
    `,
    subject,
  );
  return { subject, html };
}

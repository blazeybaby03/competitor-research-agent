import { Resend } from "resend";

const FROM = "CompeteIQ <accounts@mail.competeiq.pro>";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  return new Resend(key);
}

// Shared HTML shell matching the CompeteIQ brand design system.
function shell(body: string): string {
  return `<html>
  <head>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body style="font-family:'Inter',sans-serif;color:#111827;background:#f9fafb;margin:0;padding:0;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;padding:40px;border:1px solid #e5e7eb;">
          <tr><td style="padding-bottom:32px;">
            <span style="font-size:20px;font-weight:700;color:#0284c7;">CompeteIQ</span>
          </td></tr>
          ${body}
          <tr><td style="border-top:1px solid #e5e7eb;padding-top:24px;font-size:13px;color:#9ca3af;">
            <p style="margin:0;">— The CompeteIQ Team &nbsp;·&nbsp; <a href="https://competeiq.pro" style="color:#9ca3af;text-decoration:none;">competeiq.pro</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#0284c7;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;padding:12px 28px;">${label}</a>`;
}

// Email 1 — immediate: report is ready
function email1Html(reportUrl: string, competitorUrl: string): string {
  const host = (() => { try { return new URL(competitorUrl).hostname.replace(/^www\./, ""); } catch { return competitorUrl; } })();
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your competitor report is ready</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your competitive intelligence report on <strong style="color:#111827;">${host}</strong> has been generated. It covers positioning, pricing, market gaps, and clear actions you can take.</p>
      <p style="margin:0;">Click below to read your full report — it's ready right now.</p>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(reportUrl, "View my free report →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Your report is available for 30 days. <a href="https://competeiq.pro/signup" style="color:#0284c7;text-decoration:none;">Create a free account</a> to save it permanently and set up monthly monitoring.</p>
    </td></tr>
  `);
}

// Email 2 — day 1: what the report covers
function email2Html(reportUrl: string, competitorUrl: string): string {
  const host = (() => { try { return new URL(competitorUrl).hostname.replace(/^www\./, ""); } catch { return competitorUrl; } })();
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">What your report just revealed</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your report on <strong style="color:#111827;">${host}</strong> includes 7 sections of live competitive intelligence — all pulled from their actual website, not guesswork.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.8;">
          <p style="margin:0 0 6px;">📌 <strong style="color:#111827;">Executive summary</strong> — the 60-second overview</p>
          <p style="margin:0 0 6px;">💬 <strong style="color:#111827;">Positioning analysis</strong> — how they talk about themselves</p>
          <p style="margin:0 0 6px;">💰 <strong style="color:#111827;">Pricing analysis</strong> — visible pricing signals and strategy</p>
          <p style="margin:0 0 6px;">⚡ <strong style="color:#111827;">Strengths &amp; weaknesses</strong> — where they're exposed</p>
          <p style="margin:0 0 6px;">🎯 <strong style="color:#111827;">Market gaps</strong> — opportunities they're missing</p>
          <p style="margin:0;">✅ <strong style="color:#111827;">Recommended actions</strong> — what to do about it</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(reportUrl, "Read my full report →")}</td></tr>
  `);
}

// Email 3 — day 3: social proof + monitoring pitch
function email3Html(reportUrl: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">How founders use CompeteIQ every month</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Most founders check in on competitors once a quarter — if at all. By then, a pricing change or a new messaging angle has already cost them deals they didn't know they were losing.</p>
      <p style="margin:0;">CompeteIQ Pro members run a fresh report every month, automatically. When something changes — pricing, positioning, new feature claims — they see it before their next sales call.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #e0f2fe;border-radius:8px;padding:16px 20px;width:100%;">
        <tr><td style="font-size:14px;color:#0284c7;line-height:1.6;">
          <strong style="color:#0369a1;">With a Pro account you get:</strong><br>
          • 100 reports per 30 days<br>
          • Monthly auto-monitoring for up to 5 competitors<br>
          • "What changed" summaries comparing each run<br>
          • PDF export for client presentations
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/signup", "Start monitoring competitors →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Your free report is still available: <a href="${reportUrl}" style="color:#0284c7;text-decoration:none;">view it here</a>.</p>
    </td></tr>
  `);
}

// Email 4 — day 5: direct upgrade CTA
function email4Html(reportUrl: string, competitorUrl: string): string {
  const host = (() => { try { return new URL(competitorUrl).hostname.replace(/^www\./, ""); } catch { return competitorUrl; } })();
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Unlock monthly monitoring for ${host}</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your free report captured a snapshot of <strong style="color:#111827;">${host}</strong> as of today. Competitor websites change — pricing gets updated, new features get announced, messaging shifts.</p>
      <p style="margin:0;">With CompeteIQ Pro, you can set up automatic monthly re-runs so you always have a current picture — with a "what changed" summary highlighting exactly what shifted.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr>
          <td style="font-size:13px;color:#6b7280;padding-bottom:8px;">Pro plan</td>
          <td style="font-size:14px;font-weight:600;color:#0284c7;text-align:right;padding-bottom:8px;">100 reports / 30 days</td>
        </tr>
        <tr>
          <td style="font-size:13px;color:#6b7280;">Monthly auto-monitoring</td>
          <td style="font-size:14px;font-weight:600;color:#111827;text-align:right;">Up to 5 competitors</td>
        </tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/signup", "Upgrade to Pro →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Your report: <a href="${reportUrl}" style="color:#0284c7;text-decoration:none;">view it here</a> (available for 30 days from when it was generated).</p>
    </td></tr>
  `);
}

// Email 5 — day 7: expiry urgency
function email5Html(reportUrl: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Save your report before it expires</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your free competitor report expires in 23 days. After that, the link will no longer work.</p>
      <p style="margin:0;">Create a free CompeteIQ account to save it permanently, run new reports whenever you need them, and set up monthly monitoring so you never miss a competitor move.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;width:100%;">
        <tr><td style="font-size:14px;color:#92400e;line-height:1.5;">
          <strong>Your free report expires in 23 days.</strong> Save it now by creating an account — it's free, no credit card required.
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:20px;">${ctaButton("https://competeiq.pro/signup", "Save my report — it's free →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">View your report one more time: <a href="${reportUrl}" style="color:#0284c7;text-decoration:none;">open report</a>.</p>
    </td></tr>
  `);
}

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

function host(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function alertBox(html: string): string {
  return `<tr><td style="padding-bottom:32px;"><table cellpadding="0" cellspacing="0" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:16px 20px;width:100%;"><tr><td style="font-size:14px;color:#92400e;line-height:1.5;">${html}</td></tr></table></td></tr>`;
}

function detailBox(rows: { label: string; value: string; valueColor?: string }[]): string {
  const rowHtml = rows.map(r => `<tr><td style="font-size:13px;color:#6b7280;padding-bottom:${rows.indexOf(r) < rows.length - 1 ? "8" : "0"}px;">${r.label}</td><td style="font-size:14px;font-weight:600;color:${r.valueColor ?? "#111827"};text-align:right;padding-bottom:${rows.indexOf(r) < rows.length - 1 ? "8" : "0"}px;">${r.value}</td></tr>`).join("");
  return `<tr><td style="padding-bottom:24px;"><table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">${rowHtml}</table></td></tr>`;
}

// ─── Auth email HTML functions ───────────────────────────────────────────────

function authConfirmSignupHtml(confirmationUrl: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Confirm your email address</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">Thanks for signing up for CompeteIQ. Click the button below to confirm your email address and activate your account.</p></td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(confirmationUrl, "Confirm my email →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:13px;color:#6b7280;"><p style="margin:0;">This link expires in 24 hours. If you didn't create a CompeteIQ account, you can safely ignore this email.</p></td></tr>
  `);
}

function authMagicLinkHtml(confirmationUrl: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your sign-in link</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">Click the button below to sign in to CompeteIQ. This link can only be used once and expires in 1 hour.</p></td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(confirmationUrl, "Sign in to CompeteIQ →")}</td></tr>
    ${alertBox("<strong>Didn't request this?</strong> Someone may have entered your email address. You can safely ignore this email — your account has not been accessed.")}
  `);
}

function authResetPasswordHtml(confirmationUrl: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Reset your password</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">We received a request to reset the password for your CompeteIQ account. Click the button below to set a new password. This link expires in 1 hour.</p></td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(confirmationUrl, "Reset my password →")}</td></tr>
    ${alertBox("<strong>Didn't request this?</strong> Your password has not been changed. If you're concerned, contact us at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a>.")}
  `);
}

function authChangeEmailHtml(confirmationUrl: string, newEmail?: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Confirm your new email address</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">A request was made to change the email address on your CompeteIQ account${newEmail ? ` to <strong style="color:#0284c7;">${newEmail}</strong>` : ""}. Click below to confirm this change.</p></td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(confirmationUrl, "Confirm email change →")}</td></tr>
    ${alertBox("<strong>Didn't make this request?</strong> Contact us immediately at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a> so we can secure your account.")}
  `);
}

function authReauthenticationHtml(token: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Verify it's you</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0 0 12px;">To complete a sensitive action on your CompeteIQ account, enter the code below in the app. It expires in 10 minutes.</p></td></tr>
    <tr><td style="padding-bottom:32px;text-align:center;"><table cellpadding="0" cellspacing="0" style="margin:0 auto;background:#f0f9ff;border-radius:12px;padding:24px 40px;border:1px solid #e0f2fe;"><tr><td style="font-size:40px;font-weight:700;letter-spacing:10px;color:#0284c7;text-align:center;">${token}</td></tr></table></td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;"><p style="margin:0;"><strong style="color:#111827;">Why is this required?</strong> CompeteIQ requires re-verification before allowing changes to account credentials or sensitive settings.</p></td></tr>
    ${alertBox("If you didn't initiate this, someone may be attempting to access your account. Contact us immediately at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a>.")}
  `);
}

function authPasswordChangedHtml(userEmail: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your password has been changed</h2></td></tr>
    <tr><td style="padding-bottom:28px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0 0 12px;">This is a confirmation that the password for your CompeteIQ account (<strong style="color:#111827;">${userEmail}</strong>) was successfully updated.</p><p style="margin:0;">If you made this change, no further action is needed.</p></td></tr>
    ${alertBox("<strong>Didn't make this change?</strong> Your account may be compromised. Reset your password immediately and contact us at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a>.")}
  `);
}

function authSignInMethodLinkedHtml(userEmail: string, provider?: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">New sign-in method added</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">A new sign-in method has been linked to your CompeteIQ account (<strong style="color:#111827;">${userEmail}</strong>).</p></td></tr>
    ${provider ? detailBox([{ label: "Method added", value: provider, valueColor: "#0284c7" }]) : ""}
    <tr><td style="padding-bottom:24px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">You can review and manage your sign-in methods in <a href="https://competeiq.pro/settings/account" style="color:#0284c7;text-decoration:none;">Account Settings</a>.</p></td></tr>
    ${alertBox("<strong>Didn't do this?</strong> Remove this sign-in method in <a href=\"https://competeiq.pro/settings/account\" style=\"color:#92400e;\">Account Settings</a> immediately and contact us at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a>.")}
  `);
}

function authSignInMethodRemovedHtml(userEmail: string, provider?: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Sign-in method removed</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">A sign-in method has been removed from your CompeteIQ account (<strong style="color:#111827;">${userEmail}</strong>).</p></td></tr>
    ${provider ? detailBox([{ label: "Method removed", value: provider }]) : ""}
    <tr><td style="padding-bottom:24px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">You can review your remaining sign-in methods in <a href="https://competeiq.pro/settings/account" style="color:#0284c7;text-decoration:none;">Account Settings</a>.</p></td></tr>
    ${alertBox("<strong>Didn't do this?</strong> Review your account security in <a href=\"https://competeiq.pro/settings/account\" style=\"color:#92400e;\">Account Settings</a> immediately and contact us at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a>.")}
  `);
}

function authEmailAddressChangedHtml(oldEmail: string, newEmail?: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your email address has been updated</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0;">The email address on your CompeteIQ account has been successfully changed. All future sign-ins and notifications will be sent to your new address.</p></td></tr>
    ${detailBox([
      { label: "Previous email", value: oldEmail },
      ...(newEmail ? [{ label: "New email", value: newEmail, valueColor: "#0284c7" }] : []),
    ])}
    ${alertBox("<strong>Didn't make this change?</strong> Contact us immediately at <a href=\"mailto:info@competeiq.pro\" style=\"color:#92400e;\">info@competeiq.pro</a> so we can secure your account.")}
  `);
}

// ─── Transactional email HTML functions ──────────────────────────────────────

function welcomeHtml(planName: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Welcome to CompeteIQ — you're all set</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0 0 12px;">Your <strong style="color:#111827;">${planName}</strong> subscription is now active. You can start generating competitor intelligence reports right away.</p><p style="margin:0;">Set up your business details, add competitor URLs, and hit Generate — your first report will be ready in about 60 seconds.</p></td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #e0f2fe;border-radius:8px;padding:16px 20px;width:100%;">
        <tr><td style="font-size:14px;color:#0284c7;line-height:1.6;">
          <strong style="color:#0369a1;">What's included in ${planName}:</strong><br>
          • All 7 report sections — positioning, pricing, market gaps, and more<br>
          • Scheduled monthly re-runs with "what changed" summaries<br>
          • Client-ready PDF export<br>
          • Cancel any time
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/dashboard", "Go to my dashboard →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;"><p style="margin:0;">Questions? Reply to this email or contact us at <a href="mailto:info@competeiq.pro" style="color:#0284c7;text-decoration:none;">info@competeiq.pro</a>.</p></td></tr>
  `);
}

function monthlyReportReadyHtml(reportUrl: string, competitorUrl: string): string {
  const competitorHost = host(competitorUrl);
  return shell(`
    <tr><td style="padding-bottom:16px;"><h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your monthly competitor report is ready</h2></td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;"><p style="margin:0 0 12px;">Your scheduled monthly intelligence report on <strong style="color:#111827;">${competitorHost}</strong> has been generated. It includes a "what changed" summary comparing this month to your last report.</p><p style="margin:0;">Click below to read the full report and see what's new.</p></td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton(reportUrl, "Read my monthly report →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;"><p style="margin:0;">You're receiving this because you have monthly re-runs enabled for this competitor. Manage your schedule in <a href="https://competeiq.pro/dashboard" style="color:#0284c7;text-decoration:none;">Dashboard settings</a>.</p></td></tr>
  `);
}

// ─── Auth email dispatcher (called from the Supabase hook endpoint) ───────────

export interface SupabaseEmailHookData {
  token?: string;
  token_hash?: string;
  redirect_to?: string;
  email_action_type: string;
  site_url?: string;
  confirmation_url?: string;
  new_email?: string;
  provider?: string;
  old_email?: string;
}

export async function sendAuthEmail(
  actionType: string,
  toEmail: string,
  data: SupabaseEmailHookData
): Promise<void> {
  const resend = getResend();
  const confirmUrl = data.confirmation_url ?? data.redirect_to ?? "https://competeiq.pro";

  let subject: string;
  let html: string;

  switch (actionType) {
    case "signup":
      subject = "Confirm your email to access CompeteIQ";
      html = authConfirmSignupHtml(confirmUrl);
      break;
    case "magiclink":
      subject = "Your CompeteIQ sign-in link";
      html = authMagicLinkHtml(confirmUrl);
      break;
    case "recovery":
      subject = "Reset your CompeteIQ password";
      html = authResetPasswordHtml(confirmUrl);
      break;
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      subject = "Confirm your new CompeteIQ email address";
      html = authChangeEmailHtml(confirmUrl, data.new_email);
      break;
    case "reauthentication":
      subject = "Verify it's you — action required";
      html = authReauthenticationHtml(data.token ?? "------");
      break;
    case "password_change":
      subject = "Your CompeteIQ password has been updated";
      html = authPasswordChangedHtml(toEmail);
      break;
    case "identity_linked":
      subject = "A new sign-in method was added to your account";
      html = authSignInMethodLinkedHtml(toEmail, data.provider);
      break;
    case "identity_unlinked":
      subject = "A sign-in method was removed from your account";
      html = authSignInMethodRemovedHtml(toEmail, data.provider);
      break;
    case "email_changed":
      subject = "Your CompeteIQ email address has been updated";
      html = authEmailAddressChangedHtml(data.old_email ?? toEmail, data.new_email);
      break;
    default:
      // Unknown action type — log and skip rather than failing the auth flow.
      console.warn(`sendAuthEmail: unhandled action type "${actionType}" for ${toEmail}`);
      return;
  }

  await resend.emails.send({ from: FROM, to: toEmail, subject, html });
}

// ─── Transactional email senders ─────────────────────────────────────────────

export async function sendWelcomeEmail(toEmail: string, planName: string): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Welcome to CompeteIQ — you're all set",
    html: welcomeHtml(planName),
  });
}

export async function sendMonthlyReportReadyEmail(
  toEmail: string,
  reportUrl: string,
  competitorUrl: string
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: toEmail,
    subject: "Your monthly competitor report is ready",
    html: monthlyReportReadyHtml(reportUrl, competitorUrl),
  });
}

// ─── Guest drip sequence ──────────────────────────────────────────────────────

export async function scheduleGuestEmailSequence(
  email: string,
  reportUrl: string,
  competitorUrl: string
): Promise<void> {
  const resend = getResend();

  const emails = [
    {
      subject: "Your competitive intelligence report is ready",
      html: email1Html(reportUrl, competitorUrl),
      scheduledAt: undefined, // immediate
    },
    {
      subject: "What your competitor report just revealed",
      html: email2Html(reportUrl, competitorUrl),
      scheduledAt: daysFromNow(1),
    },
    {
      subject: "How founders use CompeteIQ every month",
      html: email3Html(reportUrl),
      scheduledAt: daysFromNow(3),
    },
    {
      subject: "Unlock monthly competitor monitoring",
      html: email4Html(reportUrl, competitorUrl),
      scheduledAt: daysFromNow(5),
    },
    {
      subject: "Save your report before it expires",
      html: email5Html(reportUrl),
      scheduledAt: daysFromNow(7),
    },
  ];

  for (const e of emails) {
    await resend.emails.send({ // guest drip
      from: FROM,
      to: email,
      subject: e.subject,
      html: e.html,
      ...(e.scheduledAt ? { scheduledAt: e.scheduledAt } : {}),
    });
  }
}

// ─── Sequence A: Post-signup nurture (Days 1, 3, 7, 14) ──────────────────────
// Fires when a new user confirms their email. Nurtures free/trial accounts toward
// their first paid subscription. Starts at Day 1 to avoid overlapping with the
// signup confirmation email.

function postSignupA1Html(): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your CompeteIQ account is ready</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">You're in. CompeteIQ generates structured competitor intelligence reports in about 60 seconds — pulling live data from actual competitor websites, not training data or guesswork.</p>
      <p style="margin:0;">Each report covers 7 sections: positioning, pricing, strengths, weaknesses, market gaps, and clear recommended actions — all sourced from the pages your competitors are actually publishing.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.8;">
          <strong style="color:#111827;">Starter — A$39/month</strong><br>
          10 reports per 30 days · 3 competitors per report · Cancel any time
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "See plans and pricing →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Want to see what a report looks like first? <a href="https://competeiq.pro/sample-reports" style="color:#0284c7;text-decoration:none;">View a sample report →</a></p>
    </td></tr>
  `);
}

function postSignupA2Html(): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">What a competitor report actually reveals</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Most people assume they know what their competitors are doing. They're usually wrong about at least one thing — pricing, messaging, or a market gap they're not seeing.</p>
      <p style="margin:0;">Here's what each section of a CompeteIQ report gives you:</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.9;">
          <p style="margin:0 0 6px;"><strong style="color:#111827;">Executive summary</strong> — the 30-second answer to "what are they actually doing?"</p>
          <p style="margin:0 0 6px;"><strong style="color:#111827;">Positioning analysis</strong> — how they describe themselves vs. how you could</p>
          <p style="margin:0 0 6px;"><strong style="color:#111827;">Pricing analysis</strong> — visible pricing signals, anchors, and strategy</p>
          <p style="margin:0 0 6px;"><strong style="color:#111827;">Strengths &amp; weaknesses</strong> — where they're exposed for you to move</p>
          <p style="margin:0 0 6px;"><strong style="color:#111827;">Market gaps</strong> — what they're not doing that you could</p>
          <p style="margin:0;"><strong style="color:#111827;">Recommended actions</strong> — specific next steps based on what the report found</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Start with Starter — A$39/month →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Want to see a full example first? <a href="https://competeiq.pro/sample-reports" style="color:#0284c7;text-decoration:none;">Browse sample reports →</a></p>
    </td></tr>
  `);
}

function postSignupA3Html(): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your competitors' websites changed this week. Did you notice?</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Competitor pricing updates, new product pages, rewritten messaging — most of this happens quietly, and by the time you notice, the damage is already done: lost deals, confused positioning, outdated comparisons.</p>
      <p style="margin:0;">CompeteIQ's scheduled re-runs check your competitors every month and generate a "what changed" summary, so you're never caught off-guard.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f0f9ff;border:1px solid #e0f2fe;border-radius:8px;padding:16px 20px;width:100%;">
        <tr><td style="font-size:14px;color:#0284c7;line-height:1.6;">
          <strong style="color:#0369a1;">With a Starter subscription:</strong><br>
          • 10 competitor reports per 30 days<br>
          • Monthly re-runs with "what changed" summaries<br>
          • Evidence-backed — every insight links to source data<br>
          • A$39/month · Cancel any time
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Get Starter — A$39/month →")}</td></tr>
  `);
}

function postSignupA4Html(): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">One report. 60 seconds. Here's what you've been missing.</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">You created your CompeteIQ account two weeks ago. The founders who get the most from it are the ones who run that first report — because once they see what it reveals, they run another.</p>
      <p style="margin:0;">Starter is A$39/month. That's one coffee per week to know exactly what your competitors are doing — pricing, positioning, gaps, and what's changed.</p>
    </td></tr>
    ${alertBox("<strong>A$39/month. 10 reports. Cancel any time.</strong> No long contracts. No setup. Your first report is ready in under 60 seconds.")}
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Start with Starter →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Questions? Just reply to this email — I read every response.</p>
    </td></tr>
  `);
}

export async function schedulePostSignupNurtureSequence(email: string): Promise<void> {
  const resend = getResend();
  const emails = [
    { subject: "Your CompeteIQ account is ready", html: postSignupA1Html(), scheduledAt: daysFromNow(1) },
    { subject: "What a competitor report actually reveals", html: postSignupA2Html(), scheduledAt: daysFromNow(3) },
    { subject: "Your competitors' websites changed this week. Did you notice?", html: postSignupA3Html(), scheduledAt: daysFromNow(7) },
    { subject: "One report. 60 seconds. Here's what you've been missing.", html: postSignupA4Html(), scheduledAt: daysFromNow(14) },
  ];
  for (const e of emails) {
    await resend.emails.send({ from: FROM, to: email, subject: e.subject, html: e.html, scheduledAt: e.scheduledAt });
  }
}

// ─── Sequence B: Paid subscriber onboarding (Days 2, 7) ──────────────────────
// Fires alongside the welcome email on new subscription. Gets subscribers to
// their first report fast and builds habits that drive retention.

function onboardingB2Html(planName: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Run your first ${planName} report — here's what to look for</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">If you haven't run your first report yet, now's the time. Head to your dashboard, add your business details and a competitor URL, and hit Generate — it'll be ready in about 60 seconds.</p>
      <p style="margin:0;">When you read it, pay special attention to these three sections:</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.9;">
          <p style="margin:0 0 8px;">🎯 <strong style="color:#111827;">Market gaps</strong> — opportunities your competitor is leaving on the table. Move on even one and it's a real advantage.</p>
          <p style="margin:0 0 8px;">💬 <strong style="color:#111827;">Positioning analysis</strong> — how they describe themselves reveals what they think their strengths are. If your language sounds too similar, you're competing on the wrong terms.</p>
          <p style="margin:0;">✅ <strong style="color:#111827;">Recommended actions</strong> — specific, not generic. If an action doesn't fit your business, that's useful information too.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/dashboard", "Generate my first report →")}</td></tr>
  `);
}

function onboardingB3Html(planName: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">3 things CompeteIQ members do that make a difference</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0;">A week in, here are three habits that separate useful reports from genuinely useful ones:</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.9;">
          <p style="margin:0 0 10px;"><strong style="color:#111827;">1. Add 2–3 competitors, not just one.</strong> The market gaps section is most revealing when you're comparing patterns across multiple competitors — what they all miss is what the market is actually waiting for.</p>
          <p style="margin:0 0 10px;"><strong style="color:#111827;">2. Turn on scheduled monthly re-runs.</strong> In your dashboard, enable automatic re-runs for any saved business. You'll get a "what changed" email each month — without having to remember to check.</p>
          <p style="margin:0;"><strong style="color:#111827;">3. Run a report before a sales call or pricing decision.</strong> The positioning and pricing sections are most actionable when a competitor conversation is about to happen.</p>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/dashboard", "Go to my dashboard →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Questions about getting more from ${planName}? Reply to this email — I'm here to help.</p>
    </td></tr>
  `);
}

export async function scheduleOnboardingSequence(email: string, planName: string): Promise<void> {
  const resend = getResend();
  const emails = [
    { subject: `Run your first ${planName} report — here's what to look for`, html: onboardingB2Html(planName), scheduledAt: daysFromNow(2) },
    { subject: "3 things CompeteIQ members do that make a difference", html: onboardingB3Html(planName), scheduledAt: daysFromNow(7) },
  ];
  for (const e of emails) {
    await resend.emails.send({ from: FROM, to: email, subject: e.subject, html: e.html, scheduledAt: e.scheduledAt });
  }
}

// ─── Sequence C: Usage limit warnings ────────────────────────────────────────
// C1 fires when a paid user hits 80% of their monthly quota (upgrade nudge).
// C2 fires when they hit 100% (resets / upgrade reminder). Both are one-shot —
// callers must ensure they don't send duplicates within the same billing period.

function usageLimitWarningHtml(used: number, limit: number, planName: string): string {
  const remaining = limit - used;
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">You're almost at your monthly report limit</h2>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      ${detailBox([
        { label: "Reports used this month", value: `${used} of ${limit}` },
        { label: "Reports remaining", value: `${remaining}`, valueColor: remaining <= 2 ? "#dc2626" : "#111827" },
      ])}
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0;">${planName === "Starter"
        ? "Upgrade to Pro for 100 reports per 30 days — that's 10x your current limit for A$159/month."
        : `You're approaching the Pro plan limit of ${limit} reports. Contact us if you need a custom arrangement.`
      }</p>
    </td></tr>
    ${planName === "Starter" ? `<tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Upgrade to Pro →")}</td></tr>` : ""}
  `);
}

function usageLimitReachedHtml(planName: string, resetDate: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">You've used all your reports for this month</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your ${planName} plan report limit has been reached for this 30-day period. Your reports reset on approximately <strong style="color:#111827;">${resetDate}</strong>.</p>
      ${planName === "Starter"
        ? "<p style=\"margin:0;\">Need to keep researching? Upgrade to Pro for 100 reports per 30 days — your quota resets immediately on upgrade.</p>"
        : "<p style=\"margin:0;\">Your limit resets automatically. If you need additional capacity before then, reply to this email.</p>"
      }
    </td></tr>
    ${planName === "Starter" ? `<tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Upgrade to Pro — 100 reports/month →")}</td></tr>` : `<tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/dashboard", "View my dashboard →")}</td></tr>`}
  `);
}

export async function sendUsageLimitWarningEmail(
  email: string,
  used: number,
  limit: number,
  planName: string
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `You're almost at your ${planName} report limit`,
    html: usageLimitWarningHtml(used, limit, planName),
  });
}

export async function sendUsageLimitReachedEmail(
  email: string,
  planName: string,
  resetDate: string
): Promise<void> {
  const resend = getResend();
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "You've reached your monthly report limit",
    html: usageLimitReachedHtml(planName, resetDate),
  });
}

// ─── Sequence D: Cancellation + win-back (immediate + Day 7) ─────────────────
// D1 fires immediately on subscription.deleted. D2 follows up in 7 days to
// ask why they cancelled and offer an easy path back.

function cancellationD1Html(planName: string): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Your CompeteIQ subscription has ended</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">Your <strong style="color:#111827;">${planName}</strong> subscription has been cancelled. Your access has ended and you won't be charged again.</p>
      <p style="margin:0;">Your account, business details, and all your existing reports are still saved — they'll be right there if you come back.</p>
    </td></tr>
    <tr><td style="padding-bottom:24px;">
      <table cellpadding="0" cellspacing="0" style="background:#f9fafb;border-radius:8px;padding:16px 20px;width:100%;border:1px solid #e5e7eb;">
        <tr><td style="font-size:14px;color:#4b5563;line-height:1.6;">
          Changed your mind? You can reactivate any time — your previous data will be right where you left it.
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Reactivate my subscription →")}</td></tr>
    <tr><td style="padding-bottom:32px;font-size:14px;color:#6b7280;">
      <p style="margin:0;">Questions? Reply to this email or contact us at <a href="mailto:info@competeiq.pro" style="color:#0284c7;text-decoration:none;">info@competeiq.pro</a>.</p>
    </td></tr>
  `);
}

function cancellationD2Html(): string {
  return shell(`
    <tr><td style="padding-bottom:16px;">
      <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">Before you go — one quick question</h2>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0 0 12px;">You cancelled your CompeteIQ subscription last week. I'd genuinely love to know what made you leave — was it the price, the reports weren't useful enough, timing, or something else?</p>
      <p style="margin:0;">Just reply to this email with a sentence or two. I read every response and it directly shapes what gets built next.</p>
    </td></tr>
    <tr><td style="padding-bottom:20px;font-size:15px;line-height:1.6;color:#4b5563;">
      <p style="margin:0;">And if it was timing or budget — Starter is still A$39/month and your data is still saved. No pressure, but the door's open.</p>
    </td></tr>
    <tr><td style="padding-bottom:32px;">${ctaButton("https://competeiq.pro/billing", "Come back any time →")}</td></tr>
  `);
}

export async function scheduleCancellationSequence(email: string, planName: string): Promise<void> {
  const resend = getResend();
  const emails = [
    { subject: "Your CompeteIQ subscription has ended", html: cancellationD1Html(planName), scheduledAt: undefined },
    { subject: "Before you go — one quick question", html: cancellationD2Html(), scheduledAt: daysFromNow(7) },
  ];
  for (const e of emails) {
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: e.subject,
      html: e.html,
      ...(e.scheduledAt ? { scheduledAt: e.scheduledAt } : {}),
    });
  }
}

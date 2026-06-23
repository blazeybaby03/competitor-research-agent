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
    await resend.emails.send({
      from: FROM,
      to: email,
      subject: e.subject,
      html: e.html,
      ...(e.scheduledAt ? { scheduledAt: e.scheduledAt } : {}),
    });
  }
}

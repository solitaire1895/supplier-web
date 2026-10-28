// lib/email.ts
//
// Transactional email through Resend (https://resend.com/docs/api-reference/emails/send-email).
// Server only. Uses the REST API directly, so no SDK dependency.
//
// Env:
//   RESEND_API_KEY   re_...            (required to send; without it emails are skipped and logged)
//   EMAIL_FROM       "Nexusply <notifications@your-domain.com>"  (a domain verified in Resend)
//   EMAIL_REPLY_TO   optional reply-to address

const RESEND_URL = 'https://api.resend.com/emails'

export interface EmailMessage {
  to: string | string[]
  subject: string
  html: string
  text: string
  replyTo?: string
  /** Resend de-duplicates sends with the same key for 24 h. */
  idempotencyKey?: string
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/** Sends one email. Never throws: email must not break payments or chat. */
export async function sendEmail(message: EmailMessage): Promise<{ ok: boolean; id?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) {
    console.warn(`EMAIL skipped (RESEND_API_KEY or EMAIL_FROM missing): "${message.subject}"`)
    return { ok: false }
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(message.idempotencyKey ? { 'Idempotency-Key': message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        reply_to: message.replyTo ?? process.env.EMAIL_REPLY_TO ?? undefined,
      }),
      signal: AbortSignal.timeout(10_000),
    })

    if (!res.ok) {
      console.error(`EMAIL Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
      return { ok: false }
    }
    const body = (await res.json()) as { id?: string }
    return { ok: true, id: body.id }
  } catch (error) {
    console.error('EMAIL send failed:', error instanceof Error ? error.message : error)
    return { ok: false }
  }
}

// ─────────────────────────────────────────────────────────────
// Template
// ─────────────────────────────────────────────────────────────

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function siteUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')
  return `${base}${path}`
}

/**
 * Nexusply email layout: near-black, serif headline, mono label, one red button.
 * Table-based with inline styles so it renders in Gmail, Outlook and mobile clients.
 * All arguments except `bodyHtml` are plain text and are escaped here.
 */
export function renderEmail(opts: {
  label: string
  title: string
  bodyHtml: string
  cta?: { label: string; href: string }
  footer: string
}) {
  const serif = "Georgia, 'Times New Roman', serif"
  const sans = "Inter, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  const mono = "'SFMono-Regular', Menlo, Consolas, monospace"

  const button = opts.cta
    ? `<tr><td style="padding:8px 40px 36px">
         <a href="${escapeHtml(opts.cta.href)}" style="display:inline-block;background:#ef4444;color:#ffffff;font-family:${sans};font-size:14px;font-weight:600;text-decoration:none;padding:13px 26px;border-radius:999px">${escapeHtml(opts.cta.label)} &rarr;</a>
       </td></tr>`
    : ''

  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#030303">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#030303;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#080808;border:1px solid #1c1c1c;border-radius:20px">
        <tr><td style="padding:28px 40px;border-bottom:1px solid #1c1c1c;font-family:${sans};font-size:18px;font-weight:600;color:#ffffff">Nexus<span style="color:#ef4444">ply</span></td></tr>
        <tr><td style="padding:36px 40px 0;font-family:${mono};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#969290"><span style="color:#ef4444">&#9679;</span>&nbsp; ${escapeHtml(opts.label)}</td></tr>
        <tr><td style="padding:14px 40px 8px;font-family:${serif};font-size:32px;line-height:1.15;font-weight:400;color:#ffffff">${escapeHtml(opts.title)}</td></tr>
        <tr><td style="padding:12px 40px 24px;font-family:${sans};font-size:15px;line-height:1.65;color:#c9c6c4">${opts.bodyHtml}</td></tr>
        ${button}
        <tr><td style="padding:22px 40px;border-top:1px solid #1c1c1c;font-family:${sans};font-size:12px;line-height:1.6;color:#636363">${escapeHtml(opts.footer)}</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

/** A two-column detail row for receipts. Arguments are plain text. */
export function detailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;border-top:1px solid #1c1c1c;font-family:'SFMono-Regular',Menlo,Consolas,monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#969290">${escapeHtml(label)}</td>
    <td align="right" style="padding:10px 0;border-top:1px solid #1c1c1c;font-family:Georgia,serif;font-size:17px;color:#ffffff">${escapeHtml(value)}</td>
  </tr>`
}

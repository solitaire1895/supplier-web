// lib/notifications.ts
//
// Email notifications: plan payment confirmations and support chat messages.
// Server only. Every function here swallows its own errors; call them from
// `after()` so the response never waits on an email.

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { detailRow, escapeHtml, isEmailConfigured, renderEmail, sendEmail, siteUrl } from '@/lib/email'
import { PLANS, isPaidPlan } from '@/lib/plans'
import { formatPrice } from '@/lib/currencies'

const DATE_FR: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }

/** A user's email and display name, from the profile or the auth record. */
async function getRecipient(db: SupabaseClient, userId: string) {
  const { data: profile } = await db.from('profiles').select('email, full_name').eq('id', userId).maybeSingle()
  let email: string | null = profile?.email ?? null
  if (!email) {
    const { data } = await db.auth.admin.getUserById(userId)
    email = data?.user?.email ?? null
  }
  const name = profile?.full_name?.trim() || email?.split('@')[0] || ''
  return { email, name }
}

// ─────────────────────────────────────────────────────────────
// Payment confirmation
// ─────────────────────────────────────────────────────────────

/**
 * Receipt for a plan payment that was just fulfilled. Called once per payment
 * (fulfill_plan_payment returns "fulfilled" only the first time), and the
 * Resend idempotency key guards against a retry sending it twice.
 */
export async function sendPaymentConfirmation(paymentId: string) {
  if (!isEmailConfigured()) return
  const db = getSupabaseAdmin()
  if (!db) return

  try {
    const { data: payment } = await db
      .from('plan_payments')
      .select('id, user_id, plan, amount, currency, period_end, paid_at, created_at')
      .eq('id', paymentId)
      .maybeSingle()
    if (!payment) return

    const { email, name } = await getRecipient(db, payment.user_id)
    if (!email) {
      console.warn(`EMAIL payment ${paymentId}: user has no email`)
      return
    }

    const planName = isPaidPlan(payment.plan) ? PLANS[payment.plan].name.FR : payment.plan
    const amount = formatPrice(Number(payment.amount), payment.currency, 'FR')
    const paidOn = new Date(payment.paid_at ?? payment.created_at).toLocaleDateString('fr-FR', DATE_FR)
    const until = payment.period_end ? new Date(payment.period_end).toLocaleDateString('fr-FR', DATE_FR) : null
    const reference = String(payment.id).slice(0, 8).toUpperCase()

    const bodyHtml = `
      <p style="margin:0 0 18px">Bonjour ${escapeHtml(name)},</p>
      <p style="margin:0 0 22px">Merci pour votre paiement. Votre plan <strong style="color:#ffffff">${escapeHtml(planName)}</strong> est actif.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #1c1c1c">
        ${detailRow('Plan', planName)}
        ${detailRow('Montant', amount)}
        ${detailRow('Date', paidOn)}
        ${until ? detailRow('Actif jusqu’au', until) : ''}
        ${detailRow('Référence', reference)}
      </table>
      <p style="margin:22px 0 0;color:#969290;font-size:13px">Pas de renouvellement automatique : renouvelez depuis votre espace${until ? ` avant le ${escapeHtml(until)}` : ''} pour garder votre accès.</p>`

    const text = [
      `Bonjour ${name},`,
      '',
      `Merci pour votre paiement. Votre plan ${planName} est actif.`,
      '',
      `Plan : ${planName}`,
      `Montant : ${amount}`,
      `Date : ${paidOn}`,
      until ? `Actif jusqu'au : ${until}` : '',
      `Référence : ${reference}`,
      '',
      `Votre abonnement : ${siteUrl('/dashboard/profile?tab=plan')}`,
    ]
      .filter((line) => line !== null)
      .join('\n')

    await sendEmail({
      to: email,
      subject: `Paiement confirmé : plan ${planName}`,
      html: renderEmail({
        label: 'Paiement confirmé',
        title: `Votre plan ${planName} est actif`,
        bodyHtml,
        cta: { label: 'Voir mon abonnement', href: siteUrl('/dashboard/profile?tab=plan') },
        footer: `Nexusply · Reçu de paiement ${reference}. Gardez cet email pour vos archives.`,
      }),
      text,
      idempotencyKey: `plan-payment-${payment.id}`,
    })
  } catch (error) {
    console.error(`EMAIL payment ${paymentId} failed:`, error instanceof Error ? error.message : error)
  }
}

// ─────────────────────────────────────────────────────────────
// Support chat
// ─────────────────────────────────────────────────────────────

/** Consecutive messages from the same side within this window send one email, not one each. */
const SUPPORT_QUIET_MINUTES = 15

async function supportAdminEmails(db: SupabaseClient): Promise<string[]> {
  const configured = (process.env.SUPPORT_NOTIFY_EMAIL || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
  if (configured.length) return configured

  const { data } = await db.from('profiles').select('email').in('role', ['admin', 'super_admin'])
  return (data ?? []).map((p) => p.email).filter((e): e is string => Boolean(e))
}

function excerpt(content: string) {
  const short = content.length > 600 ? `${content.slice(0, 600)}…` : content
  return escapeHtml(short).replace(/\n/g, '<br>')
}

/**
 * Emails the other side of a support conversation about a new message:
 * a user message goes to the support team, an admin reply goes to the user.
 * Skipped when the same side already wrote within SUPPORT_QUIET_MINUTES,
 * so a burst of messages produces one email.
 */
export async function notifySupportMessage(messageId: string) {
  if (!isEmailConfigured()) return
  const db = getSupabaseAdmin()
  if (!db) return

  try {
    const { data: message } = await db
      .from('support_messages')
      .select('id, conversation_id, sender_id, sender_role, content, created_at')
      .eq('id', messageId)
      .maybeSingle()
    if (!message) return

    // Throttle: look at the message just before this one.
    const { data: previous } = await db
      .from('support_messages')
      .select('sender_role, created_at')
      .eq('conversation_id', message.conversation_id)
      .lt('created_at', message.created_at)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (
      previous &&
      previous.sender_role === message.sender_role &&
      new Date(message.created_at).getTime() - new Date(previous.created_at).getTime() < SUPPORT_QUIET_MINUTES * 60_000
    ) {
      return
    }

    const { data: conversation } = await db
      .from('support_conversations')
      .select('id, user_id, subject')
      .eq('id', message.conversation_id)
      .maybeSingle()
    if (!conversation) return

    const subject = conversation.subject || 'Support'
    const ref = String(conversation.id).slice(0, 8).toUpperCase()

    if (message.sender_role === 'admin') {
      // Reply from the team → the customer.
      const { email, name } = await getRecipient(db, conversation.user_id)
      if (!email) return
      const link = siteUrl('/dashboard/support')
      await sendEmail({
        to: email,
        subject: `Nouvelle réponse du support : ${subject}`,
        html: renderEmail({
          label: 'Support Nexusply',
          title: 'Vous avez une nouvelle réponse',
          bodyHtml: `
            <p style="margin:0 0 18px">Bonjour ${escapeHtml(name)},</p>
            <p style="margin:0 0 18px">L'équipe a répondu à votre demande « ${escapeHtml(subject)} » :</p>
            <div style="margin:0 0 8px;padding:16px 18px;border-left:2px solid #ef4444;background:#0f0f0f;border-radius:0 12px 12px 0;color:#ffffff">${excerpt(message.content)}</div>`,
          cta: { label: 'Répondre', href: link },
          footer: `Nexusply · Conversation ${ref}. Pour que l'équipe voie votre message, répondez depuis votre espace Nexusply.`,
        }),
        text: `Bonjour ${name},\n\nL'équipe a répondu à votre demande « ${subject} » :\n\n${message.content}\n\nRépondre : ${link}`,
        idempotencyKey: `support-message-${message.id}`,
      })
      return
    }

    // Message from a customer → the support team.
    const recipients = await supportAdminEmails(db)
    if (!recipients.length) {
      console.warn('EMAIL support: no SUPPORT_NOTIFY_EMAIL and no admin emails')
      return
    }
    const { email: customerEmail, name: customerName } = await getRecipient(db, conversation.user_id)
    const link = siteUrl('/admin')
    await sendEmail({
      to: recipients,
      subject: `[Support] ${customerName || customerEmail || 'Client'} : ${subject}`,
      replyTo: customerEmail ?? undefined,
      html: renderEmail({
        label: 'Nouveau message client',
        title: subject,
        bodyHtml: `
          <p style="margin:0 0 18px"><strong style="color:#ffffff">${escapeHtml(customerName || 'Client')}</strong>${customerEmail ? ` · ${escapeHtml(customerEmail)}` : ''}</p>
          <div style="margin:0 0 8px;padding:16px 18px;border-left:2px solid #ef4444;background:#0f0f0f;border-radius:0 12px 12px 0;color:#ffffff">${excerpt(message.content)}</div>`,
        cta: { label: 'Ouvrir le support', href: link },
        footer: `Nexusply · Conversation ${ref}. Répondez depuis l'espace admin pour que le client voie la réponse.`,
      }),
      text: `${customerName || 'Client'}${customerEmail ? ` (${customerEmail})` : ''} :\n\n${message.content}\n\nOuvrir : ${link}`,
      idempotencyKey: `support-message-${message.id}`,
    })
  } catch (error) {
    console.error(`EMAIL support message ${messageId} failed:`, error instanceof Error ? error.message : error)
  }
}

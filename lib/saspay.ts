// lib/saspay.ts
//
// Minimal server-side client for the SasPay REST API (https://docs.saspay.me).
// Server only: it reads SASPAY_SECRET_KEY. Never import it from a client component.

import crypto from 'crypto'

const DEFAULT_BASE_URL = 'https://api.saspay.me/api/v1'
const REQUEST_TIMEOUT_MS = 15_000
/** SasPay rejects webhook timestamps more than 5 minutes off. */
const WEBHOOK_TOLERANCE_SECONDS = 300

// ─────────────────────────────────────────────────────────────
// Types (only the fields we use)
// ─────────────────────────────────────────────────────────────

export type CheckoutSessionStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED'
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED'

export interface SaspayCheckoutSession {
  id: string
  slug?: string
  checkout_url: string
  amount: string
  currency: string
  status: CheckoutSessionStatus
  paid_at?: string | null
  /** Null until paid. Either a transaction ID or an expanded transaction object. */
  transaction?: string | { id: string } | null
}

export interface SaspayTransaction {
  id: string
  reference?: string
  status: TransactionStatus
  currency: string
  /** Transaction detail / verify endpoints. */
  requested_amount?: string
  /** Webhook payload. */
  amount?: string
  net_amount?: string
  metadata?: Record<string, unknown> | null
}

export interface CreateCheckoutSessionInput {
  amount: number
  currency: string
  customer_email: string
  customer_name: string
  description?: string
  country?: string
  customer_phone?: string
  return_url?: string
  metadata?: Record<string, unknown>
  fee_charge_mode?: 'ADD_ON' | 'DEDUCTED'
  expires_at?: string
}

export class SaspayError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly body: unknown
  ) {
    super(message)
    this.name = 'SaspayError'
  }

  /** Network errors and 5xx/429 are worth retrying; other 4xx are not. */
  get retryable(): boolean {
    return this.status === null || this.status === 429 || this.status >= 500
  }
}

// ─────────────────────────────────────────────────────────────
// HTTP
// ─────────────────────────────────────────────────────────────

export function isSaspayConfigured(): boolean {
  return !!process.env.SASPAY_SECRET_KEY
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Responses use the envelope { success, data, code }; tolerate a bare body too. */
function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in body) {
    const data = (body as { data: unknown }).data
    if (data !== null && typeof data === 'object') return data as T
  }
  return body as T
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  payload?: unknown,
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const secretKey = process.env.SASPAY_SECRET_KEY
  if (auth && !secretKey) throw new SaspayError('SASPAY_SECRET_KEY is not configured', null, null)

  const baseUrl = (process.env.SASPAY_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '')
  const maxAttempts = method === 'GET' ? 3 : 1 // POSTs are not idempotent: never replay them blindly
  let lastError: SaspayError | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          ...(auth ? { Authorization: `Bearer ${secretKey}` } : {}),
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json' } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })

      const text = await res.text()
      let body: unknown = null
      try {
        body = text ? JSON.parse(text) : null
      } catch {
        body = text
      }

      if (!res.ok) {
        const fields = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null
        const raw = fields ? (fields.message ?? fields.detail ?? fields.error ?? fields) : body
        const detail = typeof raw === 'string' ? raw : JSON.stringify(raw)
        throw new SaspayError(`SasPay ${method} ${path} failed (HTTP ${res.status}): ${detail}`, res.status, body)
      }

      return unwrap<T>(body)
    } catch (error: unknown) {
      lastError =
        error instanceof SaspayError
          ? error
          : new SaspayError(`SasPay ${method} ${path} network error: ${error instanceof Error ? error.message : String(error)}`, null, null)

      if (!lastError.retryable || attempt === maxAttempts) throw lastError
      await sleep(400 * attempt)
    }
  }

  throw lastError ?? new SaspayError('SasPay request failed', null, null)
}

// ─────────────────────────────────────────────────────────────
// Endpoints
// ─────────────────────────────────────────────────────────────

export function createCheckoutSession(input: CreateCheckoutSessionInput) {
  return request<SaspayCheckoutSession>('POST', '/checkout-sessions/', {
    ...input,
    amount: input.amount.toFixed(2),
  })
}

export function getCheckoutSession(sessionId: string) {
  return request<SaspayCheckoutSession>('GET', `/checkout-sessions/${encodeURIComponent(sessionId)}/`)
}

/** Returns the transaction, re-checking the gateway first if it is still PENDING. */
export function verifyPayment(transactionId: string) {
  return request<SaspayTransaction>('GET', `/payments/${encodeURIComponent(transactionId)}/verify/`)
}

export interface SaspayCountry {
  id: string
  iso_code: string
  name: string
  default_currency: string
  is_active: boolean
}

export interface SaspayNetwork {
  id: string
  /** Country UUID. */
  country: string
  code: string
  name: string
  is_active: boolean
}

type Paginated<T> = { results?: T[]; next?: string | null }

/** Public endpoint: returns a raw array. */
export async function listCountries(): Promise<SaspayCountry[]> {
  const data = await request<SaspayCountry[] | Paginated<SaspayCountry>>('GET', '/countries/', undefined, { auth: false })
  return Array.isArray(data) ? data : (data.results ?? [])
}

/** All mobile money / card networks, every page. */
export async function listNetworks(): Promise<SaspayNetwork[]> {
  const all: SaspayNetwork[] = []
  for (let page = 1; page <= 20; page++) {
    const data = await request<SaspayNetwork[] | Paginated<SaspayNetwork>>('GET', `/networks/?page=${page}&page_size=100`)
    if (Array.isArray(data)) return all.concat(data)
    all.push(...(data.results ?? []))
    if (!data.next) break
  }
  return all
}

/** Transaction ID of a checkout session, whether SasPay returns it as an ID or an object. */
export function sessionTransactionId(session: SaspayCheckoutSession): string | null {
  const tx = session.transaction
  if (!tx) return null
  if (typeof tx === 'string') return tx
  return typeof tx === 'object' && 'id' in tx ? tx.id : null
}

// ─────────────────────────────────────────────────────────────
// Webhook signature
// ─────────────────────────────────────────────────────────────

/**
 * Verifies X-Webhook-Signature: lowercase hex HMAC-SHA256 of "{timestamp}.{rawBody}",
 * with a 5-minute timestamp tolerance and a constant-time comparison.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secret: string
): boolean {
  if (!signature || !timestamp) return false

  const ts = Number(timestamp)
  if (!Number.isFinite(ts)) return false
  if (Math.abs(Math.floor(Date.now() / 1000) - ts) > WEBHOOK_TOLERANCE_SECONDS) return false

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex')
  const a = Buffer.from(signature.trim().toLowerCase())
  const b = Buffer.from(expected)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

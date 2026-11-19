// app/api/assistant/route.ts
//
// Nexus AI assistant. GET: messages left today. POST: one answer, streamed as plain text.
// The model runs on the FreeLLMAPI router (OpenAI-compatible); its URL and key are
// server-only. The daily limit is counted in the database before calling the model,
// and given back if the model fails before answering.

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { withEffectivePlan } from '@/lib/plans'
import { MAX_MESSAGE_CHARS, MAX_MESSAGES, SYSTEM_PROMPT, createDeltaParser, dailyLimit, doualaDay } from '@/lib/assistant'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Time allowed for the router to start answering (it may try several providers). */
const CONNECT_TIMEOUT_MS = 45_000

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS) }))
    .min(1)
    .max(MAX_MESSAGES)
    .refine((m) => m[m.length - 1].role === 'user', 'last message must be from the user'),
})

/** The signed-in user, their effective plan and today's limit, or a response to return. */
async function caller() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'unauthorized' }, { status: 401 }) }
  const db = getSupabaseAdmin()
  if (!db) return { error: NextResponse.json({ error: 'unavailable' }, { status: 500 }) }
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_plan, plan_expires_at, subscription_status')
    .eq('id', user.id)
    .maybeSingle()
  const plan = withEffectivePlan(profile)?.active_plan ?? 'free'
  return { user, db, plan, limit: dailyLimit(plan), day: doualaDay() }
}

export async function GET() {
  const c = await caller()
  if ('error' in c) return c.error
  const { data } = await c.db.from('assistant_usage').select('count').eq('user_id', c.user.id).eq('day', c.day).maybeSingle()
  return NextResponse.json({ remaining: Math.max(0, c.limit - (data?.count ?? 0)), limit: c.limit, plan: c.plan })
}

export async function POST(req: Request) {
  const url = process.env.FREELLMAPI_URL
  const key = process.env.FREELLMAPI_API_KEY
  if (!url || !key) {
    console.error('ASSISTANT: FREELLMAPI_URL or FREELLMAPI_API_KEY is missing')
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }

  const c = await caller()
  if ('error' in c) return c.error

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const { data: used, error: countError } = await c.db.rpc('consume_assistant_message', {
    p_user_id: c.user.id, p_day: c.day, p_limit: c.limit,
  })
  if (countError) {
    console.error('ASSISTANT: usage count failed:', countError.message)
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }
  if (used == null) {
    return NextResponse.json({ error: 'limit', limit: c.limit, plan: c.plan }, { status: 429 })
  }
  const refund = () => c.db.rpc('refund_assistant_message', { p_user_id: c.user.id, p_day: c.day })

  // The timeout covers only the wait for the first byte, not the streamed answer.
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), CONNECT_TIMEOUT_MS)
  req.signal.addEventListener('abort', () => abort.abort())
  let upstream: Response
  try {
    upstream = await fetch(`${url.replace(/\/+$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.FREELLMAPI_MODEL || 'auto',
        stream: true,
        max_tokens: 1200,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...parsed.data.messages],
      }),
      signal: abort.signal,
    })
  } catch (error) {
    console.error('ASSISTANT: FreeLLMAPI unreachable:', error instanceof Error ? error.message : error)
    await refund()
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  } finally {
    clearTimeout(timer)
  }
  if (!upstream.ok || !upstream.body) {
    console.error(`ASSISTANT: FreeLLMAPI answered HTTP ${upstream.status}:`, (await upstream.text().catch(() => '')).slice(0, 300))
    await refund()
    return NextResponse.json({ error: 'unavailable' }, { status: 503 })
  }

  // Re-emit only the text: the browser reads a plain text stream.
  const parse = createDeltaParser()
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const reader = upstream.body.getReader()
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await reader.read()
        const out = done ? { text: '', done: true } : parse(decoder.decode(value, { stream: true }))
        if (out.text) controller.enqueue(encoder.encode(out.text))
        if (done || out.done) controller.close()
      } catch (error) {
        // The answer broke off midway: the user keeps what arrived; the message stays counted.
        console.error('ASSISTANT: stream interrupted:', error instanceof Error ? error.message : error)
        controller.close()
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Assistant-Remaining': String(Math.max(0, c.limit - used)),
    },
  })
}

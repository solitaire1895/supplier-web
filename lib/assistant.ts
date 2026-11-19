// lib/assistant.ts
//
// Nexus AI assistant: plan limits, the Douala calendar day, the system prompt,
// and a parser for the OpenAI-style stream FreeLLMAPI sends back.
// No imports: shared by the API route and its test (node --test).

export const ASSISTANT_DAILY_LIMITS: Record<string, number> = {
  free: 5,
  explorateur: 30,
  importateur: 100,
  partenaire: 300,
}

export const dailyLimit = (plan: string | null | undefined) =>
  ASSISTANT_DAILY_LIMITS[plan ?? 'free'] ?? ASSISTANT_DAILY_LIMITS.free

/** Today's date (YYYY-MM-DD) in Douala: the counters reset at midnight there. */
export const doualaDay = (now: Date = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Douala' }).format(now)

export const MAX_MESSAGES = 20
export const MAX_MESSAGE_CHARS = 2000

export const SYSTEM_PROMPT = `You are Nexus AI, the assistant of Nexusply, a platform that helps entrepreneurs (mostly in French-speaking Africa) import products from China.

Help with: buying on Chinese platforms (1688, Taobao, Pinduoduo, Alibaba, Xianyu), opening accounts and paying (Alipay, agents), checking a supplier, samples and quality control, shipping and freight forwarders (air, sea, groupage), costs and resale margins, choosing products, and using Nexusply (supplier directory, winning products, profit calculator, trainings, support).

Rules:
- Reply in the language the user writes in (French, English or Chinese). Default to French.
- Be practical and concise: short steps, concrete examples, no filler.
- Never present a price, exchange rate, duty or delivery time as a guaranteed fact: give typical ranges and say they change.
- Never give legal or customs guarantees; for duties and regulations, tell the user to check with a licensed customs broker or the official authority.
- Never invent Nexusply suppliers, products, prices or features. To find suppliers, point the user to the Nexusply supplier directory and winning products pages.
- Ask the user not to share passwords, card numbers or other sensitive personal data.
- If a question has nothing to do with importing, e-commerce or Nexusply, say briefly that you can only help with those topics.`

/**
 * Splits an OpenAI-style server-sent-events stream into text deltas.
 * Feed it raw chunks; it keeps the incomplete last line between calls.
 */
export function createDeltaParser() {
  let buffer = ''
  return (chunk: string): { text: string; done: boolean } => {
    buffer += chunk
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    let text = ''
    let done = false
    for (const raw of lines) {
      const line = raw.trim()
      if (!line.startsWith('data:')) continue
      const data = line.slice(5).trim()
      if (data === '[DONE]') { done = true; continue }
      try {
        const delta = JSON.parse(data)?.choices?.[0]?.delta?.content
        if (typeof delta === 'string') text += delta
      } catch {
        // a keep-alive or a malformed line: skip it
      }
    }
    return { text, done }
  }
}

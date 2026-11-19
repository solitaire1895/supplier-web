// Run: node --test --experimental-strip-types lib/assistant.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createDeltaParser, dailyLimit, doualaDay } from './assistant.ts'

test('daily limits per plan, unknown plans fall back to free', () => {
  assert.equal(dailyLimit('free'), 5)
  assert.equal(dailyLimit('partenaire'), 300)
  assert.equal(dailyLimit(null), 5)
  assert.equal(dailyLimit('Free'), 5)
})

test('the day turns at midnight in Douala (UTC+1), not UTC', () => {
  assert.equal(doualaDay(new Date('2026-11-19T22:59:00Z')), '2026-11-19')
  assert.equal(doualaDay(new Date('2026-11-19T23:00:00Z')), '2026-11-20')
})

test('stream parser joins deltas across chunk boundaries and stops at [DONE]', () => {
  const parse = createDeltaParser()
  const a = parse('data: {"choices":[{"delta":{"content":"Bon"}}]}\n\ndata: {"choices":[{"de')
  const b = parse('lta":{"content":"jour"}}]}\n\n: keep-alive\n\ndata: [DONE]\n\n')
  assert.equal(a.text + b.text, 'Bonjour')
  assert.equal(a.done, false)
  assert.equal(b.done, true)
})

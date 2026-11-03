// lib/supabase/admin-queries.ts
//
// Data for the admin console. Server only, and only call it AFTER checking the
// caller is an admin (app/admin/page.tsx does): it uses the service role so it
// can read every account, payment and activity row, without the customer plan
// limits that getSuppliers()/getProducts() apply.

import 'server-only'
import { getSupabaseAdmin } from './admin'
import { SUPPLIER_WITH_CONTACTS, flattenContacts } from '@/lib/supplier-contacts'
import { isPaidPlan, isPlanExpired } from '@/lib/plans'

const DAY = 24 * 60 * 60 * 1000
const PLAN_RANK: Record<string, number> = { partenaire: 3, importateur: 2, explorateur: 1 }

export interface AdminUser {
  id: string
  email: string | null
  full_name: string | null
  role: string | null
  status: string | null
  active_plan: string | null
  subscription_status: string | null
  plan_expires_at: string | null
  created_at: string
  favorites_count: number
  /** Paid plan that has not expired. */
  is_paying: boolean
  /** Sum of paid plan payments, in XAF. */
  total_paid: number
  payments_count: number
  last_paid_at: string | null
  /** Latest of the last sign-in and the last tracked activity. */
  last_active_at: string | null
  searches_30d: number
  views_30d: number
}

export interface AdminStats {
  revenue30d: number
  revenuePrev30d: number
  revenueAllTime: number
  payingCount: number
  usersCount: number
  paymentsCount30d: number
}

/** XAF value of a payment: base_amount (migration 0017), else the amount when it is already XAF. */
function paymentValue(p: { base_amount: number | string | null; amount: number | string; currency: string }) {
  if (p.base_amount !== null && p.base_amount !== undefined) return Number(p.base_amount)
  return p.currency?.toUpperCase() === 'XAF' ? Number(p.amount) : 0
}

/** Paying customers first (highest plan, then most recent payment), then everyone else, newest first. */
export function sortUsersPayingFirst<T extends Pick<AdminUser, 'is_paying' | 'active_plan' | 'last_paid_at' | 'created_at'>>(users: T[]) {
  return [...users].sort((a, b) => {
    if (a.is_paying !== b.is_paying) return a.is_paying ? -1 : 1
    if (a.is_paying) {
      const rank = (PLAN_RANK[b.active_plan ?? ''] ?? 0) - (PLAN_RANK[a.active_plan ?? ''] ?? 0)
      if (rank) return rank
      return (b.last_paid_at ?? '').localeCompare(a.last_paid_at ?? '')
    }
    return (b.created_at ?? '').localeCompare(a.created_at ?? '')
  })
}

export async function getAdminData() {
  const db = getSupabaseAdmin()
  if (!db) {
    console.error('ADMIN: SUPABASE_SERVICE_ROLE_KEY missing')
    return { suppliers: [], products: [], users: [] as AdminUser[], stats: null as AdminStats | null }
  }

  const since30 = new Date(Date.now() - 30 * DAY).toISOString()
  const since60 = new Date(Date.now() - 60 * DAY).toISOString()

  const [suppliersRes, productsRes, profilesRes, paymentsRes, activityRes, authUsers] = await Promise.all([
    db.from('suppliers').select(SUPPLIER_WITH_CONTACTS).order('created_at', { ascending: false }),
    db.from('products').select('*').order('created_at', { ascending: false }),
    db.from('profiles').select('*, favorites_count:user_favorites(count)').order('created_at', { ascending: false }),
    db.from('plan_payments').select('user_id, amount, currency, base_amount, paid_at').eq('status', 'paid'),
    db.from('user_activity').select('user_id, activity_type, created_at').gte('created_at', since30).limit(50_000),
    listAllAuthUsers(db),
  ])

  for (const [name, res] of [['suppliers', suppliersRes], ['products', productsRes], ['profiles', profilesRes], ['payments', paymentsRes], ['activity', activityRes]] as const) {
    if (res.error) console.error(`ADMIN: ${name} fetch failed:`, res.error.message)
  }

  // Payments per user, and revenue windows.
  const paid = new Map<string, { total: number; count: number; last: string | null }>()
  let revenue30d = 0
  let revenuePrev30d = 0
  let revenueAllTime = 0
  let paymentsCount30d = 0
  for (const p of paymentsRes.data ?? []) {
    const value = paymentValue(p)
    revenueAllTime += value
    if (p.paid_at && p.paid_at >= since30) {
      revenue30d += value
      paymentsCount30d++
    } else if (p.paid_at && p.paid_at >= since60) {
      revenuePrev30d += value
    }
    const entry = paid.get(p.user_id) ?? { total: 0, count: 0, last: null }
    entry.total += value
    entry.count++
    if (p.paid_at && (!entry.last || p.paid_at > entry.last)) entry.last = p.paid_at
    paid.set(p.user_id, entry)
  }

  // Activity in the last 30 days.
  const activity = new Map<string, { searches: number; views: number; last: string | null }>()
  for (const a of activityRes.data ?? []) {
    const entry = activity.get(a.user_id) ?? { searches: 0, views: 0, last: null }
    if (a.activity_type === 'search') entry.searches++
    else entry.views++
    if (!entry.last || a.created_at > entry.last) entry.last = a.created_at
    activity.set(a.user_id, entry)
  }

  const users: AdminUser[] = (profilesRes.data ?? []).map((u) => {
    const payment = paid.get(u.id)
    const act = activity.get(u.id)
    const signIn = authUsers.get(u.id) ?? null
    const lastActive = [signIn, act?.last ?? null].filter(Boolean).sort().at(-1) ?? null
    return {
      id: u.id,
      email: u.email ?? null,
      full_name: u.full_name ?? null,
      role: u.role ?? null,
      status: u.status ?? null,
      active_plan: u.active_plan ?? null,
      subscription_status: u.subscription_status ?? null,
      plan_expires_at: u.plan_expires_at ?? null,
      created_at: u.created_at,
      favorites_count: u.favorites_count?.[0]?.count ?? 0,
      is_paying: isPaidPlan(u.active_plan) && !isPlanExpired(u),
      total_paid: payment?.total ?? 0,
      payments_count: payment?.count ?? 0,
      last_paid_at: payment?.last ?? null,
      last_active_at: lastActive,
      searches_30d: act?.searches ?? 0,
      views_30d: act?.views ?? 0,
    }
  })

  const stats: AdminStats = {
    revenue30d,
    revenuePrev30d,
    revenueAllTime,
    payingCount: users.filter((u) => u.is_paying).length,
    usersCount: users.length,
    paymentsCount30d,
  }

  return {
    suppliers: (suppliersRes.data ?? []).map(flattenContacts),
    products: productsRes.data ?? [],
    users: sortUsersPayingFirst(users),
    stats,
  }
}

/** id -> last_sign_in_at for every auth user (paged). */
async function listAllAuthUsers(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>) {
  const map = new Map<string, string | null>()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      console.error('ADMIN: listUsers failed:', error.message)
      break
    }
    for (const u of data.users) map.set(u.id, u.last_sign_in_at ?? null)
    if (data.users.length < 1000) break
  }
  return map
}

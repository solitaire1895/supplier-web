// Supplier direct contacts live in public.supplier_contacts (migration 0019).
// RLS only returns that row to Partner accounts with a live plan and to admins,
// so embedding it is safe for every caller: everyone else gets null.

export const CONTACT_FIELDS = ['whatsapp', 'wechat', 'private_email'] as const
export type ContactField = (typeof CONTACT_FIELDS)[number]

/** `select()` string for a supplier row plus its (RLS-filtered) contacts. */
export const SUPPLIER_WITH_CONTACTS = '*, supplier_contacts(whatsapp, wechat, private_email)'

type Row = Record<string, unknown> & { supplier_contacts?: unknown }

/** Lifts the embedded contacts onto the supplier, keeping the old flat shape. */
export function flattenContacts<T extends Row>(row: T): T {
  if (!row) return row
  const embedded = row.supplier_contacts
  const contacts = (Array.isArray(embedded) ? embedded[0] : embedded) as Partial<Record<ContactField, string | null>> | null
  const { supplier_contacts: _omit, ...rest } = row
  void _omit
  return {
    ...rest,
    whatsapp: contacts?.whatsapp ?? null,
    wechat: contacts?.wechat ?? null,
    private_email: contacts?.private_email ?? null,
  } as unknown as T
}

/** Splits admin form data into the supplier row and its contact row. */
export function splitSupplierForm(form: Record<string, unknown>) {
  const row: Record<string, unknown> = {}
  const contacts: Partial<Record<ContactField, string | null>> = {}
  let hasContacts = false
  for (const [key, value] of Object.entries(form ?? {})) {
    if ((CONTACT_FIELDS as readonly string[]).includes(key)) {
      contacts[key as ContactField] = typeof value === 'string' && value.trim() ? value.trim() : null
      hasContacts = true
    } else if (!['id', 'created_at', 'search_vector', 'supplier_contacts'].includes(key)) {
      row[key] = value
    }
  }
  return { row, contacts, hasContacts }
}

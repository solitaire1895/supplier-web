import { createClient } from './server'
import { cache } from 'react'
import { getPlanFeatures } from '../plans'

// ---------------------------------------------------------------------------
// Cached per-request auth helpers — avoids redundant round-trips when multiple
// query functions are called in the same React Server Component render.
// ---------------------------------------------------------------------------

const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

const getCachedPlan = cache(async () => {
  const user = await getCachedUser()
  if (!user) return null
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('active_plan')
    .eq('id', user.id)
    .maybeSingle()
  return profile?.active_plan ?? null
})

// ---------------------------------------------------------------------------

export const getSuppliers = cache(async () => {
  const supabase = await createClient()

  // Determine the current user's plan to enforce supplier limits server-side.
  const plan = await getCachedPlan()
  const supplierLimit: number | 'unlimited' = getPlanFeatures(plan).access.supplierLimit

  let query = supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (supplierLimit !== 'unlimited') {
    query = query.limit(supplierLimit as number)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data
})

export const getProducts = cache(async () => {
  const supabase = await createClient()

  // Block winning products entirely for plans with a 0 limit (free/trial).
  const plan = await getCachedPlan()

  if (getPlanFeatures(plan).winningProducts.limit === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching products:', error)
    return []
  }

  return data
})

export const getReviews = cache(async (type: 'product' | 'supplier', id: string) => {
  const supabase = await createClient()
  const column = type === 'product' ? 'product_id' : 'supplier_id'

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      profiles (
        email,
        full_name
      )
    `)
    .eq(column, id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching reviews for ${type}:`, error)
    return []
  }

  return data
})

export const getFavoriteSuppliers = cache(async () => {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      suppliers (*)
    `)
    .eq('user_id', user.id)
    .not('supplier_id', 'is', null)

  if (error) {
    console.error('Error fetching favorite suppliers:', error)
    return []
  }

  return data.map(item => item.suppliers).filter(Boolean)
})

export const getFavoriteProducts = cache(async () => {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('user_favorites')
    .select(`
      products (*)
    `)
    .eq('user_id', user.id)
    .not('product_id', 'is', null)

  if (error) {
    console.error('Error fetching favorite products:', error)
    return []
  }

  return data.map(item => item.products).filter(Boolean)
})

export const getUsers = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      favorites_count:user_favorites(count)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return []
  }

  // Supabase count returns an array of objects like [{count: 5}] due to the way it handles joins
  return data.map(user => ({
    ...user,
    favorites_count: user.favorites_count?.[0]?.count || 0
  }))
})

export const getStats = cache(async () => {
  const supabase = await createClient()
  
  const [suppliersCount, productsCount, favoritesCount] = await Promise.all([
    supabase.from('suppliers').select('*', { count: 'exact', head: true }),
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('user_favorites').select('*', { count: 'exact', head: true }),
  ])

  return {
    suppliers: suppliersCount.count || 0,
    products: productsCount.count || 0,
    favorites: favoritesCount.count || 0,
  }
})

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  const user = await getCachedUser()
  
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
})

export const searchProducts = cache(async (query: string) => {
  const supabase = await createClient()

  // Block winning products entirely for plans with a 0 limit (free/trial).
  const plan = await getCachedPlan()

  if (getPlanFeatures(plan).winningProducts.limit === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error searching products:', error)
    return []
  }

  return data
})

export const searchSuppliers = cache(async (query: string) => {
  const supabase = await createClient()

  // Determine the current user's plan to enforce supplier limits server-side.
  const plan = await getCachedPlan()
  const supplierLimit: number | 'unlimited' = getPlanFeatures(plan).access.supplierLimit

  let query_ = supabase
    .from('suppliers')
    .select('*')
    .textSearch('search_vector', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })

  if (supplierLimit !== 'unlimited') {
    query_ = query_.limit(supplierLimit as number)
  }

  const { data, error } = await query_

  if (error) {
    console.error('Error searching suppliers:', error)
    return []
  }

  return data
})

export const trackActivity = async (type: 'view_product' | 'view_supplier' | 'search', targetId?: string, metaData?: any) => {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return

  const { error } = await supabase
    .from('user_activity')
    .insert({
      user_id: user.id,
      activity_type: type,
      target_id: targetId,
      meta_data: metaData
    })

  if (error) console.error('Error tracking activity:', error)
}

export const getRecommendedProducts = cache(async (limit: number = 4) => {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_recommended_products', {
      p_user_id: user.id,
      p_limit: limit
    })

  if (error) {
    // PGRST202 = function not found in schema cache — quietly return empty
    // until the migration 0013_recommendation_functions.sql is run.
    if (error.code !== 'PGRST202') {
      console.error('Error getting recommended products:', error)
    }
    return []
  }

  return data
})

export const getRecommendedSuppliers = cache(async (limit: number = 4) => {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_recommended_suppliers', {
      p_user_id: user.id,
      p_limit: limit
    })

  if (error) {
    if (error.code !== 'PGRST202') {
      console.error('Error getting recommended suppliers:', error)
    }
    return []
  }

  return data
})

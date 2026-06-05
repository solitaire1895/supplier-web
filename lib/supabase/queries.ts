import { createClient } from './server'
import { cache } from 'react'

export const getSuppliers = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching suppliers:', error)
    return []
  }

  return data
})

export const getProducts = cache(async () => {
  const supabase = await createClient()
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

export const getFavoriteSuppliers = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
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
  const { data: { user } } = await supabase.auth.getUser()
  
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

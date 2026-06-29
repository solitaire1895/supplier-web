'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'
import { getPlanFeatures } from '@/lib/plans'

/* ================= STORAGE ACTIONS ================= */

export async function uploadImage(file: File, path: string) {
  const supabase = await createClient()
  
  // 1. Verify Authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    console.error('Upload authentication error:', authError)
    return { error: 'You must be logged in to upload images.' }
  }

  // 2. Verify Admin Status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Unauthorized: Only admins can upload images.' }
  }
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
  const filePath = `${path}/${fileName}`

  // 3. Perform Upload
  const { data, error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Supabase storage upload error:', error)
    return { error: error.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath)

  return { success: true, url: publicUrl }
}

/* ================= SUPPLIERS ACTIONS ================= */

export async function addSupplier(formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').insert([formData])

  if (error) {
    console.error('Error adding supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSupplier(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').update(formData).eq('id', id)

  if (error) {
    console.error('Error updating supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateSuppliersBulk(ids: string[], formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').update(formData).in('id', ids)

  if (error) {
    console.error('Error updating suppliers bulk:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('suppliers').delete().eq('id', id)

  if (error) {
    console.error('Error deleting supplier:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard')
  return { success: true }
}

/* ================= PRODUCTS ACTIONS ================= */

export async function addProduct(formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').insert([formData])

  if (error) {
    console.error('Error adding product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard/winning-products')
  return { success: true }
}

export async function updateProduct(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update(formData).eq('id', id)

  if (error) {
    console.error('Error updating product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard/winning-products')
  return { success: true }
}

export async function updateProductsBulk(ids: string[], formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update(formData).in('id', ids)

  if (error) {
    console.error('Error updating products bulk:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard/winning-products')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) {
    console.error('Error deleting product:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  revalidatePath('/dashboard/winning-products')
  return { success: true }
}

/* ================= USERS ACTIONS ================= */

export async function updateUser(id: string, formData: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update(formData).eq('id', id)

  if (error) {
    console.error('Error updating user:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function deleteUser(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').delete().eq('id', id)

  if (error) {
    console.error('Error deleting user:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function suspendUser(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({ status: 'suspended' }).eq('id', id)

  if (error) {
    console.error('Error suspending user:', error)
    return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

/* ================= FAVORITES ACTIONS ================= */

export async function toggleFavorite(type: 'product' | 'supplier', id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const column = type === 'product' ? 'product_id' : 'supplier_id'

  // Check if already favorite
  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq(column, id)
    .single()

  if (existing) {
    // Remove from favorites
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    // Add to favorites
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        [column]: id
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

/* ================= REVIEWS ACTIONS ================= */

export async function submitReview(data: { 
  type: 'product' | 'supplier', 
  id: string, 
  rating: number, 
  content: string 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const column = data.type === 'product' ? 'product_id' : 'supplier_id'

  const { error } = await supabase.from('reviews').insert({
    user_id: user.id,
    [column]: data.id,
    rating: data.rating,
    content: data.content
  })

  if (error) {
    console.error('Error submitting review:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/${data.type}s/${data.id}`)
  return { success: true }
}

/* ================= SOURCING ACTIONS ================= */

export async function recordSourcingRequest(data: { 
  supplier_id: string, 
  product_id?: string,
  notes?: string 
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  // Check if request already exists to avoid duplicates in the feed (optional logic)
  const { error } = await supabase.from('sourcing_requests').insert({
    user_id: user.id,
    supplier_id: data.supplier_id,
    product_id: data.product_id,
    notes: data.notes
  })

  if (error) {
    console.error('Error recording sourcing request:', error)
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

/* ================= PLAN-AWARE SEARCH ================= */

export async function searchAction(rawTerm: string): Promise<{ products: any[]; suppliers: any[] }> {
  const term = (rawTerm || '').trim()
  if (term.length < 2) {
    return { products: [], suppliers: [] }
  }

  const supabase = await createClient()

  // Resolve the current user's plan. Anonymous / unauthenticated users get 'free'.
  const { data: { user } } = await supabase.auth.getUser()

  let plan = 'free'
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('active_plan')
      .eq('id', user.id)
      .single()
    plan = profileData?.active_plan || 'free'
  }

  const features = getPlanFeatures(plan)

  // Escape LIKE wildcards so user input can't break the pattern.
  const safe = term.replace(/[%_\\]/g, (m) => `\\${m}`)
  const pattern = `%${safe}%`

  // ---- PRODUCTS (winning products) ----------------------------------------
  let products: any[] = []
  const productLimit = features.winningProducts.limit

  // Only query products at all if the plan grants at least some access.
  const canSeeProducts =
    productLimit === 'unlimited' ||
    (typeof productLimit === 'number' && productLimit > 0)

  if (canSeeProducts) {
    let pq = supabase
      .from('products')
      .select('id, name, category, created_at')
      .or(`name.ilike.${pattern},category.ilike.${pattern}`)

    // Enforce the publish delay: hide products newer than `delay` hours.
    if (features.winningProducts.delay > 0) {
      const cutoff = new Date(
        Date.now() - features.winningProducts.delay * 3600 * 1000
      ).toISOString()
      pq = pq.lte('created_at', cutoff)
    }

    pq = pq.order('created_at', { ascending: false })

    // Honour the numeric product limit; cap suggestions at 5 for unlimited plans.
    if (productLimit !== 'unlimited' && typeof productLimit === 'number') {
      pq = pq.limit(productLimit)
    } else {
      pq = pq.limit(5)
    }

    const { data, error } = await pq
    if (error) console.error('searchAction products error:', error)
    products = data || []
  }

  // ---- SUPPLIERS -----------------------------------------------------------
  const supplierLimit = features.access.supplierLimit

  let sq = supabase
    .from('suppliers')
    .select('id, name, category')
    .or(`name.ilike.${pattern},category.ilike.${pattern}`)

  // Cap suggestions at 5 for unlimited plans; honour numeric limits otherwise.
  if (supplierLimit !== 'unlimited' && typeof supplierLimit === 'number') {
    sq = sq.limit(supplierLimit)
  } else {
    sq = sq.limit(5)
  }

  const { data: supData, error: supErr } = await sq
  if (supErr) console.error('searchAction suppliers error:', supErr)
  const suppliers = supData || []

  return { products, suppliers }
}

/* ================= ACTIVITY ACTIONS ================= */

export async function trackActivityAction(type: 'view_product' | 'view_supplier' | 'search', targetId?: string, metaData?: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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

export async function getRecommendedProductsAction(limit: number = 4) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_recommended_products', {
      p_user_id: user.id,
      p_limit: limit
    })

  if (error) {
    console.error('Error getting recommended products:', error)
    return []
  }

  return data
}

export async function getRecommendedSuppliersAction(limit: number = 4) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .rpc('get_recommended_suppliers', {
      p_user_id: user.id,
      p_limit: limit
    })

  if (error) {
    console.error('Error getting recommended suppliers:', error)
    return []
  }

  return data
}

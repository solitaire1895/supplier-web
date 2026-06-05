'use server'

import { createClient } from './server'
import { revalidatePath } from 'next/cache'

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

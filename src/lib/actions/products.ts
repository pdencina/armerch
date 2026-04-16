'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth/get-current-profile'

type ProductInput = {
  name: string
  description?: string
  price: number
  sku?: string
  category_id?: string | null
  image_url?: string | null
  active: boolean
}

type CampusStockInput = {
  campus_id: string
  stock: number
  low_stock_alert?: number
}

type UpsertProductWithInventoryInput = {
  id?: string
  product: ProductInput
  campusStocks: CampusStockInput[]
}

export async function upsertProductWithInventory(
  input: UpsertProductWithInventoryInput
) {
  const supabase = await createClient()

  const profileResult = await getCurrentProfile()
  if ('error' in profileResult) {
    return { error: profileResult.error }
  }

  const profile = profileResult.data

  if (!['super_admin', 'admin'].includes(profile.role)) {
    return { error: 'No autorizado para crear o editar productos' }
  }

  if (!input.product.name?.trim()) {
    return { error: 'El nombre es obligatorio' }
  }

  if (Number(input.product.price) < 0) {
    return { error: 'El precio no puede ser negativo' }
  }

  if (!input.campusStocks.length) {
    return { error: 'Debes seleccionar al menos un campus' }
  }

  const normalizedCampusStocks = input.campusStocks.map((item) => ({
    campus_id: item.campus_id,
    stock: Number(item.stock ?? 0),
    low_stock_alert: Number(item.low_stock_alert ?? 5),
  }))

  for (const item of normalizedCampusStocks) {
    if (item.stock < 0) {
      return { error: 'El stock inicial no puede ser negativo' }
    }
    if (!item.campus_id) {
      return { error: 'Hay un campus inválido en la configuración' }
    }
  }

  let productId = input.id

  if (input.id) {
    const { error: updateError } = await supabase
      .from('products')
      .update({
        name: input.product.name,
        description: input.product.description ?? null,
        price: input.product.price,
        sku: input.product.sku ?? null,
        category_id: input.product.category_id ?? null,
        image_url: input.product.image_url ?? null,
        active: input.product.active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)

    if (updateError) {
      return { error: updateError.message }
    }
  } else {
    const { data: createdProduct, error: insertError } = await supabase
      .from('products')
      .insert({
        name: input.product.name,
        description: input.product.description ?? null,
        price: input.product.price,
        sku: input.product.sku ?? null,
        category_id: input.product.category_id ?? null,
        image_url: input.product.image_url ?? null,
        active: input.product.active,
      })
      .select('id')
      .single()

    if (insertError || !createdProduct) {
      return { error: insertError?.message ?? 'No se pudo crear el producto' }
    }

    productId = createdProduct.id
  }

  if (!productId) {
    return { error: 'No se pudo resolver el producto' }
  }

  const inventoryRows = normalizedCampusStocks.map((item) => ({
    product_id: productId,
    campus_id: item.campus_id,
    stock: item.stock,
    low_stock_alert: item.low_stock_alert,
    updated_by: profile.id,
    updated_at: new Date().toISOString(),
  }))

  const { error: inventoryError } = await supabase
    .from('inventory')
    .upsert(inventoryRows, {
      onConflict: 'product_id,campus_id',
    })

  if (inventoryError) {
    return { error: inventoryError.message }
  }

  const movementRows = !input.id
    ? normalizedCampusStocks
        .filter((item) => item.stock > 0)
        .map((item) => ({
          product_id: productId,
          campus_id: item.campus_id,
          type: 'entrada',
          quantity: item.stock,
          notes: 'Stock inicial al crear producto',
          created_by: profile.id,
        }))
    : []

  if (movementRows.length > 0) {
    const { error: movementsError } = await supabase
      .from('inventory_movements')
      .insert(movementRows)

    if (movementsError) {
      return { error: movementsError.message }
    }
  }

  revalidatePath('/products')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return {
    success: true,
    productId,
  }
}

export async function assignProductToCampus(input: {
  product_id: string
  campus_id: string
  stock: number
  low_stock_alert?: number
}) {
  const supabase = await createClient()

  const profileResult = await getCurrentProfile()
  if ('error' in profileResult) {
    return { error: profileResult.error }
  }

  const profile = profileResult.data

  if (profile.role !== 'super_admin') {
    return { error: 'Solo el super admin puede asignar productos a otros campus' }
  }

  if (!input.product_id || !input.campus_id) {
    return { error: 'Producto o campus inválido' }
  }

  const stock = Number(input.stock)
  const lowStockAlert = Number(input.low_stock_alert ?? 5)

  if (stock < 0) {
    return { error: 'El stock no puede ser negativo' }
  }

  const { data: existingInventory, error: existingError } = await supabase
    .from('inventory')
    .select('id')
    .eq('product_id', input.product_id)
    .eq('campus_id', input.campus_id)
    .maybeSingle()

  if (existingError) {
    return { error: existingError.message }
  }

  if (existingInventory) {
    return { error: 'Este producto ya existe en el campus seleccionado' }
  }

  const { error: inventoryError } = await supabase
    .from('inventory')
    .insert({
      product_id: input.product_id,
      campus_id: input.campus_id,
      stock,
      low_stock_alert: lowStockAlert,
      updated_by: profile.id,
      updated_at: new Date().toISOString(),
    })

  if (inventoryError) {
    return { error: inventoryError.message }
  }

  if (stock > 0) {
    const { error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        product_id: input.product_id,
        campus_id: input.campus_id,
        type: 'entrada',
        quantity: stock,
        notes: 'Asignación inicial de producto a campus',
        created_by: profile.id,
      })

    if (movementError) {
      return { error: movementError.message }
    }
  }

  revalidatePath('/products')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true }
}
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface OrderItem {
  product_id: string
  quantity: number
  unit_price: number
}

interface CreateOrderInput {
  items: OrderItem[]
  payment_method: 'efectivo' | 'transferencia' | 'debito' | 'credito'
  discount?: number
  notes?: string
}

export async function createOrder(input: CreateOrderInput) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const subtotal = input.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
  const discount = input.discount ?? 0
  const total = subtotal - discount

  // 1. Crear la orden
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      seller_id: user.id,
      payment_method: input.payment_method,
      subtotal,
      discount,
      total,
      notes: input.notes ?? null,
      status: 'pendiente',
    })
    .select()
    .single()

  if (orderError) return { error: orderError.message }

  // 2. Insertar items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(input.items.map(i => ({ ...i, order_id: order.id })))

  if (itemsError) return { error: itemsError.message }

  // 3. Completar la orden (esto dispara el trigger de descuento de stock)
  const { error: completeError } = await supabase
    .from('orders')
    .update({ status: 'completada' })
    .eq('id', order.id)

  if (completeError) return { error: completeError.message }

  revalidatePath('/pos')
  revalidatePath('/orders')
  revalidatePath('/inventory')
  revalidatePath('/dashboard')

  return { success: true, orderId: order.id, orderNumber: order.order_number }
}

export async function getOrders() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      seller:profiles(full_name, email),
      order_items(
        *,
        product:products(name, sku)
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data }
}

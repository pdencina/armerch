import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ⚠️ usa service role SOLO en backend
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      items,
      total,
      payment_method,
      campus_id,
      client_name,
      client_email,
    } = body

    // 🔒 validación básica
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Sin productos' }, { status: 400 })
    }

    // 🧾 crear orden
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        total,
        payment_method,
        campus_id,
        client_name,
        client_email,
        status: 'paid', // ✅ CLAVE: venta confirmada
      })
      .select()
      .single()

    if (orderError) {
      console.error(orderError)
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // 📦 insertar items
    const orderItems = items.map((item: any) => ({
      order_id: order.id,
      product_id: item.id,
      quantity: item.quantity,
      price: item.price,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error(itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // 📉 actualizar stock
    for (const item of items) {
      const { data: stockData, error: stockFetchError } = await supabase
        .from('inventory')
        .select('stock')
        .eq('product_id', item.id)
        .eq('campus_id', campus_id)
        .single()

      if (stockFetchError) {
        console.error(stockFetchError)
        continue
      }

      const newStock = (stockData?.stock || 0) - item.quantity

      const { error: stockUpdateError } = await supabase
        .from('inventory')
        .update({ stock: newStock })
        .eq('product_id', item.id)
        .eq('campus_id', campus_id)

      if (stockUpdateError) {
        console.error(stockUpdateError)
      }
    }

    return NextResponse.json({ success: true, order })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// SumUp envía: { event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout-uuid" }
// Hay que consultar GET /v0.1/checkouts/{id} para obtener status real

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[SumUp Webhook] RAW body:', JSON.stringify(body))

    const { event_type, id: checkout_id } = body

    // Ignorar eventos que no sean cambios de estado
    if (event_type !== 'CHECKOUT_STATUS_CHANGED' || !checkout_id) {
      return NextResponse.json({ received: true, action: 'ignored' })
    }

    const apiKey = process.env.SUMUP_API_KEY
    if (!apiKey) {
      console.error('[SumUp Webhook] SUMUP_API_KEY not configured')
      return NextResponse.json({ error: 'API key missing' }, { status: 500 })
    }

    // Consultar el estado real del checkout a SumUp
    const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    console.log('[SumUp Webhook] Fetch status:', checkoutRes.status)

    if (!checkoutRes.ok) {
      const errBody = await checkoutRes.text()
      console.error('[SumUp Webhook] Failed to fetch checkout:', checkout_id, errBody)
      return NextResponse.json({ error: 'Failed to fetch checkout' }, { status: 500 })
    }

    const checkout = await checkoutRes.json()
    console.log('[SumUp Webhook] Checkout data:', JSON.stringify(checkout))

    const { status, checkout_reference, transactions } = checkout
    const transaction_code = transactions?.[0]?.transaction_code ?? ''

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Buscar la orden por checkout_reference en notes
    const { data: order } = await adminClient
      .from('orders')
      .select('id, order_number, campus_id, status, order_items(product_id, quantity, size)')
      .ilike('notes', `%${checkout_reference}%`)
      .maybeSingle()

    if (!order) {
      console.error('[SumUp Webhook] Order not found for reference:', checkout_reference)
      return NextResponse.json({ received: true, action: 'order_not_found' })
    }

    // Evitar duplicados
    if (order.status === 'paid' || order.status === 'cancelled') {
      console.log('[SumUp Webhook] Already processed:', order.order_number, order.status)
      return NextResponse.json({ received: true, action: 'already_processed' })
    }

    // ── PAGO ACEPTADO ─────────────────────────────────────────────────────────
    if (status === 'PAID') {
      await adminClient
        .from('orders')
        .update({
          status: 'paid',
          notes:  `Pagado via SumUp | Ref: ${checkout_reference} | TXN: ${transaction_code}`,
        })
        .eq('id', order.id)

      for (const item of (order.order_items ?? [])) {
        await adminClient
          .from('inventory_movements')
          .insert({
            product_id: item.product_id,
            campus_id:  order.campus_id,
            type:       'salida',
            quantity:   item.quantity,
            notes:      `Pago link SumUp - Orden #${order.order_number}`,
          })
      }

      console.log('[SumUp Webhook] ✅ Order PAID:', order.order_number)
      return NextResponse.json({ received: true, action: 'paid' })
    }

    // ── PAGO FALLIDO / CANCELADO / EXPIRADO ───────────────────────────────────
    if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
      await adminClient
        .from('orders')
        .update({
          status: 'cancelled',
          notes:  `Pago ${status.toLowerCase()} via SumUp | Ref: ${checkout_reference}`,
        })
        .eq('id', order.id)

      console.log('[SumUp Webhook] ❌ Order', status, ':', order.order_number)
      return NextResponse.json({ received: true, action: status.toLowerCase() })
    }

    console.log('[SumUp Webhook] Status ignored:', status)
    return NextResponse.json({ received: true, action: 'ignored', status })

  } catch (error: any) {
    console.error('[SumUp Webhook] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
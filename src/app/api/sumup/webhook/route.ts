import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/sumup/webhook ──────────────────────────────────────────────────
// SumUp envía: { event_type: "CHECKOUT_STATUS_CHANGED", id: "checkout-id" }
// Hay que consultar la API de SumUp para obtener el estado real del checkout.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[SumUp Webhook] Received:', JSON.stringify(body))

    const { event_type, id: checkout_id } = body

    // Solo procesar cambios de estado de checkout
    if (event_type !== 'CHECKOUT_STATUS_CHANGED' || !checkout_id) {
      return NextResponse.json({ received: true, action: 'ignored' })
    }

    // ── Consultar el estado real del checkout a SumUp ─────────────────────────
    const apiKey = process.env.SUMUP_API_KEY
    if (!apiKey) {
      console.error('[SumUp Webhook] SUMUP_API_KEY not configured')
      return NextResponse.json({ error: 'API key missing' }, { status: 500 })
    }

    const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!checkoutRes.ok) {
      console.error('[SumUp Webhook] Failed to fetch checkout:', checkout_id)
      return NextResponse.json({ error: 'Failed to fetch checkout' }, { status: 500 })
    }

    const checkout = await checkoutRes.json()
    const { status, checkout_reference, transactions } = checkout
    const transaction_code = transactions?.[0]?.transaction_code ?? ''

    console.log('[SumUp Webhook] Checkout status:', checkout_id, status, checkout_reference)

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
          notes: `Pagado via SumUp | Ref: ${checkout_reference} | TXN: ${transaction_code}`,
        })
        .eq('id', order.id)

      // Descontar stock
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
      return NextResponse.json({ received: true, action: 'paid', order_number: order.order_number })
    }

    // ── PAGO FALLIDO O CANCELADO ──────────────────────────────────────────────
    if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') {
      await adminClient
        .from('orders')
        .update({
          status: 'cancelled',
          notes: `Pago ${status.toLowerCase()} via SumUp | Ref: ${checkout_reference}`,
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

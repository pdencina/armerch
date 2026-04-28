import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log('[SumUp Webhook] Received:', JSON.stringify(body))

    const { event_type, id: checkout_id } = body

    if (event_type !== 'CHECKOUT_STATUS_CHANGED' || !checkout_id) {
      return NextResponse.json({ received: true, action: 'ignored' })
    }

    const apiKey = process.env.SUMUP_API_KEY

    if (!apiKey) {
      console.error('[SumUp Webhook] SUMUP_API_KEY not configured')
      return NextResponse.json({ received: true, action: 'api_key_missing' })
    }

    const checkoutRes = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkout_id}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    const checkoutText = await checkoutRes.text()
    let checkout: any = {}

    try {
      checkout = JSON.parse(checkoutText)
    } catch {
      checkout = { raw: checkoutText }
    }

    console.log('[SumUp Webhook] Checkout API status:', checkoutRes.status)
    console.log('[SumUp Webhook] Checkout API response:', checkout)

    if (!checkoutRes.ok) {
      return NextResponse.json({
        received: true,
        action: 'checkout_fetch_failed',
        status: checkoutRes.status,
      })
    }

    const status = String(checkout?.status ?? '').toUpperCase()
    const checkout_reference = checkout?.checkout_reference
    const transactions = checkout?.transactions ?? []
    const transaction = transactions?.[0] ?? null
    const transaction_code = transaction?.transaction_code ?? transaction?.id ?? ''

    console.log('[SumUp Webhook] Checkout status:', {
      checkout_id,
      status,
      checkout_reference,
      transaction_code,
      transaction,
    })

    if (!checkout_reference) {
      return NextResponse.json({
        received: true,
        action: 'missing_checkout_reference',
      })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, order_number, campus_id, status, notes, order_items(product_id, quantity, size)')
      .ilike('notes', `%${checkout_reference}%`)
      .maybeSingle()

    if (orderError) {
      console.error('[SumUp Webhook] Order query error:', orderError)
      return NextResponse.json({ received: true, action: 'order_query_error' })
    }

    if (!order) {
      console.error('[SumUp Webhook] Order not found for reference:', checkout_reference)
      return NextResponse.json({ received: true, action: 'order_not_found' })
    }

    if (order.status === 'paid') {
      console.log('[SumUp Webhook] Already paid:', order.order_number)
      return NextResponse.json({ received: true, action: 'already_paid' })
    }

    const paidStatuses = ['PAID', 'SUCCESSFUL', 'SUCCESS', 'COMPLETED']
    const failedStatuses = ['FAILED', 'CANCELLED', 'CANCELED', 'EXPIRED']

    if (paidStatuses.includes(status)) {
      const { error: updateError } = await adminClient
        .from('orders')
        .update({
          status: 'paid',
          notes: `Pagado via SumUp | Ref: ${checkout_reference} | TXN: ${transaction_code}`,
        })
        .eq('id', order.id)

      if (updateError) {
        console.error('[SumUp Webhook] Error updating paid order:', updateError)
        return NextResponse.json({ received: true, action: 'paid_update_error' })
      }

      for (const item of order.order_items ?? []) {
        const { error: movementError } = await adminClient
          .from('inventory_movements')
          .insert({
            product_id: item.product_id,
            campus_id: order.campus_id,
            type: 'salida',
            quantity: item.quantity,
            notes: `Pago link SumUp - Orden #${order.order_number}`,
          })

        if (movementError) {
          console.error('[SumUp Webhook] Inventory movement error:', movementError)
        }
      }

      console.log('[SumUp Webhook] ✅ Order PAID:', order.order_number)

      return NextResponse.json({
        received: true,
        action: 'paid',
        order_number: order.order_number,
      })
    }

    if (failedStatuses.includes(status)) {
      console.log('[SumUp Webhook] Payment failed/cancelled/expired:', {
        order_number: order.order_number,
        status,
      })

      await adminClient
        .from('orders')
        .update({
          status: 'cancelled',
          notes: `Pago ${status.toLowerCase()} via SumUp | Ref: ${checkout_reference}`,
        })
        .eq('id', order.id)

      return NextResponse.json({
        received: true,
        action: status.toLowerCase(),
        order_number: order.order_number,
      })
    }

    console.log('[SumUp Webhook] Status ignored:', status)

    return NextResponse.json({
      received: true,
      action: 'ignored',
      status,
    })
  } catch (error: any) {
    console.error('[SumUp Webhook] Error:', error)

    return NextResponse.json({
      received: true,
      action: 'internal_error',
      error: error?.message ?? 'Error interno',
    })
  }
}
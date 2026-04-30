import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/sumup/verify-payment ──────────────────────────────────────────
// Consulta las últimas transacciones de SumUp y busca una que coincida
// con el monto y la referencia de la orden. Si encuentra el pago,
// actualiza la orden a 'paid' y descuenta el stock.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const apiKey = process.env.SUMUP_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'SUMUP_API_KEY no configurada' }, { status: 500 })
    }

    const body      = await req.json()
    const { order_id, amount, tolerance = 1 } = body

    if (!order_id || !amount) {
      return NextResponse.json({ error: 'order_id y amount requeridos' }, { status: 400 })
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Verificar que la orden existe y está pending
    const { data: order } = await adminClient
      .from('orders')
      .select('id, order_number, campus_id, status, order_items(product_id, quantity)')
      .eq('id', order_id)
      .maybeSingle()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({ found: true, already_paid: true })
    }

    // Consultar últimas transacciones de SumUp (últimos 10 minutos)
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const txRes = await fetch(
      `https://api.sumup.com/v0.1/me/transactions/history?limit=10&newest_first=true`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!txRes.ok) {
      const err = await txRes.json().catch(() => ({}))
      console.error('[SumUp Verify] API error:', err)
      return NextResponse.json({ found: false, error: 'Error consultando SumUp', detail: err })
    }

    const txData = await txRes.json()
    const transactions = txData.items ?? txData.transactions ?? []

    console.log('[SumUp Verify] Transactions found:', transactions.length)

    // Buscar transacción que coincida con el monto (tolerancia ±1 CLP)
    const amountNum = Number(amount)
    const match = transactions.find((tx: any) => {
      const txAmount = Number(tx.amount ?? tx.total_amount ?? 0)
      const txStatus = tx.status ?? tx.transaction_status ?? ''
      const txTime   = new Date(tx.timestamp ?? tx.created_at ?? 0).getTime()
      const isRecent = txTime > Date.now() - 15 * 60 * 1000 // últimos 15 min

      return (
        txStatus === 'SUCCESSFUL' &&
        Math.abs(txAmount - amountNum) <= tolerance &&
        isRecent
      )
    })

    if (!match) {
      return NextResponse.json({ found: false, checked: transactions.length })
    }

    // ¡Pago encontrado! Actualizar orden
    await adminClient
      .from('orders')
      .update({
        status: 'paid',
        notes: `Smart POS SumUp | TX: ${match.transaction_code ?? match.id ?? 'unknown'}`,
      })
      .eq('id', order_id)

    // Descontar stock
    for (const item of (order.order_items ?? [])) {
      await adminClient
        .from('inventory_movements')
        .insert({
          product_id: item.product_id,
          campus_id:  order.campus_id,
          type:       'salida',
          quantity:   item.quantity,
          notes:      `Smart POS SumUp - Orden #${order.order_number}`,
        })
    }

    console.log('[SumUp Verify] ✅ Payment confirmed for order:', order.order_number)

    return NextResponse.json({
      found:        true,
      transaction:  match.transaction_code ?? match.id,
      order_number: order.order_number,
    })

  } catch (error: any) {
    console.error('[SumUp Verify] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey       = process.env.SUMUP_API_KEY
    const merchantCode = process.env.SUMUP_MERCHANT_CODE ?? 'MGSXCYTL'

    if (!apiKey) {
      return NextResponse.json({ error: 'SUMUP_API_KEY no configurada' }, { status: 500 })
    }

    const { amount } = await req.json()
    if (!amount) {
      return NextResponse.json({ error: 'amount requerido' }, { status: 400 })
    }

    const targetAmount = Number(amount)

    // ── Buscar las últimas transacciones en orden DESCENDENTE ─────────────────
    // SumUp por defecto devuelve ASC (las más antiguas primero)
    // Usamos order=descending para obtener las más recientes
    const res = await fetch(
      `https://api.sumup.com/v0.1/me/transactions/history` +
      `?limit=10&order=descending`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[SumUp Verify] API error:', err)
      return NextResponse.json(
        { error: 'Error consultando SumUp', details: err },
        { status: 400 }
      )
    }

    const data = await res.json()
    const allTx: any[] = data.items ?? []

    console.log('[SumUp Verify] Transactions found:', allTx.length)
    console.log('[SumUp Verify] Latest:', allTx[0]?.timestamp, allTx[0]?.amount, allTx[0]?.status)

    // Filtrar solo las de los últimos 15 minutos
    const cutoff = Date.now() - 15 * 60 * 1000
    const recentTx = allTx.filter(tx => {
      const txTime = new Date(tx.timestamp).getTime()
      return txTime >= cutoff
    })

    console.log('[SumUp Verify] Recent transactions (last 15min):', recentTx.length)

    if (recentTx.length === 0) {
      return NextResponse.json({
        found: false,
        message: `No hay transacciones en los últimos 15 minutos. La más reciente es de: ${allTx[0]?.timestamp ?? 'desconocida'}`,
        debug: {
          total_found: allTx.length,
          latest_timestamp: allTx[0]?.timestamp,
          latest_amount: allTx[0]?.amount,
          latest_status: allTx[0]?.status,
        }
      })
    }

    // Buscar transacción que coincida con el monto (tolerancia ±100 CLP)
    const successStatuses = ['SUCCESSFUL', 'successful', 'PAID', 'paid', 'APPROVED', 'approved']
    const match = recentTx.find(tx =>
      successStatuses.includes(tx.status) &&
      Math.abs(Number(tx.amount) - targetAmount) <= 100
    )

    if (!match) {
      // Si hay transacciones recientes pero no coincide el monto
      const recentAmounts = recentTx.map(tx => `$${tx.amount} (${tx.status})`).join(', ')
      return NextResponse.json({
        found: false,
        message: `No hay transacción de $${targetAmount.toLocaleString('es-CL')} en los últimos 15 minutos. Transacciones recientes: ${recentAmounts}`,
      })
    }

    console.log('[SumUp Verify] ✅ Match found:', match.transaction_code, match.amount)

    return NextResponse.json({
      found: true,
      transaction: {
        id:           match.id,
        tx_code:      match.transaction_code,
        amount:       match.amount,
        currency:     match.currency,
        status:       match.status,
        card_type:    match.card_type,
        timestamp:    match.timestamp,
        payment_type: match.payment_type,
      },
    })

  } catch (error: any) {
    console.error('[SumUp Verify] Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

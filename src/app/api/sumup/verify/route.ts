import { NextRequest, NextResponse } from 'next/server'

// ─── POST /api/sumup/verify ───────────────────────────────────────────────────
// Consulta las últimas transacciones de SumUp y verifica si la más reciente
// coincide con el monto del carrito (dentro de un margen de tiempo de 5 minutos).
// ─────────────────────────────────────────────────────────────────────────────

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

    // Buscar transacciones de los últimos 10 minutos
    const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()

    const res = await fetch(
      `https://api.sumup.com/v2.1/merchants/${merchantCode}/transactions/history` +
      `?statuses=SUCCESSFUL&limit=5&oldest_time=${since}`,
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
    const transactions: any[] = data.items ?? []

    if (transactions.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No hay transacciones recientes en SumUp (últimos 10 minutos)',
      })
    }

    // Buscar transacción que coincida con el monto (tolerancia ±1 CLP)
    const targetAmount = Number(amount)
    const match = transactions.find(tx => {
      const txAmount = Number(tx.amount)
      return Math.abs(txAmount - targetAmount) <= 1
    })

    if (!match) {
      // Mostrar los montos encontrados para ayudar al diagnóstico
      const found = transactions.map(tx => tx.amount).join(', ')
      return NextResponse.json({
        found: false,
        message: `No hay transacción de $${targetAmount.toLocaleString('es-CL')} en los últimos 10 minutos. Montos encontrados: $${found}`,
      })
    }

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

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ─── POST /api/sumup/checkout ──────────────────────────────────────────────────
// Crea un Hosted Checkout en SumUp y retorna la URL de pago.
// El frontend envía esa URL por WhatsApp al cliente.
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const apiKey       = process.env.SUMUP_API_KEY
    const merchantCode = process.env.SUMUP_MERCHANT_CODE ?? 'MGSXCYTL'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'SUMUP_API_KEY no configurada en Vercel' },
        { status: 500 }
      )
    }

    const body = await req.json()
    const { amount, description, order_id, currency = 'CLP' } = body

    if (!amount || !description) {
      return NextResponse.json(
        { error: 'amount y description son requeridos' },
        { status: 400 }
      )
    }

    // ── Crear Hosted Checkout en SumUp ────────────────────────────────────────
    const checkoutRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: order_id ?? `arm-${Date.now()}`,
        amount: Number(amount),
        currency,
        merchant_code: merchantCode,
        description,
        hosted_checkout: {
          enabled: true,
        },
        // URL de retorno cuando el cliente completa el pago
        redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/pos?payment=success`,
      }),
    })

    const checkoutData = await checkoutRes.json()

    if (!checkoutRes.ok) {
      console.error('[SumUp] Checkout error:', checkoutData)
      return NextResponse.json(
        { error: checkoutData?.message ?? 'Error creando checkout en SumUp' },
        { status: 400 }
      )
    }

    const paymentUrl = checkoutData.hosted_checkout_url
    const checkoutId = checkoutData.id

    if (!paymentUrl) {
      return NextResponse.json(
        { error: 'SumUp no retornó URL de pago. Verifica que tu cuenta tenga Hosted Checkout habilitado.' },
        { status: 400 }
      )
    }

    console.log('[SumUp] Checkout created:', checkoutId, paymentUrl)

    return NextResponse.json({
      success: true,
      checkout_id: checkoutId,
      payment_url: paymentUrl,
    })

  } catch (error: any) {
    console.error('[SumUp] Error:', error)
    return NextResponse.json(
      { error: error?.message ?? 'Error interno' },
      { status: 500 }
    )
  }
}

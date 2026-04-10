import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

async function getSumUpToken(): Promise<string | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await supabase.from('app_settings').select('value').eq('key', 'sumup_access_token').single()
  if (!data) return null
  const tokenData = JSON.parse(data.value)
  // Si el token está por expirar, renovarlo
  if (tokenData.expires_at - Date.now() < 60000 && tokenData.refresh_token) {
    const res = await fetch('https://api.sumup.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type:    'refresh_token',
        refresh_token: tokenData.refresh_token,
        client_id:     process.env.SUMUP_CLIENT_ID ?? '',
        client_secret: process.env.SUMUP_CLIENT_SECRET ?? '',
      }),
    })
    const newToken = await res.json()
    if (newToken.access_token) {
      await supabase.from('app_settings').upsert({
        key:   'sumup_access_token',
        value: JSON.stringify({
          access_token:  newToken.access_token,
          refresh_token: newToken.refresh_token ?? tokenData.refresh_token,
          expires_at:    Date.now() + (newToken.expires_in ?? 3600) * 1000,
        }),
      })
      return newToken.access_token
    }
  }
  return tokenData.access_token
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency, description, checkout_reference } = await req.json()

    const token = await getSumUpToken()
    if (!token) {
      return NextResponse.json({ error: 'SumUp no está conectado. Ve a Configuración → SumUp.' }, { status: 401 })
    }

    // Crear checkout en SumUp
    const res = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference,
        amount,
        currency: currency ?? 'CLP',
        merchant_code: process.env.SUMUP_MERCHANT_CODE ?? 'M0KP75HN',
        description,
        pay_to_email: process.env.SUMUP_EMAIL ?? '',
      }),
    })

    const checkout = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: checkout.message ?? 'Error al crear el cobro' }, { status: 400 })
    }

    return NextResponse.json({ checkout_id: checkout.id, status: checkout.status })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

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
  return JSON.parse(data.value).access_token
}

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get('id')
  if (!checkoutId) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const token = await getSumUpToken()
  if (!token) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const res = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })

  const data = await res.json()
  return NextResponse.json({ status: data.status, id: data.id })
}

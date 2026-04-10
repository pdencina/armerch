import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const code  = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://armerch-poud.vercel.app'}/pos?sumup=error`)
  }

  // Intercambiar code por access_token
  const res = await fetch('https://api.sumup.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'authorization_code',
      code,
      client_id:     process.env.SUMUP_CLIENT_ID ?? '',
      client_secret: process.env.SUMUP_CLIENT_SECRET ?? '',
      redirect_uri:  `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://armerch-poud.vercel.app'}/api/sumup/callback`,
    }),
  })

  const token = await res.json()
  if (!token.access_token) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://armerch-poud.vercel.app'}/pos?sumup=error`)
  }

  // Guardar token en Supabase (tabla settings)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  await supabase.from('app_settings').upsert({
    key:   'sumup_access_token',
    value: JSON.stringify({
      access_token:  token.access_token,
      refresh_token: token.refresh_token,
      expires_at:    Date.now() + (token.expires_in ?? 3600) * 1000,
    }),
  })

  return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL ?? 'https://armerch-poud.vercel.app'}/pos?sumup=connected`)
}
